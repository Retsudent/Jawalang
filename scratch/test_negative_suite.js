const lexer = require('d:/Jawascript/src/lexer');
const parser = require('d:/Jawascript/src/parser');
const interpreter = require('d:/Jawascript/src/interpreter');

function run(code) {
    return interpreter(parser(lexer(code)));
}

let allPassed = true;

// Test 1: Undefined assignment
try {
    run(`
    fungsi test() {
        x = 10
    }
    test()
    `);
    console.error('FAIL: Undefined assignment should have thrown an error!');
    allPassed = false;
} catch (e) {
    console.log('PASS: Undefined assignment error caught ->', e.message);
}

// Test 2: Local variable leakage
try {
    run(`
    fungsi test() {
        gawe rahasia = 123
    }
    test()
    tulis rahasia
    `);
    console.error('FAIL: Local variable leakage should have thrown an error!');
    allPassed = false;
} catch (e) {
    console.log('PASS: Local variable leakage error caught ->', e.message);
}

// Test 3: Nested function rejection
try {
    run(`
    fungsi luar() {
        fungsi dalam() {
            tulis "test"
        }
    }
    `);
    console.error('FAIL: Nested function should have thrown an error!');
    allPassed = false;
} catch (e) {
    console.log('PASS: Nested function error caught ->', e.message);
}

// Test 4: Dynamic scope test (Lexical Scoping verification)
let output = [];
const originalLog = console.log;
console.log = (msg) => output.push(msg);

run(`
gawe x = "Global"

fungsi kedua() {
    tulis x
}

fungsi pertama() {
    gawe x = "Local"
    kedua()
}

pertama()
`);

console.log = originalLog;
if (output[0] === "Global") {
    console.log('PASS: Dynamic scope test (Lexical Scoping maintained: output is "Global")');
} else {
    console.error('FAIL: Dynamic scoping occurred! Expected "Global", got:', output[0]);
    allPassed = false;
}

if (allPassed) {
    console.log('\nALL NEGATIVE & SCOPE INTEGRITY TESTS PASSED!');
} else {
    process.exit(1);
}
