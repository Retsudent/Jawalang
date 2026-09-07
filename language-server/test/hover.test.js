const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getHover } = require('../src/hover');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Hover Tests ---');

    const filePath = path.resolve(__dirname, 'fixtures', 'hover.jawa');
    const code = fs.readFileSync(filePath, 'utf8');
    const uri = pathToUri(filePath);
    const analysis = analyzer.analyze(code, uri);

    // 1. Variable hover with inferred type "string"
    // Line 1: gawe teksHover = "Sugeng Enjang"
    // Cursor on "teksHover" (line 1, char 7)
    {
        const hover = getHover(analysis, { line: 1, character: 7 });
        assert.ok(hover, 'Hover for teksHover should exist');
        const text = hover.contents.value;
        assert.ok(text.includes('teksHover'), 'Should contain variable name');
        assert.ok(text.includes('string'), 'Should contain inferred type string');
        console.log('PASS: Variable hover displays name and inferred string type');
    }

    // 2. Variable hover with inferred type "number"
    // Line 2: gawe angkaHover = 123
    {
        const hover = getHover(analysis, { line: 2, character: 7 });
        assert.ok(hover, 'Hover for angkaHover should exist');
        assert.ok(hover.contents.value.includes('number'), 'Should contain inferred type number');
        console.log('PASS: Variable hover displays number type');
    }

    // 3. Variable hover with inferred type "instance of WongHover"
    // Line 26 (0-based 25): gawe instanceHover = anyar WongHover("Budi", 20)
    {
        const hover = getHover(analysis, { line: 25, character: 7 });
        assert.ok(hover, 'Hover for instanceHover should exist');
        assert.ok(hover.contents.value.includes('instance of WongHover'), 'Should contain instance type');
        console.log('PASS: Instance hover displays struct instance type');
    }

    // 4. Function hover
    // Line 7: guna petungHover(a, b)
    {
        const hover = getHover(analysis, { line: 7, character: 8 });
        assert.ok(hover, 'Hover for petungHover should exist');
        const text = hover.contents.value;
        assert.ok(text.includes('petungHover(a, b)'), 'Should contain function signature');
        assert.ok(text.includes('Parameter'), 'Should list parameters');
        console.log('PASS: Function hover displays signature and parameter list');
    }

    // 5. Struct hover
    // Line 11: bentuk WongHover
    {
        const hover = getHover(analysis, { line: 11, character: 10 });
        assert.ok(hover, 'Hover for WongHover should exist');
        const text = hover.contents.value;
        assert.ok(text.includes('bentuk WongHover'), 'Should contain struct header');
        assert.ok(text.includes('jeneng') && text.includes('umur'), 'Should list struct properties');
        assert.ok(text.includes('salamHover'), 'Should list struct methods');
        console.log('PASS: Struct hover displays fields and method list');
    }

    // 6. Built-in function hover
    // Line 27 (0-based 26): gawe panjang = dawa(teksHover)
    // Cursor on "dawa" (line 26, char 17)
    {
        const hover = getHover(analysis, { line: 26, character: 17 });
        assert.ok(hover, 'Hover for dawa should exist');
        const text = hover.contents.value;
        assert.ok(text.includes('dawa(koleksi'), 'Should contain built-in signature');
        assert.ok(text.includes('Built-in function'), 'Should be identified as built-in function');
        console.log('PASS: Built-in function hover displays signature and documentation');
    }
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
