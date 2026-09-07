const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getDefinition } = require('../src/definitions');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Definitions Tests ---');

    const filePath = path.resolve(__dirname, 'fixtures', 'definitions.jawa');
    const code = fs.readFileSync(filePath, 'utf8');
    const uri = pathToUri(filePath);
    const analysis = analyzer.analyze(code, uri);

    // 1. Variable definition
    // Line 21 (0-based line 20): gawe testA = targetVar
    // Cursor on "targetVar" (line 20, char 16)
    {
        const def = getDefinition(analysis, { line: 20, character: 16 });
        assert.ok(def, 'Definition for targetVar should exist');
        assert.strictEqual(def.range.start.line, 1, 'targetVar should point to line 1');
        console.log('PASS: Variable definition lookup succeeds');
    }

    // 2. Function definition
    // Line 22 (0-based line 21): gawe testB = targetFunc(1, 2)
    // Cursor on "targetFunc" (line 21, char 16)
    {
        const def = getDefinition(analysis, { line: 21, character: 16 });
        assert.ok(def, 'Definition for targetFunc should exist');
        assert.strictEqual(def.range.start.line, 3, 'targetFunc should point to line 3');
        console.log('PASS: Function definition lookup succeeds');
    }

    // 3. Struct definition
    // Line 23 (0-based line 22): gawe testC = anyar TargetStruct(50)
    // Cursor on "TargetStruct" (line 22, char 24)
    {
        const def = getDefinition(analysis, { line: 22, character: 24 });
        assert.ok(def, 'Definition for TargetStruct should exist');
        assert.strictEqual(def.range.start.line, 8, 'TargetStruct should point to line 8');
        console.log('PASS: Struct definition lookup succeeds');
    }

    // 4. Function parameter definition
    // Inside targetFunc at line 5 (0-based line 4): gawe lokal = paramA + paramB
    // Cursor on "paramA" (line 4, char 18)
    {
        const def = getDefinition(analysis, { line: 4, character: 18 });
        assert.ok(def, 'Definition for paramA should exist');
        assert.strictEqual(def.range.start.line, 3, 'paramA should point to function header line 3');
        console.log('PASS: Parameter definition lookup succeeds');
    }

    // 5. Cross-file imported symbol definition
    {
        const mainPath = path.resolve(__dirname, 'fixtures', 'modules', 'main.jawa');
        const mainCode = fs.readFileSync(mainPath, 'utf8');
        const mainUri = pathToUri(mainPath);
        const mainAnalysis = analyzer.analyze(mainCode, mainUri);

        // Line 6 (0-based line 5): gawe hasil = tambah(10, 20)
        // Cursor on "tambah" (line 5, char 16)
        const def = getDefinition(mainAnalysis, { line: 5, character: 16 });
        assert.ok(def, 'Definition for imported tambah should exist');
        assert.ok(def.uri.includes('math.jawa'), 'tambah definition should point to math.jawa');
        console.log('PASS: Cross-module imported symbol definition succeeds');
    }
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
