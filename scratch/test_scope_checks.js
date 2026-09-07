const lexer = require('d:/Jawascript/src/lexer');
const parser = require('d:/Jawascript/src/parser');
const interpreter = require('d:/Jawascript/src/interpreter');

function run(code) {
    return interpreter(parser(lexer(code)));
}

console.log('--- Check 30 ---');
run(`
fungsi test(n) {
    gawe i = 0
    nalika i < n {
        i = i + 1
    }
    bali i
}
tulis test(5)
`);

console.log('--- Check 31 ---');
run(`
fungsi faktorial(n) {
    yen n <= 1 {
        bali 1
    }
    bali n * faktorial(n - 1)
}
tulis faktorial(5)
`);

console.log('--- Check 32 ---');
run(`
gawe x = 10
fungsi test() {
    gawe x = 20
    x = 30
    tulis x
}
test()
tulis x
`);

console.log('--- Check 33 ---');
run(`
gawe x = 10
fungsi test() {
    x = 30
}
test()
tulis x
`);

console.log('--- Check 34 ---');
try {
    run(`
fungsi test() {
    x = 30
}
test()
`);
} catch (e) {
    console.log('Check 34 Error as expected:', e.message);
}

console.log('--- Check 35 ---');
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
