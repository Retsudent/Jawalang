const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { getCompletions, CompletionItemKind } = require('../src/completion');
const { pathToUri } = require('../src/utils');

function check(code, line, character, filePath = null) {
    const uri = filePath ? pathToUri(filePath) : 'file:///test_comp.jawa';
    const analysis = analyzer.analyze(code, uri);
    return getCompletions(analysis, { line, character });
}

function runTests() {
    console.log('--- Completion Tests ---');

    // 1. Global variable completion
    {
        const code = 'gawe namaGlobal = "Barch"\ngawe umurGlobal = 20\nnam';
        const items = check(code, 2, 3);
        const item = items.find(it => it.label === 'namaGlobal');
        assert.ok(item, 'Should suggest global variable namaGlobal');
        assert.strictEqual(item.kind, CompletionItemKind.Variable);
        console.log('PASS: 1. Global variable completion');
    }

    // 2. Local variable completion
    {
        const code = 'gawe global = 10\nguna test() {\n    gawe lokalVar = 20\n    lok\n}';
        const items = check(code, 3, 7);
        const item = items.find(it => it.label === 'lokalVar');
        assert.ok(item, 'Should suggest local variable lokalVar');
        assert.strictEqual(item.kind, CompletionItemKind.Variable);
        console.log('PASS: 2. Local variable completion');
    }

    // 3. Parameter completion
    {
        const code = 'guna salam(pesan, ulang) {\n    pes\n}';
        const items = check(code, 1, 7);
        const item = items.find(it => it.label === 'pesan');
        assert.ok(item, 'Should suggest function parameter pesan');
        assert.strictEqual(item.kind, CompletionItemKind.Variable);
        assert.ok(item.detail.includes('parameter'));
        console.log('PASS: 3. Parameter completion');
    }

    // 4. Function completion
    {
        const code = 'guna tambah(a, b) {\n    bali a + b\n}\ntam';
        const items = check(code, 3, 3);
        const item = items.find(it => it.label === 'tambah');
        assert.ok(item, 'Should suggest function tambah');
        assert.strictEqual(item.kind, CompletionItemKind.Function);
        assert.ok(item.detail.includes('tambah(a, b)'));
        console.log('PASS: 4. Function completion');
    }

    // 5. Struct completion
    {
        const code = 'bentuk Wong {\n    gawe jeneng = ""\n}\nWo';
        const items = check(code, 3, 2);
        const item = items.find(it => it.label === 'Wong');
        assert.ok(item, 'Should suggest struct Wong');
        assert.strictEqual(item.kind, CompletionItemKind.Class);
        assert.ok(item.detail.includes('bentuk Wong'));
        console.log('PASS: 5. Struct completion');
    }

    // 6. Builtin completion
    {
        const code = 'daw';
        const items = check(code, 0, 3);
        const item = items.find(it => it.label === 'dawa');
        assert.ok(item, 'Should suggest built-in dawa');
        assert.strictEqual(item.kind, CompletionItemKind.Function);
        assert.ok(item.documentation.includes('array'));
        console.log('PASS: 6. Builtin completion');
    }

    // 7. Keyword completion
    {
        const code = 'gaw';
        const items = check(code, 0, 3);
        const item = items.find(it => it.label === 'gawe');
        assert.ok(item, 'Should suggest keyword gawe');
        assert.strictEqual(item.kind, CompletionItemKind.Keyword);
        console.log('PASS: 7. Keyword completion');
    }

    // 8. Shadowing resolution
    {
        const code = 'gawe nama = "Global"\nguna test() {\n    gawe nama = "Local"\n    nam\n}';
        const items = check(code, 3, 7);
        const matches = items.filter(it => it.label === 'nama');
        assert.strictEqual(matches.length, 1, 'Shadowed symbol should only appear once');
        console.log('PASS: 8. Shadowing resolution');
    }

    // 9. Dot instance completion
    {
        const code = 'bentuk Wong {\n    gawe jeneng = "Budi"\n    guna salam() {}\n}\ngawe w = anyar Wong()\nw.';
        const items = check(code, 5, 2);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('jeneng'));
        assert.ok(labels.includes('salam'));
        console.log('PASS: 9. Dot instance completion');
    }

    // 10. Instance field completion
    {
        const code = 'bentuk Titik {\n    gawe x = 0\n    gawe y = 0\n}\ngawe t = anyar Titik()\nt.';
        const items = check(code, 5, 2);
        const xItem = items.find(it => it.label === 'x');
        assert.ok(xItem);
        assert.strictEqual(xItem.kind, CompletionItemKind.Field);
        assert.ok(xItem.detail.includes('Titik.x'));
        console.log('PASS: 10. Instance field completion');
    }

    // 11. Instance method completion
    {
        const code = 'bentuk Mobil {\n    guna mlaku(kacepatan) {}\n}\ngawe m = anyar Mobil()\nm.';
        const items = check(code, 4, 2);
        const mItem = items.find(it => it.label === 'mlaku');
        assert.ok(mItem);
        assert.strictEqual(mItem.kind, CompletionItemKind.Method);
        assert.ok(mItem.detail.includes('mlaku(kacepatan)'));
        console.log('PASS: 11. Instance method completion');
    }

    // 12. Inherited field completion
    {
        const code = 'bentuk Makhluk {\n    gawe jeneng = ""\n}\nbentuk Kucing ngembangake Makhluk {\n    gawe wulu = ""\n}\ngawe k = anyar Kucing()\nk.';
        const items = check(code, 7, 2);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('jeneng'), 'Should inherit jeneng from Makhluk');
        assert.ok(labels.includes('wulu'), 'Should have own field wulu');
        console.log('PASS: 12. Inherited field completion');
    }

    // 13. Inherited method completion
    {
        const code = 'bentuk Makhluk {\n    guna ambegan() {}\n}\nbentuk Kucing ngembangake Makhluk {\n    guna ngeong() {}\n}\ngawe k = anyar Kucing()\nk.';
        const items = check(code, 7, 2);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('ambegan'), 'Should inherit ambegan from Makhluk');
        assert.ok(labels.includes('ngeong'), 'Should have own method ngeong');
        console.log('PASS: 13. Inherited method completion');
    }

    // 14. Override deduplication
    {
        const code = 'bentuk Induk {\n    guna obah() {}\n}\nbentuk Anak ngembangake Induk {\n    guna obah(jarak) {}\n}\ngawe a = anyar Anak()\na.';
        const items = check(code, 7, 2);
        const obahItems = items.filter(it => it.label === 'obah');
        assert.strictEqual(obahItems.length, 1, 'Overridden method should appear only once');
        assert.ok(obahItems[0].detail.includes('jarak'), 'Child implementation details should override parent');
        console.log('PASS: 14. Override deduplication');
    }

    // 15. Namespace member completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor "./math" minangka math\nmath.';
        const items = check(code, 1, 5, callerPath);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('tambah'));
        assert.ok(labels.includes('kurang'));
        assert.ok(labels.includes('PI'));
        assert.ok(!labels.includes('rahasia'), 'Private module function must not be suggested');
        console.log('PASS: 15. Namespace member completion');
    }

    // 16. Namespace variable completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor "./math" minangka math\nmath.';
        const items = check(code, 1, 5, callerPath);
        const piItem = items.find(it => it.label === 'PI');
        assert.ok(piItem);
        assert.strictEqual(piItem.kind, CompletionItemKind.Variable);
        console.log('PASS: 16. Namespace variable completion');
    }

    // 17. Namespace function completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor "./math" minangka math\nmath.';
        const items = check(code, 1, 5, callerPath);
        const fnItem = items.find(it => it.label === 'tambah');
        assert.ok(fnItem);
        assert.strictEqual(fnItem.kind, CompletionItemKind.Function);
        assert.ok(fnItem.detail.includes('tambah(a, b)'));
        console.log('PASS: 17. Namespace function completion');
    }

    // 18. Namespace struct completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor "./models" minangka models\nmodels.';
        const items = check(code, 1, 7, callerPath);
        const sItem = items.find(it => it.label === 'Siswa');
        assert.ok(sItem);
        assert.strictEqual(sItem.kind, CompletionItemKind.Class);
        console.log('PASS: 18. Namespace struct completion');
    }

    // 19. Selective import completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor { tambah } saka "./math"\ntam';
        const items = check(code, 1, 3, callerPath);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('tambah'));
        assert.ok(!labels.includes('kurang'), 'Unimported module export must not appear locally');
        console.log('PASS: 19. Selective import completion');
    }

    // 20. Selective import alias completion
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor { tambah minangka jumlah } saka "./math"\nju';
        const items = check(code, 1, 2, callerPath);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('jumlah'), 'Aliased import name should be available');
        assert.ok(!labels.includes('tambah'), 'Original unaliased name must not be available');
        console.log('PASS: 20. Selective import alias completion');
    }

    // 21. Imported shadowing
    {
        const callerPath = path.resolve(__dirname, 'fixtures', 'modules', 'caller.jawa');
        const code = 'impor { tambah } saka "./math"\nguna test() {\n    gawe tambah = 10\n    tam\n}';
        const items = check(code, 3, 7, callerPath);
        const tItem = items.find(it => it.label === 'tambah');
        assert.ok(tItem);
        assert.strictEqual(tItem.kind, CompletionItemKind.Variable);
        console.log('PASS: 21. Imported shadowing');
    }

    // 22. "iki." context completion
    {
        const code = 'bentuk Wong {\n    gawe jeneng = ""\n    guna salam() {\n        iki.\n    }\n}';
        const items = check(code, 3, 12);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('jeneng'));
        assert.ok(labels.includes('salam'));
        assert.ok(!labels.includes('gawe'), 'Global keyword must not appear in iki.');
        assert.ok(!labels.includes('dawa'), 'Global builtin must not appear in iki.');
        console.log('PASS: 22. "iki." context completion');
    }

    // 23. "super." context completion
    {
        const code = 'bentuk Induk {\n    gawe asal = "Bumi"\n    guna salam() {}\n}\nbentuk Anak ngembangake Induk {\n    guna test() {\n        super.\n    }\n}';
        const items = check(code, 6, 14);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('asal'), 'Should suggest parent field in super.');
        assert.ok(labels.includes('salam'), 'Should suggest parent method in super.');
        console.log('PASS: 23. "super." context completion');
    }

    // 24. "super." override resolves parent implementation
    {
        const code = 'bentuk Induk {\n    guna salam() {}\n}\nbentuk Anak ngembangake Induk {\n    guna salam(pesan) {}\n    guna test() {\n        super.\n    }\n}';
        const items = check(code, 6, 14);
        const item = items.find(it => it.label === 'salam');
        assert.ok(item);
        assert.strictEqual(item.detail, 'guna salam()', 'super. must provide parent implementation, not child override');
        console.log('PASS: 24. "super." override resolves parent implementation');
    }

    // 25. "anyar" context completion
    {
        const code = 'bentuk Mobil {}\nbentuk Motor {}\ngawe m = anyar Mo';
        const items = check(code, 2, 17);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('Mobil'));
        assert.ok(labels.includes('Motor'));
        assert.ok(!labels.includes('mandheg'), 'Keywords must not appear in anyar context');
        assert.ok(!labels.includes('motong'), 'Builtins must not appear in anyar context');
        console.log('PASS: 25. "anyar" context completion');
    }

    // 26. Malformed source resilience
    {
        const code = 'guna test(\n';
        const items = check(code, 1, 0);
        assert.ok(Array.isArray(items), 'Malformed source must return array without crashing');
        console.log('PASS: 26. Malformed source resilience');
    }

    // 27. Empty document handling
    {
        const code = '';
        const items = check(code, 0, 0);
        assert.ok(Array.isArray(items));
        assert.ok(items.some(it => it.label === 'gawe'));
        console.log('PASS: 27. Empty document handling');
    }

    // 28. String context safety
    {
        const code = 'tulis "nam';
        const items = check(code, 0, 10);
        assert.strictEqual(items.length, 0, 'Must return 0 completions inside open string literal');
        console.log('PASS: 28. String context safety');
    }

    // 29. Comment context safety
    {
        const code = '// nam';
        const items = check(code, 0, 6);
        assert.strictEqual(items.length, 0, 'Must return 0 completions inside comment');
        console.log('PASS: 29. Comment context safety');
    }

    // 30. Array indexing context
    {
        const code = 'gawe data = [1, 2, 3]\ndata[';
        const items = check(code, 1, 5);
        assert.ok(items.some(it => it.label === 'data'), 'Inside bracket indexing should offer normal scope expressions');
        console.log('PASS: 30. Array indexing context');
    }

    // 31. Object context safe handling
    {
        const code = 'gawe obj = { a: 1 }\nobj.';
        const items = check(code, 1, 4);
        assert.ok(Array.isArray(items), 'Object dot access should safely return array without error');
        console.log('PASS: 31. Object context safe handling');
    }

    // 32. Unknown member returns empty
    {
        const code = 'bentuk Wong {}\ngawe w = anyar Wong()\nw.ora_ana';
        const items = check(code, 2, 9);
        assert.strictEqual(items.length, 0, 'Unknown member prefix should return empty list');
        console.log('PASS: 32. Unknown member returns empty');
    }

    // 33. Unknown identifier returns empty
    {
        const code = 'xyzTidakAda';
        const items = check(code, 0, 11);
        assert.strictEqual(items.length, 0, 'Unknown prefix should filter to empty list');
        console.log('PASS: 33. Unknown identifier returns empty');
    }

    // 34. Prefix filtering
    {
        const code = 'bentuk Wong {\n    gawe jeneng = ""\n    gawe umur = 0\n}\ngawe w = anyar Wong()\nw.je';
        const items = check(code, 5, 4);
        const labels = items.map(it => it.label);
        assert.ok(labels.includes('jeneng'));
        assert.ok(!labels.includes('umur'), 'w.je must not suggest umur');
        console.log('PASS: 34. Prefix filtering');
    }

    // 35. Duplicate elimination
    {
        const code = 'gawe x = 1\n';
        const items = check(code, 1, 0);
        const labels = items.map(it => it.label);
        const unique = new Set(labels);
        assert.strictEqual(labels.length, unique.size, 'No duplicate completion labels permitted');
        console.log('PASS: 35. Duplicate elimination');
    }

    // 36. Completion range for word replacement
    {
        const code = 'gawe namaUser = "Budi"\nnam';
        const items = check(code, 1, 3);
        const item = items.find(it => it.label === 'namaUser');
        assert.ok(item && item.textEdit);
        assert.deepStrictEqual(item.textEdit.range, {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 3 }
        });
        console.log('PASS: 36. Completion range for word replacement');
    }

    // 37. Dot completion range replaces only member prefix
    {
        const code = 'bentuk Wong { guna salam() {} }\ngawe w = anyar Wong()\nw.sa';
        const items = check(code, 2, 4);
        const item = items.find(it => it.label === 'salam');
        assert.ok(item && item.textEdit);
        assert.deepStrictEqual(item.textEdit.range, {
            start: { line: 2, character: 2 },
            end: { line: 2, character: 4 }
        });
        console.log('PASS: 37. Dot completion range replaces only member prefix');
    }

    // 38. Function detail includes parameter signature
    {
        const code = 'guna petung(x, y) {}\npet';
        const items = check(code, 1, 3);
        const item = items.find(it => it.label === 'petung');
        assert.ok(item);
        assert.strictEqual(item.detail, 'guna petung(x, y)');
        console.log('PASS: 38. Function detail includes parameter signature');
    }

    // 39. Method detail includes parameter signature
    {
        const code = 'bentuk Kendaraan { guna mlaku(bensin, supir) {} }\ngawe k = anyar Kendaraan()\nk.';
        const items = check(code, 2, 2);
        const item = items.find(it => it.label === 'mlaku');
        assert.ok(item);
        assert.strictEqual(item.detail, 'guna mlaku(bensin, supir)');
        console.log('PASS: 39. Method detail includes parameter signature');
    }

    // 40. Constructor completion and kind
    {
        const code = 'bentuk Siswa { wiwiti(nama, kelas) {} }\ngawe s = anyar Siswa()\ns.';
        const items = check(code, 2, 2);
        const item = items.find(it => it.label === 'wiwiti');
        assert.ok(item);
        assert.strictEqual(item.kind, CompletionItemKind.Constructor);
        assert.strictEqual(item.detail, 'wiwiti(nama, kelas)');
        console.log('PASS: 40. Constructor completion and kind');
    }

    console.log('\nAll 40 Completion Unit Scenarios Passed!\n');
}

module.exports = runTests;

if (require.main === module) {
    runTests();
}
