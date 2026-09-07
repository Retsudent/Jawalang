const assert = require('assert');
const path = require('path');
const { execSync, spawn } = require('child_process');

const { ReplSession, isCompleteInput, BANNER_TEXT, HELP_TEXT } = require('../src/repl');
const PROJECT_ROOT = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`PASS: ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`FAIL: ${name}`);
        console.error(err.message || err);
    }
}

console.log('====================================================');
console.log('           JAWALANG V1.2.0 REPL TEST SUITE          ');
console.log('====================================================\n');

// 1. Basic Expressions
runTest('Basic Arithmetic Expression: 10 + 20 -> 30', () => {
    const session = new ReplSession();
    const res = session.eval('10 + 20');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.printed, true);
    assert.strictEqual(res.value, 30);
    assert.strictEqual(res.formatted, '30');
});

runTest('Basic String Literal Expression: "halo" -> halo', () => {
    const session = new ReplSession();
    const res = session.eval('"halo"');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.printed, true);
    assert.strictEqual(res.value, 'halo');
    assert.strictEqual(res.formatted, 'halo');
});

runTest('Basic Boolean Expressions: 10 > 5 -> bener, 10 < 5 -> salah', () => {
    const session = new ReplSession();
    const res1 = session.eval('10 > 5');
    assert.strictEqual(res1.ok, true);
    assert.strictEqual(res1.value, true);
    assert.strictEqual(res1.formatted, 'bener');

    const res2 = session.eval('10 < 5');
    assert.strictEqual(res2.ok, true);
    assert.strictEqual(res2.value, false);
    assert.strictEqual(res2.formatted, 'salah');
});

runTest('Basic Null Expression: null -> null', () => {
    const session = new ReplSession();
    const res = session.eval('null');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.value, null);
    assert.strictEqual(res.formatted, 'null');
});

// 2. Variable Persistence & Reassignment
runTest('Variable Declaration & Persistence across inputs', () => {
    const session = new ReplSession();
    const resDecl = session.eval('gawe x = 10');
    assert.strictEqual(resDecl.ok, true);
    assert.strictEqual(resDecl.printed, false);

    const resUse = session.eval('x + 5');
    assert.strictEqual(resUse.ok, true);
    assert.strictEqual(resUse.printed, true);
    assert.strictEqual(resUse.value, 15);
    assert.strictEqual(resUse.formatted, '15');
});

runTest('Variable Reassignment across inputs', () => {
    const session = new ReplSession();
    session.eval('gawe x = 10');
    const resAssign = session.eval('x = x + 10');
    assert.strictEqual(resAssign.ok, true);
    assert.strictEqual(resAssign.printed, false);

    const resGet = session.eval('x');
    assert.strictEqual(resGet.ok, true);
    assert.strictEqual(resGet.printed, true);
    assert.strictEqual(resGet.value, 20);
    assert.strictEqual(resGet.formatted, '20');
});

// 3. Function Declaration & Persistence
runTest('Function Declaration & Persistence across inputs', () => {
    const session = new ReplSession();
    const resDecl = session.eval(`
        guna tambah(a, b) {
            bali a + b
        }
    `);
    assert.strictEqual(resDecl.ok, true);
    assert.strictEqual(resDecl.printed, false);

    const resCall = session.eval('tambah(2, 3)');
    assert.strictEqual(resCall.ok, true);
    assert.strictEqual(resCall.printed, true);
    assert.strictEqual(resCall.value, 5);
    assert.strictEqual(resCall.formatted, '5');
});

// 4. Arrays & Objects
runTest('Array Literal and Member Indexing', () => {
    const session = new ReplSession();
    const resArray = session.eval('[1, 2, 3]');
    assert.strictEqual(resArray.ok, true);
    assert.strictEqual(resArray.formatted, '[1, 2, 3]');

    session.eval('gawe arr = [10, 20, 30]');
    const resElem = session.eval('arr[1]');
    assert.strictEqual(resElem.ok, true);
    assert.strictEqual(resElem.value, 20);
});

runTest('Object Literal and Property Access', () => {
    const session = new ReplSession();
    const resObj = session.eval('{"nama": "Budi", "umur": 20}');
    assert.strictEqual(resObj.ok, true);
    assert.strictEqual(resObj.formatted, '{"nama": "Budi", "umur": 20}');

    session.eval('gawe user = {"nama": "Budi", "umur": 20}');
    const resProp = session.eval('user.nama');
    assert.strictEqual(resProp.ok, true);
    assert.strictEqual(resProp.formatted, 'Budi');
});

// 5. Struct, Constructor, Method & Self (iki)
runTest('Struct Declaration, Instantiation & Methods (iki)', () => {
    const session = new ReplSession();
    const resStruct = session.eval(`
        bentuk Wong {
            gawe nama = "Budi"
            guna salam() {
                bali "Halo " + iki.nama
            }
        }
    `);
    assert.strictEqual(resStruct.ok, true);

    const resInst = session.eval('gawe w = anyar Wong()');
    assert.strictEqual(resInst.ok, true);

    const resCall = session.eval('w.salam()');
    assert.strictEqual(resCall.ok, true);
    assert.strictEqual(resCall.value, 'Halo Budi');
    assert.strictEqual(resCall.formatted, 'Halo Budi');
});

// 6. Inheritance & super
runTest('Inheritance (ngembangake) & super calls', () => {
    const session = new ReplSession();
    session.eval(`
        bentuk Wong {
            gawe nama = "Budi"
            guna salam() {
                bali "Halo " + iki.nama
            }
        }
    `);
    const resInherit = session.eval(`
        bentuk Karyawan ngembangake Wong {
            gawe jabatan = "Programmer"
            guna wiwiti(j) {
                iki.jabatan = j
            }
            guna info() {
                bali iki.salam() + " minangka " + iki.jabatan
            }
        }
    `);
    assert.strictEqual(resInherit.ok, true);

    session.eval('gawe k = anyar Karyawan("Lead")');
    const resInfo = session.eval('k.info()');
    assert.strictEqual(resInfo.ok, true);
    assert.strictEqual(resInfo.formatted, 'Halo Budi minangka Lead');
});

// 7. Higher-Order Functions
runTest('Higher-Order Functions: terapkan, saring, itung, gabung, balik', () => {
    const session = new ReplSession();
    session.eval('guna kaliLoro(x) { bali x * 2 }');
    const resMap = session.eval('terapkan(kaliLoro, [1, 2, 3])');
    assert.strictEqual(resMap.ok, true);
    assert.strictEqual(resMap.formatted, '[2, 4, 6]');

    session.eval('guna luwihLoro(x) { bali x > 2 }');
    const resFilter = session.eval('saring(luwihLoro, [1, 2, 3, 4])');
    assert.strictEqual(resFilter.ok, true);
    assert.strictEqual(resFilter.formatted, '[3, 4]');

    const resCount = session.eval('itung(luwihLoro, [1, 2, 3, 4])');
    assert.strictEqual(resCount.ok, true);
    assert.strictEqual(resCount.value, 2);

    const resJoin = session.eval('gabung(["A", "B", "C"], "-")');
    assert.strictEqual(resJoin.ok, true);
    assert.strictEqual(resJoin.value, 'A-B-C');

    const resReverse = session.eval('balik([1, 2, 3])');
    assert.strictEqual(resReverse.ok, true);
    assert.strictEqual(resReverse.formatted, '[3, 2, 1]');
});

// 8. Error Recovery & Session Survivability
runTest('Runtime error (division by zero) does not terminate session', () => {
    const session = new ReplSession();
    session.eval('gawe a = 50');
    const resErr = session.eval('10 / 0');
    assert.strictEqual(resErr.ok, false);
    assert.ok(resErr.error.includes('Ora bisa dibagi'));

    // Session survives and prior variable remains accessible
    const resNext = session.eval('a + 10');
    assert.strictEqual(resNext.ok, true);
    assert.strictEqual(resNext.value, 60);
});

runTest('Syntax error does not terminate session', () => {
    const session = new ReplSession();
    session.eval('gawe b = 100');
    const resErr = session.eval('gawe = 123');
    assert.strictEqual(resErr.ok, false);

    // Session survives
    const resNext = session.eval('b * 2');
    assert.strictEqual(resNext.ok, true);
    assert.strictEqual(resNext.value, 200);
});

// 9. Control Flow Validation (bali, mandheg, lanjut outside valid scope)
runTest('Illegal top-level control flow throws clean error and session survives', () => {
    const session = new ReplSession();
    const resBali = session.eval('bali 10');
    assert.strictEqual(resBali.ok, false);
    assert.ok(resBali.error.includes('"bali"'));

    const resMandheg = session.eval('mandheg');
    assert.strictEqual(resMandheg.ok, false);
    assert.ok(resMandheg.error.includes('"mandheg"'));

    const resLanjut = session.eval('lanjut');
    assert.strictEqual(resLanjut.ok, false);
    assert.ok(resLanjut.error.includes('"lanjut"'));

    const resOk = session.eval('100 + 5');
    assert.strictEqual(resOk.ok, true);
    assert.strictEqual(resOk.value, 105);
});

// 10. Module Import & Namespace Support
runTest('Module relative import and symbol usage', () => {
    const session = new ReplSession({ cwd: PROJECT_ROOT });
    const resImport = session.eval('impor "./examples/modules/konstanta.jawa"');
    assert.strictEqual(resImport.ok, true);

    const resPi = session.eval('pi');
    assert.strictEqual(resPi.ok, true);
    assert.strictEqual(resPi.value, 3.14);
});

runTest('Namespace import (impor ... minangka ns) and member access', () => {
    const session = new ReplSession({ cwd: PROJECT_ROOT });
    const resImport = session.eval('impor "./examples/modules/matematika.jawa" minangka math');
    assert.strictEqual(resImport.ok, true);

    const resVersi = session.eval('math.versi');
    assert.strictEqual(resVersi.ok, true);
    assert.strictEqual(resVersi.value, '1.0.0');

    const resTambah = session.eval('math.tambah(2, 3)');
    assert.strictEqual(resTambah.ok, true);
    assert.strictEqual(resTambah.value, 5);
});

// 11. Multiline Input Detection
runTest('Multiline input detector: isCompleteInput() handles brackets, parens, braces, strings, operators', () => {
    // Incomplete cases
    assert.strictEqual(isCompleteInput('guna tambah(a, b) {'), false);
    assert.strictEqual(isCompleteInput('(10 +'), false);
    assert.strictEqual(isCompleteInput('[1, 2,'), false);
    assert.strictEqual(isCompleteInput('{"nama": "Budi",'), false);
    assert.strictEqual(isCompleteInput('"halo'), false);
    assert.strictEqual(isCompleteInput('10 +'), false);
    assert.strictEqual(isCompleteInput('10 >'), false);
    assert.strictEqual(isCompleteInput('gawe x ='), false);
    assert.strictEqual(isCompleteInput('bener lan'), false);

    // Complete cases
    assert.strictEqual(isCompleteInput('guna tambah(a, b) {\n    bali a + b\n}'), true);
    assert.strictEqual(isCompleteInput('(10 +\n20)'), true);
    assert.strictEqual(isCompleteInput('[1, 2,\n3]'), true);
    assert.strictEqual(isCompleteInput('{"nama": "Budi"}'), true);
    assert.strictEqual(isCompleteInput('"halo"'), true);
    assert.strictEqual(isCompleteInput('10 + 20'), true);
    assert.strictEqual(isCompleteInput('gawe x = 10'), true);
});

// 12. Session Isolation
runTest('Session Isolation: separate sessions do not leak variables', () => {
    const sessionA = new ReplSession();
    sessionA.eval('gawe rahasia = 999');
    assert.strictEqual(sessionA.eval('rahasia').value, 999);

    const sessionB = new ReplSession();
    const resB = sessionB.eval('rahasia');
    assert.strictEqual(resB.ok, false);
    assert.ok(resB.error.includes('durung digawe'));
});

// 13. Empty Input Handling
runTest('Empty or whitespace input returns cleanly without error', () => {
    const session = new ReplSession();
    const res1 = session.eval('');
    assert.strictEqual(res1.ok, true);
    assert.strictEqual(res1.empty, true);
    assert.strictEqual(res1.printed, false);

    const res2 = session.eval('   \n\t  ');
    assert.strictEqual(res2.ok, true);
    assert.strictEqual(res2.empty, true);
    assert.strictEqual(res2.printed, false);
});

// 14. Banner and Meta-Command Constants
runTest('Banner and Help text constants are well-defined', () => {
    assert.ok(BANNER_TEXT.includes('Jawalang REPL v1.2.0'));
    assert.ok(BANNER_TEXT.includes('.bantu'));
    assert.ok(HELP_TEXT.includes('.help'));
    assert.ok(HELP_TEXT.includes('.exit'));
    assert.ok(HELP_TEXT.includes('.clear'));
});

// 15. CLI Process Integration
runTest('CLI help contains repl command', () => {
    const out = execSync(`"${process.execPath}" "${path.join(PROJECT_ROOT, 'src', 'cli.js')}" --help`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8'
    });
    assert.ok(out.includes('repl'), 'CLI help must include repl');
    assert.ok(out.includes('Start interactive REPL'), 'CLI help description must be present');
});

runTest('CLI interactive execution via piped input (jawa repl)', () => {
    const out = execSync(`"${process.execPath}" "${path.join(PROJECT_ROOT, 'src', 'cli.js')}" repl`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        input: 'gawe num = 42\nnum + 8\n.exit\n'
    });
    assert.ok(out.includes('Jawalang REPL v1.2.0'), 'Must print REPL banner');
    assert.ok(out.includes('50'), 'Must output 50');
});

console.log('\n====================================================');
console.log(`REPL SUITE RESULT: ${passedTests}/${totalTests} passed`);
console.log('====================================================\n');
if (passedTests !== totalTests) {
    process.exit(1);
}
