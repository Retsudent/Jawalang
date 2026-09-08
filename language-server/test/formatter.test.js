const assert = require('assert');
const { formatDocument } = require('../src/formatter');

function runTests() {
    console.log('--- Formatter Unit Tests ---');

    function formatText(code, options = {}) {
        const edits = formatDocument(code, options);
        if (!edits || edits.length === 0) return code;
        // In full-document replacement, newText replaces range
        return edits[0].newText;
    }

    // 1. Empty document
    {
        const edits = formatDocument('');
        assert.deepStrictEqual(edits, [], 'Empty document should return empty edits');
        console.log('PASS: 1. Empty document returns []');
    }

    // 2. Single statement
    {
        const input = 'gawe x=10';
        const expected = 'gawe x = 10';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 2. Single statement formatting');
    }

    // 3. Function declaration
    {
        const input = 'guna tambah(a,b){\nbali a+b\n}';
        const expected = 'guna tambah(a, b) {\n    bali a + b\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 3. Function declaration formatting');
    }

    // 4. Function parameters
    {
        const input = 'guna test(a,b,c){\n}';
        const expected = 'guna test(a, b, c) {\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 4. Function parameters spacing');
    }

    // 5. If block
    {
        const input = 'yen x>10{\ntulis x\n}';
        const expected = 'yen x > 10 {\n    tulis x\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 5. If block formatting');
    }

    // 6. Else block cuddling
    {
        const input = 'yen x>10{\ntulis x\n}liyane{\ntulis 0\n}';
        const expected = 'yen x > 10 {\n    tulis x\n} liyane {\n    tulis 0\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 6. Else block cuddling');
    }

    // 7. Else-If block cuddling
    {
        const input = 'yen a>10{\ntulis "besar"\n}liyane yen a>5{\ntulis "sedang"\n}liyane{\ntulis "kecil"\n}';
        const expected = 'yen a > 10 {\n    tulis "besar"\n} liyane yen a > 5 {\n    tulis "sedang"\n} liyane {\n    tulis "kecil"\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 7. Else-If block cuddling');
    }

    // 8. While loop
    {
        const input = 'nalika i<=10{\ntulis i\ni=i+1\n}';
        const expected = 'nalika i <= 10 {\n    tulis i\n    i = i + 1\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 8. While loop formatting');
    }

    // 9. For loop (kanggo)
    {
        const input = 'kanggo i=0 nganti 10 langkah 1{\ntulis i\n}';
        const expected = 'kanggo i = 0 nganti 10 langkah 1 {\n    tulis i\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 9. For loop formatting');
    }

    // 10. Foreach loop (kanggo saben)
    {
        const input = 'kanggo saben item ing data{\ntulis item\n}';
        const expected = 'kanggo saben item ing data {\n    tulis item\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 10. Foreach loop formatting');
    }

    // 11. Nested block indentation
    {
        const input = 'guna test(){\nyen bener{\nnalika bener{\ntulis "test"\n}\n}\n}';
        const expected = 'guna test() {\n    yen bener {\n        nalika bener {\n            tulis "test"\n        }\n    }\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 11. Nested block indentation');
    }

    // 12. Struct definition
    {
        const input = 'bentuk Wong{\ngawe jeneng\ngawe umur\n\nguna salam(){\ntulis iki.jeneng\n}\n}';
        const expected = 'bentuk Wong {\n    gawe jeneng\n    gawe umur\n\n    guna salam() {\n        tulis iki.jeneng\n    }\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 12. Struct declaration formatting');
    }

    // 13. Constructor (wiwiti)
    {
        const input = 'wiwiti(nama,umur){\niki.nama=nama\niki.umur=umur\n}';
        const expected = 'wiwiti(nama, umur) {\n    iki.nama = nama\n    iki.umur = umur\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 13. Constructor wiwiti formatting');
    }

    // 14. Inheritance (ngembangake)
    {
        const input = 'bentuk Anak ngembangake Induk{\nwiwiti(nama,umur){\nsuper(nama)\niki.umur=umur\n}\n}';
        const expected = 'bentuk Anak ngembangake Induk {\n    wiwiti(nama, umur) {\n        super(nama)\n        iki.umur = umur\n    }\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 14. Inheritance ngembangake formatting');
    }

    // 15. Super calls and method invocations
    {
        const input = 'super(nama)\nsuper.salam()\nsuper["salam"]()';
        const expected = 'super(nama)\nsuper.salam()\nsuper["salam"]()';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 15. Super invocation formatting');
    }

    // 16. Iki member access
    {
        const input = 'iki.nama=nama\ngawe x=iki.salam()\ntulis iki["umur"]';
        const expected = 'iki.nama = nama\ngawe x = iki.salam()\ntulis iki["umur"]';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 16. Iki property and method access');
    }

    // 17. Array literal inline
    {
        const input = 'gawe angka=[1,2,3]';
        const expected = 'gawe angka = [1, 2, 3]';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 17. Array inline formatting');
    }

    // 18. Nested array literal
    {
        const input = 'gawe data=[[1,2],[3,4]]';
        const expected = 'gawe data = [[1, 2], [3, 4]]';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 18. Nested array formatting');
    }

    // 19. Object literal multiline on assignment
    {
        const input = 'gawe siswa={"nama":"Barch","umur":20}';
        const expected = 'gawe siswa = {\n    "nama": "Barch",\n    "umur": 20\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 19. Object literal multiline on assignment');
    }

    // 20. Nested object literal
    {
        const input = 'gawe config={\n"user":{\n"id":1,\n"nama":"Barch"\n},\n"active":bener\n}';
        const expected = 'gawe config = {\n    "user": {\n        "id": 1,\n        "nama": "Barch"\n    },\n    "active": bener\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 20. Nested object literal formatting');
    }

    // 21. Function call spacing
    {
        const input = 'tambah(1,2)';
        const expected = 'tambah(1, 2)';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 21. Function call parameter spacing');
    }

    // 22. Nested function call spacing
    {
        const input = 'tulis kali(tambah(2,3),4)';
        const expected = 'tulis kali(tambah(2, 3), 4)';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 22. Nested function call spacing');
    }

    // 23. Operator spacing (binary arithmetic, relational, logical)
    {
        const input = 'gawe res=a+b*c/d-e%f\ngawe ok=a>=b lan c<=d utawa e!=f';
        const expected = 'gawe res = a + b * c / d - e % f\ngawe ok = a >= b lan c <= d utawa e != f';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 23. Operator spacing for binary expressions');
    }

    // 24. Unary operators (-, +, ora)
    {
        const input = 'gawe x=-10\ngawe y=+20\ngawe z=ora bener\ngawe w=-(a+b)';
        const expected = 'gawe x = -10\ngawe y = +20\ngawe z = ora bener\ngawe w = -(a + b)';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 24. Unary operators attached to operand');
    }

    // 25. Comma spacing normalization
    {
        const input = 'guna foo(a,b,c){\nbali [a,b,c]\n}';
        const expected = 'guna foo(a, b, c) {\n    bali [a, b, c]\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 25. Comma spacing in params and arrays');
    }

    // 26. Import statement
    {
        const input = 'impor "./math.jawa"';
        const expected = 'impor "./math.jawa"';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 26. Basic import statement');
    }

    // 27. Selective import multiline
    {
        const input = 'impor {\ntambah,\nkurang\n} saka "./math.jawa"';
        const expected = 'impor {\n    tambah,\n    kurang\n} saka "./math.jawa"';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 27. Selective import multiline');
    }

    // 28. Namespace import minangka
    {
        const input = 'impor "./math.jawa" minangka math\ngawe x=math.tambah(1,2)';
        const expected = 'impor "./math.jawa" minangka math\ngawe x = math.tambah(1, 2)';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 28. Namespace import minangka and usage');
    }

    // 29. Try/catch cuddling
    {
        const input = 'coba{\ntulis "start"\n}tangkep err{\ntulis err\n}';
        const expected = 'coba {\n    tulis "start"\n} tangkep err {\n    tulis err\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 29. Try-catch block cuddling');
    }

    // 30. Throw statement (lempar)
    {
        const input = 'lempar "kesalahan fatal"';
        const expected = 'lempar "kesalahan fatal"';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 30. Lempar statement');
    }

    // 31. Comments preservation
    {
        const input = '// Top comment\ngawe x=10 // inline comment\n// Standalone comment';
        const expected = '// Top comment\ngawe x = 10 // inline comment\n// Standalone comment';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 31. Standalone and trailing comments preserved');
    }

    // 32. String preservation verbatim
    {
        const input = 'tulis "a+b=c"\ntulis "Halo, \\"Barch\\"!"';
        const expected = 'tulis "a+b=c"\ntulis "Halo, \\"Barch\\"!"';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 32. String contents and escape sequences verbatim');
    }

    // 33. Dot notation without spaces
    {
        const input = 'user.alamat.kota=10';
        const expected = 'user.alamat.kota = 10';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 33. Dot notation member chaining');
    }

    // 34. Bracket indexing without spaces
    {
        const input = 'gawe x=data[0][1]\nobj["aksi"]()';
        const expected = 'gawe x = data[0][1]\nobj["aksi"]()';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 34. Bracket indexing and chained invocation');
    }

    // 35. New expression (anyar)
    {
        const input = 'gawe w=anyar Wong("Barch")\ngawe v=anyar ns.Mobil()';
        const expected = 'gawe w = anyar Wong("Barch")\ngawe v = anyar ns.Mobil()';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 35. New expression anyar instantiation');
    }

    // 36. Malformed source unclosed string safe return []
    {
        const input = 'gawe x = "unclosed string without end';
        const edits = formatDocument(input);
        assert.deepStrictEqual(edits, [], 'Malformed unclosed string must return []');
        console.log('PASS: 36. Malformed unclosed string returns [] safely');
    }

    // 37. Incomplete block with unclosed brace
    {
        const input = 'guna foo() {\n    tulis 10\n';
        const edits = formatDocument(input);
        assert.ok(Array.isArray(edits), 'Incomplete block should safely return array without crash');
        console.log('PASS: 37. Incomplete block does not crash');
    }

    // 38. CRLF line endings preserved
    {
        const input = 'guna foo(){\r\nbali 10\r\n}';
        const edits = formatDocument(input);
        assert.ok(edits.length > 0);
        assert.ok(edits[0].newText.includes('\r\n'), 'CRLF must be preserved in output');
        assert.ok(!edits[0].newText.replace(/\r\n/g, '').includes('\r'));
        console.log('PASS: 38. CRLF line endings preserved');
    }

    // 39. Idempotency guarantee
    {
        const input = 'guna tambah(a,b){\nyen a>10{\nbali a+b\n}liyane{\nbali 0\n}\n}';
        const pass1 = formatText(input);
        const pass2 = formatText(pass1);
        assert.strictEqual(pass1, pass2, 'format(format(x)) must equal format(x)');
        console.log('PASS: 39. Formatter idempotency');
    }

    // 40. No-op already formatted source returns []
    {
        const input = 'guna tambah(a, b) {\n    bali a + b\n}';
        const edits = formatDocument(input);
        assert.deepStrictEqual(edits, [], 'Already formatted source must return empty edits');
        console.log('PASS: 40. Already formatted source returns []');
    }

    // 41. Custom tabSize option (e.g. 2 spaces)
    {
        const input = 'guna test(){\ntulis 1\n}';
        const expected = 'guna test() {\n  tulis 1\n}';
        assert.strictEqual(formatText(input, { tabSize: 2 }), expected);
        console.log('PASS: 41. Custom tabSize formatting');
    }

    // 42. Export function formatting
    {
        const input = 'ekspor guna tambah(a,b){\nbali a+b\n}';
        const expected = 'ekspor guna tambah(a, b) {\n    bali a + b\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 42. Export function declaration');
    }

    // 43. Bare return statement (bali) without expression
    {
        const input = 'guna mandheg(){\nbali\n}';
        const expected = 'guna mandheg() {\n    bali\n}';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 43. Bare return bali without expression');
    }

    // 44. Inline object in expression
    {
        const input = 'tulis {"nama":"Barch"}';
        const expected = 'tulis { "nama": "Barch" }';
        assert.strictEqual(formatText(input), expected);
        console.log('PASS: 44. Inline object in expression');
    }

    console.log('\n====================================================');
    console.log('  ALL FORMATTER UNIT TESTS PASSED (44/44 SCENARIOS) ');
    console.log('====================================================');
}

if (require.main === module) {
    runTests();
}

module.exports = runTests;
