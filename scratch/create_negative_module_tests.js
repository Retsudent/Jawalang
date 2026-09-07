const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');

// examples/test_module_error.jawa
fs.writeFileSync(path.join(PROJECT, 'examples', 'test_module_error.jawa'), `// test_module_error.jawa
// Coba impor modul sing ora ana
impor "modul_sing_ora_ana"
`, 'utf8');

// scratch/test_module_negative.js
const testNegativeRunnerContent = `const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_module_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync('node index.js examples/__neg_module_tmp__.jawa', {
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
        console.log(\`PASS: \${name} -> \${expectedFragment}\`);
        passed++;
    } else {
        console.log(\`FAIL: \${name}\`);
        console.log(\`  Expected to contain: \${expectedFragment}\`);
        console.log(\`  Got (success=\${r.success}): \${r.output.slice(0, 300)}\`);
        failed++;
    }
}

// 1. Missing module
test(
    'Missing module',
    'impor "modul_ora_ana"',
    'Modul ora ditemokake'
);

// 2. Invalid import syntax (no string)
test(
    'Import non-string number',
    'impor 123',
    'Dibutuhake string path modul'
);

// 3. Import non-string boolean
test(
    'Import non-string boolean',
    'impor bener',
    'Dibutuhake string path modul'
);

// 4. Import without argument
test(
    'Import without argument',
    'impor',
    'Dibutuhake string path modul'
);

// 5. Invalid export syntax (export without target)
test(
    'Export without target',
    'ekspor',
    'Dibutuhake deklarasi fungsi utawa variabel'
);

// 6. Invalid export syntax (export number)
test(
    'Export number',
    'ekspor 123',
    'Dibutuhake deklarasi fungsi utawa variabel'
);

// 7. Export inside function
test(
    'Export inside function',
    'fungsi tes() { ekspor gawe x = 10 }',
    'ora bisa digunakake ing njero fungsi'
);

// 8. Import inside function
test(
    'Import inside function',
    'fungsi tes() { impor "modules/matematika" }',
    'ora bisa digunakake ing njero fungsi'
);

// 9. Import inside conditional
test(
    'Import inside conditional',
    'yen bener { impor "modules/matematika" }',
    'mung bisa digunakake ing top-level module'
);

// 10. Import inside loop
test(
    'Import inside loop',
    'nalika bener { impor "modules/matematika" }',
    'ora bisa digunakake ing njero loop'
);

// 11. Export inside conditional
test(
    'Export inside conditional',
    'yen bener { ekspor gawe x = 10 }',
    'mung bisa digunakake ing top-level module'
);

// 12. Export inside loop
test(
    'Export inside loop',
    'nalika bener { ekspor gawe x = 10 }',
    'ora bisa digunakake ing njero loop'
);

// 13. Import inside try/catch
test(
    'Import inside try/catch',
    'coba { impor "modules/matematika" } tangkep err { tulis err }',
    'mung bisa digunakake ing top-level module'
);

// 14. Access private variable from imported module
test(
    'Access private variable',
    'impor "modules/private"\\ntulis rahasia',
    'Variabel "rahasia" durung digawe'
);

// 15. Circular dependency
test(
    'Circular dependency',
    'impor "modules/circular_a"',
    'Circular module dependency'
);

// 16. Imported module syntax error
test(
    'Imported module syntax error',
    'impor "modules/syntax_error"',
    'Kasalahan sintaks ing modul'
);

// 17. Imported module runtime error
test(
    'Imported module runtime error',
    'impor "modules/runtime_error"',
    'module gagal dieksekusi'
);

// 18. Invalid file extension
test(
    'Invalid file extension',
    'impor "modules/matematika.js"',
    'Ekstensi file ora sah'
);

console.log(\`\\nNegative Test Results: \${passed}/\${passed + failed} passed\`);
if (failed > 0) process.exit(1);
`;

fs.writeFileSync(path.join(__dirname, 'test_module_negative.js'), testNegativeRunnerContent, 'utf8');
console.log('test_module_error.jawa and test_module_negative.js created');
`;

fs.writeFileSync(path.join(__dirname, 'create_negative_module_tests.js'), testNegativeRunnerContent, 'utf8');
