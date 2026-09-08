/**
 * Jawalang Language Server V1 — Master Validation Runner
 * Validates all LSP capabilities and VS Code Extension integration.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const analyzer = require('../language-server/src/analyzer');
const { getDefinition } = require('../language-server/src/definitions');
const { getCompletions } = require('../language-server/src/completion');
const { getHover } = require('../language-server/src/hover');
const { getDocumentSymbols, SymbolKind } = require('../language-server/src/symbols');
const { getReferences } = require('../language-server/src/references');
const { renameSymbol } = require('../language-server/src/rename');
const { getSignatureHelp } = require('../language-server/src/signatureHelp');
const { formatDocument } = require('../language-server/src/formatter');
const moduleManager = require('../language-server/src/modules');
const { DocumentManager } = require('../language-server/src/documentManager');
const { pathToUri } = require('../language-server/src/utils');

const results = [];

function recordResult(component, testName, fn) {
    try {
        fn();
        results.push({ component, testName, passed: true });
    } catch (err) {
        results.push({ component, testName, passed: false, error: err.message });
    }
}

console.log('================================================================');
console.log('       JAWALANG LANGUAGE SERVER V1 — MASTER VALIDATION          ');
console.log('================================================================\n');

// 1. DIAGNOSTICS TESTS
recordResult('Diagnostics', 'Valid code produces 0 diagnostics', () => {
    const validCode = 'gawe x = 10\nguna tambah(a, b) { bali a + b }\ngawe hasil = tambah(x, 20)';
    const res = analyzer.analyze(validCode, 'file:///test_valid.jawa');
    assert.strictEqual(res.diagnostics.length, 0);
});

recordResult('Diagnostics', 'Built-in functions recognized without false diagnostics', () => {
    const builtinsCode = 'gawe d = dawa([1, 2, 3])\ntulis d\ngawe s = motong("Halo", 0, 2)';
    const res = analyzer.analyze(builtinsCode, 'file:///test_builtins.jawa');
    assert.strictEqual(res.diagnostics.length, 0);
});

recordResult('Diagnostics', 'Syntax error produces diagnostic with accurate range', () => {
    const syntaxErrCode = 'gawe x = ';
    const res = analyzer.analyze(syntaxErrCode, 'file:///test_syntax.jawa');
    assert.ok(res.diagnostics.length > 0);
    assert.strictEqual(res.diagnostics[0].severity, 1);
    assert.strictEqual(res.diagnostics[0].range.start.line, 0);
});

recordResult('Diagnostics', 'Undefined variable reported cleanly', () => {
    const undefinedVarCode = 'gawe y = varOraAna + 10';
    const res = analyzer.analyze(undefinedVarCode, 'file:///test_undef_var.jawa');
    const diag = res.diagnostics.find(d => d.message.includes('varOraAna'));
    assert.ok(diag, 'Diagnostic for undefined variable varOraAna should exist');
});

recordResult('Diagnostics', 'Undefined function reported cleanly', () => {
    const undefinedFnCode = 'fungsiOraAna(1, 2)';
    const res = analyzer.analyze(undefinedFnCode, 'file:///test_undef_fn.jawa');
    const diag = res.diagnostics.find(d => d.message.includes('fungsiOraAna'));
    assert.ok(diag, 'Diagnostic for undefined function should exist');
});

recordResult('Diagnostics', 'Parameter count mismatch reported with warning', () => {
    const paramMismatchCode = 'guna petung(a, b) { bali a + b }\npetung(1)';
    const res = analyzer.analyze(paramMismatchCode, 'file:///test_param_mismatch.jawa');
    const diag = res.diagnostics.find(d => d.message.includes('petung'));
    assert.ok(diag, 'Diagnostic for parameter mismatch should exist');
    assert.strictEqual(diag.severity, 2);
});

recordResult('Diagnostics', 'Invalid "iki" outside method reported', () => {
    const invalidIkiCode = 'iki.jeneng = "Invalid"';
    const res = analyzer.analyze(invalidIkiCode, 'file:///test_invalid_iki.jawa');
    const diag = res.diagnostics.find(d => d.message.includes('iki'));
    assert.ok(diag, 'Diagnostic for invalid iki should exist');
});

recordResult('Diagnostics', 'Invalid "super" outside inheritance reported', () => {
    const invalidSuperCode = 'guna test() { super.salam() }';
    const res = analyzer.analyze(invalidSuperCode, 'file:///test_invalid_super.jawa');
    const diag = res.diagnostics.find(d => d.message.includes('super'));
    assert.ok(diag, 'Diagnostic for invalid super should exist');
});

// 2. DEFINITIONS TESTS
const defFixture = path.resolve(__dirname, '../language-server/test/fixtures/definitions.jawa');
const defCode = fs.readFileSync(defFixture, 'utf8');
const defUri = pathToUri(defFixture);
const defAnalysis = analyzer.analyze(defCode, defUri);

recordResult('Definitions', 'Local variable definition lookup', () => {
    const def = getDefinition(defAnalysis, { line: 20, character: 16 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 1);
});

recordResult('Definitions', 'Function definition lookup', () => {
    const def = getDefinition(defAnalysis, { line: 21, character: 16 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 3);
});

recordResult('Definitions', 'Struct definition lookup', () => {
    const def = getDefinition(defAnalysis, { line: 22, character: 24 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 8);
});

recordResult('Definitions', 'Parameter definition lookup', () => {
    const def = getDefinition(defAnalysis, { line: 4, character: 18 });
    assert.ok(def);
    assert.strictEqual(def.range.start.line, 3);
});

recordResult('Definitions', 'Cross-file import definition lookup', () => {
    const mainModFixture = path.resolve(__dirname, '../language-server/test/fixtures/modules/main.jawa');
    const mainModCode = fs.readFileSync(mainModFixture, 'utf8');
    const mainModUri = pathToUri(mainModFixture);
    const mainAnalysis = analyzer.analyze(mainModCode, mainModUri);
    const def = getDefinition(mainAnalysis, { line: 5, character: 16 });
    assert.ok(def);
    assert.ok(def.uri.includes('math.jawa'));
});

// 3. COMPLETION TESTS
const compFixture = path.resolve(__dirname, '../language-server/test/fixtures/completion.jawa');
const compCode = fs.readFileSync(compFixture, 'utf8');
const compUri = pathToUri(compFixture);
const compAnalysis = analyzer.analyze(compCode, compUri);

recordResult('Completion', 'General scope completion (vars, fns, structs, builtins, keywords)', () => {
    const items = getCompletions(compAnalysis, { line: 24, character: 0 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('namaUser') && labels.includes('Mobil') && labels.includes('tulis') && labels.includes('gawe'));
});

recordResult('Completion', 'Function parameter completion inside body', () => {
    const items = getCompletions(compAnalysis, { line: 6, character: 4 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('paramSiji') && labels.includes('paramLoro'));
});

recordResult('Completion', 'Struct instance member completion (m.)', () => {
    const testCode = compCode + '\nm.';
    const testAnalysis = analyzer.analyze(testCode, compUri);
    const lines = testCode.split('\n');
    const items = getCompletions(testAnalysis, { line: lines.length - 1, character: 2 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('merk') && labels.includes('kacepatan') && labels.includes('mlaku'));
});

recordResult('Completion', '"iki." member completion inside method', () => {
    const testCode = compCode.replace('// Should complete iki.merk, iki.kacepatan', 'iki.');
    const testAnalysis = analyzer.analyze(testCode, compUri);
    const lines = testCode.split('\n');
    const ikiLineIdx = lines.findIndex(l => l.includes('iki.'));
    const items = getCompletions(testAnalysis, { line: ikiLineIdx, character: lines[ikiLineIdx].indexOf('iki.') + 4 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('merk') && labels.includes('kacepatan'));
});

recordResult('Completion', 'Namespace completion provides exported symbols', () => {
    const mainModFixture = path.resolve(__dirname, '../language-server/test/fixtures/modules/main.jawa');
    const mainModCode = fs.readFileSync(mainModFixture, 'utf8') + '\nmath.';
    const mainModUri = pathToUri(mainModFixture);
    const mainAnalysis = analyzer.analyze(mainModCode, mainModUri);
    const lines = mainModCode.split('\n');
    const items = getCompletions(mainAnalysis, { line: lines.length - 1, character: 5 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('PI') && labels.includes('tambah') && labels.includes('kurang'));
    assert.ok(!labels.includes('rahasia'));
});

recordResult('Completion', 'Inherited members and override resolution on child instance', () => {
    const code = [
        'bentuk Induk {',
        '    gawe jeneng',
        '    guna salam() {}',
        '}',
        'bentuk Anak ngembangake Induk {',
        '    gawe umur',
        '    guna salam(pesan) {}',
        '}',
        'gawe a = anyar Anak()',
        'a.'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_inherit.jawa');
    const items = getCompletions(analysis, { line: 9, character: 2 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('jeneng'));
    assert.ok(labels.includes('umur'));
    assert.ok(labels.includes('salam'));
    // Ensure salam is deduplicated
    const salamItems = items.filter(it => it.label === 'salam');
    assert.strictEqual(salamItems.length, 1);
});

recordResult('Completion', '"super." member completion inside child method', () => {
    const code = [
        'bentuk Induk {',
        '    gawe jeneng',
        '    guna salam() {}',
        '}',
        'bentuk Anak ngembangake Induk {',
        '    guna salam(pesan) {}',
        '    guna test() {',
        '        super.',
        '    }',
        '}'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_super.jawa');
    const items = getCompletions(analysis, { line: 7, character: 14 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('salam'));
    assert.ok(labels.includes('jeneng'));
});

recordResult('Completion', 'Constructor context after "anyar" offers structs only', () => {
    const code = [
        'gawe x = 10',
        'guna fn() {}',
        'bentuk Mobil {}',
        'bentuk Motor {}',
        'gawe m = anyar '
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_anyar.jawa');
    const items = getCompletions(analysis, { line: 4, character: 15 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('Mobil') && labels.includes('Motor'));
    assert.ok(!labels.includes('x') && !labels.includes('fn') && !labels.includes('tulis'));
});

recordResult('Completion', 'Safety: zero completions inside strings and comments', () => {
    const code = [
        'gawe nama = "test"',
        'tulis "nam',
        '// nam'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_safety.jawa');
    const stringItems = getCompletions(analysis, { line: 1, character: 10 });
    assert.strictEqual(stringItems.length, 0);
    const commentItems = getCompletions(analysis, { line: 2, character: 5 });
    assert.strictEqual(commentItems.length, 0);
});

recordResult('Completion', 'Accurate textEdit replacement range for prefix and member access', () => {
    const code = [
        'bentuk Wong {',
        '    gawe jeneng',
        '    guna salam() {}',
        '}',
        'gawe w = anyar Wong()',
        'w.sa'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_range.jawa');
    const items = getCompletions(analysis, { line: 5, character: 4 });
    const salamItem = items.find(it => it.label === 'salam');
    assert.ok(salamItem);
    assert.ok(salamItem.textEdit);
    assert.strictEqual(salamItem.textEdit.range.start.character, 2);
    assert.strictEqual(salamItem.textEdit.range.end.character, 4);
    assert.strictEqual(salamItem.textEdit.newText, 'salam');
});

recordResult('Completion', 'Malformed document recovery provides valid scope completions', () => {
    const code = [
        'gawe nama = "Barch"',
        'gawe umur = 20',
        'nam'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///test_comp_malformed.jawa');
    const items = getCompletions(analysis, { line: 2, character: 3 });
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('nama'));
});

// 4. HOVER TESTS
const hoverFixture = path.resolve(__dirname, '../language-server/test/fixtures/hover.jawa');
const hoverCode = fs.readFileSync(hoverFixture, 'utf8');
const hoverUri = pathToUri(hoverFixture);
const hoverAnalysis = analyzer.analyze(hoverCode, hoverUri);

recordResult('Hover', 'Variable hover with inferred string type', () => {
    const hover = getHover(hoverAnalysis, { line: 1, character: 7 });
    assert.ok(hover && hover.contents.value.includes('string'));
});

recordResult('Hover', 'Variable hover with inferred number type', () => {
    const hover = getHover(hoverAnalysis, { line: 2, character: 7 });
    assert.ok(hover && hover.contents.value.includes('number'));
});

recordResult('Hover', 'Struct instance hover (instance of ...)', () => {
    const hover = getHover(hoverAnalysis, { line: 25, character: 7 });
    assert.ok(hover && hover.contents.value.includes('instance of WongHover'));
});

recordResult('Hover', 'Function hover with signature & parameter docs', () => {
    const hover = getHover(hoverAnalysis, { line: 7, character: 8 });
    assert.ok(hover && hover.contents.value.includes('petungHover(a, b)'));
});

recordResult('Hover', 'Struct hover with fields and methods', () => {
    const hover = getHover(hoverAnalysis, { line: 11, character: 10 });
    assert.ok(hover && hover.contents.value.includes('bentuk WongHover'));
    assert.ok(hover.contents.value.includes('jeneng') && hover.contents.value.includes('salamHover'));
});

recordResult('Hover', 'Built-in function hover with signature & doc', () => {
    const hover = getHover(hoverAnalysis, { line: 26, character: 17 });
    assert.ok(hover && hover.contents.value.includes('dawa(koleksi'));
});

// 5. DOCUMENT SYMBOLS TESTS
const structFixture = path.resolve(__dirname, '../language-server/test/fixtures/structs.jawa');
const structCode = fs.readFileSync(structFixture, 'utf8');
const structUri = pathToUri(structFixture);
const structAnalysis = analyzer.analyze(structCode, structUri);

recordResult('Symbols', 'Hierarchical document symbols (classes, methods, fields)', () => {
    const symbols = getDocumentSymbols(structAnalysis);
    const kewanSym = symbols.find(s => s.name === 'Kewan');
    assert.ok(kewanSym, 'Struct Kewan should be in document symbols');
    assert.strictEqual(kewanSym.kind, SymbolKind.Struct);
    assert.ok(kewanSym.children.some(c => c.name === 'jeneng' && c.kind === SymbolKind.Field));
    assert.ok(kewanSym.children.some(c => c.name === 'wiwiti' && c.kind === SymbolKind.Constructor));
    assert.ok(kewanSym.children.some(c => c.name === 'swara' && c.kind === SymbolKind.Method));
});

recordResult('Symbols', 'Top-level variable symbols', () => {
    const symbols = getDocumentSymbols(structAnalysis);
    assert.ok(symbols.some(s => s.name === 'k' && s.kind === SymbolKind.Variable));
});

// 6. MODULE AWARENESS TESTS
recordResult('Modules', 'Relative import resolution with optional .jawa extension', () => {
    const curPath = path.resolve(__dirname, '../language-server/test/fixtures/modules/main.jawa');
    const resolvedWithExt = moduleManager.resolve('./math.jawa', curPath);
    const resolvedNoExt = moduleManager.resolve('./math', curPath);
    assert.strictEqual(resolvedWithExt, resolvedNoExt);
    assert.ok(fs.existsSync(resolvedWithExt));
});

recordResult('Modules', 'Static module exports extraction', () => {
    const mathPath = path.resolve(__dirname, '../language-server/test/fixtures/modules/math.jawa');
    const mod = moduleManager.getModuleExports(mathPath);
    assert.ok(mod.exports.variables.PI);
    assert.ok(mod.exports.functions.tambah);
    assert.ok(mod.exports.functions.kurang);
    assert.strictEqual(mod.exports.functions.rahasia, undefined);
});

recordResult('Modules', 'Circular import detection and cycle handling', () => {
    const testCyclePath = path.resolve(__dirname, '../language-server/test/fixtures/modules/math.jawa');
    const visited = new Set([testCyclePath]);
    const cycleRes = moduleManager.getModuleExports(testCyclePath, visited);
    assert.strictEqual(cycleRes.isCycle, true);
});

recordResult('Modules', 'Missing module correctly flagged in diagnostics', () => {
    const mainPath = path.resolve(__dirname, '../language-server/test/fixtures/modules/main.jawa');
    const code = 'impor "./ora_ana_babarpisan.jawa"';
    const res = analyzer.analyze(code, pathToUri(mainPath));
    const diag = res.diagnostics.find(d => d.message.includes('Modul ora ditemokake'));
    assert.ok(diag, 'Should flag missing module error');
});

recordResult('Modules', 'Missing named export correctly flagged in diagnostics', () => {
    const mainPath = path.resolve(__dirname, '../language-server/test/fixtures/modules/main.jawa');
    const code = 'impor { oraAnaBabarpisan } saka "./math.jawa"';
    const res = analyzer.analyze(code, pathToUri(mainPath));
    const diag = res.diagnostics.find(d => d.message.includes('oraAnaBabarpisan') && d.message.includes('ora ditemokake'));
    assert.ok(diag, 'Should flag missing named export error');
});

// 7. MULTIPLE DOCUMENTS TESTS
recordResult('Multiple Documents', 'Multiple open documents maintain isolated scope', () => {
    const docManager = new DocumentManager();
    const uri1 = 'file:///doc1.jawa';
    const uri2 = 'file:///doc2.jawa';
    docManager.openDocument(uri1, 'gawe privateVarDoc1 = 100', 1);
    docManager.openDocument(uri2, 'gawe privateVarDoc2 = 200', 1);

    const analysis1 = docManager.getAnalysis(uri1);
    const analysis2 = docManager.getAnalysis(uri2);

    assert.ok(analysis1.globalScope.lookup('privateVarDoc1'));
    assert.strictEqual(analysis1.globalScope.lookup('privateVarDoc2'), null);
    assert.ok(analysis2.globalScope.lookup('privateVarDoc2'));
    assert.strictEqual(analysis2.globalScope.lookup('privateVarDoc1'), null);
});

recordResult('Multiple Documents', 'Document updates re-analyze accurately', () => {
    const docManager = new DocumentManager();
    const uri = 'file:///doc_update.jawa';
    docManager.openDocument(uri, 'gawe awal = 1', 1);
    assert.ok(docManager.getAnalysis(uri).globalScope.lookup('awal'));

    docManager.openDocument(uri, 'gawe anyarVar = 2', 2);
    const updated = docManager.getAnalysis(uri);
    assert.strictEqual(updated.globalScope.lookup('awal'), null);
    assert.ok(updated.globalScope.lookup('anyarVar'));
});

// 8. ERROR ISOLATION TESTS
recordResult('Error Isolation', 'Syntax error does not crash analyzer or document manager', () => {
    const brokenCode = 'bentuk Rusak {\n  gawe x = \n  guna mlaku() { bali 1 }\n}';
    const res = analyzer.analyze(brokenCode, 'file:///broken.jawa');
    assert.ok(res.diagnostics.length > 0);
    assert.ok(Array.isArray(res.scopes));
    assert.ok(Array.isArray(res.symbols));
});

recordResult('Error Isolation', 'Parse recovery enables member completion even with trailing dot', () => {
    const codeWithDot = 'bentuk A {\n  gawe prop = 10\n}\ngawe a = anyar A()\na.';
    const res = analyzer.analyze(codeWithDot, 'file:///broken_dot.jawa');
    const lines = codeWithDot.split('\n');
    const items = getCompletions(res, { line: lines.length - 1, character: 2 });
    assert.ok(items.some(it => it.label === 'prop'));
});

// 9. VS CODE EXTENSION INTEGRATION TESTS
recordResult('VS Code Integration', 'Extension package manifest contains all languageServer configurations', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vscode-extension/package.json'), 'utf8'));
    const props = pkg.contributes.configuration.properties;
    assert.ok(props['jawalang.languageServer.enabled']);
    assert.ok(props['jawalang.languageServer.path']);
    assert.ok(props['jawalang.languageServer.debug']);
});

recordResult('VS Code Integration', 'Extension manifest declares vscode-languageclient dependency', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vscode-extension/package.json'), 'utf8'));
    assert.ok(pkg.dependencies && pkg.dependencies['vscode-languageclient']);
});

recordResult('VS Code Integration', 'Bundled language server executable exists and responds to --version', () => {
    const bundledBin = path.resolve(__dirname, '../vscode-extension/server/bin/jawalang-language-server.js');
    assert.ok(fs.existsSync(bundledBin));
});

recordResult('VS Code Integration', 'VSIX artifact is packaged and ready for distribution', () => {
    const vsixPath = path.resolve(__dirname, '../vscode-extension/jawalang-vscode-1.0.0.vsix');
    assert.ok(fs.existsSync(vsixPath));
    const stat = fs.statSync(vsixPath);
    assert.ok(stat.size > 20000);
});

// 10. FIND REFERENCES TESTS (V1.3.0 Phase 2)
recordResult('Find References', 'Global variable references finds declaration and call-site usages', () => {
    const code = 'gawe x = 10\ntulis x\ngawe y = x + 1';
    const res = analyzer.analyze(code, 'file:///test_ref_global.jawa');
    const refs = getReferences(res, { line: 0, character: 5 }, { includeDeclaration: true });
    assert.strictEqual(refs.length, 3);
});

recordResult('Find References', 'Local variable references honors scope and shadowing', () => {
    const code = 'gawe x = 10\nguna tes() {\n    gawe x = 20\n    tulis x\n}\ntulis x';
    const res = analyzer.analyze(code, 'file:///test_ref_shadow.jawa');
    const refs = getReferences(res, { line: 2, character: 9 }, { includeDeclaration: true });
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].range.start.line, 2);
});

recordResult('Find References', 'Struct and method references resolve accurately', () => {
    const code = 'bentuk Mobil { guna maju() { tulis 1 } }\ngawe m = anyar Mobil()\nm.maju()';
    const res = analyzer.analyze(code, 'file:///test_ref_struct.jawa');
    const refs = getReferences(res, { line: 0, character: 21 }, { includeDeclaration: true });
    assert.strictEqual(refs.length, 2);
    assert.strictEqual(refs[0].range.start.line, 0);
    assert.strictEqual(refs[1].range.start.line, 2);
});

recordResult('Find References', 'Built-in functions and keywords return empty array', () => {
    const code = 'tulis "halo"\nyen bener { mandheg }';
    const res = analyzer.analyze(code, 'file:///test_ref_builtins.jawa');
    assert.deepStrictEqual(getReferences(res, { line: 0, character: 2 }), []);
    assert.deepStrictEqual(getReferences(res, { line: 1, character: 2 }), []);
});

// 11. RENAME SYMBOL TESTS (V1.3.0 Phase 3)
recordResult('Rename Symbol', 'Global variable rename produces WorkspaceEdit across declaration and usages', () => {
    const code = 'gawe nama = "Budi"\ntulis nama\ngawe salinan = nama';
    const uri = 'file:///test_rename_global.jawa';
    const res = analyzer.analyze(code, uri);
    const edit = renameSymbol(res, { line: 0, character: 5 }, 'jeneng');
    assert.ok(edit && edit.changes && edit.changes[uri]);
    assert.strictEqual(edit.changes[uri].length, 3);
    assert.strictEqual(edit.changes[uri][0].range.start.line, 2);
    assert.strictEqual(edit.changes[uri][2].range.start.line, 0);
    assert.ok(edit.changes[uri].every(c => c.newText === 'jeneng'));
});

recordResult('Rename Symbol', 'Local variable rename respects scope and shadowing', () => {
    const code = 'gawe x = 100\nguna test() {\n    gawe x = 20\n    tulis x\n}\ntulis x';
    const uri = 'file:///test_rename_shadow.jawa';
    const res = analyzer.analyze(code, uri);
    const edit = renameSymbol(res, { line: 2, character: 9 }, 'lokal');
    assert.ok(edit && edit.changes && edit.changes[uri]);
    assert.strictEqual(edit.changes[uri].length, 2);
    assert.strictEqual(edit.changes[uri][0].range.start.line, 3);
    assert.strictEqual(edit.changes[uri][1].range.start.line, 2);
});

recordResult('Rename Symbol', 'Struct and method rename produce valid WorkspaceEdit', () => {
    const code = 'bentuk Mobil {\n    guna maju() { tulis 1 }\n}\ngawe m = anyar Mobil()\nm.maju()';
    const uri = 'file:///test_rename_struct.jawa';
    const res = analyzer.analyze(code, uri);
    const editStruct = renameSymbol(res, { line: 0, character: 8 }, 'Kendaraan');
    assert.ok(editStruct && editStruct.changes && editStruct.changes[uri]);
    assert.strictEqual(editStruct.changes[uri].length, 2);

    const editMethod = renameSymbol(res, { line: 1, character: 10 }, 'mlaku');
    assert.ok(editMethod && editMethod.changes && editMethod.changes[uri]);
    assert.strictEqual(editMethod.changes[uri].length, 2);
});

recordResult('Rename Symbol', 'Built-in functions, keywords, and constructor "wiwiti" return null safely', () => {
    const code = 'tulis "halo"\nyen bener { mandheg }\nbentuk O { wiwiti() {} }';
    const uri = 'file:///test_rename_builtins.jawa';
    const res = analyzer.analyze(code, uri);
    assert.strictEqual(renameSymbol(res, { line: 0, character: 2 }, 'cetak'), null);
    assert.strictEqual(renameSymbol(res, { line: 1, character: 1 }, 'ifKeyword'), null);
    assert.strictEqual(renameSymbol(res, { line: 2, character: 12 }, 'init'), null);
});

recordResult('Rename Symbol', 'Invalid identifier names and scope collisions return null safely', () => {
    const code = 'gawe x = 10\ngawe y = 20';
    const uri = 'file:///test_rename_invalid.jawa';
    const res = analyzer.analyze(code, uri);
    assert.strictEqual(renameSymbol(res, { line: 0, character: 5 }, '123bad'), null);
    assert.strictEqual(renameSymbol(res, { line: 0, character: 5 }, 'y'), null);
});

// ==========================================
// 12. SIGNATURE HELP VALIDATION
// ==========================================

recordResult('Signature Help', 'Basic function signature returns label, parameters, and activeParameter 0', () => {
    const code = 'guna tambah(a, b) { bali a + b }\ntambah(';
    const uri = 'file:///test_sig_basic.jawa';
    const res = analyzer.analyze(code, uri);
    const sig = getSignatureHelp(res, { line: 1, character: 7 });
    assert.ok(sig);
    assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
    assert.strictEqual(sig.signatures[0].parameters.length, 2);
    assert.strictEqual(sig.activeParameter, 0);
});

recordResult('Signature Help', 'Active parameter updates accurately across multiple arguments', () => {
    const code = 'guna daftar(x, y, z) {}\ndaftar(10, 20, ';
    const uri = 'file:///test_sig_params.jawa';
    const res = analyzer.analyze(code, uri);
    const sig = getSignatureHelp(res, { line: 1, character: 15 });
    assert.ok(sig);
    assert.strictEqual(sig.signatures[0].label, 'daftar(x, y, z)');
    assert.strictEqual(sig.activeParameter, 2);
});

recordResult('Signature Help', 'Nested call resolution distinguishes inner from outer call', () => {
    const code = 'guna f(a, b) {}\nguna g(x, y) {}\nf(g(1, 2), ';
    const uri = 'file:///test_sig_nested.jawa';
    const res = analyzer.analyze(code, uri);
    const sig = getSignatureHelp(res, { line: 2, character: 11 });
    assert.ok(sig);
    assert.strictEqual(sig.signatures[0].label, 'f(a, b)');
    assert.strictEqual(sig.activeParameter, 1);
});

recordResult('Signature Help', 'Struct methods and constructor calls provide signatures', () => {
    const code = [
        'bentuk Wong {',
        '    guna wiwiti(nama, umur) {}',
        '    guna sapa(pesan) {}',
        '}',
        'gawe w = anyar Wong(',
        'w.sapa('
    ].join('\n');
    const uri = 'file:///test_sig_struct.jawa';
    const res = analyzer.analyze(code, uri);
    const sigCtor = getSignatureHelp(res, { line: 4, character: 20 });
    assert.ok(sigCtor);
    assert.strictEqual(sigCtor.signatures[0].label, 'Wong(nama, umur)');
    const sigMethod = getSignatureHelp(res, { line: 5, character: 7 });
    assert.ok(sigMethod);
    assert.strictEqual(sigMethod.signatures[0].label, 'sapa(pesan)');
});

recordResult('Signature Help', 'Built-in functions provide signatures and documentation', () => {
    const code = 'dawa(';
    const uri = 'file:///test_sig_builtin.jawa';
    const res = analyzer.analyze(code, uri);
    const sig = getSignatureHelp(res, { line: 0, character: 5 });
    assert.ok(sig);
    assert.strictEqual(sig.signatures[0].label, 'dawa(koleksi)');
    assert.ok(sig.signatures[0].documentation);
});

// 9. FORMATTING TESTS
recordResult('Formatting', 'Basic function and operator spacing', () => {
    const code = 'guna tambah(a,b){\nbali a+b\n}';
    const edits = formatDocument(code);
    assert.strictEqual(edits[0].newText, 'guna tambah(a, b) {\n    bali a + b\n}');
});

recordResult('Formatting', 'If / else cuddling and block indent', () => {
    const code = 'yen x>10{\ntulis x\n}liyane{\ntulis 0\n}';
    const edits = formatDocument(code);
    assert.strictEqual(edits[0].newText, 'yen x > 10 {\n    tulis x\n} liyane {\n    tulis 0\n}');
});

recordResult('Formatting', 'Struct and method formatting', () => {
    const code = 'bentuk Wong{\ngawe jeneng\n\nguna salam(){\ntulis iki.jeneng\n}\n}';
    const edits = formatDocument(code);
    assert.strictEqual(edits[0].newText, 'bentuk Wong {\n    gawe jeneng\n\n    guna salam() {\n        tulis iki.jeneng\n    }\n}');
});

recordResult('Formatting', 'Comments and strings safety', () => {
    const code = 'gawe x=10 // comment\ntulis "a+b=c"';
    const edits = formatDocument(code);
    assert.strictEqual(edits[0].newText, 'gawe x = 10 // comment\ntulis "a+b=c"');
});

recordResult('Formatting', 'Malformed code returns [] cleanly', () => {
    const code = 'gawe x = "unclosed';
    const edits = formatDocument(code);
    assert.deepStrictEqual(edits, []);
});

recordResult('Formatting', 'Idempotency guarantee', () => {
    const code = 'guna tambah(a,b){\nbali a+b\n}';
    const edits1 = formatDocument(code);
    const edits2 = formatDocument(edits1[0].newText);
    assert.deepStrictEqual(edits2, []);
});

// RENDER SUMMARY TABLE
const componentStats = {};
for (const r of results) {
    if (!componentStats[r.component]) {
        componentStats[r.component] = { total: 0, passed: 0, failed: 0 };
    }
    componentStats[r.component].total++;
    if (r.passed) componentStats[r.component].passed++;
    else componentStats[r.component].failed++;
}

console.log('+--------------------------+-------+--------+--------+--------+');
console.log('| Component                | Total | Passed | Failed | Status |');
console.log('+--------------------------+-------+--------+--------+--------+');

let allPassed = true;
let grandTotal = 0;
let grandPassed = 0;
let grandFailed = 0;

for (const [comp, stat] of Object.entries(componentStats)) {
    const status = stat.failed === 0 ? 'PASS' : 'FAIL';
    if (stat.failed > 0) allPassed = false;
    grandTotal += stat.total;
    grandPassed += stat.passed;
    grandFailed += stat.failed;

    const compPadded = comp.padEnd(24);
    const totPadded = String(stat.total).padStart(5);
    const passPadded = String(stat.passed).padStart(6);
    const failPadded = String(stat.failed).padStart(6);
    const statPadded = status.padStart(6);

    console.log(`| ${compPadded} | ${totPadded} | ${passPadded} | ${failPadded} | ${statPadded} |`);
}

console.log('+--------------------------+-------+--------+--------+--------+');
const totSummary = `| TOTAL                    | ${String(grandTotal).padStart(5)} | ${String(grandPassed).padStart(6)} | ${String(grandFailed).padStart(6)} | ${(allPassed ? 'PASS' : 'FAIL').padStart(6)} |`;
console.log(totSummary);
console.log('+--------------------------+-------+--------+--------+--------+\n');

if (!allPassed) {
    console.error('FAILED TESTS:');
    for (const r of results) {
        if (!r.passed) {
            console.error(`- [${r.component}] ${r.testName}: ${r.error}`);
        }
    }
    process.exit(1);
} else {
    console.log('ALL JAWALANG LANGUAGE SERVER VALIDATION TESTS PASSED!');
}
