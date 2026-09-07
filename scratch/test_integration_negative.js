const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const negativeCases = [
    {
        name: "Index number pada object",
        code: `gawe user = { "nama": "Budi" }\ntulis user[0]`,
        expectedError: 'Object mung bisa diakses nganggo key string, nanging ditemu: "number"'
    },
    {
        name: "Index string pada array",
        code: `gawe arr = [10, 20]\ntulis arr["0"]`,
        expectedError: 'Index array kudu bilangan bulat'
    },
    {
        name: "Index object pada array",
        code: `gawe arr = [10, 20]\ngawe obj = {}\ntulis arr[obj]`,
        expectedError: 'Index array kudu bilangan bulat'
    },
    {
        name: "Target null pada index access",
        code: `gawe data = null\ntulis data["nama"]`,
        expectedError: 'Ora bisa ngakses property saka null'
    },
    {
        name: "Nested invalid access pada number",
        code: `gawe data = { "angka": 10 }\ntulis data["angka"]["x"]`,
        expectedError: 'Mung array utawa object sing bisa diindex, nanging ditemu: "number"'
    },
    {
        name: "Nested invalid access pada boolean",
        code: `gawe data = { "aktif": bener }\ntulis data["aktif"]["x"]`,
        expectedError: 'Mung array utawa object sing bisa diindex, nanging ditemu: "boolean"'
    },
    {
        name: "Nested invalid access pada string",
        code: `gawe data = { "teks": "halo" }\ntulis data["teks"]["x"]`,
        expectedError: 'Mung array utawa object sing bisa diindex, nanging ditemu: "string"'
    },
    {
        name: "Invalid deep assignment pada number",
        code: `gawe data = { "angka": 10 }\ndata["angka"]["x"] = 20`,
        expectedError: 'Mung array utawa object sing bisa diubah elemente, nanging ditemu: "number"'
    },
    {
        name: "Invalid deep assignment pada boolean",
        code: `gawe data = { "aktif": bener }\ndata["aktif"]["x"] = 20`,
        expectedError: 'Mung array utawa object sing bisa diubah elemente, nanging ditemu: "boolean"'
    },
    {
        name: "Invalid deep assignment pada null target",
        code: `gawe data = { "kosong": null }\ndata["kosong"]["x"] = 20`,
        expectedError: 'Ora bisa ngowahi property saka null'
    },
    {
        name: "Invalid deep assignment pada missing property (evaluates to null)",
        code: `gawe data = { "user": "budi" }\ndata["ora_ana"]["x"] = 20`,
        expectedError: 'Ora bisa ngowahi property saka null'
    },
    {
        name: "Deep array index out of bounds",
        code: `gawe data = { "siswa": ["Budi"] }\ndata["siswa"][99] = "x"`,
        expectedError: 'Index array 99 ngluwihi ukuran array 1'
    },
    {
        name: "Deep array negative index",
        code: `gawe data = { "siswa": ["Budi"] }\ndata["siswa"][-1] = "x"`,
        expectedError: 'Index array ora oleh negatif: -1'
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
            console.error(`FAIL: ${tc.name} -> unexpected error: ${e.message}`);
        }
    }
}
console.log(`\nResult: ${passed}/${negativeCases.length} passed`);
if (passed !== negativeCases.length) {
    process.exit(1);
}
