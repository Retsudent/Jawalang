let lexer;
try {
    lexer = require('../../src/lexer');
} catch (_) {
    lexer = require('../runtime/lexer');
}

const { findTokenAt, isPositionInRange, pathToUri, BUILTINS, KEYWORDS } = require('./utils');
const { getReferences, isSameSymbol } = require('./references');

/**
 * Validate whether an identifier is a valid Jawalang symbol name.
 * Adheres strictly to the Jawalang lexer grammar and reserved names.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isValidIdentifier(name) {
    if (!name || typeof name !== 'string') return false;

    // Fast reject on whitespace, empty, or leading digit
    const trimmed = name.trim();
    if (trimmed !== name || name.length === 0) return false;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) return false;

    // Check reserved keywords, built-ins, and constructor name
    if (KEYWORDS[name] || BUILTINS[name] || name === 'wiwiti') return false;

    // Lex with Jawalang lexer to guarantee exact single IDENTIFIER token
    try {
        const tokens = lexer(name);
        if (tokens.length !== 1) return false;
        if (tokens[0].type !== 'IDENTIFIER') return false;
        if (tokens[0].value !== name) return false;
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Check whether renaming targetSymbol to newName would cause a collision
 * in the symbol's scope, enclosing struct, or global namespace.
 *
 * @param {Object} analysisResult
 * @param {Object} targetSymbol
 * @param {string} newName
 * @returns {string|null} Collision error message if collision exists, null if safe
 */
function checkCollision(analysisResult, targetSymbol, newName) {
    if (!analysisResult || !targetSymbol || !newName) return null;

    // Built-in collision check
    if (BUILTINS[newName]) {
        return `Simbol "${newName}" iku jeneng fungsi bawaan (built-in).`;
    }

    // Keyword collision check
    if (KEYWORDS[newName] || newName === 'wiwiti') {
        return `Simbol "${newName}" iku tembung kunci (keyword) basa Jawa.`;
    }

    // 1. Struct Member Collision (field or method)
    if (targetSymbol.kind === 'field' || targetSymbol.kind === 'method') {
        const structName = targetSymbol.enclosingStruct;
        if (structName && analysisResult.structs) {
            const structSym = analysisResult.structs.get(structName);
            if (structSym) {
                if (structSym.fieldSymbols && structSym.fieldSymbols.has(newName)) {
                    return `Property "${newName}" wis ana ing struct "${structName}".`;
                }
                if (structSym.methods && structSym.methods.has(newName)) {
                    return `Method "${newName}" wis ana ing struct "${structName}".`;
                }
                if (Array.isArray(structSym.fields) && structSym.fields.includes(newName)) {
                    return `Property "${newName}" wis ana ing struct "${structName}".`;
                }
            }
        }
        return null;
    }

    // 2. Struct Declaration Collision
    if (targetSymbol.kind === 'struct') {
        if (analysisResult.structs && analysisResult.structs.has(newName)) {
            return `Struct "${newName}" wis ana ing berkas iki.`;
        }
        if (analysisResult.globalScope && analysisResult.globalScope.symbols.has(newName)) {
            return `Simbol "${newName}" wis ana ing scope global.`;
        }
        return null;
    }

    // 3. Global Function Collision
    if (targetSymbol.kind === 'function') {
        if (analysisResult.globalScope && analysisResult.globalScope.symbols.has(newName)) {
            return `Fungsi utawa simbol "${newName}" wis ana ing scope global.`;
        }
        if (analysisResult.structs && analysisResult.structs.has(newName)) {
            return `Struct kanthi jeneng "${newName}" wis ana.`;
        }
        return null;
    }

    // 4. Namespace Collision
    if (targetSymbol.kind === 'namespace') {
        if (analysisResult.globalScope && analysisResult.globalScope.symbols.has(newName)) {
            return `Namespace utawa simbol "${newName}" wis ana ing scope global.`;
        }
        return null;
    }

    // 5. Variable / Parameter Collision in target scope
    // Find the scope that defined targetSymbol
    let targetScope = null;
    for (const sc of analysisResult.scopes || []) {
        if (sc.symbols && sc.symbols.get(targetSymbol.name) === targetSymbol) {
            targetScope = sc;
            break;
        }
    }

    if (!targetScope) {
        if (analysisResult.globalScope && analysisResult.globalScope.symbols.get(targetSymbol.name) === targetSymbol) {
            targetScope = analysisResult.globalScope;
        }
    }

    if (targetScope && targetScope.symbols) {
        if (targetScope.symbols.has(newName)) {
            return `Variabel "${newName}" wis ana ing scope iki.`;
        }
    }

    return null;
}

/**
 * LSP Rename Symbol Provider (textDocument/rename)
 *
 * @param {Object} analysisResult - Analysis result from Analyzer.analyze()
 * @param {Object} position - Zero-based { line, character } cursor position
 * @param {string} newName - New symbol identifier name
 * @returns {Object|null} LSP WorkspaceEdit or null if rename is invalid / rejected
 */
function renameSymbol(analysisResult, position, newName) {
    if (!analysisResult || !analysisResult.tokens || !position) return null;

    // 1. Cursor token lookup
    const token = findTokenAt(analysisResult.tokens, position);
    if (!token) return null;

    // Only IDENTIFIER tokens can represent user-defined symbols for rename
    // Keywords (GAWE, GUNA, BALI, YEN, etc.), literals, and WIWITI have distinct token types
    if (token.type !== 'IDENTIFIER') {
        return null;
    }

    const oldName = token.value;

    // 2. Reject if renaming to the exact same name
    if (newName === oldName) return null;

    // 3. Constructor protection
    if (oldName === 'wiwiti' || newName === 'wiwiti') {
        return null;
    }

    // 4. Validate new identifier name
    if (!isValidIdentifier(newName)) {
        return null;
    }

    // 5. Resolve Target Symbol using reference resolution
    let targetSymbol = null;

    // A. Position is directly on a symbol declaration range
    for (const sym of analysisResult.symbols || []) {
        if (sym.name === oldName && sym.nameLoc && isPositionInRange(position, sym.nameLoc)) {
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
        targetSymbol = matchedScope.lookup(oldName);
    }

    // D. Enclosing struct member lookup
    if (!targetSymbol) {
        let matchedScope = analysisResult.globalScope;
        for (const sc of analysisResult.scopes || []) {
            if (sc.range && isPositionInRange(position, sc.range)) {
                matchedScope = sc;
            }
        }
        if (matchedScope && matchedScope.enclosingStruct) {
            const enc = matchedScope.enclosingStruct;
            if (enc.methods && enc.methods.has(oldName)) {
                targetSymbol = enc.methods.get(oldName);
            } else if (enc.fieldSymbols && enc.fieldSymbols.has(oldName)) {
                targetSymbol = enc.fieldSymbols.get(oldName);
            }
        }
    }

    // E. Global struct member lookup by name
    if (!targetSymbol && analysisResult.structs) {
        for (const structSym of analysisResult.structs.values()) {
            if (structSym.methods && structSym.methods.has(oldName)) {
                targetSymbol = structSym.methods.get(oldName);
                break;
            }
            if (structSym.fieldSymbols && structSym.fieldSymbols.has(oldName)) {
                targetSymbol = structSym.fieldSymbols.get(oldName);
                break;
            }
        }
    }

    if (!targetSymbol) return null;

    // Built-in or constructor symbol safety check
    if (targetSymbol.kind === 'builtin' || targetSymbol.kind === 'constructor' || targetSymbol.name === 'wiwiti') {
        return null;
    }

    // 6. Collision detection
    const collisionError = checkCollision(analysisResult, targetSymbol, newName);
    if (collisionError) {
        return null;
    }

    // 9. Collect declaration + reference locations
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

    // Declaration location
    const declUri = targetSymbol.uri || (targetSymbol.importedFrom ? pathToUri(targetSymbol.importedFrom) : analysisResult.uri);
    const declRange = targetSymbol.nameLoc || targetSymbol.loc;
    if (declRange) {
        addLocation(declUri, declRange);
    }

    // All matching references
    for (const ref of analysisResult.references || []) {
        if (!ref.loc) continue;
        if (isSameSymbol(ref.symbol, targetSymbol)) {
            const refUri = ref.uri || analysisResult.uri;
            addLocation(refUri, ref.loc);
        }
    }

    if (locations.length === 0) {
        return null;
    }

    // 10. Group locations by URI into WorkspaceEdit changes
    const changes = {};

    for (const loc of locations) {
        if (!changes[loc.uri]) {
            changes[loc.uri] = [];
        }
        changes[loc.uri].push({
            range: loc.range,
            newText: newName
        });
    }

    // 11. Sort edits descending (line descending, then character descending)
    // to ensure safe application without text offset corruption
    for (const uri of Object.keys(changes)) {
        changes[uri].sort((a, b) => {
            if (b.range.start.line !== a.range.start.line) {
                return b.range.start.line - a.range.start.line;
            }
            return b.range.start.character - a.range.start.character;
        });
    }

    return { changes };
}

module.exports = {
    isValidIdentifier,
    checkCollision,
    renameSymbol
};
