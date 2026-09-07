const assert = require('assert');
const fs = require('fs');
const path = require('path');
const moduleManager = require('../src/modules');
const analyzer = require('../src/analyzer');
const { getDiagnostics } = require('../src/diagnostics');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Modules Tests ---');

    const rawMathPath = path.resolve(__dirname, 'fixtures', 'modules', 'math.jawa');
    const mathPath = fs.realpathSync.native ? fs.realpathSync.native(rawMathPath) : fs.realpathSync(rawMathPath);
    const mainPath = path.resolve(__dirname, 'fixtures', 'modules', 'main.jawa');

    // 1. Module path resolution
    const resolved = moduleManager.resolve('./math.jawa', mainPath);
    assert.strictEqual(resolved, mathPath, 'Should resolve relative module path to math.jawa');

    // Resolution without extension
    const resolvedNoExt = moduleManager.resolve('./math', mainPath);
    assert.strictEqual(resolvedNoExt, mathPath, 'Should resolve relative module path without .jawa extension');
    console.log('PASS: Module path resolution handles relative paths and optional .jawa extension');

    // 2. Static export extraction
    const mod = moduleManager.getModuleExports(mathPath);
    assert.ok(mod.exports.variables['PI'], 'Should export PI variable');
    assert.ok(mod.exports.functions['tambah'], 'Should export tambah function');
    assert.ok(mod.exports.functions['kurang'], 'Should export kurang function');
    assert.ok(!mod.exports.functions['rahasia'], 'Should NOT export private rahasia function');
    console.log('PASS: Static module export analyzer extracts only exported symbols');

    // 3. Main module analysis with imports
    const mainCode = fs.readFileSync(mainPath, 'utf8');
    const mainAnalysis = analyzer.analyze(mainCode, pathToUri(mainPath));
    const mainDiags = getDiagnostics(mainAnalysis);
    assert.strictEqual(mainDiags.length, 0, `main.jawa should have 0 diagnostics, got: ${JSON.stringify(mainDiags)}`);
    console.log('PASS: Module imports resolved cleanly without false diagnostics');

    // 4. Missing module diagnostic
    {
        const badCode = 'impor "./ora_ana_modul.jawa"';
        const badAnalysis = analyzer.analyze(badCode, pathToUri(mainPath));
        const diags = getDiagnostics(badAnalysis);
        assert.ok(diags.some(d => d.message.includes('Modul ora ditemokake')), 'Expected missing module diagnostic');
        console.log('PASS: Missing module correctly flagged in diagnostics');
    }

    // 5. Missing export diagnostic
    {
        const badCode = 'impor { oraAnaExport } saka "./math.jawa"';
        const badAnalysis = analyzer.analyze(badCode, pathToUri(mainPath));
        const diags = getDiagnostics(badAnalysis);
        assert.ok(diags.some(d => d.message.includes('oraAnaExport') && d.message.includes('ora ditemokake')), 'Expected missing export diagnostic');
        console.log('PASS: Missing named export correctly flagged in diagnostics');
    }
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
