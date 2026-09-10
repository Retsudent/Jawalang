/**
 * Jawalang V1.4.0 — Phase 12: JSON & Serialization Foundation Test Suite
 *
 * Verifies jsonEncode and jsonDecode built-in functions:
 * A. Primitive encode
 * B. Primitive decode
 * C. Array
 * D. Object
 * E. Nested structures
 * F. String escaping
 * G. Unicode
 * H. Null
 * I. Boolean
 * J. Numbers
 * K. Round trip
 * L. Type preservation
 * M. Immutability
 * N. Decode isolation
 * O. First-class
 * P. HOF
 * Q. Unsupported function
 * R. Unsupported datetime
 * S. Unsupported instance & struct
 * T. Circular reference
 * U. Invalid JSON
 * V. Trailing data
 * W. Duplicate keys
 * X. Deep nesting
 * Y. Security
 * Z. LSP
 */

const assert = require("assert");
const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");
const lspUtils = require("../language-server/src/utils");

console.log("================================================================");
console.log("      JAWALANG V1.4.0 — PHASE 12: JSON TEST SUITE               ");
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
}

let totalAssertions = 0;
function check(description, fn) {
    fn();
    totalAssertions++;
    console.log(`PASS [${String(totalAssertions).padStart(2, " ")}]: ${description}`);
}

// --- Category A: Primitive Encode ---
check("A1. Encode integer number", () => {
    const logs = run('tulis jsonEncode(42)');
    assert.strictEqual(logs[0], "42");
});

check("A2. Encode string", () => {
    const logs = run('tulis jsonEncode("Jawalang")');
    assert.strictEqual(logs[0], '"Jawalang"');
});

check("A3. Encode boolean true & false", () => {
    const logs = run('tulis jsonEncode(bener)\ntulis jsonEncode(salah)');
    assert.strictEqual(logs[0], "true");
    assert.strictEqual(logs[1], "false");
});

check("A4. Encode null", () => {
    const logs = run('tulis jsonEncode(null)');
    assert.strictEqual(logs[0], "null");
});

// --- Category B: Primitive Decode ---
check("B1. Decode integer number", () => {
    const logs = run('gawe x = jsonDecode("42")\ntulis x\ntulis jinis(x)');
    assert.strictEqual(logs[0], "42");
    assert.strictEqual(logs[1], "number");
});

check("B2. Decode string", () => {
    const logs = run('gawe s = jsonDecode("\\"Sugeng Rawuh\\"")\ntulis s\ntulis jinis(s)');
    assert.strictEqual(logs[0], "Sugeng Rawuh");
    assert.strictEqual(logs[1], "string");
});

check("B3. Decode boolean true & false", () => {
    const logs = run('gawe t = jsonDecode("true")\ngawe f = jsonDecode("false")\ntulis t\ntulis f');
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "salah");
});

check("B4. Decode null", () => {
    const logs = run('gawe n = jsonDecode("null")\ntulis n\ntulis jinis(n)');
    assert.strictEqual(logs[0], "null");
    assert.strictEqual(logs[1], "null");
});

// --- Category C: Array ---
check("C1. Encode homogeneous array", () => {
    const logs = run('tulis jsonEncode([1, 2, 3])');
    assert.strictEqual(logs[0], "[1,2,3]");
});

check("C2. Encode heterogeneous array", () => {
    const logs = run('tulis jsonEncode([1, "Jawa", bener, null])');
    assert.strictEqual(logs[0], '[1,"Jawa",true,null]');
});

check("C3. Decode array to native Jawalang array", () => {
    const logs = run('gawe arr = jsonDecode("[10, 20, 30]")\ntulis jinis(arr)\ntulis arr[0]\ntulis dawa(arr)');
    assert.strictEqual(logs[0], "array");
    assert.strictEqual(logs[1], "10");
    assert.strictEqual(logs[2], "3");
});

check("C4. Manipulate decoded array with builtins", () => {
    const logs = run('gawe arr = jsonDecode("[1, 2]")\nnambah(arr, 3)\ntulis dawa(arr)\ntulis arr[2]');
    assert.strictEqual(logs[0], "3");
    assert.strictEqual(logs[1], "3");
});

// --- Category D: Object ---
check("D1. Encode plain object", () => {
    const logs = run('gawe obj = {"a": 1, "b": "loro"}\ntulis jsonEncode(obj)');
    assert.strictEqual(logs[0], '{"a":1,"b":"loro"}');
});

check("D2. Decode JSON object to Jawalang object", () => {
    const logs = run('gawe obj = jsonDecode("{\\"jeneng\\":\\"Budi\\",\\"umur\\":25}")\ntulis jinis(obj)\ntulis obj["jeneng"]\ntulis obj["umur"]');
    assert.strictEqual(logs[0], "object");
    assert.strictEqual(logs[1], "Budi");
    assert.strictEqual(logs[2], "25");
});

check("D3. Object indexing via bracket and dot notation", () => {
    const logs = run('gawe obj = jsonDecode("{\\"kutha\\":\\"Solo\\"}")\ntulis obj.kutha\ntulis obj["kutha"]');
    assert.strictEqual(logs[0], "Solo");
    assert.strictEqual(logs[1], "Solo");
});

check("D4. Object builtins kunci and nilai on decoded object", () => {
    const logs = run('gawe obj = jsonDecode("{\\"x\\":10,\\"y\\":20}")\ngawe k = kunci(obj)\ntulis dawa(k)\ntulis duwe(obj, "x")');
    assert.strictEqual(logs[0], "2");
    assert.strictEqual(logs[1], "bener");
});

// --- Category E: Nested Structures ---
check("E1. Deeply nested array inside object inside array", () => {
    const logs = run(`
        gawe data = {
            "users": [
                {"id": 1, "roles": ["admin", "editor"]},
                {"id": 2, "roles": ["viewer"]}
            ]
        }
        gawe json = jsonEncode(data)
        gawe back = jsonDecode(json)
        tulis back["users"][0]["roles"][1]
        tulis back["users"][1]["roles"][0]
    `);
    assert.strictEqual(logs[0], "editor");
    assert.strictEqual(logs[1], "viewer");
});

check("E2. Empty nested structures", () => {
    const logs = run('tulis jsonEncode({"kosongArr": [], "kosongObj": {}})');
    assert.strictEqual(logs[0], '{"kosongArr":[],"kosongObj":{}}');
});

check("E3. Decode empty nested structures", () => {
    const logs = run('gawe d = jsonDecode("{\\"a\\":[],\\"b\\":{}}")\ntulis dawa(d["a"])\ntulis dawa(kunci(d["b"]))');
    assert.strictEqual(logs[0], "0");
    assert.strictEqual(logs[1], "0");
});

check("E4. Complex nested round trip equivalence", () => {
    const logs = run(`
        gawe asal = {"nested": [[1, 2], [3, {"val": 4}]]}
        gawe encoded = jsonEncode(asal)
        gawe decoded = jsonDecode(encoded)
        tulis decoded["nested"][1][1]["val"]
    `);
    assert.strictEqual(logs[0], "4");
});

// --- Category F: String Escaping ---
check("F1. Escape newlines and tabs", () => {
    const logs = run(`
        gawe str = "baris1\\nbaris2\\ttab"
        gawe json = jsonEncode(str)
        gawe dec = jsonDecode(json)
        tulis dec == str
    `);
    assert.strictEqual(logs[0], "bener");
});

check("F2. Escape quotes inside string", () => {
    const logs = run(`
        gawe str = "Dheweke ngomong \\"Halo\\""
        gawe json = jsonEncode(str)
        gawe dec = jsonDecode(json)
        tulis dec == str
    `);
    assert.strictEqual(logs[0], "bener");
});

check("F3. Escape backslashes", () => {
    const logs = run(`
        gawe str = "C:\\\\folder\\\\file"
        gawe json = jsonEncode(str)
        gawe dec = jsonDecode(json)
        tulis dec == str
    `);
    assert.strictEqual(logs[0], "bener");
});

check("F4. Unicode escape decoding", () => {
    const logs = run(`
        gawe dec = jsonDecode("\\"\\\\u0041\\\\u0042\\\\u0043\\"")
        tulis dec
    `);
    assert.strictEqual(logs[0], "ABC");
});

// --- Category G: Unicode ---
check("G1. Javanese script encoding and decoding", () => {
    const logs = run(`
        gawe aksara = "ꦗꦮꦭꦁ"
        gawe json = jsonEncode(aksara)
        gawe dec = jsonDecode(json)
        tulis dec == aksara
    `);
    assert.strictEqual(logs[0], "bener");
});

check("G2. Accented characters in objects", () => {
    const logs = run(`
        gawe obj = {"tembung": "basa Jawa, kowé, pépé"}
        gawe dec = jsonDecode(jsonEncode(obj))
        tulis dec["tembung"]
    `);
    assert.strictEqual(logs[0], "basa Jawa, kowé, pépé");
});

check("G3. Emoji support in JSON", () => {
    const logs = run(`
        gawe obj = {"simbol": "🚀✨"}
        gawe dec = jsonDecode(jsonEncode(obj))
        tulis dec["simbol"]
    `);
    assert.strictEqual(logs[0], "🚀✨");
});

// --- Category H: Null Handling ---
check("H1. Null retains null type after decode", () => {
    const logs = run(`
        gawe res = jsonDecode("null")
        tulis res == null
        tulis jinis(res)
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "null");
});

check("H2. Null property in object is preserved", () => {
    const logs = run(`
        gawe obj = {"data": null}
        gawe dec = jsonDecode(jsonEncode(obj))
        tulis duwe(dec, "data")
        tulis dec["data"] == null
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "bener");
});

check("H3. Null in array is preserved", () => {
    const logs = run(`
        gawe arr = [1, null, 3]
        gawe dec = jsonDecode(jsonEncode(arr))
        tulis dec[1] == null
        tulis dawa(dec)
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "3");
});

// --- Category I: Boolean Handling ---
check("I1. Boolean true decodes to bener", () => {
    const logs = run('gawe x = jsonDecode("true")\ntulis x == bener\ntulis jinis(x)');
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "boolean");
});

check("I2. Boolean false decodes to salah", () => {
    const logs = run('gawe x = jsonDecode("false")\ntulis x == salah\ntulis jinis(x)');
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "boolean");
});

check("I3. Conditional yen works directly on decoded boolean", () => {
    const logs = run(`
        gawe obj = jsonDecode("{\\"isReady\\": true}")
        yen obj["isReady"] {
            tulis "Siap!"
        } liyane {
            tulis "Durung"
        }
    `);
    assert.strictEqual(logs[0], "Siap!");
});

// --- Category J: Number Handling ---
check("J1. Negative numbers and decimals", () => {
    const logs = run(`
        gawe obj = {"neg": -42, "pi": 3.14159, "nol": 0}
        gawe dec = jsonDecode(jsonEncode(obj))
        tulis dec["neg"]
        tulis dec["pi"]
        tulis dec["nol"]
    `);
    assert.strictEqual(logs[0], "-42");
    assert.strictEqual(logs[1], "3.14159");
    assert.strictEqual(logs[2], "0");
});

check("J2. Scientific notation decoding", () => {
    const logs = run('gawe n = jsonDecode("1e3")\ntulis n');
    assert.strictEqual(logs[0], "1000");
});

check("J3. Negative scientific notation", () => {
    const logs = run('gawe n = jsonDecode("2.5e-2")\ntulis n');
    assert.strictEqual(logs[0], "0.025");
});

check("J4. Reject NaN on encode", () => {
    const jsonModule = require("../src/stdlib/json");
    assert.throws(
        () => jsonModule.jsonEncode([NaN]),
        /Angka ora kena NaN/
    );
});

check("J5. Reject Infinity on encode", () => {
    const jsonModule = require("../src/stdlib/json");
    assert.throws(
        () => jsonModule.jsonEncode([Infinity]),
        /Angka ora kena NaN utawa Infinity/
    );
});

// --- Category K: Round-Trip Preservation ---
check("K1. Comprehensive round-trip dictionary", () => {
    const logs = run(`
        gawe original = {
            "proyek": "Jawalang",
            "versi": 1.4,
            "stabil": bener,
            "lisensi": null,
            "modul": ["math", "string", "datetime", "json"]
        }
        gawe jsonText = jsonEncode(original)
        gawe back = jsonDecode(jsonText)
        tulis back["proyek"]
        tulis back["versi"]
        tulis back["stabil"]
        tulis back["lisensi"] == null
        tulis back["modul"][3]
    `);
    assert.strictEqual(logs[0], "Jawalang");
    assert.strictEqual(logs[1], "1.4");
    assert.strictEqual(logs[2], "bener");
    assert.strictEqual(logs[3], "bener");
    assert.strictEqual(logs[4], "json");
});

check("K2. Array of objects round-trip", () => {
    const logs = run(`
        gawe dhaptar = [
            {"nama": "A", "biji": 90},
            {"nama": "B", "biji": 85}
        ]
        gawe hasil = jsonDecode(jsonEncode(dhaptar))
        tulis hasil[0]["nama"]
        tulis hasil[1]["biji"]
    `);
    assert.strictEqual(logs[0], "A");
    assert.strictEqual(logs[1], "85");
});

check("K3. Empty array round-trip", () => {
    const logs = run('gawe res = jsonDecode(jsonEncode([]))\ntulis dawa(res)');
    assert.strictEqual(logs[0], "0");
});

check("K4. Empty object round-trip", () => {
    const logs = run('gawe res = jsonDecode(jsonEncode({}))\ntulis dawa(kunci(res))');
    assert.strictEqual(logs[0], "0");
});

// --- Category L: Type Preservation ---
check("L1. Preserves array type", () => {
    const logs = run('tulis jinis(jsonDecode(jsonEncode([1, 2])))');
    assert.strictEqual(logs[0], "array");
});

check("L2. Preserves object type", () => {
    const logs = run('tulis jinis(jsonDecode(jsonEncode({"a": 1})))');
    assert.strictEqual(logs[0], "object");
});

check("L3. Preserves string type", () => {
    const logs = run('tulis jinis(jsonDecode(jsonEncode("teks")))');
    assert.strictEqual(logs[0], "string");
});

check("L4. Preserves number type", () => {
    const logs = run('tulis jinis(jsonDecode(jsonEncode(123)))');
    assert.strictEqual(logs[0], "number");
});

// --- Category M: Immutability ---
check("M1. Original object is not mutated by jsonEncode", () => {
    const logs = run(`
        gawe obj = {"daftar": [1, 2, 3]}
        gawe json = jsonEncode(obj)
        tulis obj["daftar"][0]
        tulis dawa(obj["daftar"])
    `);
    assert.strictEqual(logs[0], "1");
    assert.strictEqual(logs[1], "3");
});

check("M2. Original array is not mutated by jsonEncode", () => {
    const logs = run(`
        gawe arr = ["a", "b", "c"]
        gawe json = jsonEncode(arr)
        tulis arr[0]
        tulis dawa(arr)
    `);
    assert.strictEqual(logs[0], "a");
    assert.strictEqual(logs[1], "3");
});

check("M3. Mutating decoded result does not affect original object", () => {
    const logs = run(`
        gawe asal = {"angka": 100}
        gawe dec = jsonDecode(jsonEncode(asal))
        dec["angka"] = 999
        tulis asal["angka"]
        tulis dec["angka"]
    `);
    assert.strictEqual(logs[0], "100");
    assert.strictEqual(logs[1], "999");
});

// --- Category N: Decode Isolation ---
check("N1. Multiple decodes create distinct independent objects", () => {
    const logs = run(`
        gawe json = "{\\"list\\": [1, 2]}"
        gawe d1 = jsonDecode(json)
        gawe d2 = jsonDecode(json)
        d1["list"][0] = 99
        tulis d1["list"][0]
        tulis d2["list"][0]
    `);
    assert.strictEqual(logs[0], "99");
    assert.strictEqual(logs[1], "1");
});

check("N2. Multiple decodes of array create distinct arrays", () => {
    const logs = run(`
        gawe json = "[10, 20]"
        gawe a = jsonDecode(json)
        gawe b = jsonDecode(json)
        nambah(a, 30)
        tulis dawa(a)
        tulis dawa(b)
    `);
    assert.strictEqual(logs[0], "3");
    assert.strictEqual(logs[1], "2");
});

check("N3. Nested sub-objects are also isolated", () => {
    const logs = run(`
        gawe json = "{\\"sub\\": {\\"val\\": 1}}"
        gawe o1 = jsonDecode(json)
        gawe o2 = jsonDecode(json)
        o1["sub"]["val"] = 55
        tulis o2["sub"]["val"]
    `);
    assert.strictEqual(logs[0], "1");
});

// --- Category O: First-Class Builtins ---
check("O1. jsonEncode as first-class variable", () => {
    const logs = run(`
        gawe f = jsonEncode
        tulis f({"status": "ok"})
    `);
    assert.strictEqual(logs[0], '{"status":"ok"}');
});

check("O2. jsonDecode as first-class variable", () => {
    const logs = run(`
        gawe g = jsonDecode
        gawe res = g("{\\"nilai\\": 77}")
        tulis res["nilai"]
    `);
    assert.strictEqual(logs[0], "77");
});

// --- Category P: Higher-Order Function (HOF) ---
check("P1. terapkan with jsonEncode on array of objects", () => {
    const logs = run(`
        gawe data = [{"id": 1}, {"id": 2}]
        gawe asil = terapkan(jsonEncode, data)
        tulis asil[0]
        tulis asil[1]
    `);
    assert.strictEqual(logs[0], '{"id":1}');
    assert.strictEqual(logs[1], '{"id":2}');
});

check("P2. terapkan with jsonDecode on array of JSON strings", () => {
    const logs = run(`
        gawe jsonStrings = ["[10]", "[20]"]
        gawe decoded = terapkan(jsonDecode, jsonStrings)
        tulis decoded[0][0]
        tulis decoded[1][0]
    `);
    assert.strictEqual(logs[0], "10");
    assert.strictEqual(logs[1], "20");
});

// --- Category Q: Unsupported Function Rejection ---
check("Q1. Top-level function rejection", () => {
    expectError('guna tes() { bali 1 }\njsonEncode(tes)', 'Tipe "function" ora bisa diencode dadi JSON');
});

check("Q2. Function nested in object property rejection", () => {
    expectError('guna aksi() { bali 2 }\ngawe o = {"a": aksi}\njsonEncode(o)', 'Tipe "function" ora bisa diencode dadi JSON');
});

check("Q3. Function nested in array element rejection", () => {
    expectError('guna f() {}\ngawe arr = [1, [2, f]]\njsonEncode(arr)', 'Tipe "function" ora bisa diencode dadi JSON');
});

// --- Category R: Unsupported DateTime Rejection ---
check("R1. Top-level datetime rejection", () => {
    expectError('gawe w = saiki()\njsonEncode(w)', 'Tipe "datetime" ora bisa diencode dadi JSON');
});

check("R2. Datetime nested in object rejection", () => {
    expectError('gawe w = saiki()\ngawe o = {"dibuat": w}\njsonEncode(o)', 'Tipe "datetime" ora bisa diencode dadi JSON');
});

// --- Category S: Unsupported Instance & Struct Rejection ---
check("S1. Struct declaration rejection", () => {
    expectError('bentuk Wong {}\njsonEncode(Wong)', 'Tipe "struct" ora bisa diencode dadi JSON');
});

check("S2. Struct instance rejection", () => {
    expectError(`
        bentuk Wong { gawe nama = "Budi" }
        gawe w = anyar Wong()
        jsonEncode(w)
    `, 'Tipe "instance" ora bisa diencode dadi JSON');
});

// --- Category T: Circular Reference ---
check("T1. Circular array reference rejection", () => {
    expectError(`
        gawe a = [1]
        nambah(a, a)
        jsonEncode(a)
    `, "Circular reference ora bisa diencode dadi JSON");
});

check("T2. Circular object reference rejection", () => {
    expectError(`
        gawe o = {"x": 1}
        o["self"] = o
        jsonEncode(o)
    `, "Circular reference ora bisa diencode dadi JSON");
});

// --- Category U: Invalid JSON Handling ---
check("U1. Reject empty string", () => {
    expectError('jsonDecode("")', "Format JSON ora sah: Teks JSON kosong");
});

check("U2. Reject whitespace-only string", () => {
    expectError('jsonDecode("   \\t\\n  ")', "Format JSON ora sah: Teks JSON kosong");
});

check("U3. Reject arbitrary non-JSON text", () => {
    expectError('jsonDecode("abc")', "Format JSON ora sah");
});

check("U4. Reject unclosed JSON object or array", () => {
    expectError('jsonDecode("{")', "Format JSON ora sah");
    expectError('jsonDecode("[1, 2")', "Format JSON ora sah");
});

// --- Category V: Trailing Data Rejection ---
check("V1. Reject trailing numbers", () => {
    expectError('jsonDecode("10 20")', "Format JSON ora sah");
});

check("V2. Reject trailing booleans", () => {
    expectError('jsonDecode("true false")', "Format JSON ora sah");
});

check("V3. Reject concatenated objects", () => {
    expectError('jsonDecode("{}{}")', "Format JSON ora sah");
});

// --- Category W: Duplicate Keys ---
check("W1. Duplicate object keys semantics (last key wins)", () => {
    const logs = run('gawe obj = jsonDecode("{\\"k\\": 1, \\"k\\": 2}")\ntulis obj["k"]');
    assert.strictEqual(logs[0], "2");
});

check("W2. Multiple duplicate keys in same object", () => {
    const logs = run('gawe obj = jsonDecode("{\\"x\\": 10, \\"y\\": 20, \\"x\\": 30}")\ntulis obj["x"]\ntulis obj["y"]');
    assert.strictEqual(logs[0], "30");
    assert.strictEqual(logs[1], "20");
});

// --- Category X: Deep Nesting Safety ---
check("X1. Safe deep nesting within limit (depth ~20)", () => {
    const logs = run(`
        gawe cur = {"val": 1}
        gawe i = 0
        nalika i < 20 {
            cur = {"next": cur}
            i = i + 1
        }
        gawe enc = jsonEncode(cur)
        gawe dec = jsonDecode(enc)
        tulis jinis(dec)
    `);
    assert.strictEqual(logs[0], "object");
});

check("X2. Excessive depth exceeding 500 triggers Jawalang error", () => {
    const jsonModule = require("../src/stdlib/json");
    let deep = { val: 1 };
    for (let i = 0; i < 550; i++) {
        deep = { next: deep };
    }
    assert.throws(
        () => jsonModule.jsonEncode([deep]),
        /Struktur data keliwat jero/
    );
});

// --- Category Y: Security ---
check("Y1. JSON text containing executable code is decoded purely as string", () => {
    const logs = run(`
        gawe text = "{\\"skrip\\": \\"tulis 'Halo Hacker'\\"}"
        gawe res = jsonDecode(text)
        tulis res["skrip"]
    `);
    assert.strictEqual(logs[0], "tulis 'Halo Hacker'");
});

check("Y2. JSON argument arity and type checks", () => {
    expectError('jsonEncode()', "mbutuhake 1 argument");
    expectError('jsonEncode(1, 2)', "mbutuhake 1 argument");
    expectError('jsonDecode()', "mbutuhake 1 argument");
    expectError('jsonDecode(123)', "mung bisa digunakake kanggo string");
});

// --- Category Z: LSP Catalog Verification ---
check("Z1. jsonEncode registered in LSP BUILTINS", () => {
    assert.ok(lspUtils.BUILTINS.jsonEncode, "jsonEncode must be in BUILTINS");
    assert.strictEqual(lspUtils.BUILTINS.jsonEncode.returnType, "string");
    assert.strictEqual(lspUtils.BUILTINS.jsonEncode.params.length, 1);
});

check("Z2. jsonDecode registered in LSP BUILTINS", () => {
    assert.ok(lspUtils.BUILTINS.jsonDecode, "jsonDecode must be in BUILTINS");
    assert.strictEqual(lspUtils.BUILTINS.jsonDecode.returnType, "any");
    assert.strictEqual(lspUtils.BUILTINS.jsonDecode.params.length, 1);
});

check("Z3. jsonEncode and jsonDecode are protected in BUILTINS catalog", () => {
    assert.ok(lspUtils.BUILTINS["jsonEncode"], "jsonEncode must be in BUILTINS");
    assert.ok(lspUtils.BUILTINS["jsonDecode"], "jsonDecode must be in BUILTINS");
});

check("Z4. LSP signature help displays jsonEncode signature", () => {
    const sig = lspUtils.BUILTINS.jsonEncode.signature;
    assert.ok(sig.startsWith("jsonEncode("));
});

console.log("\n================================================================");
console.log(`ALL ${totalAssertions} ASSERTIONS PASSED! (100% SUCCESS)`);
console.log("================================================================\n");
