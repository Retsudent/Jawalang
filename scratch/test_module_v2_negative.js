const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');
const SCRATCH = __dirname;

function runCode(code, isFile = false) {
    let tmpFile;
    if (isFile) {
        tmpFile = path.join(PROJECT, 'examples', '__neg_mod_v2_tmp__.jawa');
        fs.writeFileSync(tmpFile, code, 'utf8');
    } else {
        tmpFile = path.join(PROJECT, 'examples', '__neg_mod_v2_tmp__.jawa');
        fs.writeFileSync(tmpFile, code, 'utf8');
    }
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

let passed = 0;
let failed = 0;

function test(name, code, expectedFragment) {
    const r = runCode(code);
    if (!r.success && r.output.includes(expectedFragment)) {
        console.log(`PASS: ${name} -> ${expectedFragment}`);
        passed++;
    } else {
        console.log(`FAIL: ${name}`);
        console.log(`  Expected to contain: ${expectedFragment}`);
        console.log(`  Got (success=${r.success}): ${r.output.slice(0, 300)}`);
        failed++;
    }
}

console.log('=== RUNNING MODULE V2 NEGATIVE TESTS ===');

// 1. Export struct nested in function
test(
    'Export struct nested in function',
    `guna test() {
    ekspor bentuk Wong {}
}`,
    'ora bisa digunakake ing njero fungsi'
);

// 2. Export struct nested in if block
test(
    'Export struct nested in if',
    `yen bener {
    ekspor bentuk Wong {}
}`,
    'mung bisa digunakake ing top-level module'
);

// 3. Export struct nested in loop
test(
    'Export struct nested in loop',
    `nalika salah {
    ekspor bentuk Wong {}
}`,
    'ora bisa digunakake ing njero loop'
);

// 4. Export struct nested in try/catch
test(
    'Export struct nested in try/catch',
    `coba {
    ekspor bentuk Wong {}
} tangkep e {}`,
    'mung bisa digunakake ing top-level module'
);

// 5. Duplicate exported struct same module
test(
    'Duplicate exported struct',
    `ekspor bentuk Wong {}
ekspor bentuk Wong {}`,
    'wis ana'
);

// 6. Exported struct name collision with function
test(
    'Struct name collision with function',
    `guna Wong() {}
ekspor bentuk Wong {}`,
    'wis digunakake minangka fungsi'
);

// 7. Exported struct name collision with variable
test(
    'Struct name collision with variable',
    `gawe Wong = 10
ekspor bentuk Wong {}`,
    'wis digunakake minangka variabel'
);

// 8. Private struct access from importer
test(
    'Private struct access from importer',
    `impor "modules/mod_struct_v2"
gawe s = anyar SecretConfig()`,
    'durung digawe'
);

// 9. Undefined imported struct
test(
    'Undefined imported struct',
    `impor "modules/mod_struct_v2"
gawe s = anyar StructTidakAda()`,
    'durung digawe'
);

// 10. Constructor too few args
test(
    'Constructor too few args',
    `impor "modules/mod_struct_v2"
gawe g = anyar Greeter()`,
    'mbutuhake'
);

// 11. Constructor too many args
test(
    'Constructor too many args',
    `impor "modules/mod_struct_v2"
gawe g = anyar Greeter("a", "b", "c")`,
    'mbutuhake'
);

// 12. Calling non-function field (number field as function)
test(
    'Calling non-function field',
    `bentuk Foo {
    gawe x = 10
}
gawe f = anyar Foo()
f["x"]()`,
    'bukan function'
);

// 13. Invalid instance index (non-string key)
test(
    'Invalid instance index - number key',
    `impor "modules/mod_struct_v2"
gawe g = anyar Greeter("X")
gawe x = g[0]`,
    'key string'
);

// 14. iki outside method
test(
    'iki outside method (top-level)',
    `tulis iki`,
    '"iki" mung bisa digunakake ing njero method'
);

// 15. iki inside regular function
test(
    'iki inside regular function',
    `guna tes() {
    tulis iki
}
tes()`,
    '"iki" mung bisa digunakake ing njero method'
);

// 16. Constructor exception propagation
test(
    'Constructor exception propagation',
    `bentuk Bomb {
    guna wiwiti() {
        lempar "bomb meledak"
    }
}
gawe b = anyar Bomb()`,
    'bomb meledak'
);

// 17. Method exception propagation (uncaught)
test(
    'Method exception propagation uncaught',
    `impor "modules/mod_struct_err"
gawe t = anyar Tester()
t["error"]()`,
    'kesalahan dari method'
);

// 18. Missing module
test(
    'Missing module',
    `impor "modules/tidak_ada"`,
    'Modul ora ditemokake'
);

// 19. Invalid module extension
test(
    'Invalid module extension',
    `impor "modules/matematika.js"`,
    'Ekstensi file ora sah'
);

// 20. Imported module syntax error
test(
    'Imported module syntax error',
    `impor "modules/syntax_error"`,
    'Kasalahan sintaks ing modul'
);

// 21. Circular module dependency
test(
    'Circular module dependency',
    `impor "modules/circular_a"`,
    'Circular module dependency'
);

console.log(`\nModule V2 Negative Tests: ${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
