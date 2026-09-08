/**
 * Jawalang V1.3.0 - Formatter Deep Audit
 * Validates formatting accuracy, edge cases, safety, and idempotency.
 */

const assert = require('assert');
const { formatDocument } = require('../language-server/src/formatter');

console.log('====================================================');
console.log('       JAWALANG FORMATTER DEEP AUDIT               ');
console.log('====================================================\n');

let total = 0;
let passed = 0;

function audit(name, fn) {
    total++;
    try {
        fn();
        console.log(`PASS [${String(total).padStart(2, ' ')}]: ${name}`);
        passed++;
    } catch (err) {
        console.error(`FAIL [${String(total).padStart(2, ' ')}]: ${name}`);
        console.error('   Error:', err.message);
    }
}

// 1. Basic function formatting
audit('Function declaration and return with binary operator spacing', () => {
    const src = 'guna tambah(a,b){\nbali a+b\n}';
    const expected = 'guna tambah(a, b) {\n    bali a + b\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 2. If-else cuddling
audit('If / Else block cuddling and condition spacing', () => {
    const src = 'yen a>10{\nbali a\n}liyane{\nbali 0\n}';
    const expected = 'yen a > 10 {\n    bali a\n} liyane {\n    bali 0\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 3. Else-if cuddling
audit('If / Else-If block cuddling', () => {
    const src = 'yen a>10{\ntulis "besar"\n}liyane yen a>5{\ntulis "sedang"\n}liyane{\ntulis "kecil"\n}';
    const expected = 'yen a > 10 {\n    tulis "besar"\n} liyane yen a > 5 {\n    tulis "sedang"\n} liyane {\n    tulis "kecil"\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 4. Struct and blank line preservation
audit('Struct declaration, properties, method, and blank line preservation', () => {
    const src = 'bentuk Wong{\ngawe jeneng\ngawe umur\n\nguna salam(){\ntulis iki.jeneng\n}\n}';
    const expected = 'bentuk Wong {\n    gawe jeneng\n    gawe umur\n\n    guna salam() {\n        tulis iki.jeneng\n    }\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 5. Inheritance and constructor
audit('Inheritance ngembangake and constructor wiwiti', () => {
    const src = 'bentuk Anak ngembangake Induk{\nwiwiti(nama,umur){\niki.nama=nama\niki.umur=umur\n}\n}';
    const expected = 'bentuk Anak ngembangake Induk {\n    wiwiti(nama, umur) {\n        iki.nama = nama\n        iki.umur = umur\n    }\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 6. Super calls
audit('Super call and super method invocation spacing', () => {
    const src = 'super(nama)\nsuper.salam()\nsuper["obah"]()';
    const expected = 'super(nama)\nsuper.salam()\nsuper["obah"]()';
    const edits = formatDocument(src);
    // Already formatted or formats cleanly
    const res = edits.length === 0 ? src : edits[0].newText;
    assert.strictEqual(res, expected);
});

// 7. Coba / Tangkep
audit('Try-catch block cuddling: } tangkep err {', () => {
    const src = 'coba{\ntulis "test"\n}tangkep err{\ntulis err\n}';
    const expected = 'coba {\n    tulis "test"\n} tangkep err {\n    tulis err\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 8. While & Foreach loops
audit('While and foreach loops with proper block formatting', () => {
    const src = 'nalika i<=10{\ntulis i\ni=i+1\n}\nkanggo saben item ing data{\ntulis item\n}';
    const expected = 'nalika i <= 10 {\n    tulis i\n    i = i + 1\n}\nkanggo saben item ing data {\n    tulis item\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 9. Object literal in assignment
audit('Object literal formatted multiline on assignment', () => {
    const src = 'gawe siswa={"nama":"Barch","umur":20}';
    const expected = 'gawe siswa = {\n    "nama": "Barch",\n    "umur": 20\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 10. Inline object in expression
audit('Inline object preserved in expression without breaking', () => {
    const src = 'tulis {"nama": "Barch"}';
    const edits = formatDocument(src);
    const res = edits.length === 0 ? src : edits[0].newText;
    assert.ok(res.includes('{"nama": "Barch"}') || res.includes('{ "nama": "Barch" }'));
});

// 11. Array formatting
audit('Array literals inline and nested array spacing', () => {
    const src = 'gawe data=[[1,2],[3,4]]';
    const expected = 'gawe data = [[1, 2], [3, 4]]';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 12. Unary vs binary operators
audit('Unary minus attached to operand and binary operator spaced', () => {
    const src = 'gawe x=-10\ngawe y=a-b\nbali -x';
    const expected = 'gawe x = -10\ngawe y = a - b\nbali -x';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 13. Comments safety
audit('Comments preserved: standalone indented, trailing spaced', () => {
    const src = '// Header comment\nguna f(){\n// Step 1\ngawe x=10 // nilai awal\n}';
    const expected = '// Header comment\nguna f() {\n    // Step 1\n    gawe x = 10 // nilai awal\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.strictEqual(edits[0].newText, expected);
});

// 14. String literal safety
audit('Strings and escape sequences preserved verbatim', () => {
    const src = 'tulis "a+b=c"\ntulis "Halo\\nJagad"';
    const expected = 'tulis "a+b=c"\ntulis "Halo\\nJagad"';
    const edits = formatDocument(src);
    const res = edits.length === 0 ? src : edits[0].newText;
    assert.strictEqual(res, expected);
});

// 15. CRLF line endings
audit('CRLF line endings preserved when present in source', () => {
    const src = 'guna f(){\r\nbali 1\r\n}';
    const edits = formatDocument(src);
    assert.strictEqual(edits.length, 1);
    assert.ok(edits[0].newText.includes('\r\n'), 'CRLF line ending must be preserved');
    assert.strictEqual(edits[0].newText, 'guna f() {\r\n    bali 1\r\n}');
});

// 16. Idempotency
audit('Idempotency: format(format(source)) === format(source)', () => {
    const src = 'guna f(a,b){\nyen a>10{\nbali a+b\n}liyane{\nbali 0\n}\n}';
    const first = formatDocument(src)[0].newText;
    const second = formatDocument(first);
    assert.strictEqual(second.length, 0, 'Second format call must return empty edits (already formatted)');
});

// 17. Malformed code safety
audit('Malformed unclosed string returns empty edits safely without crash', () => {
    const src = 'guna f(){\ntulis "unclosed string\n}';
    const edits = formatDocument(src);
    assert.deepStrictEqual(edits, []);
});

// 18. Empty document returns []
audit('Empty document returns empty edits cleanly', () => {
    assert.deepStrictEqual(formatDocument(''), []);
    assert.deepStrictEqual(formatDocument('   \n  \t  \n'), []);
});

console.log('\n====================================================');
console.log(`Audit Finished: ${passed}/${total} PASSED`);
console.log('====================================================\n');

if (passed !== total) {
    process.exit(1);
}
