const lexer = require('../src/lexer');
const parser = require('../src/parser');
const interpreter = require('../src/interpreter');

const cases = [
    { name: 'object non-string key', code: 'gawe data = { "nama": "Budi" }\ntulis data[0]' },
    { name: 'target non-object', code: 'gawe angka = 10\ntulis angka["nama"]' },
    { name: 'target string non-object', code: 'gawe s = "Halo"\ntulis s["nama"]' },
    { name: 'null target', code: 'gawe data = null\ntulis data["nama"]' },
    { name: 'assignment non-string key', code: 'gawe data = {}\ndata[0] = "Budi"' },
    { name: 'object key object', code: 'gawe data = { "nama": "Budi" }\ngawe key = { "x": 1 }\ntulis data[key]' },
    { name: 'object as array index', code: 'gawe arr = [1, 2]\ngawe key = { "x": 1 }\ntulis arr[key]' },
    { name: 'non-string key in object literal', code: 'gawe data = { 123: "Budi" }' },
    { name: 'assignment to null target', code: 'gawe data = null\ndata["nama"] = "Budi"' },
    { name: 'assignment to number target', code: 'gawe n = 10\nn["nama"] = "Budi"' }
];

let passed = 0;
for (const c of cases) {
    try {
        interpreter(parser(lexer(c.code)));
        console.error('FAIL (expected error):', c.name);
    } catch (e) {
        passed++;
        console.log('PASS: ' + c.name + ' -> ' + e.message);
    }
}

console.log('Total: ' + passed + '/' + cases.length + ' passed');
if (passed !== cases.length) process.exit(1);