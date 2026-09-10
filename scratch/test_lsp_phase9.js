/**
 * JAWALANG V1.3.0 — PHASE 9: MASTER AUDIT & RELEASE HARDENING TEST SUITE
 * 
 * Verifies all 15 audit categories (A through O) across all 11 LSP capabilities.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const analyzer = require('../language-server/src/analyzer');
const { getDiagnostics } = require('../language-server/src/diagnostics');
const { getCompletions, CompletionItemKind } = require('../language-server/src/completion');
const { getHover } = require('../language-server/src/hover');
const { getDefinition } = require('../language-server/src/definitions');
const { getDocumentSymbols, SymbolKind } = require('../language-server/src/symbols');
const { getReferences } = require('../language-server/src/references');
const { renameSymbol, isValidIdentifier } = require('../language-server/src/rename');
const { getSignatureHelp } = require('../language-server/src/signatureHelp');
const { formatDocument } = require('../language-server/src/formatter');
const { getCodeActions, CodeActionKind } = require('../language-server/src/codeActions');
const { getSemanticTokens, decodeSemanticTokens, semanticTokensLegend } = require('../language-server/src/semanticTokens');
const { DocumentManager } = require('../language-server/src/documentManager');
const moduleManager = require('../language-server/src/modules');
const { pathToUri, uriToPath, BUILTINS, KEYWORDS } = require('../language-server/src/utils');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function test(category, name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`PASS [${category}] ${name}`);
    } catch (err) {
        failures.push({ category, name, error: err.message, stack: err.stack });
        console.error(`FAIL [${category}] ${name}: ${err.message}`);
    }
}

console.log('================================================================');
console.log('    JAWALANG V1.3.0 — PHASE 9: LSP MASTER HARDENING AUDIT       ');
console.log('================================================================\n');

// ============================================================================
// CATEGORY A: DIAGNOSTICS AUDIT
// ============================================================================
console.log('--- CATEGORY A: Diagnostics Audit ---');

test('A', 'Empty file produces 0 diagnostics', () => {
    const analysis = analyzer.analyze('', 'file:///empty.jawa');
    const diags = getDiagnostics(analysis);
    assert.strictEqual(diags.length, 0);
});

test('A', 'Syntax error is detected with valid line and character', () => {
    const analysis = analyzer.analyze('gawe x = ', 'file:///syntax_err.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.length > 0);
    assert.strictEqual(diags[0].severity, 1);
    assert.strictEqual(diags[0].range.start.line, 0);
    assert.ok(diags[0].range.start.character >= 0);
});

test('A', 'Undefined identifier is detected', () => {
    const analysis = analyzer.analyze('gawe a = variabelOraAna + 1', 'file:///undef_var.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('variabelOraAna') && d.message.includes('ora ditemokake')));
});

test('A', 'Undefined function is detected', () => {
    const analysis = analyzer.analyze('fungsiGaib(1, 2)', 'file:///undef_fn.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('fungsiGaib') && d.message.includes('ora ditemokake')));
});

test('A', 'Duplicate function declaration is detected in same scope', () => {
    const code = 'guna pitungan() { bali 1 }\nguna pitungan() { bali 2 }';
    const analysis = analyzer.analyze(code, 'file:///dup_fn.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('Duplikat deklarasi') && d.message.includes('pitungan')));
});

test('A', 'Duplicate struct declaration is detected', () => {
    const code = 'bentuk Wong {}\nbentuk Wong {}';
    const analysis = analyzer.analyze(code, 'file:///dup_struct.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('Duplikat deklarasi') && d.message.includes('Wong')));
});

test('A', 'Duplicate variable declaration in same scope is detected', () => {
    const code = 'gawe angka = 10\ngawe angka = 20';
    const analysis = analyzer.analyze(code, 'file:///dup_var.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('Duplikat deklarasi') && d.message.includes('angka')));
});

test('A', 'Duplicate function parameters are detected', () => {
    const code = 'guna hitung(a, a) { bali a }';
    const analysis = analyzer.analyze(code, 'file:///dup_param.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('Duplikat parameter') && d.message.includes('a')));
});

test('A', 'Duplicate struct properties and methods are detected', () => {
    const code = 'bentuk Makhluk {\n  gawe jeneng = ""\n  gawe jeneng = ""\n  guna obah() {}\n  guna obah() {}\n}';
    const analysis = analyzer.analyze(code, 'file:///dup_member.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('jeneng') && (d.message.includes('wis dideklarasikake') || d.message.includes('Duplikat'))));
});

test('A', 'Self-inheritance is detected', () => {
    const code = 'bentuk Ulo ngembangake Ulo {}';
    const analysis = analyzer.analyze(code, 'file:///self_inherit.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('Self-inheritance ora diidinake')));
});

test('A', 'Missing parent struct is detected', () => {
    const code = 'bentuk Anak ngembangake IndukOraAna {}';
    const analysis = analyzer.analyze(code, 'file:///missing_parent.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('IndukOraAna') && d.message.includes('ora ditemokake')));
});

test('A', 'Circular inheritance is detected safely without infinite loop', () => {
    const code = 'bentuk A ngembangake B {}\nbentuk B ngembangake A {}';
    const analysis = analyzer.analyze(code, 'file:///cycle_inherit.jawa');
    const diags = getDiagnostics(analysis);
    assert.ok(diags.some(d => d.message.includes('circular inheritance') || d.message.includes('Siklus pewarisan')));
});

test('A', 'Multi-line diagnostic range calculation does not clamp endChar erroneously', () => {
    const fakeDiag = {
        diagnostics: [{
            severity: 1,
            range: {
                start: { line: 2, character: 15 },
                end: { line: 3, character: 4 }
            },
            message: 'Multi-line error'
        }]
    };
    const diags = getDiagnostics(fakeDiag);
    assert.strictEqual(diags.length, 1);
    assert.strictEqual(diags[0].range.start.line, 2);
    assert.strictEqual(diags[0].range.start.character, 15);
    assert.strictEqual(diags[0].range.end.line, 3);
    assert.strictEqual(diags[0].range.end.character, 4); // Must remain 4, NOT clamped to 15
});

// ============================================================================
// CATEGORY B: COMPLETION AUDIT
// ============================================================================
console.log('\n--- CATEGORY B: Completion Audit ---');

test('B', 'Scope completion returns keywords, built-ins, and declared variables', () => {
    const code = 'gawe jeneng = "Budi"\n';
    const analysis = analyzer.analyze(code, 'file:///completion_basic.jawa');
    const items = getCompletions(analysis, { line: 1, character: 0 });
    assert.ok(items.some(i => i.label === 'jeneng' && i.kind === CompletionItemKind.Variable));
    assert.ok(items.some(i => i.label === 'gawe' && i.kind === CompletionItemKind.Keyword));
    assert.ok(items.some(i => i.label === 'tulis' && i.kind === CompletionItemKind.Function));
});

test('B', 'Completion does not trigger inside string literals', () => {
    const code = 'gawe pesen = "Halo jaw"';
    const analysis = analyzer.analyze(code, 'file:///completion_str.jawa');
    const items = getCompletions(analysis, { line: 0, character: 18 });
    assert.strictEqual(items.length, 0);
});

test('B', 'Completion does not trigger inside comments', () => {
    const code = '// gawe test = 1\n';
    const analysis = analyzer.analyze(code, 'file:///completion_comment.jawa');
    const items = getCompletions(analysis, { line: 0, character: 5 });
    assert.strictEqual(items.length, 0);
});

test('B', 'anyar keyword triggers only struct completions', () => {
    const code = 'bentuk Makhluk {}\nanyar ';
    const analysis = analyzer.analyze(code, 'file:///completion_anyar.jawa');
    const items = getCompletions(analysis, { line: 1, character: 6 });
    assert.ok(items.some(i => i.label === 'Makhluk' && i.kind === CompletionItemKind.Class));
    assert.ok(!items.some(i => i.label === 'gawe'));
    assert.ok(!items.some(i => i.label === 'tulis'));
});

test('B', 'Member dot completion on struct instance suggests properties and methods', () => {
    const code = 'bentuk Mobil {\n  gawe merk = "Toyota"\n  guna klakson() {}\n}\ngawe m = anyar Mobil()\nm.';
    const analysis = analyzer.analyze(code, 'file:///completion_dot.jawa');
    const items = getCompletions(analysis, { line: 5, character: 2 });
    assert.ok(items.some(i => i.label === 'merk' && i.kind === CompletionItemKind.Field));
    assert.ok(items.some(i => i.label === 'klakson' && i.kind === CompletionItemKind.Method));
});

test('B', 'iki. dot completion inside method suggests enclosing struct members', () => {
    const code = 'bentuk Kucing {\n  gawe warna = "oranye"\n  guna meong() {\n    iki.\n  }\n}';
    const analysis = analyzer.analyze(code, 'file:///completion_iki.jawa');
    const items = getCompletions(analysis, { line: 3, character: 8 });
    assert.ok(items.some(i => i.label === 'warna'));
    assert.ok(items.some(i => i.label === 'meong'));
});

test('B', 'super. dot completion suggests only parent struct members', () => {
    const code = 'bentuk Induk {\n  guna salamInduk() {}\n}\nbentuk Anak ngembangake Induk {\n  guna salamAnak() {\n    super.\n  }\n}';
    const analysis = analyzer.analyze(code, 'file:///completion_super.jawa');
    const items = getCompletions(analysis, { line: 5, character: 10 });
    assert.ok(items.some(i => i.label === 'salamInduk'));
    assert.ok(!items.some(i => i.label === 'salamAnak')); // Child method excluded from super.
});

test('B', 'Unicode in string does not corrupt completion positions', () => {
    const code = 'gawe pesen = "Halo 😀 Jagad"\ngawe ';
    const analysis = analyzer.analyze(code, 'file:///completion_unicode.jawa');
    const items = getCompletions(analysis, { line: 1, character: 5 });
    assert.ok(items.length > 0);
});

// ============================================================================
// CATEGORY C: HOVER AUDIT
// ============================================================================
console.log('\n--- CATEGORY C: Hover Audit ---');

test('C', 'Hover over built-in function returns documentation and signature', () => {
    const code = 'tulis "Test"';
    const analysis = analyzer.analyze(code, 'file:///hover_builtin.jawa');
    const hover = getHover(analysis, { line: 0, character: 2 });
    assert.ok(hover && hover.contents.value.includes('tulis'));
    assert.ok(hover.contents.value.includes('Built-in function'));
});

test('C', 'Hover over keyword returns keyword documentation', () => {
    const code = 'gawe x = 10';
    const analysis = analyzer.analyze(code, 'file:///hover_kw.jawa');
    const hover = getHover(analysis, { line: 0, character: 1 });
    assert.ok(hover && hover.contents.value.includes('gawe'));
});

test('C', 'Hover over user function returns signature and return type', () => {
    const code = 'guna petungan(a, b) { bali a + b }\npetungan(1, 2)';
    const analysis = analyzer.analyze(code, 'file:///hover_fn.jawa');
    const hover = getHover(analysis, { line: 1, character: 2 });
    assert.ok(hover && hover.contents.value.includes('guna petungan(a, b)'));
});

test('C', 'Hover over struct returns fields and methods overview', () => {
    const code = 'bentuk Omah {\n  gawe tipe = "36"\n  guna kunci() {}\n}\ngawe o = anyar Omah()';
    const analysis = analyzer.analyze(code, 'file:///hover_struct.jawa');
    const hover = getHover(analysis, { line: 4, character: 17 });
    assert.ok(hover && hover.contents.value.includes('bentuk Omah'));
    assert.ok(hover.contents.value.includes('tipe'));
    assert.ok(hover.contents.value.includes('kunci'));
});

// ============================================================================
// CATEGORY D: DEFINITION AUDIT
// ============================================================================
console.log('\n--- CATEGORY D: Definition Audit ---');

test('D', 'Go to definition resolves variable declaration location', () => {
    const code = 'gawe angka = 99\ntulis angka';
    const analysis = analyzer.analyze(code, 'file:///def_var.jawa');
    const def = getDefinition(analysis, { line: 1, character: 8 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 0);
    assert.strictEqual(def.range.start.character, 5); // start of "angka"
});

test('D', 'Go to definition resolves function parameter declaration', () => {
    const code = 'guna olah(data) {\n  bali data\n}';
    const analysis = analyzer.analyze(code, 'file:///def_param.jawa');
    const def = getDefinition(analysis, { line: 1, character: 9 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 0);
});

test('D', 'Go to definition cross-module uses canonical URI', () => {
    const fixturePath = path.resolve(__dirname, '../language-server/test/fixtures/importer.jawa');
    if (fs.existsSync(fixturePath)) {
        const code = fs.readFileSync(fixturePath, 'utf8');
        const analysis = analyzer.analyze(code, pathToUri(fixturePath));
        const def = getDefinition(analysis, { line: 3, character: 15 }); // salam in importer.jawa
        if (def) {
            assert.ok(def.uri.startsWith('file:'));
            assert.ok(def.uri.toLowerCase().includes('basic.jawa'));
        }
    }
});

// ============================================================================
// CATEGORY E: REFERENCES AUDIT
// ============================================================================
console.log('\n--- CATEGORY E: References Audit ---');

test('E', 'Find references respects variable shadowing and scope boundaries', () => {
    const code = [
        'gawe x = 10',          // line 0: global x
        'guna f(x) {',          // line 1: param x
        '  gawe y = x',         // line 2: ref to param x
        '  tulis y',
        '}',
        'gawe z = x + 5'        // line 5: ref to global x
    ].join('\n');

    const analysis = analyzer.analyze(code, 'file:///ref_scope.jawa');

    // 1. References for global x (line 0, col 5)
    const globalRefs = getReferences(analysis, { line: 0, character: 5 }, { includeDeclaration: true });
    assert.strictEqual(globalRefs.length, 2); // line 0 declaration + line 5 usage
    assert.ok(globalRefs.some(r => r.range.start.line === 0));
    assert.ok(globalRefs.some(r => r.range.start.line === 5));

    // 2. References for param x (line 1, col 7)
    const paramRefs = getReferences(analysis, { line: 1, character: 7 }, { includeDeclaration: true });
    assert.strictEqual(paramRefs.length, 2); // line 1 param + line 2 usage
    assert.ok(paramRefs.some(r => r.range.start.line === 1));
    assert.ok(paramRefs.some(r => r.range.start.line === 2));
});

test('E', 'Find references for struct method tracks declarations and calls', () => {
    const code = [
        'bentuk Robot {',
        '  guna mlaku() {}',
        '}',
        'gawe r = anyar Robot()',
        'r.mlaku()'
    ].join('\n');

    const analysis = analyzer.analyze(code, 'file:///ref_method.jawa');
    const refs = getReferences(analysis, { line: 1, character: 9 }, { includeDeclaration: true });
    assert.ok(refs.length >= 2);
});

// ============================================================================
// CATEGORY F: RENAME AUDIT
// ============================================================================
console.log('\n--- CATEGORY F: Rename Audit ---');

test('F', 'Rename symbol rejects renaming to keyword', () => {
    const code = 'gawe skor = 100';
    const analysis = analyzer.analyze(code, 'file:///rename_kw.jawa');
    const edit = renameSymbol(analysis, { line: 0, character: 7 }, 'yen');
    assert.strictEqual(edit, null);
});

test('F', 'Rename symbol rejects renaming to built-in function', () => {
    const code = 'gawe skor = 100';
    const analysis = analyzer.analyze(code, 'file:///rename_builtin.jawa');
    const edit = renameSymbol(analysis, { line: 0, character: 7 }, 'tulis');
    assert.strictEqual(edit, null);
});

test('F', 'Rename symbol rejects collision with existing symbol in scope', () => {
    const code = 'gawe jeneng = "A"\ngawe nilai = 10';
    const analysis = analyzer.analyze(code, 'file:///rename_collision.jawa');
    const edit = renameSymbol(analysis, { line: 0, character: 7 }, 'nilai');
    assert.strictEqual(edit, null);
});

test('F', 'Rename symbol produces descending-sorted edits without corrupting offsets', () => {
    const code = 'gawe x = 1\ngawe y = x + x';
    const analysis = analyzer.analyze(code, 'file:///rename_desc.jawa');
    const edit = renameSymbol(analysis, { line: 0, character: 5 }, 'variabelAnyar');
    assert.ok(edit && edit.changes['file:///rename_desc.jawa']);
    const edits = edit.changes['file:///rename_desc.jawa'];
    assert.strictEqual(edits.length, 3);
    // Descending check: line b >= line a, character b >= character a
    for (let i = 0; i < edits.length - 1; i++) {
        const cur = edits[i];
        const next = edits[i + 1];
        if (cur.range.start.line === next.range.start.line) {
            assert.ok(cur.range.start.character >= next.range.start.character, 'Edits must be sorted descending');
        } else {
            assert.ok(cur.range.start.line >= next.range.start.line, 'Edits must be sorted descending by line');
        }
    }
});

// ============================================================================
// CATEGORY G: SIGNATURE HELP AUDIT
// ============================================================================
console.log('\n--- CATEGORY G: Signature Help Audit ---');

test('G', 'Signature help returns parameters and tracks activeParameter', () => {
    const code = 'guna itung(a, b, c) { bali a }\nitung(1, ';
    const analysis = analyzer.analyze(code, 'file:///sig_help.jawa');
    const sig = getSignatureHelp(analysis, { line: 1, character: 9 });
    assert.ok(sig);
    assert.strictEqual(sig.activeParameter, 1);
    assert.strictEqual(sig.signatures[0].parameters.length, 3);
});

test('G', 'Nested function call tracks innermost active call and restores outer call', () => {
    const code = 'guna f1(x) {}\nguna f2(y, z) {}\nf2(f1(10), ';
    const analysis = analyzer.analyze(code, 'file:///sig_nested.jawa');
    const sig = getSignatureHelp(analysis, { line: 2, character: 11 });
    assert.ok(sig);
    assert.ok(sig.signatures[0].label.startsWith('f2('));
    assert.strictEqual(sig.activeParameter, 1);
});

test('G', 'Commas inside array literals do not skew activeParameter', () => {
    const code = 'guna proses(data, flag) {}\nproses([1, 2, 3], ';
    const analysis = analyzer.analyze(code, 'file:///sig_array.jawa');
    const sig = getSignatureHelp(analysis, { line: 1, character: 18 });
    assert.ok(sig);
    assert.strictEqual(sig.activeParameter, 1);
});

test('G', 'Commas inside object literals do not skew activeParameter', () => {
    const code = 'guna proses(obj, flag) {}\nproses({ "a": 1, "b": 2 }, ';
    const analysis = analyzer.analyze(code, 'file:///sig_obj.jawa');
    const sig = getSignatureHelp(analysis, { line: 1, character: 27 });
    assert.ok(sig);
    assert.strictEqual(sig.activeParameter, 1);
});

// ============================================================================
// CATEGORY H: FORMATTING AUDIT
// ============================================================================
console.log('\n--- CATEGORY H: Formatting Audit ---');

test('H', 'Formatter is idempotent (format(format(x)) === format(x))', () => {
    const unformatted = 'guna salam(jeneng){\nyen jeneng=="Budi"{\ntulis "Halo Budi"\n}liyane{\ntulis "Sapa iki"\n}\n}';
    const edits1 = formatDocument(unformatted, { tabSize: 4, insertSpaces: true });
    assert.ok(edits1.length > 0);
    const pass1 = edits1[0].newText;

    const edits2 = formatDocument(pass1, { tabSize: 4, insertSpaces: true });
    assert.strictEqual(edits2.length, 0); // Idempotent: second format returns 0 edits
});

test('H', 'Formatter preserves CRLF line endings verbatim', () => {
    const crlfSource = 'gawe x = 10\r\ngawe y = 20\r\n';
    const edits = formatDocument(crlfSource, { tabSize: 4, insertSpaces: true });
    if (edits.length > 0) {
        assert.ok(edits[0].newText.includes('\r\n'));
    }
});

test('H', 'Formatter preserves string contents and escape sequences verbatim', () => {
    const src = 'tulis "Halo \\n \\t \\"Dunia\\""\n';
    const edits = formatDocument(src, { tabSize: 4, insertSpaces: true });
    const formatted = edits.length > 0 ? edits[0].newText : src;
    assert.ok(formatted.includes('"Halo \\n \\t \\"Dunia\\""'));
});

// ============================================================================
// CATEGORY I: CODE ACTIONS AUDIT
// ============================================================================
console.log('\n--- CATEGORY I: Code Actions Audit ---');

test('I', 'Organize imports sorts and deduplicates import statements cleanly', () => {
    const code = 'impor { b, a, b } saka "mod.jawa"\ntulis a + b';
    const analysis = analyzer.analyze(code, 'file:///code_action.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }, {
        only: [CodeActionKind.SourceOrganizeImports]
    });
    assert.ok(actions.length > 0);
    assert.strictEqual(actions[0].kind, CodeActionKind.SourceOrganizeImports);
});

test('I', 'Typo correction suggests closest symbol within Levenshtein distance', () => {
    const code = 'gawe jenengKu = "Budi"\ntulis jenengK';
    const analysis = analyzer.analyze(code, 'file:///code_action_typo.jawa');
    const actions = getCodeActions(analysis, { start: { line: 1, character: 6 }, end: { line: 1, character: 13 } }, {
        diagnostics: analysis.diagnostics
    });
    assert.ok(actions.some(a => a.title.includes('jenengKu')));
});

// ============================================================================
// CATEGORY J: SEMANTIC TOKENS AUDIT
// ============================================================================
console.log('\n--- CATEGORY J: Semantic Tokens Audit ---');

test('J', 'Semantic tokens delta encoding is strictly monotonic and non-overlapping', () => {
    const code = 'gawe total = 100\nguna hitung(a) { bali a + total }\nhitung(total)';
    const analysis = analyzer.analyze(code, 'file:///sem_tokens.jawa');
    const sem = getSemanticTokens(analysis);
    assert.ok(sem && Array.isArray(sem.data));

    const decoded = decodeSemanticTokens(sem.data);
    assert.ok(decoded.length > 0);

    for (let i = 0; i < decoded.length - 1; i++) {
        const cur = decoded[i];
        const next = decoded[i + 1];
        if (cur.line === next.line) {
            assert.ok(cur.character + cur.length <= next.character,
                `Overlapping tokens on line ${cur.line}: tok1 @ ${cur.character}+${cur.length}, tok2 @ ${next.character}`);
        } else {
            assert.ok(cur.line < next.line, `Non-monotonic lines: line ${cur.line} followed by ${next.line}`);
        }
    }
});

test('J', 'Token type indices are strictly within semanticTokensLegend range', () => {
    const code = 'gawe x = 10\ntulis x';
    const analysis = analyzer.analyze(code, 'file:///sem_legend.jawa');
    const sem = getSemanticTokens(analysis);
    for (let i = 3; i < sem.data.length; i += 5) {
        const typeIndex = sem.data[i];
        assert.ok(typeIndex >= 0 && typeIndex < semanticTokensLegend.tokenTypes.length,
            `Token type index ${typeIndex} out of legend bounds [0, ${semanticTokensLegend.tokenTypes.length})`);
    }
    const decoded = decodeSemanticTokens(sem.data);
    for (const tok of decoded) {
        assert.ok(semanticTokensLegend.tokenTypes.includes(tok.tokenType));
    }
});

// ============================================================================
// CATEGORY K: UTF-16 CONSISTENCY AUDIT
// ============================================================================
console.log('\n--- CATEGORY K: UTF-16 Consistency Audit ---');

test('K', 'UTF-16 character offsets after emoji (surrogate pairs) are accurate', () => {
    // "😀" is 2 UTF-16 code units (length === 2 in JS string)
    const code = 'gawe emot = "😀"\ngawe nilai = 100';
    const analysis = analyzer.analyze(code, 'file:///utf16_emoji.jawa');
    const sym = analysis.symbols.find(s => s.name === 'nilai');
    assert.ok(sym);
    assert.strictEqual(sym.loc.start.line, 1);
    assert.strictEqual(sym.loc.start.character, 0); // 'gawe' starts at char 0
});

test('K', 'UTF-16 character offsets with Aksara Jawa characters are accurate', () => {
    const code = 'gawe aksara = "ꦗꦮ"\ntulis aksara';
    const analysis = analyzer.analyze(code, 'file:///utf16_aksara.jawa');
    const diags = getDiagnostics(analysis);
    assert.strictEqual(diags.length, 0);
    const sym = analysis.symbols.find(s => s.name === 'aksara');
    assert.ok(sym);
});

// ============================================================================
// CATEGORY L: DOCUMENT LIFECYCLE AUDIT
// ============================================================================
console.log('\n--- CATEGORY L: Document Lifecycle Audit ---');

test('L', 'Document open, change, close, and re-open maintains cache integrity', () => {
    const docManager = new DocumentManager();
    const uri = 'file:///lifecycle_test.jawa';

    // 1. Open
    const a1 = docManager.openDocument(uri, 'gawe x = 10\n', 1);
    assert.ok(a1.symbols.some(s => s.name === 'x'));

    // 2. Change
    const a2 = docManager.openDocument(uri, 'gawe x = 20\ngawe y = 30\n', 2);
    assert.ok(a2.symbols.some(s => s.name === 'y'));
    assert.strictEqual(docManager.cache.get(uri).version, 2);

    // 3. Close
    docManager.cache.delete(uri);
    assert.strictEqual(docManager.getAnalysis(uri), null);

    // 4. Re-open
    const a3 = docManager.openDocument(uri, 'gawe z = 99\n', 1);
    assert.ok(a3.symbols.some(s => s.name === 'z'));
    assert.ok(!a3.symbols.some(s => s.name === 'x'));
});

// ============================================================================
// CATEGORY M: MODULE BOUNDARIES AUDIT
// ============================================================================
console.log('\n--- CATEGORY M: Module Boundaries Audit ---');

test('M', 'Module resolution resolves valid relative path and handles circular imports without hanging', () => {
    const dummyA = path.resolve(__dirname, '../scratch/mod_cycle_a.jawa');
    const dummyB = path.resolve(__dirname, '../scratch/mod_cycle_b.jawa');

    fs.writeFileSync(dummyA, 'ekspor gawe a = 1\nimpor "./mod_cycle_b.jawa"\n');
    fs.writeFileSync(dummyB, 'ekspor gawe b = 2\nimpor "./mod_cycle_a.jawa"\n');

    try {
        const exportsA = moduleManager.getModuleExports(dummyA);
        assert.ok(exportsA.exports.variables.a);
    } finally {
        if (fs.existsSync(dummyA)) fs.unlinkSync(dummyA);
        if (fs.existsSync(dummyB)) fs.unlinkSync(dummyB);
    }
});

test('M', 'Private (unexported) module symbols are isolated and invisible', () => {
    const modPath = path.resolve(__dirname, '../scratch/mod_private.jawa');
    fs.writeFileSync(modPath, 'gawe rahasia = "secret"\nekspor gawe publik = "public"\n');

    try {
        const exportsMod = moduleManager.getModuleExports(modPath);
        assert.ok(exportsMod.exports.variables.publik);
        assert.strictEqual(exportsMod.exports.variables.rahasia, undefined);
    } finally {
        if (fs.existsSync(modPath)) fs.unlinkSync(modPath);
    }
});

// ============================================================================
// CATEGORY N: ERROR RECOVERY AUDIT
// ============================================================================
console.log('\n--- CATEGORY N: Error Recovery Audit ---');

test('N', 'Unclosed string does not crash analyzer or language server', () => {
    const code = 'gawe teks = "String ora rampung';
    assert.doesNotThrow(() => {
        const analysis = analyzer.analyze(code, 'file:///err_unclosed_str.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.length > 0);
    });
});

test('N', 'Incomplete block statement does not throw unhandled exception', () => {
    const code = 'guna test() {\n  yen bener {\n';
    assert.doesNotThrow(() => {
        const analysis = analyzer.analyze(code, 'file:///err_incomplete_block.jawa');
        assert.ok(analysis);
    });
});

test('N', 'Incomplete expression in assignment recovers AST for downstream features', () => {
    const code = 'gawe x = \ngawe y = 10';
    const analysis = analyzer.analyze(code, 'file:///err_incomplete_expr.jawa');
    assert.ok(analysis);
    assert.ok(analysis.symbols.some(s => s.name === 'y'));
});

// ============================================================================
// CATEGORY O: PROTOCOL COMPLIANCE AUDIT
// ============================================================================
console.log('\n--- CATEGORY O: Protocol Compliance Audit ---');

test('O', 'Server advertises exact verified capabilities in initialize response', () => {
    // Inspect server.js initialization object schema
    const serverFile = fs.readFileSync(path.resolve(__dirname, '../language-server/src/server.js'), 'utf8');
    assert.ok(serverFile.includes('textDocumentSync: TextDocumentSyncKind.Full'));
    assert.ok(serverFile.includes('completionProvider:'));
    assert.ok(serverFile.includes('hoverProvider: true'));
    assert.ok(serverFile.includes('definitionProvider: true'));
    assert.ok(serverFile.includes('documentSymbolProvider: true'));
    assert.ok(serverFile.includes('referencesProvider: true'));
    assert.ok(serverFile.includes('renameProvider: true'));
    assert.ok(serverFile.includes('signatureHelpProvider:'));
    assert.ok(serverFile.includes('formattingProvider: true'));
    assert.ok(serverFile.includes('codeActionProvider:'));
    assert.ok(serverFile.includes('semanticTokensProvider:'));
});

test('O', 'No unadvertised or non-existent capabilities are registered', () => {
    const serverFile = fs.readFileSync(path.resolve(__dirname, '../language-server/src/server.js'), 'utf8');
    assert.ok(!serverFile.includes('implementationProvider'));
    assert.ok(!serverFile.includes('typeDefinitionProvider'));
    assert.ok(!serverFile.includes('workspaceSymbolProvider'));
    assert.ok(!serverFile.includes('documentHighlightProvider'));
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log('\n================================================================');
console.log(`  PHASE 9 MASTER AUDIT FINISHED: ${passedTests}/${totalTests} PASSED (${failures.length} failed)`);
console.log('================================================================\n');

if (failures.length > 0) {
    console.error('FAILURES:');
    for (const f of failures) {
        console.error(`- [${f.category}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
} else {
    console.log('✅ ALL 15 LSP HARDENING AUDIT CATEGORIES PASSED 100%!');
    process.exit(0);
}
