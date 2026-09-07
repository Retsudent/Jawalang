const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const cases = [
    { name: 'null + 10', code: 'tulis null + 10' },
    { name: 'null - 10', code: 'tulis null - 10' },
    { name: 'null * 10', code: 'tulis null * 10' },
    { name: 'null / 10', code: 'tulis null / 10' },
    { name: '-null', code: 'tulis -null' },
    { name: '+null', code: 'tulis +null' },
    { name: 'null > 10', code: 'tulis null > 10' },
    { name: 'null < 10', code: 'tulis null < 10' },
    { name: 'null >= 10', code: 'tulis null >= 10' },
    { name: 'null <= 10', code: 'tulis null <= 10' },
    { name: 'dawa(null)', code: 'dawa(null)' },
    { name: 'gedhe(null)', code: 'gedhe(null)' },
    { name: 'cilik(null)', code: 'cilik(null)' },
    { name: 'motong(null, 0, 2)', code: 'motong(null, 0, 2)' },
    { name: 'ngganti(null, "a", "b")', code: 'ngganti(null, "a", "b")' },
    { name: 'jupuk(null, 0)', code: 'jupuk(null, 0)' },
    { name: 'nambah(null, 10)', code: 'nambah(null, 10)' },
    { name: 'busak(null, 0)', code: 'busak(null, 0)' },
    { name: 'jinis()', code: 'jinis()' },
    { name: 'jinis(1, 2)', code: 'jinis(1, 2)' },
    { name: 'gawe null = 10', code: 'gawe null = 10' },
    { name: 'fungsi null() {}', code: 'fungsi null() {}' }
];

let passed = 0;
for (const c of cases) {
    try {
        interpreter(parser(lexer(c.code)));
        console.error('FAIL (expected error):', c.name);
    } catch (e) {
        passed++;
        console.log('PASS:', c.name, '->', e.message);
    }
}

console.log('Total: ' + passed + '/' + cases.length + ' passed');
if (passed !== cases.length) process.exit(1);