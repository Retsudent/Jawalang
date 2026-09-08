/**
 * Jawalang V1.3.0 — Phase 8: Semantic Tokens Deep Audit
 *
 * Verifies that the semantic tokens engine strictly adheres to:
 * - Token ranges valid
 * - Sorted
 * - Non-overlapping
 * - No duplicates
 * - UTF-16 correctness
 * - No regex semantic replacement
 * - No runtime execution
 * - No filesystem scan
 * - No network
 * - Strings protected
 * - Comments protected
 * - Scope shadowing
 * - Imports
 * - Aliases
 * - Namespace
 * - Inheritance
 * - Super
 * - Built-ins
 * - First-class function safety
 * - Malformed source safety
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../language-server/src/analyzer');
const {
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
    MODIFIER_DECLARATION,
    MODIFIER_DEFAULT_LIBRARY,
    semanticTokensLegend,
    getSemanticTokens,
    decodeSemanticTokens,
    encodeSemanticTokens
} = require('../language-server/src/semanticTokens');

console.log('====================================================');
console.log('    JAWALANG V1.3.0 — SEMANTIC TOKENS DEEP AUDIT    ');
console.log('====================================================\n');

let auditCount = 0;
let passCount = 0;

function runAudit(name, fn) {
    auditCount++;
    try {
        fn();
        console.log(`PASS [Audit ${String(auditCount).padStart(2, ' ')}]: ${name}`);
        passCount++;
    } catch (err) {
        console.error(`FAIL [Audit ${String(auditCount).padStart(2, ' ')}]: ${name}`);
        console.error('  Error:', err);
    }
}

// 1. Static source audit of semanticTokens.js (no child_process, no net, no http, no eval)
runAudit('Static source audit: no child_process / eval / net / http in semanticTokens.js', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../language-server/src/semanticTokens.js'), 'utf8');
    assert.ok(!src.includes('child_process'), 'Must not require child_process');
    assert.ok(!src.includes('eval('), 'Must not use eval()');
    assert.ok(!src.includes('Function('), 'Must not use Function constructor');
    assert.ok(!src.includes('require(\'net\')'), 'Must not require net');
    assert.ok(!src.includes('require(\'http\')'), 'Must not require http');
    assert.ok(!src.includes('require(\'https\')'), 'Must not require https');
    assert.ok(!src.includes('readdirSync'), 'Must not scan filesystem directories');
});

// 2. Encoded data format compliance (array of 5-tuples)
runAudit('LSP 5-tuple format compliance (length % 5 === 0)', () => {
    const code = 'guna tambah(a, b) {\n    bali a + b\n}\ngawe x = tambah(1, 2)';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    assert.ok(Array.isArray(res.data));
    assert.strictEqual(res.data.length % 5, 0, 'Data array length must be multiple of 5');
    for (const val of res.data) {
        assert.ok(typeof val === 'number', 'Every element must be an integer');
        assert.ok(Number.isInteger(val), 'Every element must be an integer');
        assert.ok(val >= 0, 'LSP delta components must be non-negative');
    }
});

// 3. Token ranges valid: non-negative line, character, and positive length
runAudit('Token ranges validity (line >= 0, character >= 0, length > 0)', () => {
    const code = 'bentuk Kotak {\n    gawe lebar = 10\n    gawe tinggi = 20\n}\ngawe k = anyar Kotak()';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    assert.ok(decoded.length > 0);
    for (const tok of decoded) {
        assert.ok(tok.line >= 0, `Line must be >= 0 (got ${tok.line})`);
        assert.ok(tok.character >= 0, `Character must be >= 0 (got ${tok.character})`);
        assert.ok(tok.length > 0, `Length must be > 0 (got ${tok.length})`);
        assert.ok(TOKEN_TYPES.includes(tok.tokenType), `Invalid tokenType: ${tok.tokenType}`);
    }
});

// 4. Strictly sorted: ascending line, then ascending character
runAudit('Strict ordering (line ASC, character ASC)', () => {
    const code = 'gawe x = 1\nguna f() { bali 2 }\ngawe y = f()';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    for (let i = 1; i < decoded.length; i++) {
        const prev = decoded[i - 1];
        const curr = decoded[i];
        if (curr.line === prev.line) {
            assert.ok(curr.character > prev.character, `Tokens on same line must be strictly ordered: char ${prev.character} then ${curr.character}`);
        } else {
            assert.ok(curr.line > prev.line, `Tokens must be strictly ordered by line: line ${prev.line} then ${curr.line}`);
        }
    }
});

// 5. Non-overlapping token ranges
runAudit('Non-overlapping token ranges on same line', () => {
    const code = 'gawe hasil = 100 + 200 * 300\ntulis "selesai"';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    for (let i = 1; i < decoded.length; i++) {
        const prev = decoded[i - 1];
        const curr = decoded[i];
        if (curr.line === prev.line) {
            const prevEnd = prev.character + prev.length;
            assert.ok(curr.character >= prevEnd, `Tokens must not overlap: prev [${prev.character}..${prevEnd}] vs curr start ${curr.character}`);
        }
    }
});

// 6. No duplicate token positions
runAudit('Duplicate prevention (no duplicate start positions)', () => {
    const raw = [
        { line: 0, character: 5, length: 4, tokenType: 'variable', modifiers: 0 },
        { line: 0, character: 5, length: 4, tokenType: 'function', modifiers: 1 },
        { line: 1, character: 2, length: 3, tokenType: 'keyword', modifiers: 0 },
        { line: 1, character: 2, length: 3, tokenType: 'keyword', modifiers: 0 }
    ];
    const encoded = encodeSemanticTokens(raw);
    const decoded = decodeSemanticTokens(encoded, semanticTokensLegend);
    assert.strictEqual(decoded.length, 2, 'Duplicate tokens must be consolidated or deduplicated');
});

// 7. UTF-16 Unicode character positions
runAudit('UTF-16 Unicode accuracy with multibyte strings', () => {
    const code = 'gawe s = "Halo 🌟 Jawalang"\ntulis s';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const strTok = decoded.find(t => t.line === 0 && t.tokenType === 'string');
    assert.ok(strTok, 'String token must be detected');
    assert.strictEqual(strTok.character, 9);
    // In UTF-16, "\"Halo 🌟 Jawalang\"" length is 18 including quotes (🌟 is 2 UTF-16 code units)
    assert.strictEqual(strTok.length, 18);
});

// 8. No regex semantic replacement
runAudit('No regex semantic replacement (uses lexer & analyzer symbol table)', () => {
    // If regex were used blindly replacing "tambah" with function, inside "tetambah" it would match
    const code = 'gawe tetambah = 10';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const varTok = decoded.find(t => t.line === 0 && t.character === 5);
    assert.ok(varTok && varTok.tokenType === 'variable');
    assert.strictEqual(varTok.length, 8);
});

// 9. No runtime execution
runAudit('Static analysis only — no interpreter execution or infinite loops', () => {
    const code = 'nalika bener {}\ntakon("input?")\nlempar "Err"';
    const start = Date.now();
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 1000, 'Semantic analysis must be fast and never block execution');
    assert.ok(Array.isArray(res.data));
});

// 10. Strings protected: no identifier / keyword tokens inside string literals
runAudit('String literal protection (no inner symbols tokenized)', () => {
    const code = 'gawe x = "guna f() { bali 123 } // comment"';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const tokensOnLine = decoded.filter(t => t.line === 0);
    // Should only have: gawe (0), x (5), = (7), string (9)
    assert.strictEqual(tokensOnLine.length, 4);
    assert.strictEqual(tokensOnLine[3].tokenType, 'string');
});

// 11. Comments protected: no identifier / keyword tokens inside comments
runAudit('Comment protection (no inner symbols tokenized)', () => {
    const code = '// gawe x = 10\n// guna test(a, b) {}\ngawe y = 20';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const l0 = decoded.filter(t => t.line === 0);
    const l1 = decoded.filter(t => t.line === 1);
    assert.strictEqual(l0.length, 1);
    assert.strictEqual(l0[0].tokenType, 'comment');
    assert.strictEqual(l1.length, 1);
    assert.strictEqual(l1[0].tokenType, 'comment');
});

// 12. Scope shadowing: parameter shadows global variable
runAudit('Scope shadowing resolution (parameter vs global variable)', () => {
    const code = 'gawe x = 1\nguna f(x) {\n    bali x\n}\ntulis x';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const globX = decoded.find(t => t.line === 0 && t.character === 5);
    const paramX = decoded.find(t => t.line === 1 && t.character === 7);
    const innerX = decoded.find(t => t.line === 2 && t.character === 9);
    const outerX = decoded.find(t => t.line === 4 && t.character === 6);
    assert.strictEqual(globX.tokenType, 'variable');
    assert.strictEqual(paramX.tokenType, 'parameter');
    assert.strictEqual(innerX.tokenType, 'parameter');
    assert.strictEqual(outerX.tokenType, 'variable');
});

// 13. Namespace import & member access
runAudit('Namespace import and member access', () => {
    const code = 'impor "./math.jawa" minangka math\nmath.tambah()';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const nsUse = decoded.find(t => t.line === 1 && t.character === 0);
    const fnUse = decoded.find(t => t.line === 1 && t.character === 5);
    assert.strictEqual(nsUse.tokenType, 'namespace');
    assert.strictEqual(fnUse.tokenType, 'function');
});

// 14. Selective import and aliases
runAudit('Selective import with aliases', () => {
    const code = 'impor { kali minangka perkalian } saka "./math.jawa"\nperkalian(1, 2)';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const origTok = decoded.find(t => t.line === 0 && t.character === 8);
    const aliasTok = decoded.find(t => t.line === 0 && t.character === 22);
    const callTok = decoded.find(t => t.line === 1 && t.character === 0);
    assert.strictEqual(origTok.tokenType, 'function');
    assert.strictEqual(aliasTok.tokenType, 'function');
    assert.strictEqual(callTok.tokenType, 'function');
});

// 15. Struct and Constructor
runAudit('Struct declaration and constructor wiwiti', () => {
    const code = 'bentuk Titik {\n    gawe x\n    wiwiti(x) {\n        iki.x = x\n    }\n}';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const structTok = decoded.find(t => t.line === 0 && t.character === 7);
    const ctorTok = decoded.find(t => t.line === 2 && t.character === 4);
    assert.strictEqual(structTok.tokenType, 'class');
    assert.strictEqual(ctorTok.tokenType, 'method');
});

// 16. Inheritance and super
runAudit('Inheritance with ngembangake and super method call', () => {
    const code = 'bentuk Anak ngembangake Induk {\n    guna halo() {\n        super.halo()\n    }\n}';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const superTok = decoded.find(t => t.line === 2 && t.character === 8);
    const methodTok = decoded.find(t => t.line === 2 && t.character === 14);
    assert.strictEqual(superTok.tokenType, 'keyword');
    assert.strictEqual(methodTok.tokenType, 'method');
});

// 17. Dynamic property indexing safety (super["method"] or obj["prop"])
runAudit('Dynamic indexing with string literal remains string', () => {
    const code = 'gawe obj = {}\nobj["kunci"] = 123';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const strTok = decoded.find(t => t.line === 1 && t.character === 4);
    assert.strictEqual(strTok.tokenType, 'string');
});

// 18. Built-in functions have defaultLibrary modifier
runAudit('Built-in functions defaultLibrary modifier', () => {
    const code = 'gawe n = dawa([1, 2, 3])';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const dawaTok = decoded.find(t => t.line === 0 && t.character === 9);
    assert.strictEqual(dawaTok.tokenType, 'function');
    assert.ok(Boolean(dawaTok.modifiers & MODIFIER_DEFAULT_LIBRARY));
});

// 19. First-class functions: assigned variable remains variable
runAudit('First-class function assignment: assignee remains variable', () => {
    const code = 'guna foo() {}\ngawe f = foo\nf()';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const res = getSemanticTokens(analysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const fDecl = decoded.find(t => t.line === 1 && t.character === 5);
    assert.strictEqual(fDecl.tokenType, 'variable');
});

// 20. Malformed source resilience (no uncaught exceptions)
runAudit('Malformed source safety (unclosed blocks, invalid syntax)', () => {
    const malformed = [
        'guna (',
        'bentuk {',
        'gawe = = =',
        'impor minangka',
        '// unclosed comment or quote\n"unclosed string'
    ];
    for (const snippet of malformed) {
        const analysis = analyzer.analyze(snippet, 'file:///audit.jawa');
        const res = getSemanticTokens(analysis);
        assert.ok(res && Array.isArray(res.data), `Must return safe array for snippet: ${snippet}`);
    }
});

console.log('\n====================================================');
console.log(`  SEMANTIC TOKENS DEEP AUDIT: ${passCount}/${auditCount} PASSED`);
console.log('====================================================\n');

if (passCount !== auditCount) {
    process.exit(1);
}
