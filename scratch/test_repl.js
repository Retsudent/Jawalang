const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

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
runTest('Scenario 1: Basic Arithmetic Expression (10 + 20 -> 30)', () => {
    const session = new ReplSession();
    const res = session.eval('10 + 20');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.printed, true);
    assert.strictEqual(res.value, 30);
    assert.strictEqual(res.formatted, '30');
});

runTest('Scenario 2: Basic String Literal Expression ("halo" -> halo)', () => {
    const session = new ReplSession();
    const res = session.eval('"halo"');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.printed, true);
    assert.strictEqual(res.value, 'halo');
    assert.strictEqual(res.formatted, 'halo');
});

runTest('Scenario 3: Basic Boolean Expressions (10 > 5 -> bener, 10 < 5 -> salah)', () => {
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

runTest('Scenario 4: Basic Null Expression (null -> null)', () => {
    const session = new ReplSession();
    const res = session.eval('null');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.value, null);
    assert.strictEqual(res.formatted, 'null');
});

// 2. Variable Persistence & Reassignment
runTest('Scenario 5: Variable Declaration & Persistence across inputs (gawe x = 10, x + 5 -> 15)', () => {
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

runTest('Scenario 6: Variable Reassignment across inputs (x = x + 10, x -> 20)', () => {
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
runTest('Scenario 7: Function Declaration & Persistence across inputs', () => {
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
runTest('Scenario 8: Array Literal and Member Indexing', () => {
    const session = new ReplSession();
    const resArray = session.eval('[1, 2, 3]');
    assert.strictEqual(resArray.ok, true);
    assert.strictEqual(resArray.formatted, '[1, 2, 3]');

    session.eval('gawe arr = [10, 20, 30]');
    const resElem = session.eval('arr[1]');
    assert.strictEqual(resElem.ok, true);
    assert.strictEqual(resElem.value, 20);
});

runTest('Scenario 9: Object Literal and Property Access', () => {
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
runTest('Scenario 10: Struct Declaration, Instantiation & Methods (iki)', () => {
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
runTest('Scenario 11: Inheritance (ngembangake) & super calls', () => {
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
runTest('Scenario 12: Higher-Order Functions: terapkan, saring, itung, gabung, balik', () => {
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
runTest('Scenario 13: Runtime error (division by zero) does not terminate session', () => {
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

runTest('Scenario 14: Syntax error does not terminate session', () => {
    const session = new ReplSession();
    session.eval('gawe b = 100');
    const resErr = session.eval('gawe = 123');
    assert.strictEqual(resErr.ok, false);

    // Session survives
    const resNext = session.eval('b * 2');
    assert.strictEqual(resNext.ok, true);
    assert.strictEqual(resNext.value, 200);
});

// 9. Control Flow Validation
runTest('Scenario 15: Illegal top-level control flow throws clean error and session survives', () => {
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
runTest('Scenario 16: Module relative import and symbol usage', () => {
    const session = new ReplSession({ cwd: PROJECT_ROOT });
    const resImport = session.eval('impor "./examples/modules/konstanta.jawa"');
    assert.strictEqual(resImport.ok, true);

    const resPi = session.eval('pi');
    assert.strictEqual(resPi.ok, true);
    assert.strictEqual(resPi.value, 3.14);
});

runTest('Scenario 17: Namespace import (impor ... minangka ns) and member access', () => {
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

// 11. Built-in input takon() validation in REPL
runTest('Scenario 18: Built-in input "takon" argument validation in REPL', () => {
    const session = new ReplSession();
    const resArgCount = session.eval('takon("A", "B")');
    assert.strictEqual(resArgCount.ok, false);
    assert.ok(resArgCount.error.includes('mbutuhake 0 utawa 1 argument'));

    const resArgType = session.eval('takon(123)');
    assert.strictEqual(resArgType.ok, false);
    assert.ok(resArgType.error.includes('kudu string'));
});

// 12. Multiline Function Definition
runTest('Scenario 19: Multiline Function input spanning multiple lines', () => {
    const session = new ReplSession();
    const multilineFunc = [
        'guna hitungTotal(a, b, c) {',
        '    gawe subtotal = a + b',
        '    bali subtotal * c',
        '}'
    ].join('\n');
    assert.strictEqual(isCompleteInput(multilineFunc), true);

    const resDecl = session.eval(multilineFunc);
    assert.strictEqual(resDecl.ok, true);
    assert.strictEqual(resDecl.printed, false);

    const resCall = session.eval('hitungTotal(2, 3, 4)');
    assert.strictEqual(resCall.ok, true);
    assert.strictEqual(resCall.value, 20);
});

// 13. Multiline Struct Definition
runTest('Scenario 20: Multiline Struct input spanning multiple lines', () => {
    const session = new ReplSession();
    const multilineStruct = [
        'bentuk Titik {',
        '    gawe x = 0',
        '    gawe y = 0',
        '    guna wiwiti(xVal, yVal) {',
        '        iki.x = xVal',
        '        iki.y = yVal',
        '    }',
        '    guna jarakKuadrat() {',
        '        bali iki.x * iki.x + iki.y * iki.y',
        '    }',
        '}'
    ].join('\n');
    assert.strictEqual(isCompleteInput(multilineStruct), true);

    const resDecl = session.eval(multilineStruct);
    assert.strictEqual(resDecl.ok, true);

    session.eval('gawe p = anyar Titik(3, 4)');
    const resJarak = session.eval('p.jarakKuadrat()');
    assert.strictEqual(resJarak.ok, true);
    assert.strictEqual(resJarak.value, 25);
});

// 14. Multiline Arrays & Objects
runTest('Scenario 21: Multiline Arrays & Objects spanning multiple lines', () => {
    const session = new ReplSession();
    const multilineArray = '[\n  "siji",\n  "loro",\n  "telu"\n]';
    assert.strictEqual(isCompleteInput(multilineArray), true);
    const resArr = session.eval(multilineArray);
    assert.strictEqual(resArr.ok, true);
    assert.strictEqual(resArr.formatted, '["siji", "loro", "telu"]');

    const multilineObj = '{\n  "status": "aktif",\n  "kode": 200\n}';
    assert.strictEqual(isCompleteInput(multilineObj), true);
    const resObj = session.eval(multilineObj);
    assert.strictEqual(resObj.ok, true);
    assert.strictEqual(resObj.formatted, '{"status": "aktif", "kode": 200}');
});

// 15. Multiline continuation on binary operators and keywords
runTest('Scenario 22: Multiline operator continuation (+, -, *, /, ==, lan, utawa)', () => {
    assert.strictEqual(isCompleteInput('100 +'), false);
    assert.strictEqual(isCompleteInput('50 -'), false);
    assert.strictEqual(isCompleteInput('10 *'), false);
    assert.strictEqual(isCompleteInput('20 /'), false);
    assert.strictEqual(isCompleteInput('x =='), false);
    assert.strictEqual(isCompleteInput('bener lan'), false);
    assert.strictEqual(isCompleteInput('salah utawa'), false);
    assert.strictEqual(isCompleteInput('gawe a ='), false);

    const session = new ReplSession();
    const res = session.eval('100 +\n200 +\n300');
    assert.strictEqual(res.ok, true);
    assert.strictEqual(res.value, 600);
});

// 16. Multiline detector isCompleteInput() edge cases
runTest('Scenario 23: Multiline detector isCompleteInput() string & bracket parity', () => {
    assert.strictEqual(isCompleteInput('"teks durung rampung'), false);
    assert.strictEqual(isCompleteInput('"teks rampung"'), true);
    assert.strictEqual(isCompleteInput('([{}])'), true);
    assert.strictEqual(isCompleteInput('([{]'), false);
    assert.strictEqual(isCompleteInput(''), true);
    assert.strictEqual(isCompleteInput('   '), true);
});

// 17. Meta-commands constants & text
runTest('Scenario 24: Meta-commands constants (.help, .bantu, .exit, .metu, .clear, .resik)', () => {
    assert.ok(BANNER_TEXT.includes('Jawalang REPL v1.2.0'));
    assert.ok(BANNER_TEXT.includes('.bantu'));
    assert.ok(HELP_TEXT.includes('.help'));
    assert.ok(HELP_TEXT.includes('.bantu'));
    assert.ok(HELP_TEXT.includes('.exit'));
    assert.ok(HELP_TEXT.includes('.metu'));
    assert.ok(HELP_TEXT.includes('.clear'));
    assert.ok(HELP_TEXT.includes('.resik'));
});

// 18. Session Reset Method
runTest('Scenario 25: Session reset() method clears declared variables and functions', () => {
    const session = new ReplSession();
    session.eval('gawe data = 123');
    assert.strictEqual(session.eval('data').value, 123);

    session.reset();
    const resAfter = session.eval('data');
    assert.strictEqual(resAfter.ok, false);
    assert.ok(resAfter.error.includes('durung digawe'));
});

// 19. Empty & Whitespace Input
runTest('Scenario 26: Empty and whitespace input handling', () => {
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

// 20. Session Isolation
runTest('Scenario 27: Session Isolation between independent instances', () => {
    const s1 = new ReplSession();
    const s2 = new ReplSession();

    s1.eval('gawe port = 8080');
    assert.strictEqual(s1.eval('port').value, 8080);

    const resS2 = s2.eval('port');
    assert.strictEqual(resS2.ok, false);
    assert.ok(resS2.error.includes('durung digawe'));
});

// 21. CLI Help contains REPL command
runTest('Scenario 28: CLI --help documents "repl" command', () => {
    const out = execSync(`"${process.execPath}" "${path.join(PROJECT_ROOT, 'src', 'cli.js')}" --help`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8'
    });
    assert.ok(out.includes('repl'), 'CLI help must include repl');
    assert.ok(out.includes('Start interactive REPL'), 'CLI help description must be present');
});

// 22. CLI interactive execution via piped input (jawa repl)
runTest('Scenario 29: CLI child process "jawa repl" runs commands interactively', () => {
    const out = execSync(`"${process.execPath}" "${path.join(PROJECT_ROOT, 'src', 'cli.js')}" repl`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        input: 'gawe angka = 42\nangka + 8\n.exit\n'
    });
    assert.ok(out.includes('Jawalang REPL v1.2.0'), 'Must print REPL banner');
    assert.ok(out.includes('50'), 'Must output 50');
});

// 23. CLI alias execution (jawalang repl)
runTest('Scenario 30: CLI alias child process "jawalang repl" runs identically', () => {
    const out = execSync(`"${process.execPath}" "${path.join(PROJECT_ROOT, 'bin', 'jawalang.js')}" repl`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        input: '"Halo saka jawalang alias"\n.exit\n'
    });
    assert.ok(out.includes('Jawalang REPL v1.2.0'), 'Must print REPL banner');
    assert.ok(out.includes('Halo saka jawalang alias'), 'Must evaluate string expression');
});

// 24. Debug Mode prints stack trace
runTest('Scenario 31: CLI child process "jawa repl --debug" outputs full stack trace on error', () => {
    const out = spawnSync(process.execPath, [path.join(PROJECT_ROOT, 'src', 'cli.js'), 'repl', '--debug'], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        input: '10 / 0\n.exit\n'
    });
    const combined = (out.stdout || '') + (out.stderr || '');
    assert.ok(combined.includes('Ora bisa dibagi'), 'Must include error message');
    assert.ok(combined.includes('interpreter.js'), 'Debug mode must print stack trace with interpreter.js');
});

// 25. Package & Distribution Integrity
runTest('Scenario 32: NPM package.json bin configuration and tarball integrity', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.version, '1.2.0');
    assert.strictEqual(pkg.bin.jawa, 'bin/jawa.js');
    assert.strictEqual(pkg.bin.jawalang, 'bin/jawa.js');

    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'bin', 'jawa.js')));
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'bin', 'jawalang.js')));
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'bin', 'jawa.cmd')));
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'bin', 'jawalang.cmd')));
    assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'src', 'repl.js')));

    const tarballPath = path.join(PROJECT_ROOT, 'jawalang-1.2.0.tgz');
    assert.ok(fs.existsSync(tarballPath), 'jawalang-1.2.0.tgz must exist');
});

console.log('\n====================================================');
console.log(`REPL SUITE RESULT: ${passedTests}/${totalTests} passed`);
console.log('====================================================\n');
if (passedTests !== totalTests) {
    process.exit(1);
}
