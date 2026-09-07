const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_ho_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync(`"${process.execPath}" "${path.join(PROJECT, 'index.js')}" "${tmpFile}"`, {
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

console.log("=== RUNNING HIGHER-ORDER FUNCTION NEGATIVE TESTS ===");
let passed = 0;
let total = 0;

function test(name, code, expected) {
    total++;
    if (expectError(name, code, expected)) passed++;
}

// 1. terapkan argument count
test("terapkan 0 args", "terapkan()", 'Function built-in "terapkan" mbutuhake 2 argument');
test("terapkan 1 arg", 'guna f(x){bali x}\nterapkan(f)', 'Function built-in "terapkan" mbutuhake 2 argument');
test("terapkan 3 args", 'guna f(x){bali x}\nterapkan(f, [1], 2)', 'Function built-in "terapkan" mbutuhake 2 argument');

// 2. saring argument count
test("saring 0 args", "saring()", 'Function built-in "saring" mbutuhake 2 argument');
test("saring 1 arg", 'guna f(x){bali bener}\nsaring(f)', 'Function built-in "saring" mbutuhake 2 argument');

// 3. itung argument count
test("itung 0 args", "itung()", 'Function built-in "itung" mbutuhake 2 argument');
test("itung 1 arg", 'guna f(x){bali bener}\nitung(f)', 'Function built-in "itung" mbutuhake 2 argument');

// 4. Non-function callback
test("terapkan non-function callback (number)", "terapkan(123, [1, 2])", "Argument kapisan terapkan() kudu function");
test("saring non-function callback (string)", 'saring("abc", [1, 2])', "Argument kapisan saring() kudu function");
test("itung non-function callback (array)", "itung([1], [1, 2])", "Argument kapisan itung() kudu function");
test("terapkan null callback", "terapkan(null, [1, 2])", "Argument kapisan terapkan() kudu function");

// 5. Non-array input
test("terapkan non-array input (number)", "guna f(x){bali x}\nterapkan(f, 123)", "Argument kapindho terapkan() kudu array");
test("saring non-array input (string)", 'guna f(x){bali bener}\nsaring(f, "abc")', "Argument kapindho saring() kudu array");
test("itung non-array input (object)", 'guna f(x){bali bener}\nitung(f, {"a": 1})', "Argument kapindho itung() kudu array");
test("terapkan null array", "guna f(x){bali x}\nterapkan(f, null)", "Argument kapindho terapkan() kudu array");

// 6. saring non-boolean return
test("saring returns number", "guna f(x){bali 123}\nsaring(f, [1, 2])", "Callback saring() kudu ngasilake boolean");
test("saring returns null", "guna f(x){bali null}\nsaring(f, [1, 2])", "Callback saring() kudu ngasilake boolean");
test("saring returns string", 'guna f(x){bali "ya"}\nsaring(f, [1, 2])', "Callback saring() kudu ngasilake boolean");

// 7. itung non-boolean return
test("itung returns number", "guna f(x){bali 123}\nitung(f, [1, 2])", "Callback itung() kudu ngasilake boolean");
test("itung returns null", "guna f(x){bali null}\nitung(f, [1, 2])", "Callback itung() kudu ngasilake boolean");
test("itung returns string", 'guna f(x){bali "bener"}\nitung(f, [1, 2])', "Callback itung() kudu ngasilake boolean");

// 8. Callback runtime error (propagate)
test("callback throw exception", 'guna f(x){lempar "kesalahan callback"}\nterapkan(f, [1])', "kesalahan callback");

// 9. Invalid function invocation
test("call number variable", "gawe x = 123\nx(5)", 'Variabel "x" dudu fungsi');
test("call string variable", 'gawe s = "halo"\ns()', 'Variabel "s" dudu fungsi');
test("call array literal", "[1, 2](5)", "Nilai ora bisa diceluk minangka fungsi");
test("call number in parens", "(123)(5)", "Nilai ora bisa diceluk minangka fungsi");

// 10. Function argument mismatch
test("direct call arg mismatch", "guna butuhLoro(a, b){bali a + b}\nbutuhLoro(1)", 'Function "butuhLoro" mbutuhake 2 argument');
test("callback arg mismatch", "guna butuhLoro(a, b){bali a + b}\nterapkan(butuhLoro, [1, 2])", 'Function "butuhLoro" mbutuhake 2 argument');

console.log(`\nHigher-Order Function Negative Test Results: ${passed}/${total} passed`);
if (passed !== total) {
    process.exit(1);
}
