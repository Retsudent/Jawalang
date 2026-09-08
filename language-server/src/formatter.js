/**
 * Jawalang Language Server - Document Formatter
 * Implements LSP textDocument/formatting
 * 
 * Provides deterministic, token-aware code formatting for Jawalang (.jawa) files.
 * - Indentation: 4 spaces per nesting level (no tabs)
 * - Operator spacing: binary operators surrounded by single spaces, unary operators attached
 * - Block formatting: { ends line with space before, } starts line with outer indent
 * - Cuddled keywords: "} liyane {", "} liyane yen ... {", "} tangkep err {"
 * - String safety: strings and escape sequences preserved verbatim
 * - Comment safety: comments preserved verbatim, standalone comments indented, trailing comments spaced
 * - Malformed code safety: returns [] on fatal syntax errors, never corrupts code or crashes
 * - Idempotency: format(format(code)) === format(code)
 * - CRLF / LF preservation
 */

const KEYWORDS = new Set([
    'tulis', 'gawe', 'yen', 'liyane', 'bener', 'salah', 'lan', 'utawa',
    'ora', 'nalika', 'kanggo', 'saben', 'ing', 'nganti', 'langkah',
    'mandheg', 'lanjut', 'guna', 'bali', 'coba', 'tangkep', 'lempar',
    'impor', 'ekspor', 'bentuk', 'anyar', 'iki', 'wiwiti', 'null',
    'saka', 'minangka', 'ngembangake', 'super'
]);

const BLOCK_HEADER_KEYWORDS = new Set([
    'guna', 'wiwiti', 'bentuk', 'yen', 'liyane', 'nalika', 'kanggo', 'coba', 'tangkep'
]);

/**
 * Tokenize source text into rich tokens preserving comments, strings, operators, and newlines.
 */
function tokenize(text) {
    const tokens = [];
    let i = 0;
    const len = text.length;

    while (i < len) {
        const ch = text[i];

        // Whitespace (horizontal)
        if (ch === ' ' || ch === '\t') {
            i++;
            continue;
        }

        // Newline
        if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
            if (ch === '\r') i++;
            i++;
            tokens.push({ type: 'NEWLINE', value: '\n' });
            continue;
        }

        // Single-line comment: //
        if (ch === '/' && text[i + 1] === '/') {
            const start = i;
            i += 2;
            while (i < len && text[i] !== '\n' && text[i] !== '\r') {
                i++;
            }
            tokens.push({ type: 'COMMENT', value: text.slice(start, i) });
            continue;
        }

        // String literal: "..."
        if (ch === '"') {
            const start = i;
            i++; // skip opening quote
            let closed = false;
            while (i < len) {
                if (text[i] === '\\' && i + 1 < len) {
                    i += 2; // skip escape sequence
                } else if (text[i] === '"') {
                    i++; // skip closing quote
                    closed = true;
                    break;
                } else if (text[i] === '\n' || text[i] === '\r') {
                    // Unclosed string on line
                    break;
                } else {
                    i++;
                }
            }
            if (!closed) {
                return { tokens: [], hasError: true };
            }
            tokens.push({ type: 'STRING', value: text.slice(start, i) });
            continue;
        }

        // Multi-character operators
        const twoChar = text.slice(i, i + 2);
        if (['==', '!=', '<=', '>=', '+=', '-=', '*=', '/='].includes(twoChar)) {
            tokens.push({ type: 'OPERATOR', value: twoChar });
            i += 2;
            continue;
        }

        // Single-character operators
        if ('+-*/%='.includes(ch) || '<>'.includes(ch)) {
            tokens.push({ type: 'OPERATOR', value: ch });
            i++;
            continue;
        }

        // Punctuation
        if ('{}()[],.:;'.includes(ch)) {
            tokens.push({ type: 'PUNCTUATION', value: ch });
            i++;
            continue;
        }

        // Numbers: integer or floating point (e.g. 10, 3.14)
        if (/[0-9]/.test(ch)) {
            const start = i;
            while (i < len && /[0-9]/.test(text[i])) {
                i++;
            }
            if (i < len && text[i] === '.' && i + 1 < len && /[0-9]/.test(text[i + 1])) {
                i++; // dot
                while (i < len && /[0-9]/.test(text[i])) {
                    i++;
                }
            }
            tokens.push({ type: 'NUMBER', value: text.slice(start, i) });
            continue;
        }

        // Identifiers and Keywords
        if (/[a-zA-Z_]/.test(ch)) {
            const start = i;
            while (i < len && /[a-zA-Z0-9_]/.test(text[i])) {
                i++;
            }
            const word = text.slice(start, i);
            if (KEYWORDS.has(word)) {
                tokens.push({ type: 'KEYWORD', value: word });
            } else {
                tokens.push({ type: 'IDENTIFIER', value: word });
            }
            continue;
        }

        // Fallback for any unknown symbol
        tokens.push({ type: 'UNKNOWN', value: ch });
        i++;
    }

    return { tokens, hasError: false };
}

/**
 * Determine if a '-' or '+' token represents a unary operator
 */
function isUnaryOp(tokIndex, tokenList) {
    const tok = tokenList[tokIndex];
    if (tok.value !== '-' && tok.value !== '+') return false;

    // Look backward for previous non-trivia token
    let prev = null;
    for (let j = tokIndex - 1; j >= 0; j--) {
        if (tokenList[j].type !== 'NEWLINE' && tokenList[j].type !== 'COMMENT') {
            prev = tokenList[j];
            break;
        }
    }

    if (!prev) return true; // Start of expression / statement

    if (prev.type === 'OPERATOR') return true; // e.g. = -, == -
    if (prev.value === '(' || prev.value === '[' || prev.value === '{' || prev.value === ',' || prev.value === ':') return true;

    if (prev.type === 'KEYWORD') {
        const exprKeywords = [
            'bali', 'tulis', 'yen', 'nalika', 'lempar', 'ing', 'saka',
            'lan', 'utawa', 'ora', 'langkah', 'nganti', 'coba', 'tangkep'
        ];
        if (exprKeywords.includes(prev.value)) return true;
    }

    return false;
}

/**
 * Determine whether a space should separate prevTok and currTok on the same line
 */
function shouldHaveSpace(prevTok, currTok, tokIndex, tokenList) {
    if (!prevTok || !currTok) return false;

    const pVal = prevTok.value;
    const cVal = currTok.value;
    const pType = prevTok.type;
    const cType = currTok.type;

    // 1. Commas and semicolons
    if (cVal === ',' || cVal === ';') return false;
    if (pVal === ',') return true;

    // 2. Colons in object literals or key-value pairs
    if (cVal === ':') return false;
    if (pVal === ':') return true;

    // 3. Dot member access: never spaces around '.'
    if (pVal === '.' || cVal === '.') return false;

    // 3b. Unary operator followed by operand (no space after: -a, +10, -(x))
    const isPrevUnary = (pVal === '-' || pVal === '+') && isUnaryOp(tokIndex - 1, tokenList);
    if (isPrevUnary) {
        return false;
    }

    // 4. Parentheses
    if (cVal === '(') {
        // Function / constructor call or declaration: no space before '('
        if (pType === 'IDENTIFIER' || pVal === 'super' || pVal === 'wiwiti') {
            return false;
        }
        // If preceding token was the function name in 'guna <name>('
        if (tokIndex >= 2) {
            let prevNonWs = tokIndex - 2;
            while (prevNonWs >= 0 && (tokenList[prevNonWs].type === 'NEWLINE' || tokenList[prevNonWs].type === 'COMMENT')) {
                prevNonWs--;
            }
            if (prevNonWs >= 0 && tokenList[prevNonWs].value === 'guna') {
                return false;
            }
        }
        if (pVal === ')' || pVal === ']') {
            return false; // Chained call: f()(x), arr[0](x)
        }
        // Control flow keywords: space before '(' (e.g. yen (cond))
        return true;
    }
    if (pVal === '(') return false;
    if (cVal === ')') return false;

    // 5. Brackets
    if (pVal === '[' && cVal === '[') return false; // nested [[ has no space
    if (cVal === '[') {
        // Indexing: receiver[index] has no space
        if (pType === 'IDENTIFIER' || pVal === 'iki' || pVal === 'super' || pVal === ')' || pVal === ']' || pType === 'STRING') {
            return false;
        }
        return true;
    }
    if (pVal === '[') return false;
    if (cVal === ']') return false;

    // 6. Braces
    if (cVal === '{') return true; // space before opening brace (e.g. fn() {, yen cond {)
    if (pVal === '{' && cVal === '}') return false; // empty {} has no space inside
    if (pVal === '{' && cVal !== '}') return true; // space after opening brace: { "nama"
    if (cVal === '}' && pVal !== '{') return true; // space before closing brace: "Barch" }

    // 7. Operators
    const isCurrUnary = isUnaryOp(tokIndex, tokenList);
    if (isCurrUnary) {
        // Unary minus/plus: space before (unless after '(', '[', or at start), no space after
        if (pVal === '(' || pVal === '[' || pVal === ',') return false;
        return true;
    }

    if (pType === 'OPERATOR' || cType === 'OPERATOR') {
        return true; // Binary operators surrounded by spaces
    }

    // 8. Keywords and identifiers
    if (pType === 'KEYWORD') return true;
    if (cType === 'KEYWORD') return true;

    // 9. Words, literals, identifiers touching
    const isPWord = pType === 'IDENTIFIER' || pType === 'NUMBER' || pType === 'STRING';
    const isCWord = cType === 'IDENTIFIER' || cType === 'NUMBER' || cType === 'STRING';
    if (isPWord && isCWord) return true;

    return false;
}

/**
 * Format tokens into an array of formatted line strings with 4-space indentation
 */
function formatTokensToLines(tokens, tabSize = 4) {
    const indentStr = ' '.repeat(tabSize);
    const resultLines = [];

    let indentLevel = 0;
    let currentLineTokens = [];
    let pendingBlankLine = false;
    const braceStack = [];

    // Identify matching braces to know which objects/arrays are multiline
    function analyzeBrace(idx) {
        const tok = tokens[idx];
        if (tok.value !== '{') return { isMultiline: false, isBlock: false, isObject: false, isImport: false };

        // Check if immediately closed: {}
        let nextIdx = idx + 1;
        while (nextIdx < tokens.length && tokens[nextIdx].type === 'NEWLINE') nextIdx++;
        if (nextIdx < tokens.length && tokens[nextIdx].value === '}') {
            let hasTokens = false;
            for (let k = idx + 1; k < nextIdx; k++) {
                if (tokens[k].type !== 'NEWLINE') hasTokens = true;
            }
            if (!hasTokens && tokens[idx + 1] && tokens[idx + 1].value === '}') {
                return { isMultiline: false, isBlock: false, isObject: false, isImport: false };
            }
        }

        // Look backward up to previous statement or block start
        let isBlock = false;
        let isImport = false;
        let isAssignment = false;

        for (let k = idx - 1; k >= 0; k--) {
            const t = tokens[k];
            if (t.type === 'NEWLINE') {
                break;
            }
            if (BLOCK_HEADER_KEYWORDS.has(t.value)) {
                isBlock = true;
                break;
            }
            if (t.value === 'impor') {
                isImport = true;
                break;
            }
            if (t.value === '=') {
                isAssignment = true;
            }
        }

        // Also check if preceded by ')' which usually ends function header or control expr
        if (!isBlock && !isImport) {
            let pIdx = idx - 1;
            while (pIdx >= 0 && tokens[pIdx].type === 'NEWLINE') pIdx--;
            if (pIdx >= 0 && tokens[pIdx].value === ')') {
                isBlock = true;
            }
        }

        // Check if original text had newline inside
        let depth = 1;
        let hasNewlineInside = false;
        let hasCommaAtDepth1 = false;
        for (let k = idx + 1; k < tokens.length; k++) {
            if (tokens[k].value === '{') depth++;
            else if (tokens[k].value === '}') {
                depth--;
                if (depth === 0) break;
            } else if (tokens[k].type === 'NEWLINE') {
                hasNewlineInside = true;
            } else if (depth === 1 && tokens[k].value === ',') {
                hasCommaAtDepth1 = true;
            }
        }

        if (isBlock) {
            return { isMultiline: true, isBlock: true, isObject: false, isImport: false };
        }

        if (isImport) {
            const multiline = hasNewlineInside;
            return { isMultiline: multiline, isBlock: false, isObject: false, isImport: true };
        }

        // Object literal
        const multiline = hasNewlineInside || (isAssignment && hasCommaAtDepth1);
        return { isMultiline: multiline, isBlock: false, isObject: true, isImport: false };
    }

    function flushLine(trailingComment = null) {
        if (currentLineTokens.length === 0 && !trailingComment) return;

        if (pendingBlankLine && resultLines.length > 0) {
            const lastLine = resultLines[resultLines.length - 1];
            // Only emit a blank line if previous line is not already blank and doesn't end with '{'
            if (lastLine !== '' && !lastLine.endsWith('{')) {
                resultLines.push('');
            }
            pendingBlankLine = false;
        }

        let lineText = '';
        for (let j = 0; j < currentLineTokens.length; j++) {
            const tok = currentLineTokens[j];
            if (j > 0) {
                const prev = currentLineTokens[j - 1];
                if (shouldHaveSpace(prev, tok, j, currentLineTokens)) {
                    lineText += ' ';
                }
            }
            lineText += tok.value;
        }

        if (trailingComment) {
            lineText = lineText.length > 0 ? `${lineText} ${trailingComment}` : trailingComment;
        }

        if (lineText.length > 0) {
            const prefix = indentStr.repeat(Math.max(0, indentLevel));
            resultLines.push(prefix + lineText);
        }

        currentLineTokens = [];
    }

    let i = 0;
    let parenDepth = 0;
    let bracketDepth = 0;

    while (i < tokens.length) {
        const tok = tokens[i];

        // Track paren and bracket depth
        if (tok.value === '(') {
            parenDepth++;
        } else if (tok.value === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
        } else if (tok.value === '[') {
            bracketDepth++;
        } else if (tok.value === ']') {
            bracketDepth = Math.max(0, bracketDepth - 1);
        }

        // 1. Newline handling
        if (tok.type === 'NEWLINE') {
            if (currentLineTokens.length > 0) {
                flushLine();
            } else if (resultLines.length > 0) {
                const last = resultLines[resultLines.length - 1];
                if (last !== '' && !last.endsWith('{')) {
                    pendingBlankLine = true;
                }
            }
            i++;
            continue;
        }

        // 2. Comment handling
        if (tok.type === 'COMMENT') {
            if (currentLineTokens.length > 0) {
                // Trailing comment after code
                flushLine(tok.value);
                if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                    i++;
                }
            } else {
                // Standalone comment line
                if (pendingBlankLine && resultLines.length > 0 && resultLines[resultLines.length - 1] !== '') {
                    resultLines.push('');
                    pendingBlankLine = false;
                }
                const prefix = indentStr.repeat(Math.max(0, indentLevel));
                resultLines.push(prefix + tok.value);
                if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                    i++;
                }
            }
            i++;
            continue;
        }

        // 3. Opening brace {
        if (tok.value === '{') {
            const braceInfo = analyzeBrace(i);
            if (braceInfo.isMultiline) {
                braceStack.push(braceInfo);
                currentLineTokens.push(tok);
                flushLine();
                indentLevel++;
                // Skip the newline immediately following opening brace
                if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                    i++;
                }
                i++;
                continue;
            } else {
                // Inline brace (e.g. empty {} or single-line expression object)
                braceStack.push(braceInfo);
                currentLineTokens.push(tok);
                i++;
                continue;
            }
        }

        // 4. Closing brace }
        if (tok.value === '}') {
            const topBrace = braceStack.pop();
            if (topBrace && !topBrace.isMultiline) {
                // Inline brace closing: stay on same line
                currentLineTokens.push(tok);
                i++;
                continue;
            }

            // Multiline brace closing
            if (currentLineTokens.length > 0) {
                flushLine();
            }
            indentLevel = Math.max(0, indentLevel - 1);
            pendingBlankLine = false; // No blank line right before '}'
            currentLineTokens.push(tok);

            // Look ahead to see if cuddled keyword follows on same line
            let nextNonNl = i + 1;
            while (nextNonNl < tokens.length && tokens[nextNonNl].type === 'NEWLINE') {
                nextNonNl++;
            }

            if (nextNonNl < tokens.length) {
                const nextTok = tokens[nextNonNl];
                if (nextTok.value === 'liyane' || nextTok.value === 'tangkep' || nextTok.value === 'saka') {
                    i = nextNonNl;
                    while (i < tokens.length) {
                        const cTok = tokens[i];
                        if (cTok.value === '(') parenDepth++;
                        else if (cTok.value === ')') parenDepth = Math.max(0, parenDepth - 1);
                        else if (cTok.value === '[') bracketDepth++;
                        else if (cTok.value === ']') bracketDepth = Math.max(0, bracketDepth - 1);

                        if (cTok.type === 'NEWLINE') {
                            // Check if next non-newline token is opening brace '{'
                            let lookAhead = i + 1;
                            while (lookAhead < tokens.length && tokens[lookAhead].type === 'NEWLINE') lookAhead++;
                            if (lookAhead < tokens.length && tokens[lookAhead].value === '{') {
                                i = lookAhead;
                                continue;
                            }
                            break;
                        }
                        if (cTok.value === '{') {
                            braceStack.push({ isMultiline: true, isBlock: true, isObject: false, isImport: false });
                            currentLineTokens.push(cTok);
                            flushLine();
                            indentLevel++;
                            if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                                i++;
                            }
                            i++;
                            break;
                        }
                        currentLineTokens.push(cTok);
                        i++;
                    }
                    continue;
                }
            }

            // Normal closing brace on its own line
            if (tokens[i + 1] && tokens[i + 1].value === ',') {
                currentLineTokens.push(tokens[i + 1]);
                i++;
            }
            flushLine();
            if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                i++;
            }
            i++;
            continue;
        }

        // 5. Comma in multiline object / import: break to next line if was multiline
        if (tok.value === ',') {
            currentLineTokens.push(tok);
            const topBrace = braceStack.length > 0 ? braceStack[braceStack.length - 1] : null;
            if (parenDepth === 0 && bracketDepth === 0 && topBrace && topBrace.isMultiline && (topBrace.isObject || topBrace.isImport)) {
                flushLine();
                if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                    i++;
                }
                i++;
                continue;
            }
            if (tokens[i + 1] && tokens[i + 1].type === 'NEWLINE') {
                flushLine();
                i += 2;
                continue;
            }
            i++;
            continue;
        }

        // 6. Default token addition
        currentLineTokens.push(tok);
        i++;
    }

    // Flush any remaining tokens
    if (currentLineTokens.length > 0) {
        flushLine();
    }

    return resultLines;
}

/**
 * Format document text according to formatting options.
 * Returns array of LSP TextEdit objects.
 */
function formatDocument(text, options = {}) {
    if (!text || text.trim().length === 0) {
        return [];
    }

    try {
        const isCRLF = text.includes('\r\n');
        const eol = isCRLF ? '\r\n' : '\n';
        const tabSize = (options && options.tabSize) || 4;

        const { tokens, hasError } = tokenize(text);
        if (hasError) {
            // Malformed source (e.g. unclosed string literal), return safe []
            return [];
        }

        const formattedLines = formatTokensToLines(tokens, tabSize);

        // Remove trailing empty lines and ensure single final newline if original had one
        while (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] === '') {
            formattedLines.pop();
        }

        const hasTrailingNewline = text.endsWith('\n') || text.endsWith('\r\n');
        let formattedText = formattedLines.join(eol);
        if (hasTrailingNewline && formattedText.length > 0) {
            formattedText += eol;
        }

        // No-op check: if formatted text matches original exactly, return []
        if (formattedText === text) {
            return [];
        }

        // Generate full-document replacement TextEdit
        const originalLines = text.split(/\r?\n/);
        const lastLine = originalLines.length - 1;
        const lastCol = originalLines[lastLine].length;

        return [
            {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: lastLine, character: lastCol }
                },
                newText: formattedText
            }
        ];
    } catch (err) {
        // Safe fallback on any unexpected error: never crash language server
        return [];
    }
}

module.exports = {
    formatDocument,
    tokenize,
    formatTokensToLines
};
