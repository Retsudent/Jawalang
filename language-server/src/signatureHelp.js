const { BUILTINS, isPositionInRange } = require('./utils');
const analyzer = require('./analyzer');

/**
 * Check if pos is strictly after token's end
 */
function isPositionAfterToken(pos, tok) {
    if (!tok || !tok.loc || !tok.loc.end) return false;
    const end = tok.loc.end;
    if (pos.line > end.line) return true;
    if (pos.line === end.line && pos.character >= end.character) return true;
    return false;
}

/**
 * Check if pos is strictly before or at token's start
 */
function isPositionBeforeOrAtTokenStart(pos, tok) {
    if (!tok || !tok.loc || !tok.loc.start) return true;
    const start = tok.loc.start;
    if (pos.line < start.line) return true;
    if (pos.line === start.line && pos.character <= start.character) return true;
    return false;
}

/**
 * Parse all call expressions and active calls from token stream
 */
function parseCalls(tokens) {
    const allCalls = [];
    const delimiterStack = []; // elements: { type: 'call'|'paren'|'bracket'|'brace', ... }

    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];

        if (tok.type === 'LEFT_BRACKET') {
            delimiterStack.push({ type: 'bracket', open: tok });
        } else if (tok.type === 'RIGHT_BRACKET') {
            if (delimiterStack.length > 0 && delimiterStack[delimiterStack.length - 1].type === 'bracket') {
                delimiterStack.pop();
            }
        } else if (tok.type === 'LEFT_BRACE') {
            delimiterStack.push({ type: 'brace', open: tok });
        } else if (tok.type === 'RIGHT_BRACE') {
            if (delimiterStack.length > 0 && delimiterStack[delimiterStack.length - 1].type === 'brace') {
                delimiterStack.pop();
            }
        } else if (tok.type === 'LEFT_PAREN') {
            const prev = i > 0 ? tokens[i - 1] : null;
            const prev2 = i > 1 ? tokens[i - 2] : null;
            const prev3 = i > 2 ? tokens[i - 3] : null;

            let isCall = false;
            let callInfo = null;

            // Reject function and constructor declarations: guna fnName( or wiwiti(
            if (prev2 && (prev2.type === 'GUNA' || prev2.type === 'BENTUK')) {
                // Function or struct declaration: guna foo(, bentuk Bar(
                isCall = false;
            } else if (prev && prev.type === 'WIWITI') {
                // Constructor declaration: wiwiti(
                isCall = false;
            } else if (prev && (prev.type === 'YEN' || prev.type === 'NALIKA' || prev.type === 'KANGGO' || prev.type === 'COBA' || prev.type === 'TANGKEP' || prev.type === 'LEMPAR' || prev.type === 'BALI')) {
                // Control flow keywords: yen (, nalika (, etc.
                isCall = false;
            } else if (prev && prev.type === 'SUPER') {
                // super(...) constructor call
                isCall = true;
                callInfo = {
                    kind: 'super_constructor'
                };
            } else if (prev && (prev.type === 'IDENTIFIER' || prev.type === 'TULIS' || (prev.value && BUILTINS[prev.value]))) {
                if (prev2 && prev2.type === 'ANYAR') {
                    // anyar StructName(...)
                    isCall = true;
                    callInfo = {
                        kind: 'constructor',
                        structName: prev.value
                    };
                } else if (prev2 && prev2.type === 'DOT' && prev3) {
                    if (prev3.type === 'SUPER') {
                        // super.method(...)
                        isCall = true;
                        callInfo = {
                            kind: 'super_method',
                            methodName: prev.value
                        };
                    } else if (prev3.type === 'IKI') {
                        // iki.method(...)
                        isCall = true;
                        callInfo = {
                            kind: 'iki_method',
                            methodName: prev.value
                        };
                    } else if (prev3.type === 'IDENTIFIER') {
                        // receiver.method(...)
                        isCall = true;
                        callInfo = {
                            kind: 'member_method',
                            receiverName: prev3.value,
                            methodName: prev.value
                        };
                    }
                } else {
                    // Direct function call: fnName(...)
                    isCall = true;
                    callInfo = {
                        kind: 'function',
                        fnName: prev.value
                    };
                }
            }

            if (isCall && callInfo) {
                const callObj = {
                    type: 'call',
                    kind: callInfo.kind,
                    fnName: callInfo.fnName,
                    structName: callInfo.structName,
                    receiverName: callInfo.receiverName,
                    methodName: callInfo.methodName,
                    openParen: tok,
                    closeParen: null,
                    commas: []
                };
                delimiterStack.push(callObj);
                allCalls.push(callObj);
            } else {
                delimiterStack.push({ type: 'paren', open: tok, closeParen: null });
            }
        } else if (tok.type === 'COMMA') {
            // Check top of stack: if it's an active call, record this argument separator comma
            if (delimiterStack.length > 0) {
                const top = delimiterStack[delimiterStack.length - 1];
                if (top.type === 'call') {
                    top.commas.push(tok);
                }
            }
        } else if (tok.type === 'RIGHT_PAREN') {
            // Pop the matching open paren or call
            for (let s = delimiterStack.length - 1; s >= 0; s--) {
                const item = delimiterStack[s];
                if (item.type === 'call' || item.type === 'paren') {
                    item.closeParen = tok;
                    delimiterStack.splice(s, 1);
                    break;
                }
            }
        }
    }

    return allCalls;
}

/**
 * Fallback to extract function parameter names from tokens if AST was incomplete
 */
function extractFunctionParamsFromTokens(tokens, fnName) {
    if (!tokens) return null;
    for (let i = 0; i < tokens.length - 3; i++) {
        if (tokens[i].type === 'GUNA' && tokens[i + 1] && tokens[i + 1].value === fnName && tokens[i + 2] && tokens[i + 2].type === 'LEFT_PAREN') {
            const params = [];
            let idx = i + 3;
            while (idx < tokens.length && tokens[idx].type !== 'RIGHT_PAREN') {
                if (tokens[idx].type === 'IDENTIFIER' || tokens[idx].type === 'ANYAR') {
                    params.push(tokens[idx].value);
                }
                idx++;
            }
            return params;
        }
    }
    return null;
}

/**
 * Fallback to extract struct constructor params from tokens
 */
function extractStructConstructorParamsFromTokens(tokens, structName) {
    if (!tokens) return null;
    for (let i = 0; i < tokens.length - 2; i++) {
        if (tokens[i].type === 'BENTUK' && tokens[i + 1] && tokens[i + 1].value === structName) {
            // Find wiwiti inside this struct
            let idx = i + 2;
            let depth = 0;
            while (idx < tokens.length) {
                if (tokens[idx].type === 'LEFT_BRACE') depth++;
                else if (tokens[idx].type === 'RIGHT_BRACE') {
                    depth--;
                    if (depth === 0) break;
                }
                if (depth > 0 && tokens[idx].type === 'WIWITI' && tokens[idx + 1] && tokens[idx + 1].type === 'LEFT_PAREN') {
                    const params = [];
                    let pIdx = idx + 2;
                    while (pIdx < tokens.length && tokens[pIdx].type !== 'RIGHT_PAREN') {
                        if (tokens[pIdx].type === 'IDENTIFIER') {
                            params.push(tokens[pIdx].value);
                        }
                        pIdx++;
                    }
                    return params;
                }
                idx++;
            }
            return [];
        }
    }
    return null;
}

/**
 * LSP Signature Help Provider (textDocument/signatureHelp)
 *
 * @param {Object} analysisResult - Analysis result from Analyzer.analyze()
 * @param {Object} position - Zero-based { line, character } cursor position
 * @returns {Object|null} LSP SignatureHelp or null
 */
function getSignatureHelp(analysisResult, position) {
    if (!analysisResult || !analysisResult.tokens || !position) return null;
    if (position.line === undefined || position.character === undefined) return null;

    const tokens = analysisResult.tokens;
    if (tokens.length === 0) return null;

    const allCalls = parseCalls(tokens);

    // Find all calls containing position
    const activeCalls = [];
    for (const call of allCalls) {
        if (isPositionAfterToken(position, call.openParen)) {
            if (!call.closeParen || isPositionBeforeOrAtTokenStart(position, call.closeParen)) {
                activeCalls.push(call);
            }
        }
    }

    if (activeCalls.length === 0) return null;

    // Pick the innermost call (the one whose openParen starts latest before position)
    activeCalls.sort((a, b) => {
        const aStart = a.openParen.loc.start;
        const bStart = b.openParen.loc.start;
        if (aStart.line !== bStart.line) return bStart.line - aStart.line;
        return bStart.character - aStart.character;
    });

    const activeCall = activeCalls[0];

    // Compute activeParameter by counting top-level commas occurring before position
    let activeParameter = 0;
    for (const commaTok of activeCall.commas) {
        if (isPositionAfterToken(position, commaTok)) {
            activeParameter++;
        }
    }

    // Resolve Innermost Scope at position
    let matchedScope = analysisResult.globalScope;
    for (const sc of analysisResult.scopes || []) {
        if (sc.range && isPositionInRange(position, sc.range)) {
            matchedScope = sc;
        }
    }

    // Callee Resolution
    let label = null;
    let parameters = [];
    let documentation = null;

    switch (activeCall.kind) {
        case 'function': {
            const fnName = activeCall.fnName;
            const sym = matchedScope ? matchedScope.lookup(fnName) : null;

            if (sym) {
                // Shadowing check: if shadowed by a local variable, it is not callable
                if (sym.kind === 'variable' || sym.kind === 'parameter') {
                    return null;
                }

                if (sym.kind === 'function') {
                    const params = (sym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
                    label = `${fnName}(${params.join(', ')})`;
                    parameters = params.map(p => ({ label: p }));
                } else if (sym.kind === 'builtin') {
                    const info = BUILTINS[fnName];
                    if (info) {
                        const params = info.params || [];
                        label = `${fnName}(${params.join(', ')})`;
                        parameters = params.map(p => ({ label: p }));
                        documentation = {
                            kind: 'markdown',
                            value: `${info.description}\n\n**Tuladha:**\n\`\`\`jawa\n${info.example}\n\`\`\``
                        };
                    }
                }
            } else if (BUILTINS[fnName]) {
                const info = BUILTINS[fnName];
                const params = info.params || [];
                label = `${fnName}(${params.join(', ')})`;
                parameters = params.map(p => ({ label: p }));
                documentation = {
                    kind: 'markdown',
                    value: `${info.description}\n\n**Tuladha:**\n\`\`\`jawa\n${info.example}\n\`\`\``
                };
            } else {
                // Fallback: check token stream for user function declaration if AST was malformed
                const fallbackParams = extractFunctionParamsFromTokens(tokens, fnName);
                if (fallbackParams) {
                    label = `${fnName}(${fallbackParams.join(', ')})`;
                    parameters = fallbackParams.map(p => ({ label: p }));
                }
            }
            break;
        }

        case 'constructor': {
            const structName = activeCall.structName;
            const structSym = (analysisResult.structs && analysisResult.structs.get(structName)) ||
                              (matchedScope && matchedScope.lookup(structName));

            if (structSym && structSym.kind === 'struct') {
                let ctor = structSym.constructor || (structSym.methods && structSym.methods.get('wiwiti'));
                let curr = structSym;
                while (!ctor && curr && curr.parent) {
                    const pName = typeof curr.parent === 'string' ? curr.parent : curr.parent.value;
                    curr = analysisResult.structs ? analysisResult.structs.get(pName) : null;
                    if (curr) {
                        ctor = curr.constructor || (curr.methods && curr.methods.get('wiwiti'));
                    }
                }
                const params = ctor ? (ctor.parameters || []).map(p => typeof p === 'string' ? p : p.value || p) : [];
                label = `${structName}(${params.join(', ')})`;
                parameters = params.map(p => ({ label: p }));
            } else {
                const fallbackParams = extractStructConstructorParamsFromTokens(tokens, structName);
                if (fallbackParams !== null) {
                    label = `${structName}(${fallbackParams.join(', ')})`;
                    parameters = fallbackParams.map(p => ({ label: p }));
                }
            }
            break;
        }

        case 'super_constructor': {
            let encStruct = matchedScope ? matchedScope.enclosingStruct : null;
            if (!encStruct && analysisResult.structs) {
                // Find struct enclosing position
                for (const s of analysisResult.structs.values()) {
                    if (s.loc && isPositionInRange(position, s.loc)) {
                        encStruct = s;
                        break;
                    }
                }
            }
            if (encStruct && encStruct.parent) {
                const pName = typeof encStruct.parent === 'string' ? encStruct.parent : encStruct.parent.value;
                const parentStruct = analysisResult.structs ? analysisResult.structs.get(pName) : null;
                if (parentStruct) {
                    let ctor = parentStruct.constructor || (parentStruct.methods && parentStruct.methods.get('wiwiti'));
                    let curr = parentStruct;
                    while (!ctor && curr && curr.parent) {
                        const nextP = typeof curr.parent === 'string' ? curr.parent : curr.parent.value;
                        curr = analysisResult.structs ? analysisResult.structs.get(nextP) : null;
                        if (curr) {
                            ctor = curr.constructor || (curr.methods && curr.methods.get('wiwiti'));
                        }
                    }
                    const params = ctor ? (ctor.parameters || []).map(p => typeof p === 'string' ? p : p.value || p) : [];
                    label = `super(${params.join(', ')})`;
                    parameters = params.map(p => ({ label: p }));
                }
            }
            break;
        }

        case 'super_method': {
            const methodName = activeCall.methodName;
            let encStruct = matchedScope ? matchedScope.enclosingStruct : null;
            if (!encStruct && analysisResult.structs) {
                for (const s of analysisResult.structs.values()) {
                    if (s.loc && isPositionInRange(position, s.loc)) {
                        encStruct = s;
                        break;
                    }
                }
            }
            if (encStruct && encStruct.parent) {
                const pName = typeof encStruct.parent === 'string' ? encStruct.parent : encStruct.parent.value;
                const parentStruct = analysisResult.structs ? analysisResult.structs.get(pName) : null;
                if (parentStruct) {
                    const methodSym = analyzer.lookupStructMember(parentStruct, methodName, analysisResult.structs);
                    if (methodSym && (methodSym.kind === 'method' || methodSym.kind === 'function')) {
                        const params = (methodSym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
                        label = `${methodName}(${params.join(', ')})`;
                        parameters = params.map(p => ({ label: p }));
                    }
                }
            }
            break;
        }

        case 'iki_method': {
            const methodName = activeCall.methodName;
            let encStruct = matchedScope ? matchedScope.enclosingStruct : null;
            if (!encStruct && analysisResult.structs) {
                for (const s of analysisResult.structs.values()) {
                    if (s.loc && isPositionInRange(position, s.loc)) {
                        encStruct = s;
                        break;
                    }
                }
            }
            if (encStruct) {
                const methodSym = analyzer.lookupStructMember(encStruct, methodName, analysisResult.structs);
                if (methodSym && (methodSym.kind === 'method' || methodSym.kind === 'function')) {
                    const params = (methodSym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
                    label = `${methodName}(${params.join(', ')})`;
                    parameters = params.map(p => ({ label: p }));
                }
            }
            break;
        }

        case 'member_method': {
            const receiverName = activeCall.receiverName;
            const methodName = activeCall.methodName;
            const receiverSym = matchedScope ? matchedScope.lookup(receiverName) : null;

            if (receiverSym) {
                // Case A: Namespace module
                if (receiverSym.kind === 'namespace' && receiverSym.moduleRecord) {
                    const expFn = receiverSym.moduleRecord.exports?.functions?.[methodName];
                    if (expFn) {
                        const params = (expFn.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
                        label = `${methodName}(${params.join(', ')})`;
                        parameters = params.map(p => ({ label: p }));
                    }
                } else if (receiverSym.inferredType && receiverSym.inferredType.startsWith('instance of ')) {
                    // Case B: Struct instance
                    const targetStructName = receiverSym.inferredType.replace('instance of ', '').trim();
                    const structSym = (analysisResult.structs && analysisResult.structs.get(targetStructName)) ||
                                      (analysisResult.globalScope && analysisResult.globalScope.lookup(targetStructName));
                    if (structSym && structSym.kind === 'struct') {
                        const methodSym = analyzer.lookupStructMember(structSym, methodName, analysisResult.structs);
                        if (methodSym && (methodSym.kind === 'method' || methodSym.kind === 'function')) {
                            const params = (methodSym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
                            label = `${methodName}(${params.join(', ')})`;
                            parameters = params.map(p => ({ label: p }));
                        }
                    }
                }
            }
            break;
        }

        default:
            break;
    }

    if (!label) return null;

    const signatureObj = {
        label,
        parameters
    };
    if (documentation) {
        signatureObj.documentation = documentation;
    }

    return {
        signatures: [signatureObj],
        activeSignature: 0,
        activeParameter
    };
}

module.exports = {
    getSignatureHelp,
    parseCalls
};
