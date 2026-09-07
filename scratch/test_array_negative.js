const lexer = require('d:/Jawascript/src/lexer');
const parser = require('d:/Jawascript/src/parser');
const interpreter = require('d:/Jawascript/src/interpreter');

function run(code) {
    return interpreter(parser(lexer(code)));
}

let passed = 0;
let failed = 0;

function assertThrows(title, code, expectedMsgSubstr) {
    try {
        run(code);
        console.error('FAIL:', title, '- Should have thrown error');
        failed++;
    } catch (e) {
        if (!expectedMsgSubstr || e.message.includes(expectedMsgSubstr)) {
            console.log('PASS:', title, '->', e.message);
            passed++;
        } else {
            console.error('FAIL:', title, '- Message mismatch:', e.message, 'vs expected:', expectedMsgSubstr);
            failed++;
        }
    }
}

// 1. Index out of bounds read
assertThrows('Index out of bounds read', 'gawe a = [1, 2]\ntulis a[5]', 'ngluwihi ukuran array');

// 2. Negative index read
assertThrows('Negative index read', 'gawe a = [1, 2]\ntulis a[-1]', 'ora oleh negatif');

// 3. Float index read
assertThrows('Float index read', 'gawe a = [1, 2]\ntulis a[1.5]', 'kudu bilangan bulat');

// 4. Non-number index read
assertThrows('String index read', 'gawe a = [1, 2]\ntulis a["halo"]', 'kudu bilangan bulat');

// 5. Index non-array read
assertThrows('Index non-array read', 'gawe a = 100\ntulis a[0]', 'Mung array sing bisa diindex');

// 6. Index out of bounds write
assertThrows('Index out of bounds write', 'gawe a = [1, 2]\na[5] = 99', 'ngluwihi ukuran array');

// 7. Negative index write
assertThrows('Negative index write', 'gawe a = [1, 2]\na[-1] = 99', 'ora oleh negatif');

// 8. Float index write
assertThrows('Float index write', 'gawe a = [1, 2]\na[1.5] = 99', 'kudu bilangan bulat');

// 9. Index non-array write
assertThrows('Index non-array write', 'gawe a = 100\na[0] = 99', 'Mung array sing bisa diubah');

// 10. Missing closing bracket in literal
assertThrows('Unclosed array literal', 'gawe a = [1, 2', 'kudu ditutup nganggo "]"');

// 11. Missing closing bracket in index
assertThrows('Unclosed index access', 'gawe a = [1, 2]\ntulis a[0', 'kudu ditutup nganggo "]"');

console.log('\nTotal Passed:', passed, 'Failed:', failed);
if (failed > 0) process.exit(1);
