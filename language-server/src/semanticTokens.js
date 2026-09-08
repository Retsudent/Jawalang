/**
 * Jawalang Language Server — Phase 8: Semantic Tokens Engine
 *
 * Implements textDocument/semanticTokens/full providing deterministic,
 * scope-aware, and semantic-safe highlighting for Jawalang (.jawa) files.
 */

const { BUILTINS, KEYWORDS } = require('./utils');
const moduleManager = require('./modules');

const TOKEN_TYPES = [
    'namespace',   // 0
    'type',        // 1
    'class',       // 2
    'function',    // 3
    'method',      // 4
    'property',    // 5
    'variable',    // 6
    'parameter',   // 7
    'keyword',     // 8
    'number',      // 9
    'string',      // 10
    'comment',     // 11
    'operator'     // 12
];

const TOKEN_MODIFIERS = [
    'declaration',    // 1 << 0 = 1
    'defaultLibrary'  // 1 << 1 = 2
];

const MODIFIER_DECLARATION = 1 << 0;     // 1
const MODIFIER_DEFAULT_LIBRARY = 1 << 1; // 2

const semanticTokensLegend = {
    tokenTypes: TOKEN_TYPES,
    tokenModifiers: TOKEN_MODIFIERS
};

const OPERATOR_TYPES = new Set([
    'PLUS',
    'MINUS',
    'MULTIPLY',
    'DIVIDE',
    'EQUALS',
    'EQUAL_EQUAL',
    'NOT_EQUAL',
    'GREATER',
    'GREATER_EQUAL',
    'LESS',
    'LESS_EQUAL'
]);

const KEYWORD_TOKEN_TYPES = new Set([
    'TULIS',
    'GAWE',
    'YEN',
    'LIYANE',
    'BOOLEAN',
    'LAN',
    'UTAWA',
    'ORA',
    'NALIKA',
    'KANGGO',
    'SABEN',
    'ING',
    'NGANTI',
    'LANGKAH',
    'MANDHEG',
    'LANJUT',
    'GUNA',
    'BALI',
    'COBA',
    'TANGKEP',
    'LEMPAR',
    'IMPOR',
    'EKSPOR',
    'BENTUK',
    'ANYAR',
    'IKI',
    'NULL',
    'SAKA',
    'MINANGKA',
    'NGEMBANGAKE',
    'SUPER'
]);

/**
 * Extract single-line comments (// ...) from text, ignoring slashes inside strings
 */
function extractComments(text) {
    const comments = [];
    if (!text || typeof text !== 'string') return comments;

    let inString = false;
    let line = 0;
    let lineStartOffset = 0;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '\n') {
            line++;
            lineStartOffset = i + 1;
            inString = false;
            continue;
        }

        if (ch === '"') {
            if (!inString) {
                inString = true;
            } else {
                let backslashCount = 0;
                let j = i - 1;
                while (j >= 0 && text[j] === '\\') {
                    backslashCount++;
                    j--;
                }
                if (backslashCount % 2 === 0) {
                    inString = false;
                }
            }
            continue;
        }

        if (!inString && ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
            const startChar = i - lineStartOffset;
            const startLine = line;
            let commentLen = 0;
            while (i < text.length && text[i] !== '\n' && text[i] !== '\r') {
                commentLen++;
                i++;
            }
            comments.push({
                line: startLine,
                character: startChar,
                length: commentLen,
                tokenType: 'comment',
                modifiers: 0
            });
            i--; // Allow \n to be consumed in next iteration
        }
    }

    return comments;
}

/**
 * Resolves the innermost Scope enclosing a given position (line, character)
 */
function findScopeAtPosition(scopes, line, character) {
    if (!scopes || scopes.length === 0) return null;
    let bestScope = scopes[0]; // Global scope fallback

    for (const sc of scopes) {
        if (!sc.range) continue;
        const s = sc.range.start;
        const e = sc.range.end;
        const afterStart = line > s.line || (line === s.line && character >= s.character);
        const beforeEnd = line < e.line || (line === e.line && character <= e.character);
        if (afterStart && beforeEnd) {
            bestScope = sc;
        }
    }

    return bestScope;
}

/**
 * Encodes an array of raw semantic tokens into relative LSP 5-tuples:
 * [deltaLine, deltaStart, length, tokenTypeIndex, tokenModifierBitmask]
 */
function encodeSemanticTokens(rawTokens) {
    if (!rawTokens || rawTokens.length === 0) {
        return [];
    }

    // 1. Sort strictly by line ASC, then character ASC
    const sorted = [...rawTokens].sort((a, b) => {
        if (a.line !== b.line) return a.line - b.line;
        return a.character - b.character;
    });

    // 2. Deduplicate and remove overlaps
    const sanitized = [];
    let prevAccepted = null;

    for (const tok of sorted) {
        if (tok.length <= 0) continue;
        if (tok.line < 0 || tok.character < 0) continue;

        if (prevAccepted) {
            // Same line checks
            if (tok.line === prevAccepted.line) {
                // Exact same start position: keep the more specific/informative token
                if (tok.character === prevAccepted.character) {
                    if (prevAccepted.tokenType === 'variable' && tok.tokenType !== 'variable') {
                        sanitized[sanitized.length - 1] = tok;
                        prevAccepted = tok;
                    }
                    continue;
                }

                // Overlapping range on same line: drop or skip
                if (tok.character < prevAccepted.character + prevAccepted.length) {
                    continue;
                }
            }
        }

        sanitized.push(tok);
        prevAccepted = tok;
    }

    // 3. Delta encoding
    let prevLine = 0;
    let prevChar = 0;
    const data = [];

    for (const tok of sanitized) {
        const typeIdx = TOKEN_TYPES.indexOf(tok.tokenType);
        if (typeIdx === -1) continue;

        const deltaLine = tok.line - prevLine;
        const deltaStart = deltaLine === 0 ? tok.character - prevChar : tok.character;

        data.push(deltaLine, deltaStart, tok.length, typeIdx, tok.modifiers || 0);

        prevLine = tok.line;
        prevChar = tok.character;
    }

    return data;
}

/**
 * Decodes LSP 5-tuples back into readable token objects (useful for tests and verification)
 */
function decodeSemanticTokens(data, legend = semanticTokensLegend) {
    const tokens = [];
    if (!data || data.length === 0) return tokens;

    let currentLine = 0;
    let currentChar = 0;

    for (let i = 0; i < data.length; i += 5) {
        const deltaLine = data[i];
        const deltaStart = data[i + 1];
        const length = data[i + 2];
        const tokenTypeIndex = data[i + 3];
        const tokenModifiersBitmask = data[i + 4];

        currentLine += deltaLine;
        if (deltaLine > 0) {
            currentChar = deltaStart;
        } else {
            currentChar += deltaStart;
        }

        tokens.push({
            line: currentLine,
            character: currentChar,
            length,
            tokenType: legend.tokenTypes[tokenTypeIndex],
            modifiers: tokenModifiersBitmask
        });
    }

    return tokens;
}

/**
 * Compute semantic tokens for an analyzed document
 */
function getSemanticTokens(analysis) {
    try {
        if (!analysis) {
            return { data: [] };
        }

        const rawTokens = [];
        const text = analysis.text || '';
        const lexerTokens = analysis.tokens || [];
        const symbols = analysis.symbols || [];
        const references = analysis.references || [];
        const scopes = analysis.scopes || [];
        const structs = analysis.structs || new Map();

        // 1. Extract and record all single-line comments
        const comments = extractComments(text);
        for (const cm of comments) {
            rawTokens.push(cm);
        }

        // 2. Index symbol declarations by location key "line:character"
        const declSymbolMap = new Map();
        for (const sym of symbols) {
            const loc = sym.nameLoc || (sym.node ? sym.node.nameLoc : null) || sym.loc;
            if (loc && loc.start) {
                const key = `${loc.start.line}:${loc.start.character}`;
                declSymbolMap.set(key, sym);
            }
        }

        // Index method declarations in structs
        for (const [stName, stSym] of structs.entries()) {
            if (stSym.methods instanceof Map) {
                for (const [mName, mSym] of stSym.methods.entries()) {
                    const loc = mSym.nameLoc || mSym.loc;
                    if (loc && loc.start) {
                        const key = `${loc.start.line}:${loc.start.character}`;
                        declSymbolMap.set(key, mSym);
                    }
                }
            }
            if (stSym.fieldSymbols instanceof Map) {
                for (const [fName, fSym] of stSym.fieldSymbols.entries()) {
                    const loc = fSym.nameLoc || fSym.loc;
                    if (loc && loc.start) {
                        const key = `${loc.start.line}:${loc.start.character}`;
                        declSymbolMap.set(key, fSym);
                    }
                }
            }
        }

        // 3. Index references by location key "line:character"
        const refMap = new Map();
        for (const ref of references) {
            if (ref.loc && ref.loc.start) {
                const key = `${ref.loc.start.line}:${ref.loc.start.character}`;
                refMap.set(key, ref);
            }
        }

        // 3b. Discover declared namespaces and imported symbols
        const declaredNamespaces = new Set();
        const importedFunctions = new Set();
        const importSpecifierMap = new Map();

        for (const sym of symbols) {
            if (sym.kind === 'namespace') declaredNamespaces.add(sym.name);
            if (sym.importedFrom) {
                if (sym.kind === 'function') importedFunctions.add(sym.name);
            }
        }

        // Scan tokens for imports as fallback or for unsaved/virtual files
        for (let ti = 0; ti < lexerTokens.length; ti++) {
            const t = lexerTokens[ti];
            // impor "..." minangka math
            if (t.type === 'MINANGKA' && lexerTokens[ti + 1] && (lexerTokens[ti + 1].type === 'IDENTIFIER' || lexerTokens[ti + 1].type === 'KEYWORD')) {
                if (ti > 0 && lexerTokens[ti - 1].type === 'STRING') {
                    declaredNamespaces.add(lexerTokens[ti + 1].value);
                }
            }
            // impor { a, b minangka c } saka "..."
            if (t.type === 'IMPOR' && lexerTokens[ti + 1] && lexerTokens[ti + 1].type === 'LEFT_BRACE') {
                let k = ti + 2;
                while (k < lexerTokens.length && lexerTokens[k].type !== 'RIGHT_BRACE') {
                    const currentTok = lexerTokens[k];
                    if (currentTok.type === 'IDENTIFIER' || currentTok.type === 'KEYWORD') {
                        const name = currentTok.value;
                        const nextK = lexerTokens[k + 1];
                        if (nextK && nextK.type === 'MINANGKA' && lexerTokens[k + 2]) {
                            const aliasTok = lexerTokens[k + 2];
                            const aliasName = aliasTok.value;
                            if (currentTok.loc && currentTok.loc.start) {
                                importSpecifierMap.set(`${currentTok.loc.start.line}:${currentTok.loc.start.character}`, {
                                    isAlias: false,
                                    name
                                });
                            }
                            if (aliasTok.loc && aliasTok.loc.start) {
                                importSpecifierMap.set(`${aliasTok.loc.start.line}:${aliasTok.loc.start.character}`, {
                                    isAlias: true,
                                    name: aliasName
                                });
                            }
                            importedFunctions.add(aliasName);
                            importedFunctions.add(name);
                            k += 2;
                        } else {
                            if (currentTok.loc && currentTok.loc.start) {
                                importSpecifierMap.set(`${currentTok.loc.start.line}:${currentTok.loc.start.character}`, {
                                    isAlias: false,
                                    name
                                });
                            }
                            importedFunctions.add(name);
                        }
                    }
                    k++;
                }
            }
        }

        // 4. Iterate and classify all lexical tokens
        for (let i = 0; i < lexerTokens.length; i++) {
            const tok = lexerTokens[i];
            if (!tok.loc || !tok.loc.start) continue;

            const line = tok.loc.start.line;
            const character = tok.loc.start.character;
            const length = (tok.loc.end && tok.loc.end.character !== undefined)
                ? (tok.loc.end.character - tok.loc.start.character)
                : String(tok.value).length;

            // 4a. String literal
            if (tok.type === 'STRING') {
                rawTokens.push({
                    line,
                    character,
                    length,
                    tokenType: 'string',
                    modifiers: 0
                });
                continue;
            }

            // 4b. Numeric literal
            if (tok.type === 'NUMBER') {
                rawTokens.push({
                    line,
                    character,
                    length,
                    tokenType: 'number',
                    modifiers: 0
                });
                continue;
            }

            // 4c. Operators (+, -, *, /, =, ==, !=, <, <=, >, >=)
            if (OPERATOR_TYPES.has(tok.type)) {
                rawTokens.push({
                    line,
                    character,
                    length: tok.value ? tok.value.length : 1,
                    tokenType: 'operator',
                    modifiers: 0
                });
                continue;
            }

            // 4d. Special language keywords
            if (tok.type === 'IKI') {
                rawTokens.push({
                    line,
                    character,
                    length: 3,
                    tokenType: 'keyword',
                    modifiers: 0
                });
                continue;
            }

            if (tok.type === 'SUPER') {
                rawTokens.push({
                    line,
                    character,
                    length: 5,
                    tokenType: 'keyword',
                    modifiers: 0
                });
                continue;
            }

            if (tok.type === 'WIWITI') {
                // In struct declaration `guna wiwiti(...)` or `wiwiti(...)`, wiwiti is the constructor method
                const prevTok = i > 0 ? lexerTokens[i - 1] : null;
                const nextTok = i + 1 < lexerTokens.length ? lexerTokens[i + 1] : null;

                if (prevTok && prevTok.type === 'GUNA') {
                    rawTokens.push({
                        line,
                        character,
                        length: 6,
                        tokenType: 'method',
                        modifiers: MODIFIER_DECLARATION
                    });
                } else if (nextTok && nextTok.type === 'LEFT_PAREN') {
                    rawTokens.push({
                        line,
                        character,
                        length: 6,
                        tokenType: 'method',
                        modifiers: MODIFIER_DECLARATION
                    });
                } else {
                    rawTokens.push({
                        line,
                        character,
                        length: 6,
                        tokenType: 'keyword',
                        modifiers: 0
                    });
                }
                continue;
            }

            if (KEYWORD_TOKEN_TYPES.has(tok.type)) {
                const kwLen = tok.value ? String(tok.value).length : (tok.type === 'NULL' ? 4 : (tok.value === true ? 5 : 5));
                rawTokens.push({
                    line,
                    character,
                    length: kwLen,
                    tokenType: 'keyword',
                    modifiers: 0
                });
                continue;
            }

            // 4e. Identifiers
            if (tok.type === 'IDENTIFIER') {
                const val = tok.value;
                const idLen = val.length;
                const key = `${line}:${character}`;
                const prevTok = i > 0 ? lexerTokens[i - 1] : null;
                const nextTok = i + 1 < lexerTokens.length ? lexerTokens[i + 1] : null;

                // Priority 0: Import specifiers & aliases
                if (importSpecifierMap.has(key)) {
                    const specInfo = importSpecifierMap.get(key);
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: 'function',
                        modifiers: specInfo.isAlias ? MODIFIER_DECLARATION : 0
                    });
                    continue;
                }

                // Priority 1: Exact symbol declaration match
                if (declSymbolMap.has(key)) {
                    const sym = declSymbolMap.get(key);
                    let tType = 'variable';
                    if (sym.kind === 'struct') tType = 'class';
                    else if (sym.kind === 'function') tType = 'function';
                    else if (sym.kind === 'method') tType = 'method';
                    else if (sym.kind === 'constructor') tType = 'method';
                    else if (sym.kind === 'field') tType = 'property';
                    else if (sym.kind === 'parameter') tType = 'parameter';
                    else if (sym.kind === 'namespace') tType = 'namespace';

                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: tType,
                        modifiers: MODIFIER_DECLARATION
                    });
                    continue;
                }

                // Priority 2: Exact reference graph match
                if (refMap.has(key)) {
                    const ref = refMap.get(key);
                    let tType = 'variable';
                    let mods = 0;

                    if (ref.isMethodCall) {
                        tType = 'method';
                    } else if (ref.isPropertyAccess) {
                        tType = 'property';
                    } else if (ref.symbol) {
                        const sk = ref.symbol.kind;
                        if (sk === 'struct') tType = 'class';
                        else if (sk === 'function') tType = 'function';
                        else if (sk === 'method' || sk === 'constructor') tType = 'method';
                        else if (sk === 'field') tType = 'property';
                        else if (sk === 'parameter') tType = 'parameter';
                        else if (sk === 'namespace') tType = 'namespace';
                        else if (sk === 'builtin') {
                            tType = 'function';
                            mods |= MODIFIER_DEFAULT_LIBRARY;
                        }
                    }

                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: tType,
                        modifiers: mods
                    });
                    continue;
                }

                // Priority 3: Syntactic Context heuristics
                if (prevTok) {
                    if (prevTok.type === 'BENTUK' || prevTok.type === 'NGEMBANGAKE' || prevTok.type === 'ANYAR') {
                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: 'class',
                            modifiers: prevTok.type === 'BENTUK' ? MODIFIER_DECLARATION : 0
                        });
                        continue;
                    }

                    if (prevTok.type === 'GUNA') {
                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: 'function',
                            modifiers: MODIFIER_DECLARATION
                        });
                        continue;
                    }

                    if (prevTok.type === 'GAWE') {
                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: 'variable',
                            modifiers: MODIFIER_DECLARATION
                        });
                        continue;
                    }

                    if (prevTok.type === 'MINANGKA') {
                        // Alias in import: namespace or function/class alias
                        const prevPrev = i > 1 ? lexerTokens[i - 2] : null;
                        let isNs = true;
                        if (prevPrev && (prevPrev.type === 'IDENTIFIER' || prevPrev.type === 'KEYWORD')) {
                            // Inside selective import: impor { kali minangka multiply }
                            isNs = false;
                        }
                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: isNs ? 'namespace' : 'function',
                            modifiers: MODIFIER_DECLARATION
                        });
                        continue;
                    }

                    if (prevTok.type === 'DOT') {
                        const beforeDot = i > 1 ? lexerTokens[i - 2] : null;
                        const isCall = nextTok && nextTok.type === 'LEFT_PAREN';

                        // Property or method access on object/instance/super/iki
                        if (beforeDot) {
                            if (beforeDot.type === 'SUPER' || beforeDot.type === 'IKI') {
                                rawTokens.push({
                                    line,
                                    character,
                                    length: idLen,
                                    tokenType: isCall ? 'method' : 'property',
                                    modifiers: 0
                                });
                                continue;
                            }

                            // Check if beforeDot is a known namespace
                            const isNs = declaredNamespaces.has(beforeDot.value) || symbols.some(s => s.kind === 'namespace' && s.name === beforeDot.value);
                            if (isNs) {
                                rawTokens.push({
                                    line,
                                    character,
                                    length: idLen,
                                    tokenType: isCall ? 'function' : 'variable',
                                    modifiers: 0
                                });
                                continue;
                            }
                        }

                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: isCall ? 'method' : 'property',
                            modifiers: 0
                        });
                        continue;
                    }
                }

                // If next token is 'DOT', this is an object or namespace
                if (nextTok && nextTok.type === 'DOT') {
                    const isNs = declaredNamespaces.has(val) || symbols.some(s => s.kind === 'namespace' && s.name === val);
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: isNs ? 'namespace' : 'variable',
                        modifiers: 0
                    });
                    continue;
                }

                // If symbol is a known declared namespace
                if (declaredNamespaces.has(val)) {
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: 'namespace',
                        modifiers: 0
                    });
                    continue;
                }

                // If next token is 'COLON' in object literal: { key: value }
                if (nextTok && nextTok.type === 'COLON') {
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: 'property',
                        modifiers: 0
                    });
                    continue;
                }

                // Priority 4: Lexical Scope lookup at token position
                const activeScope = findScopeAtPosition(scopes, line, character);
                if (activeScope) {
                    const resolvedSym = activeScope.lookup(val);
                    if (resolvedSym) {
                        let tType = 'variable';
                        let mods = 0;
                        if (resolvedSym.kind === 'struct') tType = 'class';
                        else if (resolvedSym.kind === 'function') tType = 'function';
                        else if (resolvedSym.kind === 'method') tType = 'method';
                        else if (resolvedSym.kind === 'parameter') tType = 'parameter';
                        else if (resolvedSym.kind === 'namespace') tType = 'namespace';
                        else if (resolvedSym.kind === 'field') tType = 'property';
                        else if (resolvedSym.kind === 'builtin') {
                            tType = 'function';
                            mods |= MODIFIER_DEFAULT_LIBRARY;
                        }

                        rawTokens.push({
                            line,
                            character,
                            length: idLen,
                            tokenType: tType,
                            modifiers: mods
                        });
                        continue;
                    }
                }

                // Priority 5: Built-in function lookup
                if (BUILTINS[val]) {
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: 'function',
                        modifiers: MODIFIER_DEFAULT_LIBRARY
                    });
                    continue;
                }

                // Priority 6: Check global struct definitions
                if (structs.has(val)) {
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: 'class',
                        modifiers: 0
                    });
                    continue;
                }

                // Priority 7: Call site check if followed by '('
                if (nextTok && nextTok.type === 'LEFT_PAREN') {
                    const fnSym = symbols.find(s => s.kind === 'function' && s.name === val);
                    rawTokens.push({
                        line,
                        character,
                        length: idLen,
                        tokenType: fnSym ? 'function' : 'function',
                        modifiers: 0
                    });
                    continue;
                }

                // Default conservative fallback: variable
                rawTokens.push({
                    line,
                    character,
                    length: idLen,
                    tokenType: 'variable',
                    modifiers: 0
                });
            }
        }

        // 5. Sort, deduplicate, and delta-encode
        const encodedData = encodeSemanticTokens(rawTokens);
        return { data: encodedData };
    } catch (err) {
        // Fail-safe: never crash language server
        return { data: [] };
    }
}

module.exports = {
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
    MODIFIER_DECLARATION,
    MODIFIER_DEFAULT_LIBRARY,
    semanticTokensLegend,
    extractComments,
    encodeSemanticTokens,
    decodeSemanticTokens,
    getSemanticTokens
};
