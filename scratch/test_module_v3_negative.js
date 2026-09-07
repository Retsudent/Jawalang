const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_mod_v3_tmp__.jawa');
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

console.log('=== RUNNING MODULE V3 NEGATIVE TESTS ===');

// 1. Import private symbol
test(
    'Import private symbol',
    'impor { privVar } saka "modules/mod_v3_private"',
    'minangka simbol privat lan ora bisa diimpor'
);

// 2. Import nonexistent symbol
test(
    'Import nonexistent symbol',
    'impor { tidak_ada_simbol } saka "modules/mod_v3_basic"',
    'ora ditemokake ing modul'
);

// 3. Duplicate selective import symbol
test(
    'Duplicate selective import',
    'impor { tambah, tambah } saka "modules/mod_v3_basic"',
    'wis ana ing dhaftar impor'
);

// 4. Duplicate alias target
test(
    'Duplicate alias target',
    'impor { tambah minangka plus, kurang minangka plus } saka "modules/mod_v3_basic"',
    'wis ana ing dhaftar impor'
);

// 5. Alias collision with variable
test(
    'Alias collision with variable',
    `gawe plus = 10
impor { tambah minangka plus } saka "modules/mod_v3_basic"`,
    'wis digunakake minangka variabel'
);

// 6. Alias collision with function
test(
    'Alias collision with function',
    `guna plus() {}
impor { tambah minangka plus } saka "modules/mod_v3_basic"`,
    'wis digunakake minangka fungsi'
);

// 7. Alias collision with struct
test(
    'Alias collision with struct',
    `bentuk plus {}
impor { tambah minangka plus } saka "modules/mod_v3_basic"`,
    'wis digunakake minangka struct'
);

// 8. Namespace collision with variable
test(
    'Namespace collision with variable',
    `gawe math = 10
impor "modules/mod_v3_basic" minangka math`,
    'wis digunakake minangka variabel'
);

// 9. Namespace collision with function
test(
    'Namespace collision with function',
    `guna math() {}
impor "modules/mod_v3_basic" minangka math`,
    'wis digunakake minangka fungsi'
);

// 10. Namespace collision with struct
test(
    'Namespace collision with struct',
    `bentuk math {}
impor "modules/mod_v3_basic" minangka math`,
    'wis digunakake minangka struct'
);

// 11. Invalid selective syntax (empty specifiers)
test(
    'Invalid selective syntax empty {}',
    'impor {} saka "modules/mod_v3_basic"',
    'ora kena kosong'
);

// 12. Invalid alias syntax (no identifier after minangka)
test(
    'Invalid alias syntax',
    'impor { tambah minangka } saka "modules/mod_v3_basic"',
    'Dibutuhake jeneng alias sawise "minangka"'
);

// 13. Circular dependency via namespace
test(
    'Circular dependency via namespace',
    'impor "modules/circular_a" minangka circ',
    'Circular module dependency'
);

// 14. Module execution error propagated
test(
    'Module execution error',
    'impor "modules/chain_err_leaf" minangka errMod',
    'kesalahan saka chain_err_leaf'
);

// 15. Old fungsi syntax remains invalid
test(
    'Old fungsi keyword remains rejected',
    'fungsi lawas() {}',
    'Statement ora dikenal: "fungsi"'
);

// 16. Mutating namespace property is rejected
test(
    'Mutating namespace property rejected',
    `impor "modules/mod_v3_basic" minangka b
b["pi"] = 999`,
    'Namespace ora bisa diowahi'
);

// 17. Duplicate namespace import
test(
    'Duplicate namespace import',
    `impor "modules/mod_v3_basic" minangka b
impor "modules/mod_v3_struct" minangka b`,
    'wis digunakake minangka namespace'
);

// 18. Variable declaration colliding with namespace
test(
    'Variable colliding with namespace',
    `impor "modules/mod_v3_basic" minangka b
gawe b = 100`,
    'wis digunakake minangka namespace'
);

// 19. Function declaration colliding with namespace
test(
    'Function colliding with namespace',
    `impor "modules/mod_v3_basic" minangka b
guna b() {}`,
    'wis digunakake minangka namespace'
);

// 20. Struct declaration colliding with namespace
test(
    'Struct colliding with namespace',
    `impor "modules/mod_v3_basic" minangka b
bentuk b {}`,
    'wis digunakake minangka namespace'
);

console.log(`\nModule V3 Negative Tests: ${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
