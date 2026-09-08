/**
 * Jawalang Language Server - Code Actions Provider
 * Implements LSP textDocument/codeAction
 *
 * Provides deterministic, static, semantic-safe code actions:
 * 1. QuickFix: Remove duplicate imports
 * 2. QuickFix: Remove unused imports (selective & namespace)
 * 3. QuickFix: Typo correction for undefined functions, variables, and structs
 * 4. QuickFix: Import missing symbol from known/cached modules
 * 5. Source Action: Organize Imports (source.organizeImports)
 */

const path = require('path');
const moduleManager = require('./modules');
const { BUILTINS, isPositionInRange } = require('./utils');

const CodeActionKind = {
    QuickFix: 'quickfix',
    Source: 'source',
    SourceOrganizeImports: 'source.organizeImports'
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(s1, s2) {
    if (s1 === s2) return 0;
    const m = s1.length;
    const n = s2.length;
    if (Math.abs(m - n) > 3) return 99;

    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,       // deletion
                dp[i][j - 1] + 1,       // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return dp[m][n];
}

/**
 * Format relative import path cleanly with forward slashes and leading './'
 */
function formatRelativeImport(fromFile, toFile) {
    if (!fromFile || !toFile) return toFile;
    let rel = path.relative(path.dirname(fromFile), toFile);
    rel = rel.replace(/\\/g, '/');
    if (!rel.startsWith('.') && !rel.startsWith('/')) {
        rel = './' + rel;
    }
    return rel;
}

/**
 * Check if code action kind matches context.only filter
 */
function isKindAllowed(actionKind, only) {
    if (!only || !Array.isArray(only) || only.length === 0) return true;
    for (const prefix of only) {
        if (actionKind === prefix || actionKind.startsWith(prefix + '.')) {
            return true;
        }
    }
    return false;
}

/**
 * Extract all import statements and their token positions from tokens list
 */
function extractImports(tokens) {
    if (!tokens || tokens.length === 0) return [];

    const imports = [];
    let i = 0;

    while (i < tokens.length) {
        const tok = tokens[i];
        if (tok.type === 'IMPOR') {
            const startLoc = tok.loc ? tok.loc.start : { line: 0, character: 0 };
            const startTokenIdx = i;
            i++;

            // 1. Selective import: impor { a, b minangka c } saka "path"
            if (i < tokens.length && tokens[i].type === 'LEFT_BRACE') {
                i++; // skip '{'
                const specifiers = [];
                while (i < tokens.length && tokens[i].type !== 'RIGHT_BRACE') {
                    if (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'TULIS' || tokens[i].type === 'KEYWORD') {
                        const importedName = tokens[i].value;
                        const specLoc = tokens[i].loc;
                        let localName = importedName;
                        i++;
                        if (i < tokens.length && tokens[i].type === 'MINANGKA') {
                            i++;
                            if (i < tokens.length && (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'KEYWORD')) {
                                localName = tokens[i].value;
                                i++;
                            }
                        }
                        specifiers.push({
                            imported: importedName,
                            local: localName,
                            loc: specLoc
                        });
                    } else {
                        i++;
                    }
                }

                if (i < tokens.length && tokens[i].type === 'RIGHT_BRACE') {
                    i++;
                }

                if (i < tokens.length && tokens[i].type === 'SAKA') {
                    i++;
                }

                let pathVal = null;
                let endLoc = tok.loc ? tok.loc.end : { line: 0, character: 0 };
                if (i < tokens.length && tokens[i].type === 'STRING') {
                    pathVal = tokens[i].value;
                    endLoc = tokens[i].loc.end;
                    i++;
                }

                if (pathVal) {
                    imports.push({
                        mode: 'selective',
                        path: pathVal,
                        specifiers,
                        startLoc,
                        endLoc,
                        startTokenIdx,
                        endTokenIdx: i - 1
                    });
                }
                continue;
            } else if (i < tokens.length && tokens[i].type === 'STRING') {
                // 2. Namespace or legacy import
                const pathVal = tokens[i].value;
                let endLoc = tokens[i].loc.end;
                i++;

                let namespace = null;
                let mode = 'legacy';

                if (i < tokens.length && tokens[i].type === 'MINANGKA') {
                    i++;
                    if (i < tokens.length && (tokens[i].type === 'IDENTIFIER' || tokens[i].type === 'KEYWORD')) {
                        namespace = tokens[i].value;
                        endLoc = tokens[i].loc.end;
                        mode = 'namespace';
                        i++;
                    }
                }

                imports.push({
                    mode,
                    path: pathVal,
                    namespace,
                    startLoc,
                    endLoc,
                    startTokenIdx,
                    endTokenIdx: i - 1
                });
                continue;
            }
        }
        i++;
    }

    return imports;
}

/**
 * Format organized imports into standard Jawalang import statements
 */
function formatOrganizedImports(groupedMap, eol) {
    const lines = [];
    const sortedPaths = Array.from(groupedMap.keys()).sort();

    for (const p of sortedPaths) {
        const group = groupedMap.get(p);

        // 1. Legacy imports
        if (group.legacy) {
            lines.push(`impor "${p}"`);
        }

        // 2. Namespace imports
        if (group.namespaces && group.namespaces.size > 0) {
            const sortedNs = Array.from(group.namespaces).sort();
            for (const ns of sortedNs) {
                lines.push(`impor "${p}" minangka ${ns}`);
            }
        }

        // 3. Selective imports
        if (group.specifiers && group.specifiers.size > 0) {
            const specs = Array.from(group.specifiers.values()).sort((a, b) => a.imported.localeCompare(b.imported));
            const formattedSpecs = specs.map(s => {
                if (s.local && s.local !== s.imported) {
                    return `${s.imported} minangka ${s.local}`;
                }
                return s.imported;
            });

            if (formattedSpecs.length <= 3) {
                lines.push(`impor { ${formattedSpecs.join(', ')} } saka "${p}"`);
            } else {
                lines.push(`impor {\n    ${formattedSpecs.join(',\n    ')}\n} saka "${p}"`);
            }
        }
    }

    return lines.join(eol);
}

/**
 * Main LSP code actions provider
 */
function getCodeActions(analysis, range, context = {}) {
    if (!analysis || !analysis.text || analysis.text.trim().length === 0) {
        return [];
    }

    try {
        const actions = [];
        const docUri = analysis.uri;
        const text = analysis.text;
        const isCRLF = text.includes('\r\n');
        const eol = isCRLF ? '\r\n' : '\n';
        const lines = text.split(/\r?\n/);
        const only = context.only;

        const imports = extractImports(analysis.tokens);

        // =========================================================================
        // 1. ORGANIZE IMPORTS (source.organizeImports)
        // =========================================================================
        if (isKindAllowed(CodeActionKind.SourceOrganizeImports, only) && imports.length > 0) {
            const groupedMap = new Map();

            for (const imp of imports) {
                if (!groupedMap.has(imp.path)) {
                    groupedMap.set(imp.path, {
                        legacy: false,
                        namespaces: new Set(),
                        specifiers: new Map()
                    });
                }
                const group = groupedMap.get(imp.path);

                if (imp.mode === 'legacy') {
                    group.legacy = true;
                } else if (imp.mode === 'namespace' && imp.namespace) {
                    group.namespaces.add(imp.namespace);
                } else if (imp.mode === 'selective' && imp.specifiers) {
                    for (const spec of imp.specifiers) {
                        const key = `${spec.imported}:${spec.local || spec.imported}`;
                        if (!group.specifiers.has(key)) {
                            group.specifiers.set(key, spec);
                        }
                    }
                }
            }

            const formattedImports = formatOrganizedImports(groupedMap, eol);

            const firstImport = imports[0];
            const lastImport = imports[imports.length - 1];
            const startLine = firstImport.startLoc.line;
            const endLine = lastImport.endLoc.line;

            const originalSpan = lines.slice(startLine, endLine + 1).join(eol);

            if (formattedImports !== originalSpan) {
                actions.push({
                    title: 'Organize Imports',
                    kind: CodeActionKind.SourceOrganizeImports,
                    edit: {
                        changes: {
                            [docUri]: [
                                {
                                    range: {
                                        start: { line: startLine, character: 0 },
                                        end: { line: endLine, character: lines[endLine].length }
                                    },
                                    newText: formattedImports
                                }
                            ]
                        }
                    }
                });
            }
        }

        // =========================================================================
        // 2. REMOVE DUPLICATE IMPORTS (quickfix)
        // =========================================================================
        if (isKindAllowed(CodeActionKind.QuickFix, only) && imports.length > 0) {
            const seenImports = new Set();

            for (let idx = 0; idx < imports.length; idx++) {
                const imp = imports[idx];
                let sig = '';
                if (imp.mode === 'legacy') {
                    sig = `legacy:${imp.path}`;
                } else if (imp.mode === 'namespace') {
                    sig = `namespace:${imp.path}:${imp.namespace}`;
                } else if (imp.mode === 'selective') {
                    const sortedSpecKeys = (imp.specifiers || []).map(s => `${s.imported}:${s.local}`).sort().join(',');
                    sig = `selective:${imp.path}:${sortedSpecKeys}`;
                }

                if (seenImports.has(sig)) {
                    // Duplicate import found
                    const dupLine = imp.startLoc.line;
                    let deleteRange;
                    if (dupLine + 1 < lines.length) {
                        deleteRange = {
                            start: { line: dupLine, character: 0 },
                            end: { line: dupLine + 1, character: 0 }
                        };
                    } else {
                        deleteRange = {
                            start: { line: dupLine, character: 0 },
                            end: { line: dupLine, character: lines[dupLine].length }
                        };
                    }

                    actions.push({
                        title: `Remove duplicate import "${imp.path}"`,
                        kind: CodeActionKind.QuickFix,
                        isPreferred: true,
                        edit: {
                            changes: {
                                [docUri]: [
                                    {
                                        range: deleteRange,
                                        newText: ''
                                    }
                                ]
                            }
                        }
                    });
                } else {
                    seenImports.add(sig);
                }

                // Also check for duplicate specifiers inside a single selective import statement
                if (imp.mode === 'selective' && imp.specifiers && imp.specifiers.length > 1) {
                    const seenSpecs = new Set();
                    for (const spec of imp.specifiers) {
                        const key = `${spec.imported}:${spec.local || spec.imported}`;
                        if (seenSpecs.has(key)) {
                            // Offer to remove duplicate specifier
                            const remainingSpecs = imp.specifiers.filter(s => s !== spec);
                            const formattedRemaining = remainingSpecs.map(s => (s.local && s.local !== s.imported) ? `${s.imported} minangka ${s.local}` : s.imported);
                            const newImportLine = `impor { ${formattedRemaining.join(', ')} } saka "${imp.path}"`;

                            actions.push({
                                title: `Remove duplicate import "${spec.imported}"`,
                                kind: CodeActionKind.QuickFix,
                                isPreferred: true,
                                edit: {
                                    changes: {
                                        [docUri]: [
                                            {
                                                range: {
                                                    start: { line: imp.startLoc.line, character: 0 },
                                                    end: { line: imp.endLoc.line, character: lines[imp.endLoc.line].length }
                                                },
                                                newText: newImportLine
                                            }
                                        ]
                                    }
                                }
                            });
                        } else {
                            seenSpecs.add(key);
                        }
                    }
                }
            }
        }

        // =========================================================================
        // 3. REMOVE UNUSED IMPORTS (quickfix)
        // =========================================================================
        if (isKindAllowed(CodeActionKind.QuickFix, only) && imports.length > 0 && analysis.symbols && analysis.references) {
            for (const imp of imports) {
                if (imp.mode === 'selective' && imp.specifiers && imp.specifiers.length > 0) {
                    for (const spec of imp.specifiers) {
                        const symName = spec.local || spec.imported;
                        const sym = (analysis.symbols || []).find(s => s.name === symName && s.importedFrom);
                        let isUsed = false;

                        if (sym) {
                            isUsed = (analysis.references || []).some(r => r.symbol === sym);
                        } else {
                            isUsed = (analysis.references || []).some(r => r.name === symName);
                            if (!isUsed && analysis.tokens) {
                                for (let ti = 0; ti < analysis.tokens.length; ti++) {
                                    if (ti >= imp.startTokenIdx && ti <= imp.endTokenIdx) continue;
                                    if (analysis.tokens[ti].value === symName) {
                                        isUsed = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if (!isUsed) {
                            // Unused selective import found
                            if (imp.specifiers.length === 1) {
                                // Only specifier in import: remove whole line
                                const impLine = imp.startLoc.line;
                                let deleteRange;
                                if (impLine + 1 < lines.length) {
                                    deleteRange = {
                                        start: { line: impLine, character: 0 },
                                        end: { line: impLine + 1, character: 0 }
                                    };
                                } else {
                                    deleteRange = {
                                        start: { line: impLine, character: 0 },
                                        end: { line: impLine, character: lines[impLine].length }
                                    };
                                }

                                actions.push({
                                    title: `Remove unused import "${symName}"`,
                                    kind: CodeActionKind.QuickFix,
                                    edit: {
                                        changes: {
                                            [docUri]: [
                                                {
                                                    range: deleteRange,
                                                    newText: ''
                                                }
                                            ]
                                        }
                                    }
                                });
                            } else {
                                // Multiple specifiers: remove just this specifier
                                const remainingSpecs = imp.specifiers.filter(s => s !== spec);
                                const formattedRemaining = remainingSpecs.map(s => (s.local && s.local !== s.imported) ? `${s.imported} minangka ${s.local}` : s.imported);
                                const newImportLine = `impor { ${formattedRemaining.join(', ')} } saka "${imp.path}"`;

                                actions.push({
                                    title: `Remove unused import "${symName}"`,
                                    kind: CodeActionKind.QuickFix,
                                    edit: {
                                        changes: {
                                            [docUri]: [
                                                {
                                                    range: {
                                                        start: { line: imp.startLoc.line, character: 0 },
                                                        end: { line: imp.endLoc.line, character: lines[imp.endLoc.line].length }
                                                    },
                                                    newText: newImportLine
                                                }
                                            ]
                                        }
                                    }
                                });
                            }
                        }
                    }
                } else if (imp.mode === 'namespace' && imp.namespace) {
                    const nsSym = (analysis.symbols || []).find(s => s.kind === 'namespace' && s.name === imp.namespace);
                    let isUsed = false;

                    if (nsSym) {
                        isUsed = (analysis.references || []).some(r => r.symbol === nsSym);
                    } else {
                        isUsed = (analysis.references || []).some(r => r.name === imp.namespace);
                        if (!isUsed && analysis.tokens) {
                            for (let ti = 0; ti < analysis.tokens.length; ti++) {
                                if (ti >= imp.startTokenIdx && ti <= imp.endTokenIdx) continue;
                                if (analysis.tokens[ti].value === imp.namespace) {
                                    isUsed = true;
                                    break;
                                }
                            }
                        }
                    }

                    if (!isUsed) {
                        const impLine = imp.startLoc.line;
                        let deleteRange;
                        if (impLine + 1 < lines.length) {
                            deleteRange = {
                                start: { line: impLine, character: 0 },
                                end: { line: impLine + 1, character: 0 }
                            };
                        } else {
                            deleteRange = {
                                start: { line: impLine, character: 0 },
                                end: { line: impLine, character: lines[impLine].length }
                            };
                        }

                        actions.push({
                            title: `Remove unused namespace import "${imp.namespace}"`,
                            kind: CodeActionKind.QuickFix,
                            edit: {
                                changes: {
                                    [docUri]: [
                                        {
                                            range: deleteRange,
                                            newText: ''
                                        }
                                    ]
                                }
                            }
                        });
                    }
                }
            }
        }

        // =========================================================================
        // 4. QUICK FIXES BASED ON DIAGNOSTICS (Typo correction & Missing import)
        // =========================================================================
        const reqDiags = (context && context.diagnostics && context.diagnostics.length > 0)
            ? context.diagnostics
            : (analysis.diagnostics || []);

        if (isKindAllowed(CodeActionKind.QuickFix, only) && reqDiags && reqDiags.length > 0) {
            for (const diag of reqDiags) {
                if (!diag || !diag.message) continue;

                // 4a. Undefined function: Fungsi "foo" ora ditemokake.
                const fnMatch = /Fungsi "(.*?)" ora ditemokake\./.exec(diag.message);
                if (fnMatch) {
                    const missingName = fnMatch[1];

                    // Candidate functions in scope + built-ins
                    const visibleFunctions = (analysis.symbols || [])
                        .filter(s => s.kind === 'function')
                        .map(s => s.name);
                    const allCandidateNames = Array.from(new Set([...visibleFunctions, ...Object.keys(BUILTINS)]));

                    const typoCandidates = allCandidateNames
                        .map(name => ({ name, dist: levenshteinDistance(missingName, name) }))
                        .filter(item => item.dist > 0 && item.dist <= 2 && item.dist < missingName.length)
                        .sort((a, b) => a.dist - b.dist);

                    for (const candidate of typoCandidates.slice(0, 2)) {
                        actions.push({
                            title: `Change to "${candidate.name}"`,
                            kind: CodeActionKind.QuickFix,
                            diagnostics: [diag],
                            isPreferred: candidate.dist === 1,
                            edit: {
                                changes: {
                                    [docUri]: [
                                        {
                                            range: diag.range,
                                            newText: candidate.name
                                        }
                                    ]
                                }
                            }
                        });
                    }

                    // Missing import from cached modules
                    if (moduleManager && moduleManager.cache) {
                        for (const [canonicalPath, record] of moduleManager.cache.entries()) {
                            if (canonicalPath === analysis.filePath) continue;
                            if (record && record.exports && record.exports.functions && record.exports.functions[missingName]) {
                                const relImport = formatRelativeImport(analysis.filePath, canonicalPath);
                                const importText = `impor { ${missingName} } saka "${relImport}"${eol}`;

                                actions.push({
                                    title: `Import "${missingName}" from "${relImport}"`,
                                    kind: CodeActionKind.QuickFix,
                                    diagnostics: [diag],
                                    isPreferred: true,
                                    edit: {
                                        changes: {
                                            [docUri]: [
                                                {
                                                    range: {
                                                        start: { line: 0, character: 0 },
                                                        end: { line: 0, character: 0 }
                                                    },
                                                    newText: importText
                                                }
                                            ]
                                        }
                                    }
                                });
                            }
                        }
                    }
                }

                // 4b. Undefined variable: Variabel "bar" ora ditemokake.
                const varMatch = /Variabel "(.*?)" ora ditemokake\./.exec(diag.message);
                if (varMatch) {
                    const missingName = varMatch[1];
                    const visibleVars = (analysis.symbols || [])
                        .filter(s => s.kind === 'variable' || s.kind === 'parameter')
                        .map(s => s.name);
                    const uniqueVarNames = Array.from(new Set(visibleVars));

                    const typoCandidates = uniqueVarNames
                        .map(name => ({ name, dist: levenshteinDistance(missingName, name) }))
                        .filter(item => item.dist > 0 && item.dist <= 2 && item.dist < missingName.length)
                        .sort((a, b) => a.dist - b.dist);

                    for (const candidate of typoCandidates.slice(0, 2)) {
                        actions.push({
                            title: `Change to "${candidate.name}"`,
                            kind: CodeActionKind.QuickFix,
                            diagnostics: [diag],
                            isPreferred: candidate.dist === 1,
                            edit: {
                                changes: {
                                    [docUri]: [
                                        {
                                            range: diag.range,
                                            newText: candidate.name
                                        }
                                    ]
                                }
                            }
                        });
                    }
                }

                // 4c. Undefined struct: Struct "Baz" ora ditemokake.
                const structMatch = /Struct "(.*?)" ora ditemokake\./.exec(diag.message);
                if (structMatch) {
                    const missingName = structMatch[1];
                    const visibleStructs = (analysis.symbols || [])
                        .filter(s => s.kind === 'struct')
                        .map(s => s.name);
                    const uniqueStructNames = Array.from(new Set(visibleStructs));

                    const typoCandidates = uniqueStructNames
                        .map(name => ({ name, dist: levenshteinDistance(missingName, name) }))
                        .filter(item => item.dist > 0 && item.dist <= 2 && item.dist < missingName.length)
                        .sort((a, b) => a.dist - b.dist);

                    for (const candidate of typoCandidates.slice(0, 2)) {
                        actions.push({
                            title: `Change to "${candidate.name}"`,
                            kind: CodeActionKind.QuickFix,
                            diagnostics: [diag],
                            isPreferred: candidate.dist === 1,
                            edit: {
                                changes: {
                                    [docUri]: [
                                        {
                                            range: diag.range,
                                            newText: candidate.name
                                        }
                                    ]
                                }
                            }
                        });
                    }

                    // Missing struct import from cached modules
                    if (moduleManager && moduleManager.cache) {
                        for (const [canonicalPath, record] of moduleManager.cache.entries()) {
                            if (canonicalPath === analysis.filePath) continue;
                            if (record && record.exports && record.exports.structs && record.exports.structs[missingName]) {
                                const relImport = formatRelativeImport(analysis.filePath, canonicalPath);
                                const importText = `impor { ${missingName} } saka "${relImport}"${eol}`;

                                actions.push({
                                    title: `Import "${missingName}" from "${relImport}"`,
                                    kind: CodeActionKind.QuickFix,
                                    diagnostics: [diag],
                                    isPreferred: true,
                                    edit: {
                                        changes: {
                                            [docUri]: [
                                                {
                                                    range: {
                                                        start: { line: 0, character: 0 },
                                                        end: { line: 0, character: 0 }
                                                    },
                                                    newText: importText
                                                }
                                            ]
                                        }
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        // Deduplicate actions with exact same title and edit
        const seenActionTitles = new Set();
        const uniqueActions = [];
        for (const act of actions) {
            const key = `${act.kind}:${act.title}`;
            if (!seenActionTitles.has(key)) {
                seenActionTitles.add(key);
                uniqueActions.push(act);
            }
        }

        return uniqueActions;
    } catch (err) {
        // Fail-safe: never crash language server
        return [];
    }
}

module.exports = {
    CodeActionKind,
    getCodeActions,
    extractImports,
    levenshteinDistance
};
