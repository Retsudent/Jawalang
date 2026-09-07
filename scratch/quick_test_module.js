const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');

function run(file) {
    try {
        const out = execSync(`node index.js ${file}`, {
            cwd: PROJECT,
            encoding: 'utf8'
        });
        return { success: true, output: out.trim() };
    } catch (e) {
        return { success: false, output: ((e.stdout || '') + (e.stderr || '')).trim() };
    }
}

// Test 6: Lexical scoping across modules
fs.writeFileSync(path.join(PROJECT, 'examples', 'modules', 'lexical_a.jawa'), `
gawe jeneng = "A"

ekspor fungsi tampil() {
    bali jeneng
}
`, 'utf8');

const test6 = path.join(PROJECT, 'examples', 'test_mod_quick6.jawa');
fs.writeFileSync(test6, `
gawe jeneng = "B"
impor "modules/lexical_a"
tulis tampil()
`, 'utf8');

const r6 = run('examples/test_mod_quick6.jawa');
console.log('Test 6 (lexical scope):', r6);
fs.unlinkSync(test6);
fs.unlinkSync(path.join(PROJECT, 'examples', 'modules', 'lexical_a.jawa'));

// Test 7: Module relative path (nested imports helper)
// chain_a -> chain_b -> chain_c
const test7 = path.join(PROJECT, 'examples', 'test_mod_quick7.jawa');
fs.writeFileSync(test7, `
impor "modules/chain_a"
tulis nilaiA()
`, 'utf8');

const r7 = run('examples/test_mod_quick7.jawa');
console.log('Test 7 (module relative path chain):', r7);
fs.unlinkSync(test7);

// Test 8: Nested module path (modules/nested/helper)
const test8 = path.join(PROJECT, 'examples', 'test_mod_quick8.jawa');
fs.writeFileSync(test8, `
impor "modules/nested/helper"
tulis salam("Budi")
`, 'utf8');

const r8 = run('examples/test_mod_quick8.jawa');
console.log('Test 8 (nested helper):', r8);
fs.unlinkSync(test8);
