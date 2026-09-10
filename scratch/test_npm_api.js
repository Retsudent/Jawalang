const assert = require('assert');
const path = require('path');

console.log('=== TESTING JAWALANG PROGRAMMATIC NPM API ===\n');

// 1. Require module safely without CLI trigger or process.exit()
const jawalang = require('../index.js');
console.log('PASS: require("../index.js") loaded safely without exit');

// 2. API exports validation
assert.strictEqual(typeof jawalang.lexer, 'function', 'jawalang.lexer must be a function');
assert.strictEqual(typeof jawalang.parser, 'function', 'jawalang.parser must be a function');
assert.strictEqual(typeof jawalang.interpreter, 'function', 'jawalang.interpreter must be a function');
assert.strictEqual(typeof jawalang.runFile, 'function', 'jawalang.runFile must be a function');
assert.strictEqual(typeof jawalang.runSource, 'function', 'jawalang.runSource must be a function');
const pkg = require('../package.json');
assert.strictEqual(jawalang.VERSION, `Jawalang v${pkg.version}`, `VERSION must match v${pkg.version}`);
console.log('PASS: All programmatic exports are defined and match expected types');

// 3. Programmatic source execution
try {
    jawalang.runSource('gawe a = 100\ngawe b = 200\ngawe c = a + b');
    console.log('PASS: runSource executed valid Jawalang source code programmatically');
} catch (e) {
    console.error('FAIL: runSource threw error:', e);
    process.exit(1);
}

// 4. Tokenizer & Parser programmatic inspection
const tokens = jawalang.lexer('gawe angka = 42');
assert.ok(Array.isArray(tokens), 'lexer must return an array of tokens');
const ast = jawalang.parser(tokens);
assert.ok(Array.isArray(ast), 'parser must return an array of AST statement nodes');
console.log('PASS: lexer and parser operate correctly in programmatic pipeline');

console.log('\n=== ALL NPM API TESTS PASSED ===');
