const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const testCases = [
    // kunci() negative tests
    {
        name: "kunci() tanpa argument",
        code: `kunci()`,
        expectedError: 'Function built-in "kunci" mbutuhake 1 argument, nanging diwenehi 0'
    },
    {
        name: "kunci() terlalu banyak argument",
        code: `gawe o = {}\nkunci(o, o)`,
        expectedError: 'Function built-in "kunci" mbutuhake 1 argument, nanging diwenehi 2'
    },
    {
        name: "kunci() target array",
        code: `kunci([1, 2, 3])`,
        expectedError: 'kunci() mung bisa digunakake kanggo object, nanging ditemu: "array"'
    },
    {
        name: "kunci() target string",
        code: `kunci("halo")`,
        expectedError: 'kunci() mung bisa digunakake kanggo object, nanging ditemu: "string"'
    },
    {
        name: "kunci() target number",
        code: `kunci(123)`,
        expectedError: 'kunci() mung bisa digunakake kanggo object, nanging ditemu: "number"'
    },
    {
        name: "kunci() target null",
        code: `kunci(null)`,
        expectedError: 'kunci() mung bisa digunakake kanggo object, nanging ditemu: "null"'
    },

    // nilai() negative tests
    {
        name: "nilai() tanpa argument",
        code: `nilai()`,
        expectedError: 'Function built-in "nilai" mbutuhake 1 argument, nanging diwenehi 0'
    },
    {
        name: "nilai() terlalu banyak argument",
        code: `gawe o = {}\nnilai(o, o)`,
        expectedError: 'Function built-in "nilai" mbutuhake 1 argument, nanging diwenehi 2'
    },
    {
        name: "nilai() target array",
        code: `nilai([1, 2, 3])`,
        expectedError: 'nilai() mung bisa digunakake kanggo object, nanging ditemu: "array"'
    },
    {
        name: "nilai() target string",
        code: `nilai("halo")`,
        expectedError: 'nilai() mung bisa digunakake kanggo object, nanging ditemu: "string"'
    },
    {
        name: "nilai() target number",
        code: `nilai(123)`,
        expectedError: 'nilai() mung bisa digunakake kanggo object, nanging ditemu: "number"'
    },
    {
        name: "nilai() target null",
        code: `nilai(null)`,
        expectedError: 'nilai() mung bisa digunakake kanggo object, nanging ditemu: "null"'
    },

    // duwe() negative tests
    {
        name: "duwe() tanpa argument",
        code: `duwe()`,
        expectedError: 'Function built-in "duwe" mbutuhake 2 argument, nanging diwenehi 0'
    },
    {
        name: "duwe() hanya 1 argument",
        code: `gawe o = {}\nduwe(o)`,
        expectedError: 'Function built-in "duwe" mbutuhake 2 argument, nanging diwenehi 1'
    },
    {
        name: "duwe() terlalu banyak argument",
        code: `gawe o = {}\nduwe(o, "a", "b")`,
        expectedError: 'Function built-in "duwe" mbutuhake 2 argument, nanging diwenehi 3'
    },
    {
        name: "duwe() target array",
        code: `duwe([1, 2], "a")`,
        expectedError: 'Argument kapisan duwe() kudu object, nanging ditemu: "array"'
    },
    {
        name: "duwe() target null",
        code: `duwe(null, "a")`,
        expectedError: 'Argument kapisan duwe() kudu object, nanging ditemu: "null"'
    },
    {
        name: "duwe() target string",
        code: `duwe("halo", "a")`,
        expectedError: 'Argument kapisan duwe() kudu object, nanging ditemu: "string"'
    },
    {
        name: "duwe() key number",
        code: `gawe o = {}\nduwe(o, 123)`,
        expectedError: 'Argument kapindho duwe() kudu string, nanging ditemu: "number"'
    },
    {
        name: "duwe() key null",
        code: `gawe o = {}\nduwe(o, null)`,
        expectedError: 'Argument kapindho duwe() kudu string, nanging ditemu: "null"'
    },
    {
        name: "duwe() key array",
        code: `gawe o = {}\nduwe(o, [1, 2])`,
        expectedError: 'Argument kapindho duwe() kudu string, nanging ditemu: "array"'
    },
    {
        name: "duwe() key object",
        code: `gawe o = {}\nduwe(o, {})`,
        expectedError: 'Argument kapindho duwe() kudu string, nanging ditemu: "object"'
    }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
    try {
        const tokens = lexer(tc.code);
        const ast = parser(tokens);
        interpreter(ast);
        console.error(`FAIL: ${tc.name} — Seharusnya melempar error tapi sukses`);
        failed++;
    } catch (e) {
        if (e.message.includes(tc.expectedError)) {
            console.log(`PASS: ${tc.name} -> ${e.message}`);
            passed++;
        } else {
            console.error(`FAIL: ${tc.name}`);
            console.error(`  Expected to include: ${tc.expectedError}`);
            console.error(`  Actual message: ${e.message}`);
            failed++;
        }
    }
}

console.log(`\nTotal: ${passed}/${testCases.length} passed`);
if (failed > 0) {
    process.exit(1);
}
