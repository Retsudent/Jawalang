const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const negativeCases = [
    // Syntax errors
    {
        name: "Tidak ada saben",
        code: `gawe angka = [1, 2]\nkanggo x ing angka {\n    tulis x\n}`,
        expectedError: 'Sawise jeneng variabel ing "kanggo" kudu ana tanda "="'
    },
    {
        name: "Tidak ada iterator",
        code: `gawe angka = [1, 2]\nkanggo saben ing angka {\n    tulis angka\n}`,
        expectedError: 'Sawise "saben" kudu ana jeneng variabel iterator'
    },
    {
        name: "Tidak ada ing",
        code: `gawe angka = [1, 2]\nkanggo saben x angka {\n    tulis x\n}`,
        expectedError: 'Perulangan "kanggo saben" mbutuhake tembung kunci "ing"'
    },
    {
        name: "Tidak ada iterable",
        code: `kanggo saben x ing {\n    tulis x\n}`,
        expectedError: 'Dibutuhake ekspresi sumber sawise "ing"'
    },
    {
        name: "Tidak ada body",
        code: `gawe angka = [1, 2]\nkanggo saben x ing angka`,
        expectedError: 'Sawise ekspresi "ing" kudu ana blok "{"'
    },
    {
        name: "Body tidak ditutup",
        code: `gawe angka = [1, 2]\nkanggo saben x ing angka {\n    tulis x`,
        expectedError: 'Blok durung ditutup nganggo "}"'
    },

    // Runtime type errors
    {
        name: "Number sebagai iterable",
        code: `kanggo saben x ing 10 {\n    tulis x\n}`,
        expectedError: 'Foreach "kanggo saben" mung bisa digunakake kanggo array, nanging ditemu: "number"'
    },
    {
        name: "String sebagai iterable",
        code: `kanggo saben x ing "Jawa" {\n    tulis x\n}`,
        expectedError: 'Foreach "kanggo saben" mung bisa digunakake kanggo array, nanging ditemu: "string"'
    },
    {
        name: "Boolean sebagai iterable",
        code: `kanggo saben x ing bener {\n    tulis x\n}`,
        expectedError: 'Foreach "kanggo saben" mung bisa digunakake kanggo array, nanging ditemu: "boolean"'
    },
    {
        name: "Null sebagai iterable",
        code: `kanggo saben x ing null {\n    tulis x\n}`,
        expectedError: 'Foreach "kanggo saben" mung bisa digunakake kanggo array, nanging ditemu: "null"'
    },
    {
        name: "Object sebagai iterable",
        code: `gawe obj = {}\nkanggo saben x ing obj {\n    tulis x\n}`,
        expectedError: 'Foreach "kanggo saben" mung bisa digunakake kanggo array, nanging ditemu: "object"'
    }
];

let passed = 0;
for (const tc of negativeCases) {
    try {
        const tokens = lexer(tc.code);
        const ast = parser(tokens);
        interpreter(ast);
        console.error(`FAIL: ${tc.name} — did not throw`);
    } catch (e) {
        if (e.message.includes(tc.expectedError)) {
            console.log(`PASS: ${tc.name} -> ${e.message}`);
            passed++;
        } else {
            console.error(`FAIL: ${tc.name} -> unexpected error message: ${e.message}`);
        }
    }
}

console.log(`\nResult: ${passed}/${negativeCases.length} passed`);
if (passed !== negativeCases.length) {
    process.exit(1);
}
