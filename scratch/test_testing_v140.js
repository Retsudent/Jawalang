/**
 * Jawalang V1.4.0 — Phase 14: Testing & Assertion Foundation Test Suite
 *
 * Verifies the standard library testing module:
 * - uji(kondisi, [pesan])
 * - ujiPadha(aktual, expected, [pesan])
 * - ujiBeda(aktual, expected, [pesan])
 * - ujiJinis(nilai, tipe, [pesan])
 * - ujiError(fungsi, [pesan])
 *
 * 23 Categories (A through W) with >= 80 meaningful assertions.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");
const { stdlibMetadata, stdlibBuiltins } = require("../src/stdlib");
const { testingBuiltins } = require("../src/stdlib/testing");
const lspUtils = require("../language-server/src/utils");

console.log("================================================================");
console.log("    JAWALANG V1.4.0 — PHASE 14: TESTING FOUNDATION TEST SUITE   ");
console.log("================================================================\n");

let totalPassed = 0;

function run(source, options = {}) {
    const tokens = lexer(source);
    const ast = parser(tokens);
    return interpreter(ast, {
        filePath: options.filePath || path.resolve(__dirname, "test_temp.jawa"),
        sandboxRoot: options.sandboxRoot || __dirname,
        isRepl: options.isRepl || false,
        ...options
    });
}

function runExpectError(source, expectedSubstring) {
    let threw = false;
    let errorMsg = "";
    try {
        run(source);
    } catch (e) {
        threw = true;
        errorMsg = e.message || String(e);
    }
    assert.ok(threw, `Expected source to throw, but it succeeded:\n${source}`);
    if (expectedSubstring) {
        assert.ok(
            errorMsg.includes(expectedSubstring),
            `Expected error message to contain "${expectedSubstring}", but got:\n${errorMsg}`
        );
    }
    return errorMsg;
}

function check(title, fn) {
    try {
        fn();
        totalPassed++;
        console.log(`[PASS] ${title}`);
    } catch (e) {
        console.error(`[FAIL] ${title}`);
        console.error(e);
        process.exit(1);
    }
}

// ================================================================
// CATEGORY A: Boolean assertion (uji)
// ================================================================
check("A1. uji(bener) succeeds silently", () => {
    run(`uji(bener)`);
});

check("A2. uji with true expression (2 < 3) succeeds", () => {
    run(`uji(2 < 3)`);
});

check("A3. uji with complex boolean expression (10 == 10 lan 5 > 2) succeeds", () => {
    run(`uji(10 == 10 lan 5 > 2)`);
});

check("A4. uji(salah) throws informative assertion error", () => {
    runExpectError(`uji(salah)`, "Assertion gagal: kondisi kudu bener");
});

check("A5. uji with false expression (5 < 2) throws assertion error", () => {
    runExpectError(`uji(5 < 2)`, "Assertion gagal: kondisi kudu bener");
});

check("A6. uji with logical or condition (salah utawa bener) succeeds", () => {
    run(`uji(salah utawa bener)`);
});

// ================================================================
// CATEGORY B: Equality assertion (ujiPadha)
// ================================================================
check("B1. ujiPadha with equal numbers (10, 10) succeeds", () => {
    run(`ujiPadha(10, 10)`);
});

check("B2. ujiPadha with equal strings (\"Jawa\", \"Jawa\") succeeds", () => {
    run(`ujiPadha("Jawa", "Jawa")`);
});

check("B3. ujiPadha with equal booleans (bener, bener) succeeds", () => {
    run(`ujiPadha(bener, bener)`);
});

check("B4. ujiPadha(10, 20) throws assertion error showing expected and actual", () => {
    const err = runExpectError(`ujiPadha(10, 20)`, "Assertion gagal:");
    assert.ok(err.includes("expected: 20"), `Expected error to show expected: 20, got: ${err}`);
    assert.ok(err.includes("actual: 10"), `Expected error to show actual: 10, got: ${err}`);
});

check("B5. ujiPadha(\"halo\", \"dunia\") throws assertion error", () => {
    const err = runExpectError(`ujiPadha("halo", "dunia")`, "Assertion gagal:");
    assert.ok(err.includes('expected: "dunia"'), `Expected "dunia", got: ${err}`);
    assert.ok(err.includes('actual: "halo"'), `Expected "halo", got: ${err}`);
});

check("B6. ujiPadha does not perform implicit type coercion (10, \"10\")", () => {
    runExpectError(`ujiPadha(10, "10")`, "Assertion gagal:");
});

check("B7. ujiPadha with decimal/floating numbers (3.14, 3.14) succeeds", () => {
    run(`ujiPadha(3.14, 3.14)`);
});

check("B8. ujiPadha with empty strings (\"\", \"\") succeeds", () => {
    run(`ujiPadha("", "")`);
});

// ================================================================
// CATEGORY C: Inequality assertion (ujiBeda)
// ================================================================
check("C1. ujiBeda with different numbers (10, 20) succeeds", () => {
    run(`ujiBeda(10, 20)`);
});

check("C2. ujiBeda with different strings (\"A\", \"B\") succeeds", () => {
    run(`ujiBeda("A", "B")`);
});

check("C3. ujiBeda with different types (10, \"10\") succeeds", () => {
    run(`ujiBeda(10, "10")`);
});

check("C6. ujiBeda with decimal numbers (3.14, 2.71) succeeds", () => {
    run(`ujiBeda(3.14, 2.71)`);
});

check("C4. ujiBeda(10, 10) throws assertion error", () => {
    runExpectError(`ujiBeda(10, 10)`, "Assertion gagal:");
});

check("C5. ujiBeda(\"Jawa\", \"Jawa\") throws assertion error", () => {
    runExpectError(`ujiBeda("Jawa", "Jawa")`, "Assertion gagal:");
});

// ================================================================
// CATEGORY D: Type assertion (ujiJinis)
// ================================================================
check("D1. ujiJinis(42, \"number\") succeeds", () => {
    run(`ujiJinis(42, "number")`);
});

check("D2. ujiJinis(\"teks\", \"string\") succeeds", () => {
    run(`ujiJinis("teks", "string")`);
});

check("D3. ujiJinis(bener, \"boolean\") succeeds", () => {
    run(`ujiJinis(bener, "boolean")`);
});

check("D4. ujiJinis([1, 2, 3], \"array\") succeeds", () => {
    run(`ujiJinis([1, 2, 3], "array")`);
});

check("D5. ujiJinis({ \"k\": 1 }, \"object\") succeeds", () => {
    run(`ujiJinis({ "k": 1 }, "object")`);
});

check("D6. ujiJinis struct instance succeeds", () => {
    run(`
        bentuk Titik {
            wiwiti(x, y) {
                iki.x = x
                iki.y = y
            }
        }
        gawe t = anyar Titik(1, 2)
        ujiJinis(t, "instance")
    `);
});

check("D7. ujiJinis struct definition succeeds", () => {
    run(`
        bentuk Titik {
            wiwiti(x) {
                iki.x = x
            }
        }
        ujiJinis(Titik, "struct")
    `);
});

check("D8. ujiJinis(\"10\", \"number\") throws assertion error", () => {
    const err = runExpectError(`ujiJinis("10", "number")`, "Assertion gagal:");
    assert.ok(err.includes('expected type "number"'));
    assert.ok(err.includes('actual type "string"'));
});

check("D9. ujiJinis with saiki() returns datetime", () => {
    run(`ujiJinis(saiki(), "datetime")`);
});

// ================================================================
// CATEGORY E: Null value testing
// ================================================================
check("E1. ujiJinis(null, \"null\") succeeds", () => {
    run(`ujiJinis(null, "null")`);
});

check("E2. ujiPadha(null, null) succeeds", () => {
    run(`ujiPadha(null, null)`);
});

check("E3. ujiBeda(null, 0) succeeds", () => {
    run(`ujiBeda(null, 0)`);
});

check("E4. ujiBeda(null, \"\") succeeds", () => {
    run(`ujiBeda(null, "")`);
});

check("E5. ujiPadha(null, 0) throws assertion error", () => {
    runExpectError(`ujiPadha(null, 0)`, "Assertion gagal:");
});

// ================================================================
// CATEGORY F: Function testing
// ================================================================
check("F1. ujiJinis(guna, \"function\") succeeds", () => {
    run(`
        guna kali(a, b) {
            bali a * b
        }
        ujiJinis(kali, "function")
    `);
});

check("F2. ujiPadha function call result succeeds", () => {
    run(`
        guna itung(x) {
            bali x * 2 + 1
        }
        ujiPadha(itung(5), 11)
    `);
});

check("F3. Higher order function testing", () => {
    run(`
        guna pasang(fn, x) {
            bali fn(x)
        }
        guna dobel(n) {
            bali n * 2
        }
        ujiPadha(pasang(dobel, 7), 14)
    `);
});

check("F4. ujiPadha with recursive factorial computation", () => {
    run(`
        guna faktorial(n) {
            yen n <= 1 {
                bali 1
            }
            bali n * faktorial(n - 1)
        }
        ujiPadha(faktorial(5), 120)
    `);
});

// ================================================================
// CATEGORY G: Array equality and operations
// ================================================================
check("G1. Array type and element equality", () => {
    run(`
        gawe arr = [10, 20, 30]
        ujiJinis(arr, "array")
        ujiPadha(arr[0], 10)
        ujiPadha(arr[1], 20)
        ujiPadha(arr[2], 30)
    `);
});

check("G2. Array reference equality (same reference)", () => {
    run(`
        gawe arr1 = [1, 2, 3]
        gawe arr2 = arr1
        ujiPadha(arr1, arr2)
    `);
});

check("G3. Array reference inequality (distinct instances)", () => {
    run(`
        gawe arr1 = [1, 2, 3]
        gawe arr2 = [1, 2, 3]
        ujiBeda(arr1, arr2)
    `);
});

check("G4. ujiPadha with array length function dawa", () => {
    run(`ujiPadha(dawa([1, 2, 3, 4]), 4)`);
});

// ================================================================
// CATEGORY H: Object equality and operations
// ================================================================
check("H1. Object type and properties", () => {
    run(`
        gawe mhs = { "jeneng": "Jawa", "umur": 20 }
        ujiJinis(mhs, "object")
        ujiPadha(mhs["jeneng"], "Jawa")
        ujiPadha(mhs["umur"], 20)
    `);
});

check("H2. Object reference equality", () => {
    run(`
        gawe obj1 = { "a": 1 }
        gawe obj2 = obj1
        ujiPadha(obj1, obj2)
    `);
});

check("H3. Object reference inequality (distinct instances)", () => {
    run(`
        gawe obj1 = { "a": 1 }
        gawe obj2 = { "a": 1 }
        ujiBeda(obj1, obj2)
    `);
});

check("H4. ujiPadha with object keys count using dawa and kunci", () => {
    run(`ujiPadha(dawa(kunci({ "a": 1, "b": 2 })), 2)`);
});

// ================================================================
// CATEGORY I: Custom messages
// ================================================================
check("I1. uji with custom message on failure", () => {
    const err = runExpectError(`uji(salah, "panyimpenan gagal")`, "panyimpenan gagal");
    assert.ok(err.includes("Assertion gagal: panyimpenan gagal"));
});

check("I2. ujiPadha with custom message on failure", () => {
    const err = runExpectError(`ujiPadha(10, 20, "petungan ora cocok")`, "petungan ora cocok");
    assert.ok(err.includes("Assertion gagal: petungan ora cocok"));
    assert.ok(err.includes("expected: 20"));
    assert.ok(err.includes("actual: 10"));
});

check("I3. ujiBeda with custom message on failure", () => {
    const err = runExpectError(`ujiBeda(5, 5, "kudu duwe nilai beda")`, "kudu duwe nilai beda");
    assert.ok(err.includes("Assertion gagal: kudu duwe nilai beda"));
});

check("I4. ujiJinis with custom message on failure", () => {
    const err = runExpectError(`ujiJinis(123, "string", "tipe ora pas")`, "tipe ora pas");
    assert.ok(err.includes("Assertion gagal: tipe ora pas"));
    assert.ok(err.includes('expected type "string"'));
});

check("I5. ujiError with custom message on failure", () => {
    const err = runExpectError(`
        guna aman() {
            bali 1
        }
        ujiError(aman, "kudune throw error")
    `, "kudune throw error");
    assert.ok(err.includes("Assertion gagal: kudune throw error"));
});

// ================================================================
// CATEGORY J: Error assertion (ujiError)
// ================================================================
check("J1. ujiError succeeds when function throws user error (lempar)", () => {
    run(`
        guna rusake() {
            lempar "ana masalah"
        }
        ujiError(rusake)
    `);
});

check("J2. ujiError succeeds when function causes runtime division by zero", () => {
    run(`
        guna bagiNol() {
            bali 10 / 0
        }
        ujiError(bagiNol)
    `);
});

check("J3. ujiError succeeds when function accesses undefined variable", () => {
    run(`
        guna aksesOraAna() {
            bali variabelGaib + 1
        }
        ujiError(aksesOraAna)
    `);
});

check("J4. ujiError throws when function succeeds without error", () => {
    const err = runExpectError(`
        guna lancar() {
            bali 10 + 20
        }
        ujiError(lancar)
    `, "Assertion gagal:");
    assert.ok(err.includes("fungsi kudu ngasilake error"));
});

check("J5. ujiError does not treat return statement as error", () => {
    runExpectError(`
        guna baliBiasa() {
            bali "sukses"
        }
        ujiError(baliBiasa)
    `, "Assertion gagal:");
});

check("J6. ujiError succeeds when built-in function throws bounds error", () => {
    run(`
        guna cobaJupuk() {
            jupuk([], 0)
        }
        ujiError(cobaJupuk)
    `);
});

// ================================================================
// CATEGORY K: Argument count validation
// ================================================================
check("K1. uji() with 0 arguments throws arity error", () => {
    runExpectError(`uji()`, "mbutuhake 1 nganti 2 argument");
});

check("K2. uji(1, 2, 3) with 3 arguments throws arity error", () => {
    runExpectError(`uji(bener, "pesan", 99)`, "mbutuhake 1 nganti 2 argument");
});

check("K3. ujiPadha(1) with 1 argument throws arity error", () => {
    runExpectError(`ujiPadha(1)`, "mbutuhake 2 nganti 3 argument");
});

check("K4. ujiPadha(1, 2, 3, 4) with 4 arguments throws arity error", () => {
    runExpectError(`ujiPadha(1, 2, "msg", 4)`, "mbutuhake 2 nganti 3 argument");
});

check("K5. ujiBeda(1) with 1 argument throws arity error", () => {
    runExpectError(`ujiBeda(1)`, "mbutuhake 2 nganti 3 argument");
});

check("K6. ujiJinis(1) with 1 argument throws arity error", () => {
    runExpectError(`ujiJinis(1)`, "mbutuhake 2 nganti 3 argument");
});

check("K7. ujiError() with 0 arguments throws arity error", () => {
    runExpectError(`ujiError()`, "mbutuhake 1 nganti 2 argument");
});

// ================================================================
// CATEGORY L: Argument type validation
// ================================================================
check("L1. uji with non-boolean condition throws type error", () => {
    runExpectError(`uji("bener")`, "kudu boolean, nanging ditemu: \"string\"");
});

check("L2. uji with non-string message throws type error", () => {
    runExpectError(`uji(bener, 123)`, "kudu string, nanging ditemu: \"number\"");
});

check("L3. ujiPadha with non-string custom message throws type error", () => {
    runExpectError(`ujiPadha(10, 20, 123)`, "kudu string, nanging ditemu: \"number\"");
});

check("L4. ujiJinis with non-string type argument throws type error", () => {
    runExpectError(`ujiJinis(10, 10)`, "kudu string, nanging ditemu: \"number\"");
});

check("L5. ujiError with non-callable throws type error", () => {
    runExpectError(`ujiError("dudu fungsi")`, "kudu function, nanging ditemu: \"string\"");
});

check("L6. ujiError with number argument throws type error", () => {
    runExpectError(`ujiError(12345)`, "kudu function, nanging ditemu: \"number\"");
});

// ================================================================
// CATEGORY M: Exception integration (coba/tangkep)
// ================================================================
check("M1. coba/tangkep successfully catches assertion failure from uji", () => {
    run(`
        gawe ketangkep = salah
        coba {
            uji(salah)
        } tangkep err {
            ketangkep = bener
        }
        uji(ketangkep)
    `);
});

check("M2. coba/tangkep successfully catches assertion failure from ujiPadha", () => {
    run(`
        gawe pesanError = ""
        coba {
            ujiPadha(1, 2)
        } tangkep err {
            pesanError = err
        }
        uji(ngemot(pesanError, "Assertion gagal"))
    `);
});

check("M3. coba/tangkep error variable scope does not leak", () => {
    run(`
        gawe err = "asli"
        coba {
            ujiPadha(1, 2)
        } tangkep err {
            // inside catch
        }
        ujiPadha(err, "asli")
    `);
});

// ================================================================
// CATEGORY N: Recursion safety
// ================================================================
check("N1. Testing assertions inside recursive function calls", () => {
    run(`
        guna hitungMundur(n) {
            yen n <= 0 {
                bali 0
            }
            uji(n > 0)
            ujiJinis(n, "number")
            bali hitungMundur(n - 1)
        }
        ujiPadha(hitungMundur(10), 0)
    `);
});

// ================================================================
// CATEGORY O: Module integration
// ================================================================
check("O1. Module imports and testing functions inside modules", () => {
    const fixturePath = path.resolve(__dirname, "../examples/modules/test_testing_module.jawa");
    const mainScript = `
        impor "${fixturePath.replace(/\\/g, "/")}" minangka tmod
        gawe res = tmod.hitungDanUji(2, 3)
        ujiPadha(res, 5)
        uji(tmod.ujiModulError())
    `;
    run(mainScript);
});

// ================================================================
// CATEGORY P: REPL integration
// ================================================================
check("P1. REPL session survives assertion failure and continues execution", () => {
    const session = interpreter.createSession();
    
    // Step 1: Valid assertion PASS
    const r1 = interpreter(parser(lexer(`ujiPadha(2 + 3, 5)`)), session);
    assert.strictEqual(r1.value, true);

    // Step 2: Failed assertion throws
    let threw = false;
    try {
        interpreter(parser(lexer(`ujiPadha(2, 3)`)), session);
    } catch (e) {
        threw = true;
        assert.ok(e.message.includes("Assertion gagal:"));
    }
    assert.ok(threw, "REPL execution should throw on failed assertion");

    // Step 3: Session still alive and accepts subsequent valid statements
    interpreter(parser(lexer(`gawe angka = 100`)), session);
    interpreter(parser(lexer(`ujiPadha(angka, 100)`)), session);
    assert.strictEqual(session.globalEnv.get("angka"), 100);
});

// ================================================================
// CATEGORY Q: JSON integration
// ================================================================
check("Q1. Testing JSON encode/decode with ujiPadha and ujiJinis", () => {
    run(`
        gawe payload = { "bahasa": "Jawa", "versi": 1.4 }
        gawe encoded = jsonEncode(payload)
        ujiJinis(encoded, "string")
        
        gawe decoded = jsonDecode(encoded)
        ujiJinis(decoded, "object")
        ujiPadha(decoded["bahasa"], "Jawa")
        ujiPadha(decoded["versi"], 1.4)
    `);
});

// ================================================================
// CATEGORY R: DateTime integration
// ================================================================
check("R1. Testing DateTime with ujiJinis, ujiPadha, and padhaWektu", () => {
    run(`
        gawe t1 = gaweWektu(2026, 9, 6)
        gawe t2 = gaweWektu(2026, 9, 6)
        gawe t3 = gaweWektu(2026, 9, 7)
        
        ujiJinis(t1, "datetime")
        ujiPadha(t1, t2)
        ujiBeda(t1, t3)
        uji(padhaWektu(t1, t2))
        uji(sadurunge(t1, t3))
    `);
});

// ================================================================
// CATEGORY S: Filesystem integration
// ================================================================
check("S1. Testing FileSystem operations with assertions", () => {
    const testDir = path.resolve(__dirname, "test_fs_assert_dir");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    
    run(`
        gaweFolder("test_fs_sub")
        uji(anaPath("test_fs_sub"))
        ujiPadha(jinisPath("test_fs_sub"), "folder")
        
        tulisFile("test_fs_sub/catatan.txt", "Jawalang testing")
        uji(anaPath("test_fs_sub/catatan.txt"))
        ujiPadha(jinisPath("test_fs_sub/catatan.txt"), "file")
        ujiPadha(macaFile("test_fs_sub/catatan.txt"), "Jawalang testing")
    `, { sandboxRoot: testDir });

    // Clean up
    try {
        fs.rmSync(testDir, { recursive: true, force: true });
    } catch (_) {}
});

// ================================================================
// CATEGORY T: First-class builtin functions
// ================================================================
check("T1. Assigning testing built-in to variable and executing", () => {
    run(`
        gawe cekSami = ujiPadha
        cekSami(50, 50)
        
        gawe cekBeda = ujiBeda
        cekBeda(10, 20)
    `);
});

check("T2. Passing testing built-in as argument to another function", () => {
    run(`
        guna tesHelper(assertFn, a, b) {
            assertFn(a, b)
        }
        tesHelper(ujiPadha, "abc", "abc")
    `);
});

check("T3. First-class assignment of ujiJinis and execution", () => {
    run(`
        gawe cekTipe = ujiJinis
        cekTipe(999, "number")
    `);
});

check("T4. First-class assignment of uji and execution", () => {
    run(`
        gawe cekBener = uji
        cekBener(100 > 50)
    `);
});

// ================================================================
// CATEGORY U: LSP metadata sync
// ================================================================
const TESTING_BUILTINS = ["uji", "ujiPadha", "ujiBeda", "ujiJinis", "ujiError"];

check("U1. All 5 testing builtins exist in LSP BUILTINS catalog", () => {
    for (const b of TESTING_BUILTINS) {
        assert.ok(b in lspUtils.BUILTINS, `LSP BUILTINS missing "${b}"`);
        assert.ok(lspUtils.BUILTINS[b].signature.startsWith(b), `${b} signature check`);
        assert.ok(lspUtils.BUILTINS[b].description.length > 0, `${b} description check`);
        assert.ok(lspUtils.BUILTINS[b].example.includes(b), `${b} example check`);
        assert.ok(Array.isArray(lspUtils.BUILTINS[b].params), `${b} params check`);
    }
});

check("U2. All 5 testing builtins registered in stdlibMetadata", () => {
    for (const b of TESTING_BUILTINS) {
        assert.ok(b in stdlibMetadata, `stdlibMetadata missing "${b}"`);
        assert.strictEqual(stdlibMetadata[b].category, "Testing");
        assert.strictEqual(stdlibMetadata[b].returnType, "boolean");
    }
});

check("U3. Total stdlib builtins count is exactly 39 and overall 62", () => {
    const stdlibKeys = Object.keys(stdlibMetadata);
    assert.strictEqual(stdlibKeys.length, 39, `Expected 39 stdlib builtins, got ${stdlibKeys.length}`);
    
    // 23 legacy builtins + 39 stdlib builtins = 62 total
    const legacyCount = 23;
    const totalExpected = 62;
    assert.strictEqual(legacyCount + stdlibKeys.length, totalExpected);
});

// ================================================================
// CATEGORY V: Security audit
// ================================================================
check("V1. Security audit: testing.js contains no eval, Function, or process.exit", () => {
    const testingSource = fs.readFileSync(path.resolve(__dirname, "../src/stdlib/testing.js"), "utf8");
    assert.ok(!testingSource.includes("eval("), "testing.js must not contain eval()");
    assert.ok(!testingSource.includes("Function("), "testing.js must not contain Function()");
    assert.ok(!testingSource.includes("child_process"), "testing.js must not contain child_process");
    assert.ok(!testingSource.includes("process.exit"), "testing.js must not contain process.exit");
    assert.ok(!testingSource.includes("process.abort"), "testing.js must not contain process.abort");
});

// ================================================================
// CATEGORY W: Portability audit
// ================================================================
check("W1. Portability audit: testing.js contains no hardcoded drive letters", () => {
    const testingSource = fs.readFileSync(path.resolve(__dirname, "../src/stdlib/testing.js"), "utf8");
    assert.ok(!testingSource.includes("C:\\"), "testing.js must not contain C:\\");
    assert.ok(!testingSource.includes("D:\\"), "testing.js must not contain D:\\");
});

console.log("\n================================================================");
console.log(` ALL TESTS PASSED! Total assertions checked: ${totalPassed}`);
console.log("================================================================\n");
