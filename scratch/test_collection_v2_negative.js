const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = 'D:\\Jawascript';

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_v2_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync('node index.js examples/__neg_v2_tmp__.jawa', {
            cwd: PROJECT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return { success: true, output: result.trim() };
    } catch (e) {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return { success: false, output: ((e.stdout || '') + (e.stderr || '')).trim() };
    }
}

function expectError(testName, code, expectedSubstring) {
    const res = runCode(code);
    if (res.success) {
        console.error(`FAIL: ${testName} (Expected error containing "${expectedSubstring}", but execution succeeded)`);
        return false;
    }
    if (res.output.includes(expectedSubstring)) {
        console.log(`PASS: ${testName}`);
        return true;
    } else {
        console.error(`FAIL: ${testName} (Expected "${expectedSubstring}", got: "${res.output}")`);
        return false;
    }
}

console.log("=== RUNNING COLLECTION V2 NEGATIVE TESTS ===");
let passed = 0;
let total = 0;

function test(name, code, expected) {
    total++;
    if (expectError(name, code, expected)) passed++;
}

// 1. gabung
test("gabung 0 args", "gabung()", 'Function built-in "gabung" mbutuhake 2 argument');
test("gabung 1 arg", "gabung([])", 'Function built-in "gabung" mbutuhake 2 argument');
test("gabung 3 args", 'gabung([], ",", "extra")', 'Function built-in "gabung" mbutuhake 2 argument');
test("gabung non-array arg1", 'gabung("abc", ",")', "Argument kapisan gabung() kudu array");
test("gabung non-string arg2 (number)", "gabung([1, 2], 123)", "Argument kapindho gabung() kudu string");
test("gabung non-string arg2 (boolean)", "gabung([1, 2], bener)", "Argument kapindho gabung() kudu string");
test("gabung non-string arg2 (null)", "gabung([1, 2], null)", "Argument kapindho gabung() kudu string");

// 2. balik
test("balik 0 args", "balik()", 'Function built-in "balik" mbutuhake 1 argument');
test("balik 2 args", "balik([], [])", 'Function built-in "balik" mbutuhake 1 argument');
test("balik non-array (number)", "balik(123)", "Argument kapisan balik() kudu array");
test("balik non-array (string)", 'balik("abc")', "Argument kapisan balik() kudu array");
test("balik non-array (object)", "balik({})", "Argument kapisan balik() kudu array");
test("balik non-array (null)", "balik(null)", "Argument kapisan balik() kudu array");

// 3. urut
test("urut 0 args", "urut()", 'Function built-in "urut" mbutuhake 1 argument');
test("urut 2 args", "urut([1], [2])", 'Function built-in "urut" mbutuhake 1 argument');
test("urut non-array (number)", "urut(123)", "Argument kapisan urut() kudu array");
test("urut non-array (string)", 'urut("abc")', "Argument kapisan urut() kudu array");
test("urut mixed (string)", 'urut([1, "dua", 3])', "Elemen array ing urut() kudu kabeh angka");
test("urut mixed (boolean)", "urut([1, bener, 3])", "Elemen array ing urut() kudu kabeh angka");
test("urut mixed (null)", "urut([1, null, 3])", "Elemen array ing urut() kudu kabeh angka");
test("urut mixed (array)", "urut([1, [2], 3])", "Elemen array ing urut() kudu kabeh angka");

// 4. ana
test("ana 0 args", "ana()", 'Function built-in "ana" mbutuhake 2 argument');
test("ana 1 arg", "ana(123)", 'Function built-in "ana" mbutuhake 2 argument');
test("ana non-function arg1 (number)", "ana(123, [])", "Argument kapisan ana() kudu function");
test("ana non-function arg1 (string)", 'ana("x", [])', "Argument kapisan ana() kudu function");
test("ana non-function arg1 (null)", "ana(null, [])", "Argument kapisan ana() kudu function");
test("ana non-array arg2 (number)", "guna fn(x){bali bener}\nana(fn, 123)", "Argument kapindho ana() kudu array");
test("ana non-array arg2 (null)", "guna fn(x){bali bener}\nana(fn, null)", "Argument kapindho ana() kudu array");

// 5. kabeh
test("kabeh 0 args", "kabeh()", 'Function built-in "kabeh" mbutuhake 2 argument');
test("kabeh 1 arg", "kabeh(123)", 'Function built-in "kabeh" mbutuhake 2 argument');
test("kabeh non-function arg1 (number)", "kabeh(123, [])", "Argument kapisan kabeh() kudu function");
test("kabeh non-function arg1 (null)", "kabeh(null, [])", "Argument kapisan kabeh() kudu function");
test("kabeh non-array arg2 (number)", "guna fn(x){bali bener}\nkabeh(fn, 123)", "Argument kapindho kabeh() kudu array");
test("kabeh non-array arg2 (string)", 'guna fn(x){bali bener}\nkabeh(fn, "abc")', "Argument kapindho kabeh() kudu array");

// 6. golek
test("golek 0 args", "golek()", 'Function built-in "golek" mbutuhake 2 argument');
test("golek 1 arg", "golek(123)", 'Function built-in "golek" mbutuhake 2 argument');
test("golek non-function arg1 (number)", "golek(123, [])", "Argument kapisan golek() kudu function");
test("golek non-function arg1 (null)", "golek(null, [])", "Argument kapisan golek() kudu function");
test("golek non-array arg2 (number)", "guna fn(x){bali bener}\ngolek(fn, 123)", "Argument kapindho golek() kudu array");
test("golek non-array arg2 (object)", 'guna fn(x){bali bener}\ngolek(fn, {})', "Argument kapindho golek() kudu array");

// 7. indeks
test("indeks 0 args", "indeks()", 'Function built-in "indeks" mbutuhake 2 argument');
test("indeks 1 arg", "indeks([])", 'Function built-in "indeks" mbutuhake 2 argument');
test("indeks non-array (number)", "indeks(123, 1)", "Argument kapisan indeks() kudu array");
test("indeks non-array (string)", 'indeks("abc", "a")', "Argument kapisan indeks() kudu array");
test("indeks non-array (null)", "indeks(null, 1)", "Argument kapisan indeks() kudu array");

// 8. Strict boolean callbacks
test("ana callback non-boolean (number)", "guna duduBener(x){bali x}\nana(duduBener, [1])", "Callback ana() kudu ngasilake boolean");
test("kabeh callback non-boolean (number)", "guna duduBener(x){bali x}\nkabeh(duduBener, [1])", "Callback kabeh() kudu ngasilake boolean");
test("golek callback non-boolean (number)", "guna duduBener(x){bali x}\ngolek(duduBener, [1])", "Callback golek() kudu ngasilake boolean");
test("ana callback null", "guna fnNull(x){bali null}\nana(fnNull, [1])", "Callback ana() kudu ngasilake boolean");
test("kabeh callback null", "guna fnNull(x){bali null}\nkabeh(fnNull, [1])", "Callback kabeh() kudu ngasilake boolean");
test("golek callback null", "guna fnNull(x){bali null}\ngolek(fnNull, [1])", "Callback golek() kudu ngasilake boolean");

// 9. Error propagation
test("ana callback throw error", 'guna err(x){lempar "gagal ana"}\nana(err, [1])', "gagal ana");
test("kabeh callback throw error", 'guna err(x){lempar "gagal kabeh"}\nkabeh(err, [1])', "gagal kabeh");
test("golek callback throw error", 'guna err(x){lempar "gagal golek"}\ngolek(err, [1])', "gagal golek");

console.log(`\nCollection V2 Negative Test Results: ${passed}/${total} passed`);
if (passed !== total) {
    process.exit(1);
}
