const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = 'D:\\Jawascript';

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_v11_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync('node index.js examples/__neg_v11_tmp__.jawa', {
            cwd: PROJECT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        fs.unlinkSync(tmpFile);
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

// 1. Missing module
test(
    'Missing module',
    'impor "modul_ora_ana"',
    'Modul ora ditemokake'
);

// 2. Invalid extension (.js)
test(
    'Invalid extension .js',
    'impor "modules/matematika.js"',
    'Ekstensi file ora sah'
);

// 3. Import non-string
test(
    'Import non-string number',
    'impor 123',
    'Dibutuhake string path modul'
);

// 4. Import missing argument
test(
    'Import missing argument',
    'impor',
    'Dibutuhake string path modul'
);

// 5. Import inside function
test(
    'Import inside function',
    'guna f() { impor "modules/matematika" }',
    'ora bisa digunakake ing njero fungsi'
);

// 6. Import inside conditional
test(
    'Import inside conditional',
    'yen bener { impor "modules/matematika" }',
    'mung bisa digunakake ing top-level module'
);

// 7. Import inside loop
test(
    'Import inside loop',
    'nalika bener { impor "modules/matematika" }',
    'ora bisa digunakake ing njero loop'
);

// 8. Import inside try/catch
test(
    'Import inside try/catch',
    'coba { impor "modules/matematika" } tangkep err { }',
    'mung bisa digunakake ing top-level module'
);

// 9. Export inside function
test(
    'Export inside function',
    'guna f() { ekspor gawe x = 10 }',
    'ora bisa digunakake ing njero fungsi'
);

// 10. Export inside conditional
test(
    'Export inside conditional',
    'yen bener { ekspor gawe x = 10 }',
    'mung bisa digunakake ing top-level module'
);

// 11. Export inside loop
test(
    'Export inside loop',
    'nalika bener { ekspor gawe x = 10 }',
    'ora bisa digunakake ing njero loop'
);

// 12. Export inside try/catch
test(
    'Export inside try/catch',
    'coba { ekspor gawe x = 10 } tangkep err { }',
    'mung bisa digunakake ing top-level module'
);

// 13. Private variable access
test(
    'Private variable access',
    'impor "modules/private"\ntulis rahasia',
    'Variabel "rahasia" durung digawe'
);

// 14. Private function access
test(
    'Private function access',
    'impor "modules/internal_helper"\ntulis rahasiaTambah(1, 2)',
    'Function "rahasiaTambah" durung digawe'
);

// 15. Circular dependency
test(
    'Circular dependency',
    'impor "modules/circular_a"',
    'Circular module dependency'
);

// 16. Module syntax error
test(
    'Module syntax error',
    'impor "modules/syntax_error"',
    'Kasalahan sintaks ing modul'
);

// 17. Module runtime error
test(
    'Module runtime error',
    'impor "modules/runtime_error"',
    'module gagal dieksekusi'
);

// 18. Failed module cache behavior (duplicate import of failed module)
test(
    'Failed module duplicate import',
    'impor "modules/runtime_error"\nimpor "modules/runtime_error"',
    'module gagal dieksekusi'
);

console.log(`\nV1.1 Negative Test Results: ${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
