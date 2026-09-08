// test_exception_negative.js — negative tests for coba/tangkep/lempar
const { execSync } = require('child_process');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');

function run(code) {
    try {
        const result = execSync(
            `echo ${JSON.stringify(code)} | node index.js /dev/stdin`,
            { cwd: PROJECT, encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
        );
        return { success: true, output: result };
    } catch (e) {
        return { success: false, output: (e.stderr || '') + (e.stdout || '') };
    }
}

function runFile(filename) {
    const fs = require('fs');
    const tmpFile = path.join(PROJECT, 'examples', '__neg_tmp__.jawa');
    fs.writeFileSync(tmpFile, filename);
    try {
        const result = execSync(`"${process.execPath}" "${path.join(PROJECT, 'index.js')}" "${tmpFile}"`, {
            cwd: PROJECT, encoding: 'utf8', stdio: ['pipe','pipe','pipe']
        });
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
        return { success: true, output: result };
    } catch (e) {
        try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch (_) {}
        return { success: false, output: (e.stderr || '') + (e.stdout || '') };
    }
}

let passed = 0;
let failed = 0;

function test(name, code, expectedFragment) {
    const r = runFile(code);
    if (!r.success && r.output.includes(expectedFragment)) {
        console.log(`PASS: ${name} -> ${expectedFragment}`);
        passed++;
    } else {
        console.log(`FAIL: ${name}`);
        console.log(`  Expected error containing: ${expectedFragment}`);
        console.log(`  Got (success=${r.success}): ${r.output.trim().slice(0, 200)}`);
        failed++;
    }
}

// 1. coba without block
test(
    'coba tanpa blok',
    `coba`,
    '{'
);

// 2. coba block without tangkep
test(
    'coba tanpa tangkep',
    `coba { tulis "oke" }`,
    'tangkep'
);

// 3. tangkep without identifier
test(
    'tangkep tanpa identifier',
    `coba { tulis "oke" } tangkep { tulis "err" }`,
    'Sawise "tangkep"'
);

// 4. tangkep without block
test(
    'tangkep tanpa blok',
    `coba { tulis "oke" } tangkep err`,
    '{'
);

// 5. lempar without expression
test(
    'lempar tanpa ekspresi',
    `lempar`,
    'Dibutuhake ekspresi sawise "lempar"'
);

// 6. standalone tangkep
test(
    'standalone tangkep',
    `tangkep err { tulis "err" }`,
    'tangkep'
);

// 7. uncaught lempar
test(
    'lempar ora ditangkep',
    `lempar "gagal"`,
    'gagal'
);

console.log(`\nTotal: ${passed}/${passed + failed} passed`);
