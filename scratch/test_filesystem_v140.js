/**
 * Jawalang V1.4.0 — Phase 13: File System Foundation Test Suite
 *
 * Verifies sandboxed, portable, synchronous filesystem built-in functions:
 * - macaFile(path)
 * - tulisFile(path, isi)
 * - anaPath(path)
 * - jinisPath(path)
 * - isiFolder(path)
 * - gaweFolder(path)
 *
 * 26 Categories (A through Z) with >= 80 meaningful assertions.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");
const { resolveSandboxPath, withSandbox, isSubPath } = require("../src/stdlib/filesystem");
const { stdlibMetadata } = require("../src/stdlib");
const lspUtils = require("../language-server/src/utils");

console.log("================================================================");
console.log("      JAWALANG V1.4.0 — PHASE 13: FILE SYSTEM TEST SUITE        ");
console.log("================================================================\n");

// Setup isolated sandbox test directory
const TEST_SANDBOX = path.resolve(__dirname, "sandbox_fs_v140");
const OUTSIDE_DIR = path.resolve(__dirname, "sandbox_outside_v140");

function setupDirs() {
    cleanupDirs();
    fs.mkdirSync(TEST_SANDBOX, { recursive: true });
    fs.mkdirSync(OUTSIDE_DIR, { recursive: true });
    fs.writeFileSync(path.resolve(OUTSIDE_DIR, "secret.txt"), "TOP_SECRET_DATA", "utf8");
}

function cleanupDirs() {
    try {
        if (fs.existsSync(TEST_SANDBOX)) {
            fs.rmSync(TEST_SANDBOX, { recursive: true, force: true });
        }
    } catch (_) {}
    try {
        if (fs.existsSync(OUTSIDE_DIR)) {
            fs.rmSync(OUTSIDE_DIR, { recursive: true, force: true });
        }
    } catch (_) {}
}

setupDirs();

let totalPassed = 0;

function run(source, customRoot = TEST_SANDBOX) {
    const tokens = lexer(source);
    const ast = parser(tokens);
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => logs.push(args.join(" "));
    try {
        const dummyFile = path.resolve(customRoot, "main.jawa");
        interpreter(ast, { filePath: dummyFile, sandboxRoot: customRoot });
        return logs;
    } finally {
        console.log = originalLog;
    }
}

function expectError(source, expectedMsgPart = null, customRoot = TEST_SANDBOX) {
    const tokens = lexer(source);
    const ast = parser(tokens);
    let thrown = null;
    const dummyFile = path.resolve(customRoot, "main.jawa");
    try {
        interpreter(ast, { filePath: dummyFile, sandboxRoot: customRoot });
    } catch (err) {
        thrown = err;
    }
    assert(thrown !== null, `Harus melempar error, tapi berhasil: ${source}`);
    if (expectedMsgPart) {
        assert(
            thrown.message.includes(expectedMsgPart),
            `Pesan error "${thrown.message}" harus memuat "${expectedMsgPart}"`
        );
    }
    return thrown;
}

try {
    // =========================================================================
    // KATEGORI A: File Read (macaFile)
    // =========================================================================
    console.log("--- Kategori A: File Read (macaFile) ---");
    fs.writeFileSync(path.resolve(TEST_SANDBOX, "baca.txt"), "Halo Jawalang!\nBaris kapindho.", "utf8");

    let logs = run(`
        gawe isi = macaFile("baca.txt")
        tulis isi
    `);
    assert.strictEqual(logs[0], "Halo Jawalang!\nBaris kapindho.");
    totalPassed++; // 1

    fs.writeFileSync(path.resolve(TEST_SANDBOX, "baca_spasi.txt"), "teks tanpa newline", "utf8");
    logs = run(`tulis macaFile("baca_spasi.txt")`);
    assert.strictEqual(logs[0], "teks tanpa newline");
    totalPassed++; // 2

    // =========================================================================
    // KATEGORI B: File Write (tulisFile)
    // =========================================================================
    console.log("--- Kategori B: File Write (tulisFile) ---");
    logs = run(`
        gawe res = tulisFile("tulis_out.txt", "Hasil tulisan")
        tulis res
        tulis macaFile("tulis_out.txt")
    `);
    assert.strictEqual(logs[0], "null"); // return null
    assert.strictEqual(logs[1], "Hasil tulisan");
    totalPassed++; // 3
    totalPassed++; // 4

    // Overwrite existing file
    logs = run(`
        tulisFile("tulis_out.txt", "Tulisan anyar")
        tulis macaFile("tulis_out.txt")
    `);
    assert.strictEqual(logs[0], "Tulisan anyar");
    totalPassed++; // 5

    // =========================================================================
    // KATEGORI C: Empty File
    // =========================================================================
    console.log("--- Kategori C: Empty File ---");
    logs = run(`
        tulisFile("kosong.txt", "")
        gawe k = macaFile("kosong.txt")
        tulis k == ""
        tulis dawa(k)
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "0");
    totalPassed++; // 6
    totalPassed++; // 7

    // =========================================================================
    // KATEGORI D: Unicode UTF-8 Handling
    // =========================================================================
    console.log("--- Kategori D: Unicode UTF-8 ---");
    logs = run(`
        gawe teksJawa = "ꦲꦤꦕꦫꦏ ꦢꦠꦱꦮꦭ ꦥꦝꦗꦪꦚ ꦩꦒꦧꦛꦔ — 🌟 🚀"
        tulisFile("aksara.txt", teksJawa)
        gawe waca = macaFile("aksara.txt")
        tulis waca == teksJawa
    `);
    assert.strictEqual(logs[0], "bener");
    totalPassed++; // 8

    // =========================================================================
    // KATEGORI E: Exists Check (anaPath)
    // =========================================================================
    console.log("--- Kategori E: Path Exists (anaPath) ---");
    logs = run(`
        tulis anaPath("baca.txt")
        tulis anaPath("ora_ana_babarpisan.txt")
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "salah");
    totalPassed++; // 9
    totalPassed++; // 10

    // Security violation in anaPath must throw, not return salah
    expectError(`anaPath("../secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 11
    expectError(`anaPath("C:\\secret.txt")`, "Path absolut ora diijini");
    totalPassed++; // 12

    // =========================================================================
    // KATEGORI F: File Type Check (jinisPath -> file)
    // =========================================================================
    console.log("--- Kategori F: File Type Check ---");
    logs = run(`
        tulis jinisPath("baca.txt")
        tulis jinisPath("tulis_out.txt")
    `);
    assert.strictEqual(logs[0], "file");
    assert.strictEqual(logs[1], "file");
    totalPassed++; // 13
    totalPassed++; // 14

    // =========================================================================
    // KATEGORI G: Folder Type Check (jinisPath -> folder, oraAna)
    // =========================================================================
    console.log("--- Kategori G: Folder Type Check ---");
    fs.mkdirSync(path.resolve(TEST_SANDBOX, "folder_contoh"), { recursive: true });
    logs = run(`
        tulis jinisPath("folder_contoh")
        tulis jinisPath("ora_ana_folder")
    `);
    assert.strictEqual(logs[0], "folder");
    assert.strictEqual(logs[1], "oraAna");
    totalPassed++; // 15
    totalPassed++; // 16

    // =========================================================================
    // KATEGORI H: Directory Listing (isiFolder)
    // =========================================================================
    console.log("--- Kategori H: Directory Listing (isiFolder) ---");
    const subFolderList = path.resolve(TEST_SANDBOX, "listing_dir");
    fs.mkdirSync(subFolderList, { recursive: true });
    fs.writeFileSync(path.resolve(subFolderList, "f1.txt"), "1");
    fs.writeFileSync(path.resolve(subFolderList, "f2.txt"), "2");

    logs = run(`
        gawe dhaftar = isiFolder("listing_dir")
        tulis jinis(dhaftar)
        tulis dawa(dhaftar)
        tulis ngemot(dhaftar[0], "f")
        tulis ngemot(dhaftar[1], "f")
    `);
    assert.strictEqual(logs[0], "array");
    assert.strictEqual(logs[1], "2");
    assert.strictEqual(logs[2], "bener");
    assert.strictEqual(logs[3], "bener");
    totalPassed++; // 17
    totalPassed++; // 18
    totalPassed++; // 19
    totalPassed++; // 20

    // Empty folder listing returns empty array
    fs.mkdirSync(path.resolve(TEST_SANDBOX, "folder_suwung"), { recursive: true });
    logs = run(`
        gawe d = isiFolder("folder_suwung")
        tulis dawa(d)
    `);
    assert.strictEqual(logs[0], "0");
    totalPassed++; // 21

    // =========================================================================
    // KATEGORI I: Make Directory (gaweFolder)
    // =========================================================================
    console.log("--- Kategori I: Make Directory (gaweFolder) ---");
    logs = run(`
        gawe res = gaweFolder("folder_anyar")
        tulis res
        tulis anaPath("folder_anyar")
        tulis jinisPath("folder_anyar")
    `);
    assert.strictEqual(logs[0], "null");
    assert.strictEqual(logs[1], "bener");
    assert.strictEqual(logs[2], "folder");
    totalPassed++; // 22
    totalPassed++; // 23
    totalPassed++; // 24

    // Idempotent: creating already existing folder succeeds
    logs = run(`
        gawe res2 = gaweFolder("folder_anyar")
        tulis res2
    `);
    assert.strictEqual(logs[0], "null");
    totalPassed++; // 25

    // =========================================================================
    // KATEGORI J: Nested Directory Creation
    // =========================================================================
    console.log("--- Kategori J: Nested Directory (gaweFolder) ---");
    logs = run(`
        gaweFolder("jebul/anak/putu")
        tulis anaPath("jebul/anak/putu")
        tulis jinisPath("jebul/anak/putu")
        tulisFile("jebul/anak/putu/data.txt", "anak cucu")
        tulis macaFile("jebul/anak/putu/data.txt")
    `);
    assert.strictEqual(logs[0], "bener");
    assert.strictEqual(logs[1], "folder");
    assert.strictEqual(logs[2], "anak cucu");
    totalPassed++; // 26
    totalPassed++; // 27
    totalPassed++; // 28

    // =========================================================================
    // KATEGORI K: JSON Integration
    // =========================================================================
    console.log("--- Kategori K: JSON Integration ---");
    logs = run(`
        gawe data = {
            "judul": "Babad Jawa",
            "taun": 2026,
            "tuntas": bener,
            "wong": ["A", "B", "C"],
            "cathetan": null
        }
        tulisFile("data.json", jsonEncode(data))
        gawe asil = jsonDecode(macaFile("data.json"))
        tulis asil["judul"]
        tulis asil["taun"]
        tulis asil["tuntas"]
        tulis asil["wong"][1]
        tulis jinis(asil["cathetan"])
    `);
    assert.strictEqual(logs[0], "Babad Jawa");
    assert.strictEqual(logs[1], "2026");
    assert.strictEqual(logs[2], "bener");
    assert.strictEqual(logs[3], "B");
    assert.strictEqual(logs[4], "null");
    totalPassed++; // 29
    totalPassed++; // 30
    totalPassed++; // 31
    totalPassed++; // 32
    totalPassed++; // 33

    // =========================================================================
    // KATEGORI L: Exception Handling (coba ... tangkep)
    // =========================================================================
    console.log("--- Kategori L: Exception Handling ---");
    logs = run(`
        coba {
            macaFile("ora_bakal_ana.txt")
        } tangkep err {
            tulis "Kacekel maca:"
            tulis ngemot(err, "ora ditemokake")
        }
    `);
    assert.strictEqual(logs[0], "Kacekel maca:");
    assert.strictEqual(logs[1], "bener");
    totalPassed++; // 34
    totalPassed++; // 35

    logs = run(`
        coba {
            macaFile("../secret.txt")
        } tangkep err {
            tulis "Kacekel sandbox:"
            tulis ngemot(err, "metu saka sandbox")
        }
    `);
    assert.strictEqual(logs[0], "Kacekel sandbox:");
    assert.strictEqual(logs[1], "bener");
    totalPassed++; // 36
    totalPassed++; // 37

    // =========================================================================
    // KATEGORI M: First-Class Builtins
    // =========================================================================
    console.log("--- Kategori M: First-Class Builtins ---");
    logs = run(`
        gawe maca = macaFile
        gawe nulis = tulisFile
        gawe ana = anaPath

        gawe res = nulis("fc.txt", "isi first class")
        tulis res
        tulis maca("fc.txt")
        tulis ana("fc.txt")
        tulis jinis(macaFile)
    `);
    assert.strictEqual(logs[0], "null");
    assert.strictEqual(logs[1], "isi first class");
    assert.strictEqual(logs[2], "bener");
    assert.strictEqual(logs[3], "function");
    totalPassed++; // 38
    totalPassed++; // 39
    totalPassed++; // 40
    totalPassed++; // 41

    // =========================================================================
    // KATEGORI N: REPL Integration Simulation
    // =========================================================================
    console.log("--- Kategori N: REPL Simulation ---");
    // In REPL, isRepl is true and cwd is used as sandbox root
    const replSession = interpreter.createSession();
    assert.strictEqual(replSession.isRepl, true);
    totalPassed++; // 42

    // =========================================================================
    // KATEGORI O: Module Sandbox Isolation
    // =========================================================================
    console.log("--- Kategori O: Module Sandbox Isolation ---");
    // Create subfolder module that reads a root file
    const modDir = path.resolve(TEST_SANDBOX, "modules");
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.resolve(TEST_SANDBOX, "root_data.txt"), "ROOT_LEVEL", "utf8");
    fs.writeFileSync(
        path.resolve(modDir, "worker.jawa"),
        `
        gawe isi = macaFile("root_data.txt")
        ekspor gawe hasilWorker = isi
        `,
        "utf8"
    );

    logs = run(`
        impor "modules/worker.jawa" minangka mod
        tulis mod.hasilWorker
    `);
    assert.strictEqual(logs[0], "ROOT_LEVEL");
    totalPassed++; // 43

    // =========================================================================
    // KATEGORI P: Argument & Content Type Assertions
    // =========================================================================
    console.log("--- Kategori P: Argument & Content Type Assertions ---");
    expectError(`tulisFile("a.txt", 123)`, "Argument kapindho tulisFile() kudu string");
    totalPassed++; // 44
    expectError(`tulisFile("a.txt", bener)`, "Argument kapindho tulisFile() kudu string");
    totalPassed++; // 45
    expectError(`tulisFile("a.txt", null)`, "Argument kapindho tulisFile() kudu string");
    totalPassed++; // 46
    expectError(`tulisFile("a.txt", [1, 2])`, "Argument kapindho tulisFile() kudu string");
    totalPassed++; // 47
    expectError(`tulisFile(123, "teks")`, "Argument kapisan tulisFile() kudu string");
    totalPassed++; // 48
    expectError(`macaFile(123)`, "macaFile() mung bisa digunakake kanggo string");
    totalPassed++; // 49
    expectError(`anaPath(123)`, "anaPath() mung bisa digunakake kanggo string");
    totalPassed++; // 50
    expectError(`jinisPath(123)`, "jinisPath() mung bisa digunakake kanggo string");
    totalPassed++; // 51
    expectError(`isiFolder(123)`, "isiFolder() mung bisa digunakake kanggo string");
    totalPassed++; // 52
    expectError(`gaweFolder(123)`, "gaweFolder() mung bisa digunakake kanggo string");
    totalPassed++; // 53

    // Arity checks
    expectError(`macaFile()`, "mbutuhake 1 argument, nanging diwenehi 0");
    totalPassed++; // 54
    expectError(`macaFile("a", "b")`, "mbutuhake 1 argument, nanging diwenehi 2");
    totalPassed++; // 55
    expectError(`tulisFile("a")`, "mbutuhake 2 argument, nanging diwenehi 1");
    totalPassed++; // 56
    expectError(`tulisFile("a", "b", "c")`, "mbutuhake 2 argument, nanging diwenehi 3");
    totalPassed++; // 57

    // =========================================================================
    // KATEGORI Q: Missing File Error
    // =========================================================================
    console.log("--- Kategori Q: Missing File Error ---");
    expectError(`macaFile("ora_ana_tenan.txt")`, 'File "ora_ana_tenan.txt" ora ditemokake');
    totalPassed++; // 58
    expectError(`isiFolder("folder_ilang")`, 'Folder "folder_ilang" ora ditemokake');
    totalPassed++; // 59

    // =========================================================================
    // KATEGORI R: Directory as File / File as Directory
    // =========================================================================
    console.log("--- Kategori R: Folder/File Collisions ---");
    fs.mkdirSync(path.resolve(TEST_SANDBOX, "dadi_folder"), { recursive: true });
    expectError(`macaFile("dadi_folder")`, "minangka folder, dudu file");
    totalPassed++; // 60

    fs.writeFileSync(path.resolve(TEST_SANDBOX, "dadi_file.txt"), "isi berkas", "utf8");
    expectError(`isiFolder("dadi_file.txt")`, "dudu folder");
    totalPassed++; // 61
    expectError(`gaweFolder("dadi_file.txt")`, "wis ana minangka file");
    totalPassed++; // 62
    expectError(`tulisFile("dadi_folder", "gagal")`, "wis ana minangka folder");
    totalPassed++; // 63

    // Writing to a missing parent directory
    expectError(`tulisFile("ora_ana_induk/file.txt", "halo")`, "Folder induk");
    totalPassed++; // 64

    // =========================================================================
    // KATEGORI S: Invalid Path Strings
    // =========================================================================
    console.log("--- Kategori S: Invalid Path Strings ---");
    expectError(`macaFile("")`, "Path ora kena kosong");
    totalPassed++; // 65
    expectError(`macaFile("   ")`, "Path ora kena kosong");
    totalPassed++; // 66
    expectError(`tulisFile("", "isi")`, "Path ora kena kosong");
    totalPassed++; // 67
    assert.throws(
        () => resolveSandboxPath("file\0null.txt", { sandboxRoot: TEST_SANDBOX }),
        err => err.message.includes("ngemot null byte")
    );
    totalPassed++; // 68

    // =========================================================================
    // KATEGORI T: Path Traversal (Posix style)
    // =========================================================================
    console.log("--- Kategori T: Path Traversal ---");
    expectError(`macaFile("../secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 69
    expectError(`macaFile("../../secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 70
    expectError(`macaFile("foo/../../secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 71
    expectError(`macaFile("./../../secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 72
    expectError(`tulisFile("../hack.txt", "evil")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 73
    expectError(`gaweFolder("../evil_folder")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 74
    expectError(`isiFolder("../")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 75

    // =========================================================================
    // KATEGORI U: Absolute Paths Across Platforms
    // =========================================================================
    console.log("--- Kategori U: Absolute Paths ---");
    expectError(`macaFile("C:\\secret.txt")`, "Path absolut ora diijini");
    totalPassed++; // 76
    expectError(`macaFile("C:/secret.txt")`, "Path absolut ora diijini");
    totalPassed++; // 77
    expectError(`macaFile("D:\\data.txt")`, "Path absolut ora diijini");
    totalPassed++; // 78
    expectError(`macaFile("/etc/passwd")`, "Path absolut ora diijini");
    totalPassed++; // 79
    expectError(`macaFile("/var/log")`, "Path absolut ora diijini");
    totalPassed++; // 80
    expectError(`macaFile("\\\\server\\share\\file.txt")`, "Path absolut ora diijini");
    totalPassed++; // 81

    // =========================================================================
    // KATEGORI V: Windows Traversal Style (..\)
    // =========================================================================
    console.log("--- Kategori V: Windows Traversal ---");
    expectError(`macaFile("..\\\\secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 82
    expectError(`macaFile("..\\\\..\\\\secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 83
    expectError(`macaFile("sub\\\\..\\\\..\\\\secret.txt")`, "ora diijini amarga metu saka sandbox");
    totalPassed++; // 84

    // =========================================================================
    // KATEGORI W: Symlink Escape Protection
    // =========================================================================
    console.log("--- Kategori W: Symlink Escape Protection ---");
    let symlinkCreated = false;
    const symlinkPath = path.resolve(TEST_SANDBOX, "link_to_secret.txt");
    try {
        fs.symlinkSync(path.resolve(OUTSIDE_DIR, "secret.txt"), symlinkPath);
        symlinkCreated = true;
    } catch (_) {
        // OS may restrict symlink creation without admin rights
    }

    if (symlinkCreated) {
        expectError(`macaFile("link_to_secret.txt")`, "target metu saka sandbox");
        totalPassed++; // 85
    } else {
        // Fallback test verifying lexical subpath containment
        assert.strictEqual(isSubPath(TEST_SANDBOX, path.resolve(OUTSIDE_DIR, "secret.txt")), false);
        totalPassed++; // 85
    }

    // =========================================================================
    // KATEGORI X: Error Boundary & Clean Message Formats
    // =========================================================================
    console.log("--- Kategori X: Error Boundary ---");
    try {
        run(`macaFile("missing_file_xyz.txt")`);
        assert.fail("Should have thrown");
    } catch (e) {
        assert(!e.stack.includes("at Object.readFileSync"), "No raw Node fs stack trace leak");
        assert(e.message.includes("ora ditemokake"), "Includes bilingual Jawalang error");
        totalPassed++; // 86
    }

    // =========================================================================
    // KATEGORI Y: Security Audit Verification
    // =========================================================================
    console.log("--- Kategori Y: Security Audit ---");
    const fsSource = fs.readFileSync(path.resolve(__dirname, "../src/stdlib/filesystem.js"), "utf8");
    assert(!fsSource.includes("child_process"), "No child_process in filesystem.js");
    assert(!fsSource.includes("exec("), "No exec() in filesystem.js");
    assert(!fsSource.includes("spawn("), "No spawn() in filesystem.js");
    assert(!fsSource.includes("eval("), "No eval() in filesystem.js");
    assert(!fsSource.includes("new Function"), "No Function constructor in filesystem.js");
    totalPassed++; // 87

    // =========================================================================
    // KATEGORI Z: LSP & Stdlib Inventory Metadata
    // =========================================================================
    console.log("--- Kategori Z: LSP & Metadata ---");
    const requiredBuiltins = ["macaFile", "tulisFile", "anaPath", "jinisPath", "isiFolder", "gaweFolder"];
    for (const b of requiredBuiltins) {
        assert(b in stdlibMetadata, `stdlibMetadata must contain ${b}`);
        assert(b in lspUtils.BUILTINS, `LSP BUILTINS must contain ${b}`);
        assert(lspUtils.BUILTINS[b].signature.startsWith(b), `${b} signature format check`);
        assert(lspUtils.BUILTINS[b].description.length > 0, `${b} description check`);
        assert(lspUtils.BUILTINS[b].example.includes(b), `${b} example check`);
        assert(Array.isArray(lspUtils.BUILTINS[b].params), `${b} params check`);
    }
    totalPassed++; // 88

    console.log("\n================================================================");
    console.log(`      HASIL: ${totalPassed} ASSERTIONS PASSED (100%)             `);
    console.log("================================================================\n");

} finally {
    cleanupDirs();
}
