const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getDocumentSymbols, SymbolKind } = require('../src/symbols');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Document Symbols Tests ---');

    const filePath = path.resolve(__dirname, 'fixtures', 'structs.jawa');
    const code = fs.readFileSync(filePath, 'utf8');
    const uri = pathToUri(filePath);
    const analysis = analyzer.analyze(code, uri);

    const symbols = getDocumentSymbols(analysis);
    assert.ok(symbols.length >= 2, 'Should have at least 2 top-level symbols');

    // 1. Struct symbol
    const structSym = symbols.find(s => s.name === 'Kewan');
    assert.ok(structSym, 'Kewan struct symbol must exist');
    assert.strictEqual(structSym.kind, SymbolKind.Struct, 'Kewan must be Struct symbol');
    assert.ok(structSym.children, 'Kewan must have children');

    // 2. Struct fields
    const fieldJeneng = structSym.children.find(c => c.name === 'jeneng');
    assert.ok(fieldJeneng, 'jeneng field must exist');
    assert.strictEqual(fieldJeneng.kind, SymbolKind.Field);

    const fieldSikil = structSym.children.find(c => c.name === 'sikil');
    assert.ok(fieldSikil, 'sikil field must exist');
    assert.strictEqual(fieldSikil.kind, SymbolKind.Field);

    // 3. Constructor
    const ctor = structSym.children.find(c => c.name === 'wiwiti');
    assert.ok(ctor, 'wiwiti constructor must exist');
    assert.strictEqual(ctor.kind, SymbolKind.Constructor);

    // 4. Method
    const methodSwara = structSym.children.find(c => c.name === 'swara');
    assert.ok(methodSwara, 'swara method must exist');
    assert.strictEqual(methodSwara.kind, SymbolKind.Method);

    // 5. Global variable
    const varK = symbols.find(s => s.name === 'k');
    assert.ok(varK, 'k variable symbol must exist');
    assert.strictEqual(varK.kind, SymbolKind.Variable);

    console.log('PASS: Document symbols hierarchy accurately reflects variables, structs, fields, constructors, and methods');
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
