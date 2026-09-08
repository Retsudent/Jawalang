const { findTokenAt, isPositionInRange, pathToUri, BUILTINS, KEYWORDS } = require('./utils');

/**
 * LSP Find References Provider (textDocument/references)
 * 
 * @param {Object} analysisResult - Analysis result from Analyzer.analyze()
 * @param {Object} position - Zero-based { line, character } cursor position
 * @param {Object} context - { includeDeclaration: boolean }
 * @returns {Array<Object>} Array of LSP Location objects ({ uri, range })
 */
function getReferences(analysisResult, position, context = { includeDeclaration: true }) {
    if (!analysisResult || !analysisResult.tokens || !position) return [];

    const token = findTokenAt(analysisResult.tokens, position);
    if (!token) return [];

    const name = token.value;

    // Built-in functions and language keywords do not produce user-defined symbol references
    // unless the token is actually an identifier defined as a user struct field/method or variable
    if (BUILTINS[name] || KEYWORDS[name]) {
        const isUserDefined = (analysisResult.symbols || []).some(s => s.name === name && (s.kind === 'field' || s.kind === 'method' || s.kind === 'variable')) ||
                             (analysisResult.references || []).some(r => r.name === name && r.loc && isPositionInRange(position, r.loc));
        if (!isUserDefined) {
            return [];
        }
    }

    // 1. Resolve Target Symbol
    let targetSymbol = null;

    // A. Position is directly on a symbol's declaration range
    for (const sym of analysisResult.symbols || []) {
        if (sym.name === name && sym.nameLoc && isPositionInRange(position, sym.nameLoc)) {
            targetSymbol = sym;
            break;
        }
    }

    // B. Position is on an existing recorded reference
    if (!targetSymbol) {
        for (const ref of analysisResult.references || []) {
            if (ref.loc && isPositionInRange(position, ref.loc)) {
                targetSymbol = ref.symbol;
                break;
            }
        }
    }

    // C. Innermost scope lookup at position
    if (!targetSymbol) {
        let matchedScope = analysisResult.globalScope;
        for (const sc of analysisResult.scopes || []) {
            if (sc.range && isPositionInRange(position, sc.range)) {
                matchedScope = sc;
            }
        }
        targetSymbol = matchedScope.lookup(name);
    }

    // D. Enclosing struct member lookup (e.g. inside a method, cursor on field/method)
    if (!targetSymbol) {
        let matchedScope = analysisResult.globalScope;
        for (const sc of analysisResult.scopes || []) {
            if (sc.range && isPositionInRange(position, sc.range)) {
                matchedScope = sc;
            }
        }
        if (matchedScope && matchedScope.enclosingStruct) {
            const enc = matchedScope.enclosingStruct;
            if (enc.methods && enc.methods.has(name)) {
                targetSymbol = enc.methods.get(name);
            } else if (enc.fieldSymbols && enc.fieldSymbols.has(name)) {
                targetSymbol = enc.fieldSymbols.get(name);
            }
        }
    }

    // E. Global struct member lookup by name
    if (!targetSymbol && analysisResult.structs) {
        for (const structSym of analysisResult.structs.values()) {
            if (structSym.methods && structSym.methods.has(name)) {
                targetSymbol = structSym.methods.get(name);
                break;
            }
            if (structSym.fieldSymbols && structSym.fieldSymbols.has(name)) {
                targetSymbol = structSym.fieldSymbols.get(name);
                break;
            }
        }
    }

    if (!targetSymbol) return [];

    const locations = [];
    const seen = new Set();

    function addLocation(uri, range) {
        if (!uri || !range || !range.start || !range.end) return;
        const key = `${uri}:${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}`;
        if (seen.has(key)) return;
        seen.add(key);
        locations.push({
            uri,
            range: {
                start: { line: range.start.line, character: range.start.character },
                end: { line: range.end.line, character: range.end.character }
            }
        });
    }

    // 2. Declaration Location (if requested via context.includeDeclaration)
    if (context && context.includeDeclaration) {
        const declUri = targetSymbol.uri || (targetSymbol.importedFrom ? pathToUri(targetSymbol.importedFrom) : analysisResult.uri);
        const declRange = targetSymbol.nameLoc || targetSymbol.loc;
        if (declRange) {
            addLocation(declUri, declRange);
        }
    }

    // 3. Match All Recorded References
    for (const ref of analysisResult.references || []) {
        if (!ref.loc) continue;
        if (isSameSymbol(ref.symbol, targetSymbol)) {
            const refUri = ref.uri || analysisResult.uri;
            addLocation(refUri, ref.loc);
        }
    }

    return locations;
}

/**
 * Compare two symbols to verify they represent the identical declaration
 */
function isSameSymbol(a, b) {
    if (!a || !b) return false;
    if (a === b) return true;

    if (a.name !== b.name) return false;

    // Both are fields or methods
    if ((a.kind === 'field' || a.kind === 'method') && (b.kind === 'field' || b.kind === 'method')) {
        if (a.enclosingStruct && b.enclosingStruct && a.enclosingStruct !== b.enclosingStruct) {
            return false;
        }
    } else if (a.kind !== b.kind) {
        return false;
    }

    // Compare nameLoc coordinates if both exist
    if (a.nameLoc && b.nameLoc) {
        return (
            a.nameLoc.start.line === b.nameLoc.start.line &&
            a.nameLoc.start.character === b.nameLoc.start.character &&
            a.nameLoc.end.line === b.nameLoc.end.line &&
            a.nameLoc.end.character === b.nameLoc.end.character &&
            (a.uri || '') === (b.uri || '')
        );
    }

    // If imported, compare source path
    if (a.importedFrom && b.importedFrom) {
        return a.importedFrom === b.importedFrom;
    }

    return false;
}

module.exports = {
    getReferences,
    isSameSymbol
};
