const assert = require('assert');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getSignatureHelp } = require('../src/signatureHelp');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Signature Help Tests ---');

    // Helper to analyze code and query signature help
    function checkSignature(code, line, character, filePath = 'test.jawa') {
        const uri = pathToUri(path.resolve(process.cwd(), filePath));
        const analysis = analyzer.analyze(code, uri);
        return getSignatureHelp(analysis, { line, character });
    }

    // 1. Basic user function at open paren
    {
        const code = [
            'guna tambah(a, b) {',
            '    bali a + b',
            '}',
            'tambah('
        ].join('\n');
        // line 3, character 7 (right after '(')
        const sig = checkSignature(code, 3, 7);
        assert.ok(sig, 'Expected signature help for tambah(');
        assert.strictEqual(sig.signatures.length, 1);
        assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        assert.strictEqual(sig.signatures[0].parameters[0].label, 'a');
        assert.strictEqual(sig.signatures[0].parameters[1].label, 'b');
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 1. Basic function signature help');
    }

    // 2. First parameter
    {
        const code = [
            'guna tambah(a, b) {',
            '    bali a + b',
            '}',
            'tambah(10'
        ].join('\n');
        // line 3, character 9 (on first argument 10)
        const sig = checkSignature(code, 3, 9);
        assert.ok(sig);
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 2. First parameter activeParameter: 0');
    }

    // 3. Second parameter after comma
    {
        const code = [
            'guna tambah(a, b) {',
            '    bali a + b',
            '}',
            'tambah(10, '
        ].join('\n');
        // line 3, character 11 (after comma)
        const sig = checkSignature(code, 3, 11);
        assert.ok(sig);
        assert.strictEqual(sig.activeParameter, 1);
        assert.strictEqual(sig.signatures[0].parameters[sig.activeParameter].label, 'b');
        console.log('PASS: 3. Second parameter activeParameter: 1');
    }

    // 4. Third parameter
    {
        const code = [
            'guna daftar(a, b, c, d) {}',
            'daftar(10, 20, 30'
        ].join('\n');
        // line 1, character 17 (on 3rd arg)
        const sig = checkSignature(code, 1, 17);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'daftar(a, b, c, d)');
        assert.strictEqual(sig.activeParameter, 2);
        assert.strictEqual(sig.signatures[0].parameters[sig.activeParameter].label, 'c');
        console.log('PASS: 4. Third parameter activeParameter: 2');
    }

    // 5. Nested call inside inner function
    {
        const code = [
            'guna tambah(a, b) { bali a + b }',
            'guna kali(x, y) { bali x * y }',
            'kali(tambah(10, 20'
        ].join('\n');
        // line 2, character 12 (on 10, inside tambah)
        const sig = checkSignature(code, 2, 12);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 5. Nested call selects innermost call');
    }

    // 6. Nested call active parameter in outer call
    {
        const code = [
            'guna tambah(a, b) { bali a + b }',
            'guna kali(x, y) { bali x * y }',
            'kali(tambah(10, 20), '
        ].join('\n');
        // line 2, character 21 (after comma in kali)
        const sig = checkSignature(code, 2, 21);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'kali(x, y)');
        assert.strictEqual(sig.activeParameter, 1);
        assert.strictEqual(sig.signatures[0].parameters[1].label, 'y');
        console.log('PASS: 6. Outer call activeParameter: 1 after completed nested call');
    }

    // 7. Imported function
    {
        const code = [
            'impor { tambah } saka "./math"',
            'tambah('
        ].join('\n');
        const sig = checkSignature(code, 1, 7, path.resolve(__dirname, 'fixtures', 'modules', 'consumer.jawa'));
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        console.log('PASS: 7. Imported function signature help');
    }

    // 8. Selective import
    {
        const code = [
            'impor { kurang } saka "./math"',
            'kurang(10, '
        ].join('\n');
        const sig = checkSignature(code, 1, 11, path.resolve(__dirname, 'fixtures', 'modules', 'consumer2.jawa'));
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'kurang(a, b)');
        assert.strictEqual(sig.activeParameter, 1);
        console.log('PASS: 8. Selective import signature help');
    }

    // 9. Import alias
    {
        const code = [
            'impor { tambah minangka jumlah } saka "./math"',
            'jumlah('
        ].join('\n');
        const sig = checkSignature(code, 1, 7, path.resolve(__dirname, 'fixtures', 'modules', 'consumer3.jawa'));
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'jumlah(a, b)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        console.log('PASS: 9. Import alias signature help');
    }

    // 10. Namespace function
    {
        const code = [
            'impor "./math" minangka math',
            'math.tambah('
        ].join('\n');
        const sig = checkSignature(code, 1, 12, path.resolve(__dirname, 'fixtures', 'modules', 'consumer4.jawa'));
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 10. Namespace function signature help');
    }

    // 11. Struct method
    {
        const code = [
            'bentuk Wong {',
            '    guna salam(pesan, ulang) {',
            '        tulis pesan',
            '    }',
            '}',
            'gawe w = anyar Wong()',
            'w.salam('
        ].join('\n');
        const sig = checkSignature(code, 6, 8);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'salam(pesan, ulang)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 11. Struct method signature help');
    }

    // 12. Inherited method
    {
        const code = [
            'bentuk Induk {',
            '    guna salam(nama, umur) {}',
            '}',
            'bentuk Anak ngembangake Induk {}',
            'gawe a = anyar Anak()',
            'a.salam('
        ].join('\n');
        const sig = checkSignature(code, 5, 8);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'salam(nama, umur)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        console.log('PASS: 12. Inherited method signature help');
    }

    // 13. Overridden method
    {
        const code = [
            'bentuk Induk {',
            '    guna salam(nama) {}',
            '}',
            'bentuk Anak ngembangake Induk {',
            '    guna salam(nama, umur) {}',
            '}',
            'gawe a = anyar Anak()',
            'a.salam('
        ].join('\n');
        const sig = checkSignature(code, 7, 8);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'salam(nama, umur)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        console.log('PASS: 13. Overridden method prefers child struct signature');
    }

    // 14. Super method
    {
        const code = [
            'bentuk Induk {',
            '    guna salam(nama, umur) {}',
            '}',
            'bentuk Anak ngembangake Induk {',
            '    guna test() {',
            '        super.salam(',
            '    }',
            '}'
        ].join('\n');
        const sig = checkSignature(code, 5, 20);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'salam(nama, umur)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        console.log('PASS: 14. Super method resolves parent signature');
    }

    // 15. Constructor (anyar)
    {
        const code = [
            'bentuk Wong {',
            '    guna wiwiti(nama, umur) {}',
            '}',
            'gawe w = anyar Wong('
        ].join('\n');
        const sig = checkSignature(code, 3, 20);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'Wong(nama, umur)');
        assert.strictEqual(sig.signatures[0].parameters.length, 2);
        assert.strictEqual(sig.signatures[0].parameters[0].label, 'nama');
        assert.strictEqual(sig.signatures[0].parameters[1].label, 'umur');
        console.log('PASS: 15. Constructor invocation displays StructName(params)');
    }

    // 16. Super constructor
    {
        const code = [
            'bentuk Induk {',
            '    guna wiwiti(nama) {}',
            '}',
            'bentuk Anak ngembangake Induk {',
            '    guna wiwiti(nama, umur) {',
            '        super(',
            '    }',
            '}'
        ].join('\n');
        const sig = checkSignature(code, 5, 14);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'super(nama)');
        assert.strictEqual(sig.signatures[0].parameters.length, 1);
        assert.strictEqual(sig.signatures[0].parameters[0].label, 'nama');
        console.log('PASS: 16. Super constructor resolves parent constructor');
    }

    // 17. Array argument safety
    {
        const code = [
            'guna foo(arr, batas) {}',
            'foo([1, 2, 3], '
        ].join('\n');
        const sig = checkSignature(code, 1, 15);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'foo(arr, batas)');
        assert.strictEqual(sig.activeParameter, 1);
        assert.strictEqual(sig.signatures[0].parameters[1].label, 'batas');
        console.log('PASS: 17. Commas inside array do not skew activeParameter');
    }

    // 18. Object argument safety
    {
        const code = [
            'guna foo(data, opsi) {}',
            'foo({ "a": 1, "b": 2 }, '
        ].join('\n');
        const sig = checkSignature(code, 1, 24);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'foo(data, opsi)');
        assert.strictEqual(sig.activeParameter, 1);
        assert.strictEqual(sig.signatures[0].parameters[1].label, 'opsi');
        console.log('PASS: 18. Commas inside object literal do not skew activeParameter');
    }

    // 19. String comma safety
    {
        const code = [
            'guna sapa(teks, kaping) {}',
            'sapa("a, b, c", '
        ].join('\n');
        const sig = checkSignature(code, 1, 16);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'sapa(teks, kaping)');
        assert.strictEqual(sig.activeParameter, 1);
        console.log('PASS: 19. Commas inside string literal ignored');
    }

    // 20. Comment comma safety
    {
        const code = [
            'guna test(x, y) {}',
            'test(10, // komentar, komentar maneh',
            '    '
        ].join('\n');
        const sig = checkSignature(code, 2, 4);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'test(x, y)');
        assert.strictEqual(sig.activeParameter, 1);
        console.log('PASS: 20. Commas inside comments ignored');
    }

    // 21. Malformed call (unclosed paren)
    {
        const code = 'guna tambah(a, b) { bali a + b }\ntambah(';
        const sig = checkSignature(code, 1, 7);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig.activeParameter, 0);
        console.log('PASS: 21. Malformed call recovers gracefully');
    }

    // 22. Unknown function
    {
        const code = 'fungsiOraAna(';
        const sig = checkSignature(code, 0, 13);
        assert.strictEqual(sig, null);
        console.log('PASS: 22. Unknown function returns null');
    }

    // 23. Shadowing non-callable variable
    {
        const code = [
            'guna tambah(a, b) { bali a + b }',
            'guna tes() {',
            '    gawe tambah = 10',
            '    tambah(',
            '}'
        ].join('\n');
        const sig = checkSignature(code, 3, 11);
        assert.strictEqual(sig, null, 'Non-callable shadowed variable must return null');
        console.log('PASS: 23. Shadowed non-callable variable returns null');
    }

    // 24. Cursor outside call
    {
        const code = [
            'guna tambah(a, b) { bali a + b }',
            'tambah(10, 20)',
            'tulis 100'
        ].join('\n');
        const sig = checkSignature(code, 2, 0);
        assert.strictEqual(sig, null);
        console.log('PASS: 24. Cursor outside call returns null');
    }

    // 25. Cursor on function declaration
    {
        const code = 'guna tambah(a, b) { bali a + b }';
        const sig = checkSignature(code, 0, 12);
        assert.strictEqual(sig, null);
        console.log('PASS: 25. Cursor on function declaration returns null');
    }

    // 26. Built-in function dawa
    {
        const code = 'dawa(';
        const sig = checkSignature(code, 0, 5);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'dawa(koleksi)');
        assert.strictEqual(sig.signatures[0].parameters.length, 1);
        assert.ok(sig.signatures[0].documentation);
        console.log('PASS: 26. Built-in function dawa provides signature & documentation');
    }

    // 27. Built-in function terapkan
    {
        const code = 'terapkan(fn, ';
        const sig = checkSignature(code, 0, 13);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'terapkan(fungsi, array)');
        assert.strictEqual(sig.activeParameter, 1);
        console.log('PASS: 27. Built-in function terapkan tracks parameter 1');
    }

    // 28. Built-in function takon
    {
        const code = 'takon(';
        const sig = checkSignature(code, 0, 6);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'takon(prompt)');
        console.log('PASS: 28. Built-in function takon provides signature');
    }

    // 29. Expression argument with operators
    {
        const code = [
            'guna hitung(a, b) {}',
            'hitung(10 + 20 * 30, '
        ].join('\n');
        const sig = checkSignature(code, 1, 21);
        assert.ok(sig);
        assert.strictEqual(sig.signatures[0].label, 'hitung(a, b)');
        assert.strictEqual(sig.activeParameter, 1);
        console.log('PASS: 29. Binary expression in argument');
    }

    // 30. Invalid position bounds
    {
        const code = 'tulis 10';
        const sig = checkSignature(code, 999, 999);
        assert.strictEqual(sig, null);
        console.log('PASS: 30. Invalid position bounds returns null');
    }

    console.log('\nAll 30 Signature Help Unit Scenarios Passed!\n');
}

if (require.main === module) {
    runTests();
}

module.exports = runTests;
