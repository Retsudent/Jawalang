const assert = require('assert');
const path = require('path');

const analyzer = require('../src/analyzer');
const { renameSymbol, isValidIdentifier, checkCollision } = require('../src/rename');
const { pathToUri } = require('../src/utils');

function testRename() {
    console.log('--- Rename Symbol Tests ---');

    const testUri = pathToUri(path.resolve(__dirname, 'fixtures/rename_test.jawa'));

    // 1. Global Variable Rename
    {
        const code = `gawe nama = "Budi"
tulis nama
gawe salinan = nama`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 5 }, 'jeneng');
        assert.ok(edit && edit.changes, 'WorkspaceEdit should be returned');
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 3, 'Should have 3 edits (1 decl + 2 usages)');
        assert.strictEqual(changes[0].range.start.line, 2);
        assert.strictEqual(changes[1].range.start.line, 1);
        assert.strictEqual(changes[2].range.start.line, 0);
        changes.forEach(c => assert.strictEqual(c.newText, 'jeneng'));
        console.log('PASS: 1. Global variable rename');
    }

    // 2. Local Variable Rename (only inside function)
    {
        const code = `guna etung() {
    gawe nilai = 10
    tulis nilai
}
gawe nilai = 99
tulis nilai`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'angka');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Should only rename local variable');
        assert.strictEqual(changes[0].range.start.line, 2);
        assert.strictEqual(changes[1].range.start.line, 1);
        console.log('PASS: 2. Local variable rename');
    }

    // 3. Variable Shadowing (Local rename does not touch global)
    {
        const code = `gawe x = 100
guna test() {
    gawe x = 20
    tulis x
}
tulis x`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 2, character: 9 }, 'lokal');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Local rename should only affect local scope');
        assert.strictEqual(changes[0].range.start.line, 3);
        assert.strictEqual(changes[1].range.start.line, 2);
        console.log('PASS: 3. Local shadowing isolation');
    }

    // 4. Global Shadowing (Global rename does not touch local shadow)
    {
        const code = `gawe x = 100
guna test() {
    gawe x = 20
    tulis x
}
tulis x`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 5 }, 'global');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Global rename should not affect inner shadowed x');
        assert.strictEqual(changes[0].range.start.line, 5);
        assert.strictEqual(changes[1].range.start.line, 0);
        console.log('PASS: 4. Global shadowing isolation');
    }

    // 5. Function Parameter Rename
    {
        const code = `guna tambah(angkaA, angkaB) {
    bali angkaA + angkaB
}`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 14 }, 'param1');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Should rename parameter declaration and usage');
        assert.strictEqual(changes[0].range.start.line, 1);
        assert.strictEqual(changes[1].range.start.line, 0);
        console.log('PASS: 5. Function parameter rename');
    }

    // 6. Parameter Shadowing
    {
        const code = `gawe x = 100
guna test(x) {
    tulis x
}
tulis x`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'paramX');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Parameter rename should not touch global x');
        assert.strictEqual(changes[0].range.start.line, 2);
        assert.strictEqual(changes[1].range.start.line, 1);
        console.log('PASS: 6. Parameter shadowing isolation');
    }

    // 7. Function Rename
    {
        const code = `guna tambah(a, b) {
    bali a + b
}
tulis tambah(10, 20)`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 7 }, 'jumlah');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Function rename should update declaration and call site');
        assert.strictEqual(changes[0].range.start.line, 3);
        assert.strictEqual(changes[1].range.start.line, 0);
        console.log('PASS: 7. Function rename');
    }

    // 8. Multiple Function Calls
    {
        const code = `guna salam() { tulis 1 }
salam()
salam()
salam()`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 2 }, 'nyapa');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 4, 'Should update 1 decl + 3 calls');
        console.log('PASS: 8. Multiple function call sites rename');
    }

    // 9. Struct Rename
    {
        const code = `bentuk Wong {
    gawe jeneng = "Budi"
}
gawe w = anyar Wong()`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 8 }, 'Manungsa');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Struct rename should update struct decl and anyar instantiator');
        assert.strictEqual(changes[0].range.start.line, 3);
        assert.strictEqual(changes[1].range.start.line, 0);
        console.log('PASS: 9. Struct declaration and instantiation rename');
    }

    // 10. Struct Field Rename
    {
        const code = `bentuk Wong {
    gawe jeneng = "Budi"
    guna salam() {
        tulis iki.jeneng
    }
}
gawe w = anyar Wong()
tulis w.jeneng`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'nama');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 3, 'Field rename should update decl, iki.jeneng, and w.jeneng');
        console.log('PASS: 10. Struct field rename');
    }

    // 11. Struct Method Rename
    {
        const code = `bentuk Wong {
    guna salam() {
        tulis "Halo"
    }
}
gawe w = anyar Wong()
w.salam()`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'nyapa');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Method rename should update decl and call site');
        assert.strictEqual(changes[0].range.start.line, 6);
        assert.strictEqual(changes[1].range.start.line, 1);
        console.log('PASS: 11. Struct method rename');
    }

    // 12. Constructor Protection
    {
        const code = `bentuk Wong {
    wiwiti(jeneng) {
        iki.jeneng = jeneng
    }
}`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 6 }, 'inisialisasi');
        assert.strictEqual(edit, null, 'Constructor "wiwiti" rename must be rejected safely');
        console.log('PASS: 12. Constructor "wiwiti" protection');
    }

    // 13. Inherited Method Rename
    {
        const code = `bentuk Induk {
    guna mlaku() { tulis 1 }
}
bentuk Anak ngembangake Induk {}
gawe a = anyar Anak()
a.mlaku()`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'jalan');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Inherited method rename should update parent decl and child call');
        console.log('PASS: 13. Inherited method rename');
    }

    // 14. Overridden Method Separation
    {
        const code = `bentuk Induk {
    guna salam() {
        tulis "Induk"
    }
}
bentuk Anak ngembangake Induk {
    guna salam() {
        tulis "Anak"
    }
}`;
        const analysis = analyzer.analyze(code, testUri);

        // Rename Anak.salam (line 6)
        const editAnak = renameSymbol(analysis, { line: 6, character: 10 }, 'nyapa');
        assert.ok(editAnak && editAnak.changes);
        assert.strictEqual(editAnak.changes[testUri].length, 1);
        assert.strictEqual(editAnak.changes[testUri][0].range.start.line, 6);

        // Rename Induk.salam (line 1)
        const editInduk = renameSymbol(analysis, { line: 1, character: 10 }, 'sapaan');
        assert.ok(editInduk && editInduk.changes);
        assert.strictEqual(editInduk.changes[testUri].length, 1);
        assert.strictEqual(editInduk.changes[testUri][0].range.start.line, 1);

        console.log('PASS: 14. Overridden method isolation');
    }

    // 15. Super Method References
    {
        const code = `bentuk Induk {
    guna salam() {
        tulis "Induk"
    }
}
bentuk Anak ngembangake Induk {
    guna salam() {
        super.salam()
    }
}`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 10 }, 'nyapa');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Should update Induk.salam and super.salam()');
        assert.strictEqual(changes[0].range.start.line, 7); // super.salam()
        assert.strictEqual(changes[1].range.start.line, 1); // Induk.salam
        console.log('PASS: 15. Super method references rename');
    }

    // 16. Module Namespace Rename
    {
        const moduleCallerUri = pathToUri(path.resolve(__dirname, 'fixtures/modules/test_caller_ns.jawa'));
        const code = `impor "./math" minangka math
tulis math.tambah(1, 2)`;
        const analysis = analyzer.analyze(code, moduleCallerUri);
        const edit = renameSymbol(analysis, { line: 0, character: 26 }, 'matematika');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[moduleCallerUri];
        assert.strictEqual(changes.length, 2, 'Should update namespace decl and usage');
        assert.strictEqual(changes[0].range.start.line, 1);
        assert.strictEqual(changes[1].range.start.line, 0);
        console.log('PASS: 16. Module namespace rename');
    }

    // 17. Selective Import Rename
    {
        const moduleCallerUri = pathToUri(path.resolve(__dirname, 'fixtures/modules/test_caller_sel.jawa'));
        const code = `impor { tambah } saka "./math"
tulis tambah(1, 2)`;
        const analysis = analyzer.analyze(code, moduleCallerUri);
        const edit = renameSymbol(analysis, { line: 1, character: 8 }, 'jumlah');
        assert.ok(edit && edit.changes);
        const allEdits = Object.values(edit.changes).flat();
        assert.ok(allEdits.length >= 2, 'Should rename imported symbol and call site');
        console.log('PASS: 17. Selective import symbol rename');
    }

    // 18. String Literal Protection
    {
        const code = `gawe nama = "nama"
tulis nama`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 0, character: 5 }, 'jeneng');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2);
        assert.strictEqual(changes[1].range.start.line, 0);
        assert.strictEqual(changes[1].range.start.character, 5); // identifier token only, not string literal
        console.log('PASS: 18. String literal content protected');
    }

    // 19. Comment Protection
    {
        const code = `// nama ing komentar
gawe nama = "Budi"
// komentar liyane nama
tulis nama`;
        const analysis = analyzer.analyze(code, testUri);
        const edit = renameSymbol(analysis, { line: 1, character: 6 }, 'jeneng');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 2, 'Only declarations and usages renamed, not comments');
        assert.strictEqual(changes[0].range.start.line, 3);
        assert.strictEqual(changes[1].range.start.line, 1);
        console.log('PASS: 19. Comment content protected');
    }

    // 20. Array / Object Key Safety
    {
        const code = `gawe data = { "nama": "Budi" }
tulis data["nama"]`;
        const analysis = analyzer.analyze(code, testUri);
        // Rename variable data
        const editData = renameSymbol(analysis, { line: 0, character: 6 }, 'pangguna');
        assert.ok(editData && editData.changes);
        assert.strictEqual(editData.changes[testUri].length, 2);
        assert.strictEqual(editData.changes[testUri][0].range.start.character, 6); // data in data["nama"]

        // Attempting to rename string key at line 0 char 16 returns null
        const editKey = renameSymbol(analysis, { line: 0, character: 16 }, 'jeneng');
        assert.strictEqual(editKey, null, 'String object key should not be treated as a symbol');
        console.log('PASS: 20. Array and object keys safety');
    }

    // 21. Dot Property Separation (Global variable doesn't contaminate dot property)
    {
        const code = `gawe nama = "global"
bentuk Wong {
    gawe nama = "field"
}
gawe w = anyar Wong()
tulis w.nama`;
        const analysis = analyzer.analyze(code, testUri);
        // Rename global nama
        const edit = renameSymbol(analysis, { line: 0, character: 6 }, 'globalNama');
        assert.ok(edit && edit.changes);
        const changes = edit.changes[testUri];
        assert.strictEqual(changes.length, 1, 'Global variable rename should not touch w.nama');
        assert.strictEqual(changes[0].range.start.line, 0);
        console.log('PASS: 21. Dot property separation from global variables');
    }

    // 22. Keyword Rejection
    {
        const code = `gawe x = 10
yen x > 5 { mandheg }
guna cobaFn() { bali 0 }`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 1 }, 'nyoba'), null, 'Keyword "gawe" rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 1, character: 1 }, 'nyoba'), null, 'Keyword "yen" rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 1, character: 14 }, 'nyoba'), null, 'Keyword "mandheg" rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 2, character: 1 }, 'nyoba'), null, 'Keyword "guna" rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 2, character: 17 }, 'nyoba'), null, 'Keyword "bali" rejected');
        console.log('PASS: 22. Keyword rejection');
    }

    // 23. Built-in Rejection
    {
        const code = `tulis "Halo"
gawe d = dawa([1, 2, 3])`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 2 }, 'cetak'), null, 'Builtin "tulis" rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 1, character: 11 }, 'panjang'), null, 'Builtin "dawa" rejected');
        console.log('PASS: 23. Built-in function rejection');
    }

    // 24. Invalid New Name Rejection
    {
        const code = `gawe x = 10`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, '123angka'), null, 'Leading digits rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'nama-saya'), null, 'Hyphens rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'nama saya'), null, 'Spaces rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'foo.bar'), null, 'Dots rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'gawe'), null, 'Keyword rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'tulis'), null, 'Built-in rejected');
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'wiwiti'), null, 'Constructor name rejected');
        console.log('PASS: 24. Invalid newName rejection');
    }

    // 25. Empty New Name Rejection
    {
        const code = `gawe x = 10`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, ''), null);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, '   '), null);
        console.log('PASS: 25. Empty newName rejection');
    }

    // 26. Same Name Return Null
    {
        const code = `gawe x = 10\ntulis x`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 0, character: 5 }, 'x'), null);
        console.log('PASS: 26. Same name returns null cleanly');
    }

    // 27. Collision Rejection
    {
        // Variable collision
        const codeVar = `gawe x = 10\ngawe y = 20`;
        const analysisVar = analyzer.analyze(codeVar, testUri);
        assert.strictEqual(renameSymbol(analysisVar, { line: 0, character: 5 }, 'y'), null, 'Variable collision rejected');

        // Function collision
        const codeFn = `guna siji() {}\nguna loro() {}`;
        const analysisFn = analyzer.analyze(codeFn, testUri);
        assert.strictEqual(renameSymbol(analysisFn, { line: 0, character: 6 }, 'loro'), null, 'Function collision rejected');

        // Struct collision
        const codeStruct = `bentuk Alpha {}\nbentuk Beta {}`;
        const analysisStruct = analyzer.analyze(codeStruct, testUri);
        assert.strictEqual(renameSymbol(analysisStruct, { line: 0, character: 8 }, 'Beta'), null, 'Struct collision rejected');

        // Struct member collision
        const codeMember = `bentuk Mobil {\n    gawe bensin = 10\n    gawe kecepatan = 0\n}`;
        const analysisMember = analyzer.analyze(codeMember, testUri);
        assert.strictEqual(renameSymbol(analysisMember, { line: 1, character: 10 }, 'kecepatan'), null, 'Struct member collision rejected');

        // Parameter collision
        const codeParam = `guna tambah(a, b) { bali a + b }`;
        const analysisParam = analyzer.analyze(codeParam, testUri);
        assert.strictEqual(renameSymbol(analysisParam, { line: 0, character: 12 }, 'b'), null, 'Parameter collision rejected');

        console.log('PASS: 27. Semantic collision detection across variables, functions, structs, and members');
    }

    // 28. Whitespace Cursor / Undefined Symbol Safe Return Null
    {
        const code = `gawe x = 10\n\ntulis x`;
        const analysis = analyzer.analyze(code, testUri);
        assert.strictEqual(renameSymbol(analysis, { line: 1, character: 0 }, 'y'), null, 'Whitespace returns null');
        assert.strictEqual(renameSymbol(analysis, { line: 10, character: 10 }, 'y'), null, 'Out of bounds returns null');
        console.log('PASS: 28. Whitespace and out-of-bounds positions return null safely');
    }

    // 29. Malformed Source Safe Isolation
    {
        const code = `gawe x = \nguna`;
        const analysis = analyzer.analyze(code, testUri);
        assert.doesNotThrow(() => {
            const edit = renameSymbol(analysis, { line: 0, character: 5 }, 'y');
            assert.ok(edit === null || typeof edit === 'object');
        }, 'Malformed document must not crash renameSymbol');
        console.log('PASS: 29. Malformed source error isolation');
    }

    // 30. Identifier Validator Unit Tests
    {
        assert.strictEqual(isValidIdentifier('jeneng'), true);
        assert.strictEqual(isValidIdentifier('_nama'), true);
        assert.strictEqual(isValidIdentifier('nilai_total'), true);
        assert.strictEqual(isValidIdentifier('jeneng2'), true);

        assert.strictEqual(isValidIdentifier('123angka'), false);
        assert.strictEqual(isValidIdentifier('hello-world'), false);
        assert.strictEqual(isValidIdentifier('nama saya'), false);
        assert.strictEqual(isValidIdentifier('foo.bar'), false);
        assert.strictEqual(isValidIdentifier('gawe'), false);
        assert.strictEqual(isValidIdentifier('wiwiti'), false);
        assert.strictEqual(isValidIdentifier('dawa'), false);
        assert.strictEqual(isValidIdentifier(''), false);
        assert.strictEqual(isValidIdentifier(null), false);
        console.log('PASS: 30. Identifier validator unit tests');
    }

    console.log('\nAll 30 Rename Symbol Unit Scenarios Passed!\n');
}

module.exports = testRename;

if (require.main === module) {
    testRename();
}
