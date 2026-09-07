const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = 'D:\\Jawascript';

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_dot_v4_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync('node index.js examples/__neg_dot_v4_tmp__.jawa', {
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

console.log('=== RUNNING DOT NOTATION V4 NEGATIVE TESTS ===');

// 1. Trailing dot in expression
test(
    'Trailing dot in expression',
    `gawe obj = { "x": 10 }
tulis obj.`,
    'Dibutuhake jeneng properti sawise "."'
);

// 2. Trailing dot in assignment
test(
    'Trailing dot in assignment',
    `gawe obj = { "x": 10 }
obj. = 20`,
    'Dibutuhake jeneng properti sawise "."'
);

// 3. Double dot
test(
    'Double dot access',
    `gawe obj = { "x": 10 }
tulis obj..x`,
    'Dibutuhake jeneng properti sawise "."'
);

// 4. Number after dot
test(
    'Number immediately after dot as property',
    `gawe obj = { "x": 10 }
tulis obj.123`,
    'Dibutuhake jeneng properti sawise "."'
);

// 5. Keyword after dot
test(
    'Keyword after dot',
    `gawe obj = { "x": 10 }
tulis obj.yen`,
    'Dibutuhake jeneng properti sawise "."'
);

// 6. Namespace property mutation via dot
test(
    'Namespace property mutation via dot',
    `impor "modules/mod_v3_namespace" minangka math
math.versi = "99.0"`,
    'Namespace ora bisa diowahi'
);

// 7. Namespace function re-assignment via dot
test(
    'Namespace function re-assignment via dot',
    `impor "modules/mod_v3_namespace" minangka math
math.tambah = 123`,
    'Namespace ora bisa diowahi'
);

// 8. iki outside of method via dot read
test(
    'iki outside of method via dot read',
    `gawe x = iki.jeneng`,
    '"iki" mung bisa digunakake ing njero method'
);

// 9. iki outside of method via dot write
test(
    'iki outside of method via dot write',
    `iki.jeneng = "Siti"`,
    '"iki" mung bisa digunakake ing njero method'
);

// 10. Direct iki assignment
test(
    'Direct iki assignment',
    `iki = 100`,
    '"iki" ora bisa di-assign langsung'
);

// 11. anyar with trailing dot
test(
    'anyar with trailing dot',
    `impor "modules/mod_v3_namespace" minangka math
gawe w = anyar math.()`,
    'Dibutuhake jeneng properti sawise "."'
);

// 12. anyar with number after dot
test(
    'anyar with number after dot',
    `impor "modules/mod_v3_namespace" minangka math
gawe w = anyar math.123()`,
    'Dibutuhake jeneng properti sawise "."'
);

// 13. Old keyword fungsi remains rejected
test(
    'Old keyword fungsi rejected',
    `fungsi tambah(a, b) {
    bali a + b
}`,
    'Statement ora dikenal: "fungsi"'
);

// 14. Calling non-callable dot property
test(
    'Calling non-callable dot property',
    `gawe obj = { "val": 123 }
obj.val()`,
    'Nilai ora bisa diceluk minangka fungsi'
);

console.log(`\nDot Notation V4 Negative Tests: ${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
