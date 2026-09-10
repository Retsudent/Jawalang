/**
 * Jawalang V1.4.0 — Phase 11: Date & Time Test Suite
 *
 * Exhaustive automated validation for Date & Time standard library:
 * A. Current time (saiki)
 * B. Timestamp (timestamp)
 * C. Construction (gaweWektu)
 * D. Components (taun, wulan, dina, jam, menit, detik)
 * E. Formatting (formatWektu)
 * F. Parsing (parseWektu)
 * G. Comparison (sadurunge, sawise, padhaWektu)
 * H. Arithmetic (tambahWektu, kurangWektu)
 * I. Immutability
 * J. Invalid date protection
 * K. Leap year rules
 * L. Month boundary transitions
 * M. Argument validation
 * N. Type validation
 * O. First-class builtin & HOF
 * P. Array/object integration
 * Q. Module integration
 * R. REPL compatibility
 * S. Error recovery (coba/tangkep)
 * T. LSP synchronization
 */

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");
const { ReplSession } = require("../src/repl");
const { BUILTINS } = require("../language-server/src/utils");
const { getCompletions } = require("../language-server/src/completion");
const { getHover } = require("../language-server/src/hover");
const { getSignatureHelp } = require("../language-server/src/signatureHelp");
const { getSemanticTokens } = require("../language-server/src/semanticTokens");
const analyzer = require("../language-server/src/analyzer");

let passedCount = 0;

function runCode(code, options = {}) {
    const tokens = lexer(code);
    const ast = parser(tokens);
    const output = [];
    const origLog = console.log;
    console.log = (...args) => {
        output.push(args.map(a => String(a)).join(" "));
    };
    try {
        interpreter(ast, options);
        return { success: true, output };
    } catch (err) {
        return { success: false, error: err.message, output };
    } finally {
        console.log = origLog;
    }
}

function expectSuccess(code, desc, options = {}) {
    const res = runCode(code, options);
    assert.ok(res.success, `Expected success for: ${desc}, got error: ${res.error}`);
    console.log(`PASS: ${desc}`);
    passedCount++;
    return res.output;
}

function expectError(code, expectedPattern, desc, options = {}) {
    const res = runCode(code, options);
    assert.strictEqual(res.success, false, `Expected error for: ${desc}, but succeeded with output: ${res.output}`);
    assert.ok(
        res.error.includes(expectedPattern),
        `Expected error to include "${expectedPattern}" for: ${desc}, but got: "${res.error}"`
    );
    console.log(`PASS [Error]: ${desc}`);
    passedCount++;
}

console.log("================================================================");
console.log("    JAWALANG V1.4.0 — PHASE 11: DATE & TIME TEST SUITE          ");
console.log("================================================================");

// --- CATEGORY A: Current Time (saiki) ---
console.log("\n--- CATEGORY A: Current Time (saiki) ---");
{
    const out = expectSuccess(`
        gawe w1 = saiki()
        gawe w2 = saiki()
        tulis jinis(w1)
        tulis timestamp(w1) > 1700000000000
        tulis sadurunge(w1, w2) utawa padhaWektu(w1, w2)
    `, "saiki() returns valid DateTime with realistic increasing timestamp");
    assert.strictEqual(out[0], "datetime");
    assert.strictEqual(out[1], "bener");
    assert.strictEqual(out[2], "bener");
}

// --- CATEGORY B: Timestamp (timestamp) ---
console.log("\n--- CATEGORY B: Timestamp (timestamp) ---");
{
    const out = expectSuccess(`
        gawe w = parseWektu("1970-01-01 00:00:00")
        tulis timestamp(w)
        gawe w2 = parseWektu("2026-09-06 00:00:00")
        tulis jinis(timestamp(w2))
    `, "timestamp() returns exact milliseconds integer");
    assert.strictEqual(out[0], "0");
    assert.strictEqual(out[1], "number");
}

// --- CATEGORY C: Construction (gaweWektu) ---
console.log("\n--- CATEGORY C: Construction (gaweWektu) ---");
{
    const out = expectSuccess(`
        gawe w1 = gaweWektu(0)
        tulis formatWektu(w1, "YYYY-MM-DD")

        gawe w2 = gaweWektu(2026, 9, 6)
        tulis formatWektu(w2, "YYYY-MM-DD HH:mm:ss")

        gawe w3 = gaweWektu(2026, 12, 31, 23, 59, 59)
        tulis formatWektu(w3, "YYYY-MM-DD HH:mm:ss")
    `, "gaweWektu() constructs from timestamp, 3 components, and 6 components");
    assert.strictEqual(out[0], "1970-01-01");
    assert.strictEqual(out[1], "2026-09-06 00:00:00");
    assert.strictEqual(out[2], "2026-12-31 23:59:59");
}

// --- CATEGORY D: Component Accessors ---
console.log("\n--- CATEGORY D: Component Accessors ---");
{
    const out = expectSuccess(`
        gawe w = gaweWektu(2026, 9, 6, 14, 35, 48)
        tulis taun(w)
        tulis wulan(w)
        tulis dina(w)
        tulis jam(w)
        tulis menit(w)
        tulis detik(w)
    `, "taun, wulan, dina, jam, menit, detik extract exact UTC values");
    assert.strictEqual(out[0], "2026");
    assert.strictEqual(out[1], "9");
    assert.strictEqual(out[2], "6");
    assert.strictEqual(out[3], "14");
    assert.strictEqual(out[4], "35");
    assert.strictEqual(out[5], "48");
}

// --- CATEGORY E: Formatting (formatWektu) ---
console.log("\n--- CATEGORY E: Formatting (formatWektu) ---");
{
    const out = expectSuccess(`
        gawe w = gaweWektu(2026, 5, 4, 8, 9, 7)
        tulis formatWektu(w, "YYYY-MM-DD")
        tulis formatWektu(w, "DD/MM/YYYY")
        tulis formatWektu(w, "HH:mm:ss")
        tulis formatWektu(w, "Wektu: YYYY/MM/DD tabuh HH:mm")
    `, "formatWektu() replaces tokens with zero-padding and preserves custom delimiters");
    assert.strictEqual(out[0], "2026-05-04");
    assert.strictEqual(out[1], "04/05/2026");
    assert.strictEqual(out[2], "08:09:07");
    assert.strictEqual(out[3], "Wektu: 2026/05/04 tabuh 08:09");
}

// --- CATEGORY F: Parsing (parseWektu) ---
console.log("\n--- CATEGORY F: Parsing (parseWektu) ---");
{
    const out = expectSuccess(`
        gawe d1 = parseWektu("2026-09-06")
        tulis formatWektu(d1, "YYYY-MM-DD HH:mm:ss")

        gawe d2 = parseWektu("2026-09-06 15:45:30")
        tulis formatWektu(d2, "YYYY-MM-DD HH:mm:ss")

        gawe d3 = parseWektu("2026-09-06T15:45:30Z")
        tulis formatWektu(d3, "YYYY-MM-DD HH:mm:ss")
    `, "parseWektu() parses ISO date and datetime strings deterministically");
    assert.strictEqual(out[0], "2026-09-06 00:00:00");
    assert.strictEqual(out[1], "2026-09-06 15:45:30");
    assert.strictEqual(out[2], "2026-09-06 15:45:30");
}

// --- CATEGORY G: Comparison (sadurunge, sawise, padhaWektu) ---
console.log("\n--- CATEGORY G: Comparison (sadurunge, sawise, padhaWektu) ---");
{
    const out = expectSuccess(`
        gawe t1 = parseWektu("2026-09-06")
        gawe t2 = parseWektu("2026-09-07")
        gawe t3 = parseWektu("2026-09-06")

        tulis sadurunge(t1, t2)
        tulis sadurunge(t2, t1)
        tulis sawise(t2, t1)
        tulis sawise(t1, t2)
        tulis padhaWektu(t1, t3)
        tulis padhaWektu(t1, t2)
        tulis t1 == t3
        tulis t1 != t2
    `, "sadurunge, sawise, padhaWektu, and ==/!= evaluate timestamps accurately");
    assert.strictEqual(out[0], "bener");
    assert.strictEqual(out[1], "salah");
    assert.strictEqual(out[2], "bener");
    assert.strictEqual(out[3], "salah");
    assert.strictEqual(out[4], "bener");
    assert.strictEqual(out[5], "salah");
    assert.strictEqual(out[6], "bener");
    assert.strictEqual(out[7], "bener");
}

// --- CATEGORY H: Date Arithmetic (tambahWektu, kurangWektu) ---
console.log("\n--- CATEGORY H: Date Arithmetic (tambahWektu, kurangWektu) ---");
{
    const out = expectSuccess(`
        gawe w = parseWektu("2026-09-06 12:00:00")
        gawe maju1Dina = tambahWektu(w, 86400)
        tulis formatWektu(maju1Dina, "YYYY-MM-DD HH:mm:ss")

        gawe mundur1Jam = kurangWektu(w, 3600)
        tulis formatWektu(mundur1Jam, "YYYY-MM-DD HH:mm:ss")

        gawe pecahanDetik = tambahWektu(w, 0.5)
        tulis timestamp(pecahanDetik) - timestamp(w)
    `, "tambahWektu() and kurangWektu() perform pure arithmetic accurately");
    assert.strictEqual(out[0], "2026-09-07 12:00:00");
    assert.strictEqual(out[1], "2026-09-06 11:00:00");
    assert.strictEqual(out[2], "500");
}

// --- CATEGORY I: Immutability ---
console.log("\n--- CATEGORY I: Immutability ---");
{
    const out = expectSuccess(`
        gawe wAsli = parseWektu("2026-09-06")
        gawe wAnyar = tambahWektu(wAsli, 86400)
        tulis formatWektu(wAsli, "YYYY-MM-DD")
        tulis formatWektu(wAnyar, "YYYY-MM-DD")
    `, "Arithmetic does not mutate source DateTime");
    assert.strictEqual(out[0], "2026-09-06");
    assert.strictEqual(out[1], "2026-09-07");
}

// --- CATEGORY J: Invalid Date Protection ---
console.log("\n--- CATEGORY J: Invalid Date Protection ---");
expectError(`parseWektu("2026-02-30")`, "dina ora sah", "parseWektu rejects Feb 30");
expectError(`parseWektu("2026-04-31")`, "dina ora sah", "parseWektu rejects Apr 31");
expectError(`parseWektu("2026-13-01")`, "wulan ora sah", "parseWektu rejects Month 13");
expectError(`parseWektu("2026-00-10")`, "wulan ora sah", "parseWektu rejects Month 0");
expectError(`parseWektu("2026-05-32")`, "dina ora sah", "parseWektu rejects Day 32");
expectError(`parseWektu("2026-05-00")`, "dina ora sah", "parseWektu rejects Day 0");
expectError(`parseWektu("2026-05-10 25:00:00")`, "jam ora sah", "parseWektu rejects Hour 25");
expectError(`parseWektu("2026-05-10 12:60:00")`, "menit ora sah", "parseWektu rejects Minute 60");
expectError(`parseWektu("2026-05-10 12:00:60")`, "detik ora sah", "parseWektu rejects Second 60");
expectError(`parseWektu("bukan-tanggal")`, "format tanggal/wektu sing ora sah", "parseWektu rejects arbitrary text");
expectError(`gaweWektu(2026, 2, 30)`, "dina ora sah", "gaweWektu rejects Feb 30");
expectError(`gaweWektu(2026, 4, 31)`, "dina ora sah", "gaweWektu rejects Apr 31");

// --- CATEGORY K: Leap Year Rules ---
console.log("\n--- CATEGORY K: Leap Year Rules ---");
{
    const out = expectSuccess(`
        gawe kabisat = parseWektu("2024-02-29")
        tulis formatWektu(kabisat, "YYYY-MM-DD")
    `, "2024-02-29 is accepted as valid leap day");
    assert.strictEqual(out[0], "2024-02-29");
}
expectError(`parseWektu("2025-02-29")`, "dina ora sah", "2025-02-29 is rejected (non-leap year)");
expectError(`parseWektu("1900-02-29")`, "dina ora sah", "1900-02-29 is rejected (century not divisible by 400)");
{
    const out = expectSuccess(`
        gawe abad400 = parseWektu("2000-02-29")
        tulis formatWektu(abad400, "YYYY-MM-DD")
    `, "2000-02-29 is accepted as valid (divisible by 400)");
    assert.strictEqual(out[0], "2000-02-29");
}

// --- CATEGORY L: Month Boundary Transitions ---
console.log("\n--- CATEGORY L: Month Boundary Transitions ---");
{
    const out = expectSuccess(`
        gawe akhirJan = parseWektu("2026-01-31 23:59:59")
        gawe awalFeb = tambahWektu(akhirJan, 1)
        tulis formatWektu(awalFeb, "YYYY-MM-DD HH:mm:ss")

        gawe akhirFeb = parseWektu("2026-02-28 23:59:59")
        gawe awalMar = tambahWektu(akhirFeb, 1)
        tulis formatWektu(awalMar, "YYYY-MM-DD HH:mm:ss")
    `, "Month transitions across Jan 31 and Feb 28 are timestamp-based and accurate");
    assert.strictEqual(out[0], "2026-02-01 00:00:00");
    assert.strictEqual(out[1], "2026-03-01 00:00:00");
}

// --- CATEGORY M: Argument Validation ---
console.log("\n--- CATEGORY M: Argument Validation ---");
expectError(`saiki(1)`, "mbutuhake 0 argument", "saiki rejects argument");
expectError(`timestamp()`, "mbutuhake 1 argument", "timestamp requires 1 argument");
expectError(`timestamp(saiki(), 2)`, "mbutuhake 1 argument", "timestamp rejects 2 arguments");
expectError(`taun()`, "mbutuhake 1 argument", "taun requires 1 argument");
expectError(`wulan()`, "mbutuhake 1 argument", "wulan requires 1 argument");
expectError(`dina()`, "mbutuhake 1 argument", "dina requires 1 argument");
expectError(`jam()`, "mbutuhake 1 argument", "jam requires 1 argument");
expectError(`menit()`, "mbutuhake 1 argument", "menit requires 1 argument");
expectError(`detik()`, "mbutuhake 1 argument", "detik requires 1 argument");
expectError(`formatWektu()`, "mbutuhake 2 argument", "formatWektu requires 2 arguments");
expectError(`formatWektu(saiki())`, "mbutuhake 2 argument", "formatWektu rejects 1 argument");
expectError(`parseWektu()`, "mbutuhake 1 argument", "parseWektu requires 1 argument");
expectError(`sadurunge(saiki())`, "mbutuhake 2 argument", "sadurunge requires 2 arguments");
expectError(`sawise(saiki())`, "mbutuhake 2 argument", "sawise requires 2 arguments");
expectError(`padhaWektu(saiki())`, "mbutuhake 2 argument", "padhaWektu requires 2 arguments");
expectError(`tambahWektu(saiki())`, "mbutuhake 2 argument", "tambahWektu requires 2 arguments");
expectError(`kurangWektu(saiki())`, "mbutuhake 2 argument", "kurangWektu requires 2 arguments");
expectError(`gaweWektu()`, "mbutuhake 1, 3, utawa 6 argument", "gaweWektu rejects 0 arguments");
expectError(`gaweWektu(2026, 9)`, "mbutuhake 1, 3, utawa 6 argument", "gaweWektu rejects 2 arguments");

// --- CATEGORY N: Strict Type Validation ---
console.log("\n--- CATEGORY N: Strict Type Validation ---");
expectError(`timestamp("abc")`, "datetime", "timestamp rejects string");
expectError(`timestamp(12345)`, "datetime", "timestamp rejects number");
expectError(`timestamp(null)`, "datetime", "timestamp rejects null");
expectError(`taun("2026-09-06")`, "datetime", "taun rejects string");
expectError(`formatWektu("2026-09-06", "YYYY")`, "kudu datetime", "formatWektu rejects string first arg");
expectError(`formatWektu(saiki(), 123)`, "kudu string", "formatWektu rejects number second arg");
expectError(`parseWektu(12345)`, "string", "parseWektu rejects number");
expectError(`sadurunge(10, saiki())`, "kudu datetime", "sadurunge rejects non-datetime first arg");
expectError(`sadurunge(saiki(), 10)`, "kudu datetime", "sadurunge rejects non-datetime second arg");
expectError(`sawise(10, saiki())`, "kudu datetime", "sawise rejects non-datetime first arg");
expectError(`sawise(saiki(), "x")`, "kudu datetime", "sawise rejects non-datetime second arg");
expectError(`padhaWektu(null, saiki())`, "kudu datetime", "padhaWektu rejects null first arg");
expectError(`tambahWektu("abc", 10)`, "kudu datetime", "tambahWektu rejects non-datetime first arg");
expectError(`tambahWektu(saiki(), "10")`, "kudu number", "tambahWektu rejects string second arg");
expectError(`kurangWektu(saiki(), null)`, "kudu number", "kurangWektu rejects null second arg");

// --- CATEGORY O: First-Class Builtins & HOF Compatibility ---
console.log("\n--- CATEGORY O: First-Class Builtins & HOF Compatibility ---");
{
    const out = expectSuccess(`
        gawe w = parseWektu("2026-09-06")
        gawe fn = taun
        tulis fn(w)

        gawe dhaptarWektu = [parseWektu("2024-01-01"), parseWektu("2025-01-01"), parseWektu("2026-01-01")]
        gawe dhaptarTaun = terapkan(taun, dhaptarWektu)
        tulis dhaptarTaun
    `, "DateTime builtins behave as first-class citizens and work with terapkan()");
    assert.strictEqual(out[0], "2026");
    assert.strictEqual(out[1], "[2024, 2025, 2026]");
}

// --- CATEGORY P: Array & Object Integration ---
console.log("\n--- CATEGORY P: Array & Object Integration ---");
{
    const out = expectSuccess(`
        gawe w = parseWektu("2026-09-06")
        gawe data = {
            "dibuat": w,
            "riwayat": [w]
        }
        tulis jinis(data.dibuat)
        tulis jinis(data.riwayat[0])
        tulis formatWektu(data.dibuat, "YYYY-MM-DD")
    `, "DateTime instances store cleanly in objects and arrays");
    assert.strictEqual(out[0], "datetime");
    assert.strictEqual(out[1], "datetime");
    assert.strictEqual(out[2], "2026-09-06");
}

// --- CATEGORY Q: Module Integration ---
console.log("\n--- CATEGORY Q: Module Integration ---");
{
    const tempModPath = path.resolve(__dirname, "temp_datetime_module.jawa");
    fs.writeFileSync(tempModPath, `
        ekspor guna wektuSaikiStr() {
            gawe w = parseWektu("2026-09-06 12:00:00")
            bali formatWektu(w, "YYYY-MM-DD HH:mm:ss")
        }
    `, "utf8");

    try {
        const out = expectSuccess(`
            impor { wektuSaikiStr } saka "./temp_datetime_module.jawa"
            tulis wektuSaikiStr()
        `, "DateTime builtins work seamlessly across modules", { filePath: path.resolve(__dirname, "main.jawa") });
        assert.strictEqual(out[0], "2026-09-06 12:00:00");
    } finally {
        if (fs.existsSync(tempModPath)) {
            fs.unlinkSync(tempModPath);
        }
    }
}

// --- CATEGORY R: REPL Compatibility ---
console.log("\n--- CATEGORY R: REPL Compatibility ---");
{
    const session = new ReplSession({ cwd: __dirname });
    const r1 = session.eval('gawe w = parseWektu("2026-09-06")');
    assert.ok(r1.ok, "REPL eval statement succeeded");

    const r2 = session.eval('formatWektu(w, "YYYY-MM-DD")');
    assert.ok(r2.ok, "REPL bare expression succeeded");
    assert.strictEqual(r2.formatted, '2026-09-06');

    const r3 = session.eval('jinis(w)');
    assert.ok(r3.ok, "REPL jinis evaluation succeeded");
    assert.strictEqual(r3.formatted, 'datetime');

    console.log("PASS: DateTime features evaluate cleanly with state persistence in REPL session");
    passedCount++;
}

// --- CATEGORY S: Error Recovery (coba/tangkep) ---
console.log("\n--- CATEGORY S: Error Recovery (coba/tangkep) ---");
{
    const out = expectSuccess(`
        gawe hasil = "aman"
        coba {
            parseWektu("tanggal-rusak")
        } tangkep err {
            hasil = "kesalahan_ditangkep"
        }
        tulis hasil
    `, "DateTime errors are cleanly caught by coba/tangkep without crashing");
    assert.strictEqual(out[0], "kesalahan_ditangkep");
}

// --- CATEGORY T: LSP Synchronization ---
console.log("\n--- CATEGORY T: LSP Synchronization ---");
{
    const datetimeFunctions = [
        "saiki", "timestamp", "gaweWektu", "taun", "wulan", "dina",
        "jam", "menit", "detik", "formatWektu", "parseWektu",
        "sadurunge", "sawise", "padhaWektu", "tambahWektu", "kurangWektu"
    ];

    // 1. BUILTINS catalog
    for (const name of datetimeFunctions) {
        assert.ok(name in BUILTINS, `Expected ${name} in LSP BUILTINS`);
        assert.ok(BUILTINS[name].signature, `Expected signature for ${name}`);
        assert.ok(BUILTINS[name].description, `Expected description for ${name}`);
    }
    console.log("PASS: All 16 DateTime builtins exist in LSP BUILTINS registry");
    passedCount++;

    // 2. Completion
    const mockUri = "file:///test_datetime_lsp.jawa";
    const testCode = "gawe x = ";
    const analysis = analyzer.analyze(testCode, mockUri);
    const completions = getCompletions(analysis, { line: 0, character: 9 });
    for (const name of datetimeFunctions) {
        const item = completions.find(c => c.label === name);
        assert.ok(item, `Expected completion item for ${name}`);
    }
    console.log("PASS: All 16 DateTime builtins appear in LSP Completion");
    passedCount++;

    // 3. Hover
    const hoverAnalysis = analyzer.analyze("saiki()", mockUri);
    const hoverRes = getHover(hoverAnalysis, { line: 0, character: 2 });
    assert.ok(hoverRes, "Expected hover for saiki");
    assert.ok(hoverRes.contents.value.includes("saiki(): datetime"), "Hover should include signature");
    console.log("PASS: LSP Hover returns accurate signature for DateTime builtins");
    passedCount++;

    // 4. Signature Help
    const sigCode = "gaweWektu(2026, ";
    const sigAnalysis = analyzer.analyze(sigCode, mockUri);
    const sigHelp = getSignatureHelp(sigAnalysis, { line: 0, character: 16 });
    assert.ok(sigHelp, "Expected signature help for gaweWektu");
    assert.strictEqual(sigHelp.activeParameter, 1, "activeParameter should track second arg (wulan)");
    console.log("PASS: LSP Signature Help tracks activeParameter accurately for gaweWektu");
    passedCount++;

    // 5. Semantic Tokens
    const semCode = "gawe w = saiki()";
    const semAnalysis = analyzer.analyze(semCode, mockUri);
    const semTokens = getSemanticTokens(semAnalysis);
    assert.ok(semTokens && semTokens.data && semTokens.data.length > 0, "Semantic tokens emitted");
    console.log("PASS: LSP Semantic Tokens classifies DateTime builtins");
    passedCount++;
}

console.log("\n================================================================");
console.log(`  ALL DATE & TIME TESTS PASSED (${passedCount} ASSERTIONS) `);
console.log("================================================================");
