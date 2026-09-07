const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getDiagnostics } = require('../src/diagnostics');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Diagnostics Tests ---');

    // 1. Valid code produces 0 errors
    {
        const filePath = path.resolve(__dirname, 'fixtures', 'basic.jawa');
        const code = fs.readFileSync(filePath, 'utf8');
        const analysis = analyzer.analyze(code, pathToUri(filePath));
        const diags = getDiagnostics(analysis);
        assert.strictEqual(diags.length, 0, `Expected 0 diagnostics for basic.jawa, got ${diags.length}: ${JSON.stringify(diags)}`);
        console.log('PASS: Valid code has 0 diagnostics');
    }

    // 2. Built-in functions recognition (no false positives)
    {
        const code = 'gawe x = takon("Jeneng: ")\ngawe l = dawa("Halo")\ngawe t = jinis(l)\ntulis t';
        const analysis = analyzer.analyze(code, 'file:///test_builtins.jawa');
        const diags = getDiagnostics(analysis);
        assert.strictEqual(diags.length, 0, `Builtins produced diagnostics: ${JSON.stringify(diags)}`);
        console.log('PASS: Built-in functions recognized without false diagnostics');
    }

    // 3. Syntax error produces diagnostic with valid line & character
    {
        const code = 'gawe x = \n tulis x';
        const analysis = analyzer.analyze(code, 'file:///test_syntax.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.length > 0, 'Expected syntax error diagnostic');
        assert.strictEqual(diags[0].severity, 1);
        assert.ok(diags[0].message.includes('Syntax error') || diags[0].message.includes('Dibutuhake nilai'));
        assert.ok(diags[0].range.start.line >= 0);
        assert.ok(diags[0].range.start.character >= 0);
        console.log('PASS: Syntax error produces diagnostic with accurate range');
    }

    // 4. Undefined variable diagnostic
    {
        const code = 'gawe a = 10\ngawe b = a + oraAna';
        const analysis = analyzer.analyze(code, 'file:///test_undef_var.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.some(d => d.message.includes('oraAna') && d.message.includes('ora ditemokake')), 'Expected undefined variable diagnostic');
        console.log('PASS: Undefined variable reported cleanly');
    }

    // 5. Undefined function diagnostic
    {
        const code = 'gawe x = fungsiAneh(1, 2)';
        const analysis = analyzer.analyze(code, 'file:///test_undef_fn.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.some(d => d.message.includes('fungsiAneh') && d.message.includes('ora ditemokake')), 'Expected undefined function diagnostic');
        console.log('PASS: Undefined function reported cleanly');
    }

    // 6. Parameter count warning
    {
        const code = 'guna jumlah(a, b) { bali a + b }\ngawe x = jumlah(1)';
        const analysis = analyzer.analyze(code, 'file:///test_arity.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.some(d => d.message.includes('mbutuhake 2 parameter') && d.severity === 2), 'Expected parameter count warning');
        console.log('PASS: Parameter count mismatch reported with warning');
    }

    // 7. Invalid "iki" outside method
    {
        const code = 'iki.jeneng = "Invalid"';
        const analysis = analyzer.analyze(code, 'file:///test_iki.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.some(d => d.message.includes('iki')), 'Expected invalid iki diagnostic');
        console.log('PASS: Invalid "iki" outside method reported');
    }

    // 8. Invalid "super" outside inheritance
    {
        const code = 'guna test() { super.salam() }';
        const analysis = analyzer.analyze(code, 'file:///test_super.jawa');
        const diags = getDiagnostics(analysis);
        assert.ok(diags.some(d => d.message.includes('super')), 'Expected invalid super diagnostic');
        console.log('PASS: Invalid "super" outside inheritance reported');
    }
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
