const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_struct_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync(`"${process.execPath}" "${path.join(PROJECT, 'index.js')}" "${tmpFile}"`, {
            cwd: PROJECT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
        return { success: true, output: result.trim() };
    } catch (e) {
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
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

console.log("=== RUNNING STRUCT & METHOD V1 NEGATIVE TESTS ===");
let passed = 0;
let total = 0;

function test(name, code, expected) {
    total++;
    if (expectError(name, code, expected)) passed++;
}

// 1. Direct assignment to iki
test("iki direct assignment", `
bentuk A {
    guna run() {
        iki = 10
    }
}
gawe a = anyar A()
a["run"]()
`, '"iki" ora bisa di-assign langsung');

// 2. iki outside of method
test("iki outside of method (top-level)", `
tulis iki
`, '"iki" mung bisa digunakake ing njero method');

// 3. iki inside regular function
test("iki inside regular function", `
guna tes() {
    tulis iki
}
tes()
`, '"iki" mung bisa digunakake ing njero method');

// 4. gawe iki = ...
test("variable named iki", `
gawe iki = 10
`, 'Sawise "gawe" kudu ana jeneng variabel');

// 5. guna iki() {}
test("function named iki", `
guna iki() {}
`, 'Sawise "guna" kudu ana jeneng fungsi');

// 6. gawe wiwiti = ...
test("variable named wiwiti", `
gawe wiwiti = 10
`, 'Sawise "gawe" kudu ana jeneng variabel');

// 7. guna wiwiti() outside struct
test("function named wiwiti outside struct", `
guna wiwiti() {}
`, 'Sawise "guna" kudu ana jeneng fungsi');

// 8. gawe bentuk = ...
test("variable named bentuk", `
gawe bentuk = 10
`, 'Sawise "gawe" kudu ana jeneng variabel');

// 9. field named wiwiti inside struct
test("field named wiwiti inside struct", `
bentuk X {
    gawe wiwiti = 10
}
`, 'Sawise "gawe" ing struct "X" kudu ana jeneng property');

// 10. Duplicate field in struct
test("duplicate field in struct", `
bentuk D {
    gawe x = 1
    gawe x = 2
}
`, 'Property "x" wis dideklarasikake ing struct "D"');

// 11. Duplicate method in struct
test("duplicate method in struct", `
bentuk D {
    guna info() {}
    guna info() {}
}
`, 'Method "info" wis dideklarasikake ing struct "D"');

// 12. Nested struct in function
test("struct inside function", `
guna f() {
    bentuk Inside {}
}
`, '"bentuk" ora bisa digunakake ing njero fungsi');

// 13. Nested struct in while loop
test("struct inside while loop", `
nalika (salah) {
    bentuk Inside {}
}
`, '"bentuk" ora bisa digunakake ing njero loop');

// 14. Nested struct in if block
test("struct inside if block", `
yen (bener) {
    bentuk Inside {}
}
`, '"bentuk" mung bisa digunakake ing top-level');

// 15. Nested struct in try-catch
test("struct inside try-catch", `
coba {
    bentuk Inside {}
} tangkep e {}
`, '"bentuk" mung bisa digunakake ing top-level');

// 16. Struct duplicate with function
test("struct name duplicate with function", `
guna Wong() {}
bentuk Wong {}
`, 'Jeneng "Wong" wis digunakake minangka fungsi');

// 17. Function duplicate with struct
test("function name duplicate with struct", `
bentuk Wong {}
guna Wong() {}
`, 'Jeneng "Wong" wis digunakake minangka struct');

// 18. Struct name colliding with builtin
test("struct name colliding with builtin", `
bentuk dawa {}
`, 'Jeneng "dawa" wis digunakake dening built-in');

// 19. Function in export colliding with struct
test("exported function colliding with struct", `
bentuk Wong {}
ekspor guna Wong() {}
`, 'Jeneng "Wong" wis digunakake minangka struct');

// 20. anyar with arguments when no constructor
test("anyar with args but no wiwiti", `
bentuk Polosan {
    gawe x = 10
}
gawe p = anyar Polosan(1, 2)
`, 'ora duwe constructor "wiwiti", nanging diwenehi 2 argument');

// 21. anyar with too few arguments for wiwiti
test("anyar with too few args for wiwiti", `
bentuk ButuhLoro {
    guna wiwiti(a, b) {}
}
gawe b = anyar ButuhLoro(1)
`, 'Method "wiwiti" mbutuhake 2 argument, nanging diwenehi 1');

// 22. anyar with too many arguments for wiwiti
test("anyar with too many args for wiwiti", `
bentuk ButuhLoro {
    guna wiwiti(a, b) {}
}
gawe b = anyar ButuhLoro(1, 2, 3)
`, 'Method "wiwiti" mbutuhake 2 argument, nanging diwenehi 3');

// 23. anyar for undeclared struct
test("anyar undeclared struct", `
gawe x = anyar OraAna()
`, 'Struct "OraAna" durung digawe');

// 24. Assigning to instance["iki"]
test("assigning to instance iki property", `
bentuk X {}
gawe inst = anyar X()
inst["iki"] = 123
`, '"iki" ora bisa digunakake minangka property instance');

// 25. Invalid statement inside struct body
test("invalid statement in struct body", `
bentuk X {
    tulis "ora kena"
}
`, 'mung diijinake deklarasi "gawe" (property) utawa "guna" (method)');

// 26. Non-string index on instance
test("non-string index on instance", `
bentuk X {
    gawe a = 1
}
gawe inst = anyar X()
tulis inst[0]
`, 'Instance mung bisa diakses nganggo key string');

// 27. Calling non-callable field as method
test("calling non-function field", `
bentuk X {
    gawe val = 100
}
gawe inst = anyar X()
inst["val"]()
`, 'Nilai ora bisa diceluk minangka fungsi');

// 28. Old keyword fungsi is rejected
test("old keyword fungsi rejected", `
fungsi tambah(a, b) {
    bali a + b
}
`, 'Statement ora dikenal: "fungsi"');

// 29. Variable named guna is rejected
test("variable named guna rejected", `
gawe guna = 10
`, 'Sawise "gawe" kudu ana jeneng variabel');

console.log(`\nResults: ${passed} / ${total} PASS`);
if (passed !== total) process.exit(1);
