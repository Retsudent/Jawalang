const { BUILTINS, KEYWORDS, isPositionInRange } = require('./utils');

const CompletionItemKind = {
    Text: 1,
    Method: 2,
    Function: 3,
    Constructor: 4,
    Field: 5,
    Variable: 6,
    Class: 7,
    Interface: 8,
    Module: 9,
    Property: 10,
    Unit: 11,
    Value: 12,
    Enum: 13,
    Keyword: 14,
    Snippet: 15,
    Color: 16,
    File: 17,
    Reference: 18,
    Folder: 19,
    EnumMember: 20,
    Constant: 21,
    Struct: 22,
    Event: 24,
    Operator: 25,
    TypeParameter: 25
};

/**
 * Check if the given position is inside a single-line comment or string literal
 */
function isInsideStringOrComment(currentLine, character, tokens, position) {
    let inString = false;
    let escape = false;

    for (let i = 0; i < character && i < currentLine.length; i++) {
        const ch = currentLine[i];
        if (!inString && ch === '/' && currentLine[i + 1] === '/') {
            return true;
        }
        if (ch === '"' && !escape) {
            inString = !inString;
        } else if (ch === '\\' && inString) {
            escape = !escape;
        } else {
            escape = false;
        }
    }

    if (inString) return true;

    if (tokens && position) {
        for (const tok of tokens) {
            if (tok.type === 'STRING' && tok.loc && isPositionInRange(position, tok.loc)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * LSP Semantic Completion Provider (textDocument/completion) — V2
 */
function getCompletions(analysisResult, position) {
    if (!analysisResult) return [];

    const { text, tokens, scopes, globalScope, structs } = analysisResult;
    const { line, character } = position;

    const lines = (text || '').split('\n');
    const currentLine = lines[line] || '';
    const textBeforeCursor = currentLine.slice(0, character);

    // 1. Guard: If cursor is inside comment or string, return zero completions
    if (isInsideStringOrComment(currentLine, character, tokens, position)) {
        return [];
    }

    // 2. Guard: If cursor is immediately in array indexing context (e.g. data[), do not trigger member completion
    // Normal scope completion will handle expressions inside bracket
    const isIndexingContext = /\[\s*$/.test(textBeforeCursor);

    // 3. Context: After 'anyar' keyword — only suggest instantiable structs
    const anyarMatch = textBeforeCursor.match(/\banyar\s+([a-zA-Z0-9_]*)$/);
    if (anyarMatch) {
        const prefix = anyarMatch[1] || '';
        const range = {
            start: { line, character: character - prefix.length },
            end: { line, character }
        };

        return getStructOnlyCompletions(prefix, range, analysisResult);
    }

    // 4. Context: Member access completion via dot (e.g. w., w.sa, math., iki., super.)
    if (!isIndexingContext) {
        const memberMatch = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z0-9_]*)$/);
        if (memberMatch) {
            const receiverName = memberMatch[1];
            const memberPrefix = memberMatch[2] || '';
            const range = {
                start: { line, character: character - memberPrefix.length },
                end: { line, character }
            };

            return getMemberCompletions(receiverName, memberPrefix, range, position, analysisResult);
        }
    }

    // 5. General scope-based completion
    let matchedScope = globalScope || { getAllVisibleSymbols: () => [] };
    if (scopes) {
        for (const sc of scopes) {
            if (sc.range && isPositionInRange(position, sc.range)) {
                matchedScope = sc;
            }
        }
    }

    const wordMatch = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
    const prefix = wordMatch ? wordMatch[1] : '';
    const range = {
        start: { line, character: character - prefix.length },
        end: { line, character }
    };

    const items = [];
    const seen = new Set();

    // A. Visible symbols in scope (variables, parameters, functions, structs, namespaces)
    const visible = matchedScope.getAllVisibleSymbols ? matchedScope.getAllVisibleSymbols() : [];
    for (const sym of visible) {
        if (sym.kind === 'builtin') continue;
        if (seen.has(sym.name)) continue;
        seen.add(sym.name);

        let kind = CompletionItemKind.Variable;
        let detail = sym.kind;
        let documentation = '';

        if (sym.kind === 'function') {
            kind = CompletionItemKind.Function;
            const params = (sym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p).join(', ');
            detail = `guna ${sym.name}(${params})`;
            documentation = `Fungsi: ${sym.name}`;
        } else if (sym.kind === 'struct') {
            kind = CompletionItemKind.Class;
            detail = `bentuk ${sym.name}`;
            documentation = `Struct: ${sym.name}`;
        } else if (sym.kind === 'parameter') {
            kind = CompletionItemKind.Variable;
            detail = `(parameter) ${sym.name}`;
            documentation = `Parameter fungsi: ${sym.name}`;
        } else if (sym.kind === 'variable') {
            kind = CompletionItemKind.Variable;
            detail = sym.inferredType ? `(variable) ${sym.name}: ${sym.inferredType}` : `(variable) ${sym.name}`;
            documentation = `Variabel: ${sym.name}`;
        } else if (sym.kind === 'namespace') {
            kind = CompletionItemKind.Module;
            detail = `(namespace) ${sym.name}`;
            documentation = `Modul namespace: ${sym.name}`;
        }

        items.push({
            label: sym.name,
            kind,
            detail,
            documentation,
            textEdit: { range, newText: sym.name },
            filterText: sym.name
        });
    }

    // B. Built-in functions
    for (const [name, info] of Object.entries(BUILTINS)) {
        if (seen.has(name)) continue;
        seen.add(name);

        items.push({
            label: name,
            kind: CompletionItemKind.Function,
            detail: info.signature,
            documentation: `${info.description}\n\n**Tuladha:**\n\`\`\`jawa\n${info.example}\n\`\`\``,
            textEdit: { range, newText: name },
            filterText: name
        });
    }

    // C. Language Keywords
    for (const [kw, info] of Object.entries(KEYWORDS)) {
        if (seen.has(kw)) continue;
        seen.add(kw);

        items.push({
            label: kw,
            kind: CompletionItemKind.Keyword,
            detail: info.detail,
            documentation: `\`\`\`jawa\n${info.doc}\n\`\`\``,
            textEdit: { range, newText: kw },
            filterText: kw
        });
    }

    // Prefix filtering: if user typed prefix, return only matching items
    if (prefix) {
        const lowerPrefix = prefix.toLowerCase();
        return items.filter(it => it.label.toLowerCase().startsWith(lowerPrefix));
    }

    return items;
}

/**
 * Suggestions when cursor is after 'anyar' — only returns instantiable Structs
 */
function getStructOnlyCompletions(prefix, range, analysisResult) {
    const { structs, globalScope } = analysisResult;
    const items = [];
    const seen = new Set();

    if (structs && structs instanceof Map) {
        for (const [sName, sSym] of structs.entries()) {
            if (!seen.has(sName)) {
                seen.add(sName);
                items.push({
                    label: sName,
                    kind: CompletionItemKind.Class,
                    detail: `bentuk ${sName}`,
                    documentation: `Struct: ${sName}`,
                    textEdit: { range, newText: sName },
                    filterText: sName
                });
            }
        }
    }

    if (globalScope && globalScope.symbols) {
        for (const [name, sym] of globalScope.symbols.entries()) {
            if (sym.kind === 'struct' && !seen.has(name)) {
                seen.add(name);
                items.push({
                    label: name,
                    kind: CompletionItemKind.Class,
                    detail: `bentuk ${name}`,
                    documentation: `Struct: ${name}`,
                    textEdit: { range, newText: name },
                    filterText: name
                });
            }
        }
    }

    if (prefix) {
        const lower = prefix.toLowerCase();
        return items.filter(it => it.label.toLowerCase().startsWith(lower));
    }

    return items;
}

/**
 * Suggestions when cursor is in member access (receiver.prefix)
 */
function getMemberCompletions(receiverName, memberPrefix, range, position, analysisResult) {
    const { scopes, structs, globalScope } = analysisResult;
    let rawItems = [];

    // Find innermost scope at cursor
    let matchedScope = globalScope || { lookup: () => null };
    if (scopes) {
        for (const sc of scopes) {
            if (sc.range && isPositionInRange(position, sc.range)) {
                matchedScope = sc;
            }
        }
    }

    // Case 1: "iki." receiver inside struct method
    if (receiverName === 'iki') {
        const encStruct = matchedScope.enclosingStruct;
        if (encStruct) {
            const actualStruct = (structs && structs.get(encStruct.name)) || encStruct;
            rawItems = collectStructMembers(actualStruct, structs);
        }
    }
    // Case 2: "super." receiver in subclass method
    else if (receiverName === 'super') {
        const encStruct = matchedScope.enclosingStruct;
        if (encStruct && encStruct.parent) {
            const parentName = typeof encStruct.parent === 'string' ? encStruct.parent : encStruct.parent.value;
            const parentStruct = structs ? structs.get(parentName) : null;
            if (parentStruct) {
                // Collect members starting from direct parent struct
                // Note: child overrides are excluded, preserving parent implementation
                rawItems = collectStructMembers(parentStruct, structs);
            }
        }
    }
    // Case 3: Namespace receiver (e.g. math.tambah)
    else {
        const sym = matchedScope.lookup(receiverName);
        if (sym && sym.kind === 'namespace' && sym.moduleRecord) {
            const mod = sym.moduleRecord;
            const seenMod = new Set();

            for (const [vName, vInfo] of Object.entries(mod.exports.variables || {})) {
                if (!seenMod.has(vName)) {
                    seenMod.add(vName);
                    rawItems.push({
                        label: vName,
                        kind: CompletionItemKind.Variable,
                        detail: `(variable) ${vName}`,
                        documentation: `Diekspor saka modul`
                    });
                }
            }
            for (const [fName, fInfo] of Object.entries(mod.exports.functions || {})) {
                if (!seenMod.has(fName)) {
                    seenMod.add(fName);
                    const params = (fInfo.parameters || []).map(p => typeof p === 'string' ? p : p.value || p).join(', ');
                    rawItems.push({
                        label: fName,
                        kind: CompletionItemKind.Function,
                        detail: `guna ${fName}(${params})`,
                        documentation: `Fungsi diekspor saka modul`
                    });
                }
            }
            for (const [sName, sInfo] of Object.entries(mod.exports.structs || {})) {
                if (!seenMod.has(sName)) {
                    seenMod.add(sName);
                    rawItems.push({
                        label: sName,
                        kind: CompletionItemKind.Class,
                        detail: `bentuk ${sName}`,
                        documentation: `Struct diekspor saka modul`
                    });
                }
            }
        }
        // Case 4: Struct instance receiver (e.g. w = anyar Wong(); w.)
        else if (sym) {
            let targetStructName = null;
            if (sym.inferredType && sym.inferredType.startsWith('instance of ')) {
                targetStructName = sym.inferredType.replace('instance of ', '').trim();
            } else if (sym.value && sym.value.type === 'NewExpression') {
                targetStructName = sym.value.target?.name || sym.value.target?.value || sym.value.callee?.name || sym.value.callee?.value;
            } else if (sym.kind === 'struct') {
                targetStructName = sym.name;
            }

            if (targetStructName) {
                const targetStruct = (structs && structs.get(targetStructName)) || (globalScope && globalScope.lookup(targetStructName));
                if (targetStruct && targetStruct.kind === 'struct') {
                    rawItems = collectStructMembers(targetStruct, structs);
                }
            }
        }
    }

    // Attach range and filter by memberPrefix
    const items = rawItems.map(item => ({
        ...item,
        textEdit: { range, newText: item.label },
        filterText: item.label
    }));

    if (memberPrefix) {
        const lower = memberPrefix.toLowerCase();
        return items.filter(it => it.label.toLowerCase().startsWith(lower));
    }

    return items;
}

/**
 * Traverse struct hierarchy collecting fields and methods with override deduplication
 */
function collectStructMembers(structSym, structsMap) {
    const items = [];
    const seen = new Set();
    const visitedStructs = new Set();

    let current = structSym;
    while (current && current.kind === 'struct') {
        if (visitedStructs.has(current.name)) break;
        visitedStructs.add(current.name);

        // 1. Collect fields
        const fields = current.fields || [];
        for (const f of fields) {
            const fName = typeof f === 'string' ? f : f.name;
            if (fName && !seen.has(fName)) {
                seen.add(fName);
                items.push({
                    label: fName,
                    kind: CompletionItemKind.Field,
                    detail: `(property) ${current.name}.${fName}`,
                    documentation: `Field ing struct ${current.name}`
                });
            }
        }

        // 2. Collect methods
        if (current.methods) {
            const methodEntries = current.methods instanceof Map
                ? current.methods.entries()
                : Object.entries(current.methods);

            for (const [mName, mInfo] of methodEntries) {
                if (mName && !seen.has(mName)) {
                    seen.add(mName);
                    const isCtor = (mName === 'wiwiti');
                    const rawParams = mInfo.parameters || [];
                    const params = rawParams.map(p => typeof p === 'string' ? p : p.value || p).join(', ');
                    items.push({
                        label: mName,
                        kind: isCtor ? CompletionItemKind.Constructor : CompletionItemKind.Method,
                        detail: isCtor ? `wiwiti(${params})` : `guna ${mName}(${params})`,
                        documentation: isCtor ? `Konstruktor struct ${current.name}` : `Method saka struct ${current.name}`
                    });
                }
            }
        }

        // 3. Walk up inheritance chain (ngembangake)
        if (current.parent) {
            const parentName = typeof current.parent === 'string' ? current.parent : current.parent.value;
            current = (structsMap && structsMap.get(parentName)) || null;
        } else {
            current = null;
        }
    }

    return items;
}

module.exports = {
    getCompletions,
    CompletionItemKind
};
