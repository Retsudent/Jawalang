const { findTokenAt, isPositionInRange, pathToUri } = require('./utils');

/**
 * LSP Go to Definition Provider (textDocument/definition)
 */
function getDefinition(analysisResult, position) {
    if (!analysisResult || !analysisResult.tokens) return null;

    const token = findTokenAt(analysisResult.tokens, position);
    if (!token) return null;

    const name = token.value;

    // 1. Check if token is already a declaration name
    for (const sym of analysisResult.symbols) {
        if (sym.name === name && sym.nameLoc && isPositionInRange(position, sym.nameLoc)) {
            return {
                uri: sym.uri || analysisResult.uri,
                range: sym.nameLoc
            };
        }
    }

    // 2. Check recorded references
    for (const ref of analysisResult.references) {
        if (ref.loc && isPositionInRange(position, ref.loc)) {
            const sym = ref.symbol;
            if (sym) {
                const targetUri = sym.uri || (sym.importedFrom ? pathToUri(sym.importedFrom) : analysisResult.uri);
                return {
                    uri: targetUri,
                    range: sym.nameLoc || sym.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }
                };
            }
        }
    }

    // 3. Fallback: Find innermost scope containing position and lookup identifier
    let matchedScope = analysisResult.globalScope;
    for (const sc of analysisResult.scopes) {
        if (sc.range && isPositionInRange(position, sc.range)) {
            matchedScope = sc;
        }
    }

    const foundSym = matchedScope.lookup(name);
    if (foundSym) {
        // Check for struct members if in method
        const targetUri = foundSym.uri || (foundSym.importedFrom ? pathToUri(foundSym.importedFrom) : analysisResult.uri);
        if (foundSym.nameLoc || foundSym.loc) {
            return {
                uri: targetUri,
                range: foundSym.nameLoc || foundSym.loc
            };
        }
    }

    // 4. Check if token is a field or method in enclosing struct
    if (matchedScope.enclosingStruct) {
        const s = matchedScope.enclosingStruct;
        if (s.methods && s.methods.has(name)) {
            const m = s.methods.get(name);
            return {
                uri: s.uri || analysisResult.uri,
                range: m.nameLoc || m.loc
            };
        }
    }

    return null;
}

module.exports = {
    getDefinition
};
