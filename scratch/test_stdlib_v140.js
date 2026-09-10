/**
 * Jawalang V1.4.0 — Phase 10: Standard Library Foundation Test Suite
 *
 * Verifies all 10 new built-in functions (Math & String):
 * - Math: abs, min, max, akar, pangkat
 * - String: ngemot, diwiwiti, dipungkasi, trim, pecah
 *
 * Covers 12 testing categories (A to L) with 60+ meaningful assertions:
 * A. Math execution & edge cases
 * B. Math type validation
 * C. Math argument validation
 * D. String execution & edge cases
 * E. String type validation
 * F. String argument validation
 * G. Array integration
 * H. First-class builtin references
 * I. Higher-order function compatibility
 * J. Null handling
 * K. Error recovery with coba/tangkep
 * L. Regression of existing builtins
 */

const assert = require("assert");
const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");

console.log("================================================================");
console.log("    JAWALANG V1.4.0 — PHASE 10: STANDARD LIBRARY TEST SUITE     ");
console.log("================================================================\n");

function run(source) {
    const tokens = lexer(source);
    const ast = parser(tokens);
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));
    try {
        interpreter(ast);
        return logs;
    } finally {
        console.log = originalLog;
    }
}

function expectError(source, expectedMsgPart = null) {
    const tokens = lexer(source);
    const ast = parser(tokens);
    let thrown = null;
    try {
        interpreter(ast);
    } catch (e) {
        thrown = e;
    }
    assert.ok(thrown !== null, `Expected source to throw error, but succeeded: ${source}`);
    if (expectedMsgPart) {
        assert.ok(
            thrown.message.includes(expectedMsgPart),
            `Expected error message to contain "${expectedMsgPart}", but got: "${thrown.message}"`
        );
    }
    return thrown;
}

let totalAssertions = 0;
function pass(category, desc) {
    totalAssertions++;
    console.log(`PASS [${category}] ${desc}`);
}

// =================================================================
// CATEGORY A: Math Execution & Edge Cases
// =================================================================
console.log("--- CATEGORY A: Math Execution ---");

{
    // 1. abs
    const out = run(`
        tulis abs(-10)
        tulis abs(10)
        tulis abs(0)
        tulis abs(-3.14)
    `);
    assert.strictEqual(out[0], "10");
    assert.strictEqual(out[1], "10");
    assert.strictEqual(out[2], "0");
    assert.strictEqual(out[3], "3.14");
    pass("A", "abs() handles positive, negative, zero, and decimals");
}

{
    // 2. min
    const out = run(`
        tulis min(10, 20)
        tulis min(20, 10)
        tulis min(-5, -2)
        tulis min(3.5, 2.1)
    `);
    assert.strictEqual(out[0], "10");
    assert.strictEqual(out[1], "10");
    assert.strictEqual(out[2], "-5");
    assert.strictEqual(out[3], "2.1");
    pass("A", "min() returns smallest of two numbers");
}

{
    // 3. max
    const out = run(`
        tulis max(10, 20)
        tulis max(20, 10)
        tulis max(-5, -2)
        tulis max(3.5, 2.1)
    `);
    assert.strictEqual(out[0], "20");
    assert.strictEqual(out[1], "20");
    assert.strictEqual(out[2], "-2");
    assert.strictEqual(out[3], "3.5");
    pass("A", "max() returns largest of two numbers");
}

{
    // 4. akar
    const out = run(`
        tulis akar(25)
        tulis akar(0)
        tulis akar(1)
        tulis akar(4)
        tulis akar(2.25)
    `);
    assert.strictEqual(out[0], "5");
    assert.strictEqual(out[1], "0");
    assert.strictEqual(out[2], "1");
    assert.strictEqual(out[3], "2");
    assert.strictEqual(out[4], "1.5");
    pass("A", "akar() calculates square root accurately including decimals");
}

{
    // 5. pangkat
    const out = run(`
        tulis pangkat(2, 5)
        tulis pangkat(3, 2)
        tulis pangkat(10, 0)
        tulis pangkat(4, 0.5)
        tulis pangkat(2, -1)
        tulis pangkat(2, -2)
    `);
    assert.strictEqual(out[0], "32");
    assert.strictEqual(out[1], "9");
    assert.strictEqual(out[2], "1");
    assert.strictEqual(out[3], "2");
    assert.strictEqual(out[4], "0.5");
    assert.strictEqual(out[5], "0.25");
    pass("A", "pangkat() calculates exponentiation accurately including negative exponents");
}

// =================================================================
// CATEGORY B: Math Type Validation
// =================================================================
console.log("\n--- CATEGORY B: Math Type Validation ---");

{
    expectError('tulis abs("10")', 'mung bisa digunakake kanggo number');
    pass("B", "abs() rejects string");

    expectError('tulis abs(bener)', 'mung bisa digunakake kanggo number');
    pass("B", "abs() rejects boolean");

    expectError('tulis abs([1, 2])', 'mung bisa digunakake kanggo number');
    pass("B", "abs() rejects array");

    expectError('tulis min(10, "20")', 'Argument kapindho min() kudu number');
    pass("B", "min() rejects string second argument");

    expectError('tulis min("10", 20)', 'Argument kapisan min() kudu number');
    pass("B", "min() rejects string first argument");

    expectError('tulis max(10, "20")', 'Argument kapindho max() kudu number');
    pass("B", "max() rejects non-number arguments");

    expectError('tulis akar("25")', 'mung bisa digunakake kanggo number');
    pass("B", "akar() rejects string argument");

    expectError('tulis akar(-1)', 'ora kena negatif');
    pass("B", "akar() rejects negative numbers with clear error (no silent NaN)");

    expectError('tulis pangkat("2", 3)', 'Argument kapisan pangkat() kudu number');
    pass("B", "pangkat() rejects non-number base");

    expectError('tulis pangkat(2, "3")', 'Argument kapindho pangkat() kudu number');
    pass("B", "pangkat() rejects non-number exponent");

    expectError('tulis pangkat(-2, 0.5)', 'Pangkat pecahan kanggo angka negatif ora didhukung');
    pass("B", "pangkat() rejects fractional exponent on negative base");
}

// =================================================================
// CATEGORY C: Math Argument Validation
// =================================================================
console.log("\n--- CATEGORY C: Math Argument Validation ---");

{
    expectError('tulis abs()', 'mbutuhake 1 argument');
    pass("C", "abs() requires 1 argument (rejects 0)");

    expectError('tulis abs(1, 2)', 'mbutuhake 1 argument');
    pass("C", "abs() requires 1 argument (rejects 2)");

    expectError('tulis min(1)', 'mbutuhake 2 argument');
    pass("C", "min() requires 2 arguments (rejects 1)");

    expectError('tulis min(1, 2, 3)', 'mbutuhake 2 argument');
    pass("C", "min() requires 2 arguments (rejects 3)");

    expectError('tulis max(1)', 'mbutuhake 2 argument');
    pass("C", "max() requires 2 arguments (rejects 1)");

    expectError('tulis akar()', 'mbutuhake 1 argument');
    pass("C", "akar() requires 1 argument (rejects 0)");

    expectError('tulis pangkat(2)', 'mbutuhake 2 argument');
    pass("C", "pangkat() requires 2 arguments (rejects 1)");
}

// =================================================================
// CATEGORY D: String Execution & Edge Cases
// =================================================================
console.log("\n--- CATEGORY D: String Execution ---");

{
    // 1. ngemot
    const out = run(`
        tulis ngemot("Jawalang", "lang")
        tulis ngemot("Jawalang", "python")
        tulis ngemot("Basa Jawa", "")
    `);
    assert.strictEqual(out[0], "bener");
    assert.strictEqual(out[1], "salah");
    assert.strictEqual(out[2], "bener");
    pass("D", "ngemot() checks substring presence");
}

{
    // 2. diwiwiti
    const out = run(`
        tulis diwiwiti("Jawalang", "Jawa")
        tulis diwiwiti("Jawalang", "lang")
        tulis diwiwiti("Jawalang", "")
    `);
    assert.strictEqual(out[0], "bener");
    assert.strictEqual(out[1], "salah");
    assert.strictEqual(out[2], "bener");
    pass("D", "diwiwiti() checks prefix match");
}

{
    // 3. dipungkasi
    const out = run(`
        tulis dipungkasi("Jawalang", "lang")
        tulis dipungkasi("Jawalang", "Jawa")
        tulis dipungkasi("Jawalang", "")
    `);
    assert.strictEqual(out[0], "bener");
    assert.strictEqual(out[1], "salah");
    assert.strictEqual(out[2], "bener");
    pass("D", "dipungkasi() checks suffix match");
}

{
    // 4. trim
    const out = run(`
        tulis trim("  Jawa  ")
        tulis trim("Jawa")
        tulis trim("   ")
    `);
    assert.strictEqual(out[0], "Jawa");
    assert.strictEqual(out[1], "Jawa");
    assert.strictEqual(out[2], "");
    pass("D", "trim() strips leading and trailing whitespace");
}

{
    // 5. pecah
    const out = run(`
        gawe hasil = pecah("a,b,c", ",")
        tulis hasil
        gawe kata = pecah("siji loro telu", " ")
        tulis kata
    `);
    assert.strictEqual(out[0], '["a", "b", "c"]');
    assert.strictEqual(out[1], '["siji", "loro", "telu"]');
    pass("D", "pecah() splits string into array");
}

{
    // 6. Case sensitivity & multi-character delimiters
    const out = run(`
        tulis ngemot("Jawalang", "JAWA")
        tulis diwiwiti("Jawalang", "jawa")
        tulis dipungkasi("Jawalang", "LANG")
        tulis pecah("tunggal", ",")
        tulis pecah("siji::loro::telu", "::")
    `);
    assert.strictEqual(out[0], "salah");
    assert.strictEqual(out[1], "salah");
    assert.strictEqual(out[2], "salah");
    assert.strictEqual(out[3], '["tunggal"]');
    assert.strictEqual(out[4], '["siji", "loro", "telu"]');
    pass("D", "String builtins respect case sensitivity and support multi-character delimiters");
}

// =================================================================
// CATEGORY E: String Type Validation
// =================================================================
console.log("\n--- CATEGORY E: String Type Validation ---");

{
    expectError('tulis trim(10)', 'mung bisa digunakake kanggo string');
    pass("E", "trim() rejects non-string");

    expectError('tulis ngemot(10, "x")', 'Argument kapisan ngemot() kudu string');
    pass("E", "ngemot() rejects non-string first argument");

    expectError('tulis ngemot("halo", 10)', 'Argument kapindho ngemot() kudu string');
    pass("E", "ngemot() rejects non-string second argument");

    expectError('tulis diwiwiti(bener, "Jawa")', 'Argument kapisan diwiwiti() kudu string');
    pass("E", "diwiwiti() rejects non-string target");

    expectError('tulis diwiwiti("Jawalang", 123)', 'Argument kapindho diwiwiti() kudu string');
    pass("E", "diwiwiti() rejects non-string prefix");

    expectError('tulis dipungkasi(null, "lang")', 'Argument kapisan dipungkasi() kudu string');
    pass("E", "dipungkasi() rejects null target");

    expectError('tulis pecah(12345, ",")', 'Argument kapisan pecah() kudu string');
    pass("E", "pecah() rejects non-string first argument");

    expectError('tulis pecah("a,b,c", 10)', 'Argument kapindho pecah() kudu string');
    pass("E", "pecah() rejects non-string separator");
}

// =================================================================
// CATEGORY F: String Argument Validation
// =================================================================
console.log("\n--- CATEGORY F: String Argument Validation ---");

{
    expectError('tulis trim()', 'mbutuhake 1 argument');
    pass("F", "trim() requires 1 argument (rejects 0)");

    expectError('tulis trim("a", "b")', 'mbutuhake 1 argument');
    pass("F", "trim() requires 1 argument (rejects 2)");

    expectError('tulis ngemot("a")', 'mbutuhake 2 argument');
    pass("F", "ngemot() requires 2 arguments (rejects 1)");

    expectError('tulis diwiwiti("a")', 'mbutuhake 2 argument');
    pass("F", "diwiwiti() requires 2 arguments (rejects 1)");

    expectError('tulis dipungkasi("a")', 'mbutuhake 2 argument');
    pass("F", "dipungkasi() requires 2 arguments (rejects 1)");

    expectError('tulis pecah("a")', 'mbutuhake 2 argument');
    pass("F", "pecah() requires 2 arguments (rejects 1)");
}

// =================================================================
// CATEGORY G: Array Integration
// =================================================================
console.log("\n--- CATEGORY G: Array Integration ---");

{
    const out = run(`
        gawe teks = "apel,mangga,pisang"
        gawe woh = pecah(teks, ",")
        tulis dawa(woh)
        tulis jupuk(woh, 0)
        tulis jupuk(woh, 2)
        nambah(woh, "jeruk")
        tulis dawa(woh)
        tulis gabung(woh, " - ")
    `);
    assert.strictEqual(out[0], "3");
    assert.strictEqual(out[1], "apel");
    assert.strictEqual(out[2], "pisang");
    assert.strictEqual(out[3], "4");
    assert.strictEqual(out[4], "apel - mangga - pisang - jeruk");
    pass("G", "pecah() produces standard Jawalang array fully compatible with dawa, jupuk, nambah, gabung");
}

// =================================================================
// CATEGORY H: First-Class Builtin References
// =================================================================
console.log("\n--- CATEGORY H: First-Class Builtins ---");

{
    const out = run(`
        gawe fungsiAbs = abs
        tulis fungsiAbs(-42)
        gawe daftarFungsi = [abs, trim]
        tulis daftarFungsi[0](-99)
        tulis daftarFungsi[1]("  Halo Jawa  ")
    `);
    assert.strictEqual(out[0], "42");
    assert.strictEqual(out[1], "99");
    assert.strictEqual(out[2], "Halo Jawa");
    pass("H", "Builtins can be assigned to variables, arrays, and called dynamically");
}

// =================================================================
// CATEGORY I: Higher-Order Function Compatibility
// =================================================================
console.log("\n--- CATEGORY I: Higher-Order Compatibility ---");

{
    const out = run(`
        gawe data = [-2, 5, -7, 10]
        gawe positif = terapkan(abs, data)
        tulis positif

        gawe tembung = ["  siji  ", "  loro  ", "  telu  "]
        gawe resik = terapkan(trim, tembung)
        tulis resik
    `);
    assert.strictEqual(out[0], "[2, 5, 7, 10]");
    assert.strictEqual(out[1], '["siji", "loro", "telu"]');
    pass("I", "terapkan() works seamlessly with abs and trim");

    const out2 = run(`
        gawe tembung = ["apel", "jeruk", "pepaya", "anggur"]
        guna duweP(item) {
            bali ngemot(item, "p")
        }
        gawe disaring = saring(duweP, tembung)
        tulis disaring

        guna wiwitA(item) {
            bali diwiwiti(item, "a")
        }
        tulis ana(wiwitA, tembung)

        guna pungkasanX(item) {
            bali dipungkasi(item, "x")
        }
        tulis kabeh(pungkasanX, tembung)

        tulis golek(wiwitA, tembung)
    `);
    assert.strictEqual(out2[0], '["apel", "pepaya"]');
    assert.strictEqual(out2[1], "bener");
    assert.strictEqual(out2[2], "salah");
    assert.strictEqual(out2[3], "apel");
    pass("I", "saring, ana, kabeh, and golek work with string builtins in predicates");
}

// =================================================================
// CATEGORY J: Null Handling
// =================================================================
console.log("\n--- CATEGORY J: Null Handling ---");

{
    expectError('tulis abs(null)', 'mung bisa digunakake kanggo number');
    pass("J", "abs(null) throws clear type error");

    expectError('tulis min(null, 1)', 'Argument kapisan min() kudu number');
    pass("J", "min(null, 1) throws clear type error");

    expectError('tulis max(1, null)', 'Argument kapindho max() kudu number');
    pass("J", "max(1, null) throws clear type error");

    expectError('tulis trim(null)', 'mung bisa digunakake kanggo string');
    pass("J", "trim(null) throws clear type error");

    expectError('tulis ngemot(null, "a")', 'Argument kapisan ngemot() kudu string');
    pass("J", "ngemot(null, 'a') throws clear type error");
}

// =================================================================
// CATEGORY K: Error Recovery with coba/tangkep
// =================================================================
console.log("\n--- CATEGORY K: Error Recovery ---");

{
    const out = run(`
        gawe pesen = "ora ana error"
        coba {
            tulis akar(-16)
        } tangkep err {
            pesen = "kesalahan ditangkep"
        }
        tulis pesen

        gawe pesen2 = "awal"
        coba {
            tulis trim(12345)
        } tangkep err {
            pesen2 = "trim error ditangkep"
        }
        tulis pesen2
    `);
    assert.strictEqual(out[0], "kesalahan ditangkep");
    assert.strictEqual(out[1], "trim error ditangkep");
    pass("K", "Errors thrown by math and string builtins are cleanly catchable via coba/tangkep");
}

// =================================================================
// CATEGORY L: Regression of Existing Builtins
// =================================================================
console.log("\n--- CATEGORY L: Regression of Existing Builtins ---");

{
    const out = run(`
        tulis jinis(123)
        tulis dawa("Jawa")
        tulis motong("Jawalang", 0, 4)
        tulis ngganti("Halo Dunya", "Dunya", "Jawa")
        tulis gedhe("jawa")
        tulis cilik("JAWA")
        gawe arr = [3, 1, 2]
        tulis urut(arr)
        tulis balik(arr)
    `);
    assert.strictEqual(out[0], "number");
    assert.strictEqual(out[1], "4");
    assert.strictEqual(out[2], "Jawa");
    assert.strictEqual(out[3], "Halo Jawa");
    assert.strictEqual(out[4], "JAWA");
    assert.strictEqual(out[5], "jawa");
    assert.strictEqual(out[6], "[1, 2, 3]");
    assert.strictEqual(out[7], "[2, 1, 3]");
    pass("L", "Existing builtins continue to work with 100% fidelity");
}

// =================================================================
// CATEGORY M: LSP Synchronization
// =================================================================
console.log("\n--- CATEGORY M: LSP Synchronization ---");

{
    const { BUILTINS } = require("../language-server/src/utils");
    const analyzer = require("../language-server/src/analyzer");
    const { getHover } = require("../language-server/src/hover");
    const { getCompletions } = require("../language-server/src/completion");
    const { getSignatureHelp } = require("../language-server/src/signatureHelp");
    const { getSemanticTokens, decodeSemanticTokens, semanticTokensLegend, MODIFIER_DEFAULT_LIBRARY } = require("../language-server/src/semanticTokens");

    const expectedNewBuiltins = ["abs", "min", "max", "akar", "pangkat", "ngemot", "diwiwiti", "dipungkasi", "trim", "pecah"];

    // 1. BUILTINS registry presence
    for (const b of expectedNewBuiltins) {
        assert.ok(BUILTINS[b], `Expected BUILTINS to contain "${b}"`);
        assert.ok(BUILTINS[b].signature, `Expected "${b}" to have signature`);
        assert.ok(BUILTINS[b].description, `Expected "${b}" to have description`);
    }
    pass("M", "All 10 new builtins exist in LSP BUILTINS registry with metadata");

    // 2. Completion
    const analysis = analyzer.analyze("gawe x = ", "file:///test_lsp_sync.jawa");
    const compItems = getCompletions(analysis, { line: 0, character: 9 });
    for (const b of expectedNewBuiltins) {
        const item = compItems.find(it => it.label === b);
        assert.ok(item, `Expected completion item for "${b}"`);
        assert.ok(item.documentation, `Expected documentation for "${b}" in completion`);
    }
    pass("M", "All 10 new builtins appear in LSP Completion with documentation");

    // 3. Hover
    const hoverAnalysis = analyzer.analyze("gawe a = abs(-10)\ngawe s = trim(\"x\")", "file:///test_hover_sync.jawa");
    const hoverAbs = getHover(hoverAnalysis, { line: 0, character: 10 });
    assert.ok(hoverAbs, "Expected hover for abs");
    assert.ok(hoverAbs.contents.value.includes("abs(angka: number)"), "Expected abs signature in hover");
    const hoverTrim = getHover(hoverAnalysis, { line: 1, character: 10 });
    assert.ok(hoverTrim, "Expected hover for trim");
    assert.ok(hoverTrim.contents.value.includes("trim(teks: string)"), "Expected trim signature in hover");
    pass("M", "LSP Hover displays accurate signature and documentation for new builtins");

    // 4. Signature Help
    const sigAnalysis = analyzer.analyze("pangkat(2, ", "file:///test_sig_sync.jawa");
    const sig = getSignatureHelp(sigAnalysis, { line: 0, character: 11 });
    assert.ok(sig && sig.signatures && sig.signatures.length > 0, "Expected signature help for pangkat");
    assert.strictEqual(sig.activeParameter, 1, "Expected activeParameter: 1 for second argument of pangkat");
    pass("M", "LSP Signature Help tracks activeParameter accurately for new builtins");

    // 5. Semantic Tokens defaultLibrary
    const semAnalysis = analyzer.analyze("gawe r = min(1, 2)", "file:///test_sem_sync.jawa");
    const res = getSemanticTokens(semAnalysis);
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    const minTok = decoded.find(t => t.line === 0 && t.character === 9);
    assert.ok(minTok, "Expected semantic token for min");
    assert.strictEqual(minTok.tokenType, "function");
    assert.ok((minTok.modifiers & MODIFIER_DEFAULT_LIBRARY) !== 0, "Expected defaultLibrary modifier on min");
    pass("M", "LSP Semantic Tokens highlights new builtins with defaultLibrary modifier");
}

console.log("\n================================================================");
console.log(`  ALL STANDARD LIBRARY TESTS PASSED (${totalAssertions} ASSERTIONS) `);
console.log("================================================================\n");
