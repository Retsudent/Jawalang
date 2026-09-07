const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getCompletions } = require('../src/completion');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Completion Tests ---');

    const filePath = path.resolve(__dirname, 'fixtures', 'completion.jawa');
    const code = fs.readFileSync(filePath, 'utf8');
    const uri = pathToUri(filePath);
    const analysis = analyzer.analyze(code, uri);

    // 1. General scope completion (includes global variables and built-ins)
    {
        const items = getCompletions(analysis, { line: 24, character: 0 });
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('namaUser'), 'Should include namaUser in general completion');
        assert.ok(labels.includes('umurUser'), 'Should include umurUser in general completion');
        assert.ok(labels.includes('haloUser'), 'Should include haloUser in general completion');
        assert.ok(labels.includes('Mobil'), 'Should include Mobil in general completion');
        assert.ok(labels.includes('tulis'), 'Should include built-in tulis in general completion');
        assert.ok(labels.includes('gawe'), 'Should include keyword gawe in general completion');
        console.log('PASS: General scope completion contains variables, functions, structs, built-ins, and keywords');
    }

    // 2. Parameter completion inside function
    // Inside haloUser at line 6: "    gawe temp = 10"
    {
        const items = getCompletions(analysis, { line: 6, character: 4 });
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('paramSiji'), 'Should include paramSiji inside function');
        assert.ok(labels.includes('paramLoro'), 'Should include paramLoro inside function');
        console.log('PASS: Function parameter completion inside function body succeeds');
    }

    // 3. Struct instance member completion: "m."
    {
        const testCode = code + '\nm.';
        const testAnalysis = analyzer.analyze(testCode, uri);
        const lines = testCode.split('\n');
        const lastLineIdx = lines.length - 1;
        const items = getCompletions(testAnalysis, { line: lastLineIdx, character: 2 });
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('merk'), 'Should include field merk in m.');
        assert.ok(labels.includes('kacepatan'), 'Should include field kacepatan in m.');
        assert.ok(labels.includes('mlaku'), 'Should include method mlaku in m.');
        console.log('PASS: Struct instance member completion (m.) provides fields and methods');
    }

    // 4. "iki." member completion inside struct method
    {
        const testCode = code.replace('// Should complete iki.merk, iki.kacepatan', 'iki.');
        const testAnalysis = analyzer.analyze(testCode, uri);
        // Find line containing "iki."
        const lines = testCode.split('\n');
        const ikiLineIdx = lines.findIndex(l => l.includes('iki.'));
        const items = getCompletions(testAnalysis, { line: ikiLineIdx, character: lines[ikiLineIdx].indexOf('iki.') + 4 });
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('merk'), 'Should include field merk in iki.');
        assert.ok(labels.includes('kacepatan'), 'Should include field kacepatan in iki.');
        assert.ok(labels.includes('mlaku'), 'Should include method mlaku in iki.');
        console.log('PASS: "iki." member completion provides struct fields and methods');
    }

    // 5. Namespace completion (module exports)
    {
        const mainPath = path.resolve(__dirname, 'fixtures', 'modules', 'main.jawa');
        const mainCode = fs.readFileSync(mainPath, 'utf8') + '\nmath.';
        const mainUri = pathToUri(mainPath);
        const mainAnalysis = analyzer.analyze(mainCode, mainUri);

        const lines = mainCode.split('\n');
        const lastLineIdx = lines.length - 1;
        const items = getCompletions(mainAnalysis, { line: lastLineIdx, character: 5 });
        const labels = items.map(it => it.label);

        assert.ok(labels.includes('tambah'), 'math. should complete exported tambah');
        assert.ok(labels.includes('kurang'), 'math. should complete exported kurang');
        assert.ok(labels.includes('PI'), 'math. should complete exported PI');
        assert.ok(!labels.includes('rahasia'), 'math. should NOT complete private rahasia');
        console.log('PASS: Namespace completion provides only exported symbols from module');
    }
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
