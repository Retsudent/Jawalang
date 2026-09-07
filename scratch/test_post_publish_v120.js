/**
 * Jawalang V1.2.0 — Post-Publish Verification Test Suite
 * Validates the published npm package jawalang@1.2.0 from an external user's perspective.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');
const assert = require('assert');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(os.tmpdir(), 'jawalang-v120-verification');

console.log('====================================================');
console.log('    JAWALANG V1.2.0 POST-PUBLISH VERIFICATION      ');
console.log('====================================================\n');

const results = [];

function recordTest(name, fn) {
    process.stdout.write(`Testing: ${name}... `);
    try {
        fn();
        console.log('PASS');
        results.push({ name, passed: true });
    } catch (err) {
        console.log('FAIL');
        console.error(`  Error: ${err.message || err}`);
        results.push({ name, passed: false, error: err.message || String(err) });
    }
}

// 1. NPM Registry Verification
recordTest('1. NPM Registry Verification (version, dist-tags, bin, engines)', () => {
    const version = execSync('npm view jawalang version', { encoding: 'utf8' }).trim();
    assert.strictEqual(version, '1.2.0', `Expected 1.2.0, got ${version}`);

    const distTags = execSync('npm view jawalang dist-tags --json', { encoding: 'utf8' });
    const tags = JSON.parse(distTags);
    assert.strictEqual(tags.latest, '1.2.0', `Expected dist-tag latest 1.2.0, got ${tags.latest}`);

    const binRaw = execSync('npm view jawalang bin --json', { encoding: 'utf8' });
    const bin = JSON.parse(binRaw);
    assert.ok(bin.jawa, 'jawa bin entry must exist');
    assert.ok(bin.jawalang, 'jawalang bin entry must exist');

    const enginesRaw = execSync('npm view jawalang engines --json', { encoding: 'utf8' });
    const engines = JSON.parse(enginesRaw);
    assert.ok(engines.node, 'node engine constraint must exist');
});

// 2. Clean NPM Install in Isolated Temp Directory
recordTest('2. Clean NPM Install (%TEMP%/jawalang-v120-verification)', () => {
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    execSync('npm init -y', { cwd: TEMP_DIR, stdio: 'pipe' });
    execSync('npm install jawalang@1.2.0', { cwd: TEMP_DIR, stdio: 'pipe' });

    const installedPkgPath = path.join(TEMP_DIR, 'node_modules', 'jawalang', 'package.json');
    assert.ok(fs.existsSync(installedPkgPath), 'node_modules/jawalang/package.json must exist');

    const installedPkg = JSON.parse(fs.readFileSync(installedPkgPath, 'utf8'));
    assert.strictEqual(installedPkg.version, '1.2.0', 'Installed version must be 1.2.0');

    const npmList = execSync('npm list jawalang', { cwd: TEMP_DIR, encoding: 'utf8' });
    assert.ok(npmList.includes('jawalang@1.2.0'), 'npm list must show jawalang@1.2.0');
});

// 3. Installed Package Module Resolution
recordTest('3. Installed Package Module Resolution (require)', () => {
    const out = execSync('node -e "const j = require(\'jawalang\'); console.log(typeof j, typeof j.runSource);"', {
        cwd: TEMP_DIR,
        encoding: 'utf8'
    }).trim();
    assert.strictEqual(out, 'object function', 'require("jawalang") must resolve to exports object');
});

// Helper to spawn REPL cross-platform
function runRepl(input, options = {}) {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'jawa.cmd' : 'jawa';
    const args = ['repl'].concat(options.args || []);
    return spawnSync(binName, args, {
        cwd: TEMP_DIR,
        encoding: 'utf8',
        shell: isWin,
        input
    });
}

// 4. NPX Verification
recordTest('4. NPX Verification (npx jawalang@1.2.0 and npx jawa)', () => {
    const outJawalang = execSync('npx --yes jawalang@1.2.0 --version', {
        cwd: TEMP_DIR,
        encoding: 'utf8'
    }).trim();
    assert.ok(outJawalang.includes('Jawalang v1.2.0'), `Unexpected npx jawalang output: ${outJawalang}`);

    // jawa binary via package flag or local npx
    const outJawa = execSync('npx --yes -p jawalang@1.2.0 jawa --version', {
        cwd: TEMP_DIR,
        encoding: 'utf8'
    }).trim();
    assert.ok(outJawa.includes('Jawalang v1.2.0'), `Unexpected npx -p jawalang jawa output: ${outJawa}`);
});

// 5. Global Install Verification
recordTest('5. Global Install Verification (npm install -g jawalang@1.2.0)', () => {
    execSync('npm install -g jawalang@1.2.0', { stdio: 'pipe' });

    const outJawa = execSync('jawa --version', { encoding: 'utf8' }).trim();
    assert.ok(outJawa.includes('Jawalang v1.2.0'), `Global jawa output mismatch: ${outJawa}`);

    const outJawalang = execSync('jawalang --version', { encoding: 'utf8' }).trim();
    assert.ok(outJawalang.includes('Jawalang v1.2.0'), `Global jawalang output mismatch: ${outJawalang}`);
});

// 6. File Execution from Published Package
recordTest('6. File Execution from Published Package (hello.jawa)', () => {
    const helloPath = path.join(TEMP_DIR, 'hello.jawa');
    fs.writeFileSync(helloPath, 'gawe nama = "Jawalang"\ntulis("Halo " + nama)\n', 'utf8');

    const outJawa = execSync(`jawa "${helloPath}"`, { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
    assert.strictEqual(outJawa, 'Halo Jawalang');

    const outJawalang = execSync(`jawalang "${helloPath}"`, { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
    assert.strictEqual(outJawalang, 'Halo Jawalang');
});

// 7. REPL Basic Expression
recordTest('7. REPL Basic Expression Evaluation', () => {
    const res = runRepl('10 + 20\n"halo"\n10 > 5\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('Jawalang REPL v1.2.0'), 'Must contain banner');
    assert.ok(out.includes('30'), 'Must evaluate 10 + 20 -> 30');
    assert.ok(out.includes('halo'), 'Must evaluate "halo"');
    assert.ok(out.includes('bener'), 'Must evaluate 10 > 5 -> bener');
});

// 8. REPL State Persistence
recordTest('8. REPL State Persistence across Inputs', () => {
    const res = runRepl('gawe x = 10\nx + 5\nx = x + 20\nx\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('15'), 'Must evaluate x + 5 -> 15');
    assert.ok(out.includes('30'), 'Must evaluate x -> 30');
});

// 9. REPL Function Definition & Call
recordTest('9. REPL Function Definition & Call across Inputs', () => {
    const res = runRepl('guna tambah(a, b) {\nbali a + b\n}\ntambah(10, 20)\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('30'), 'Function call tambah(10, 20) must return 30');
});

// 10. REPL Struct Definition & Instantiation
recordTest('10. REPL Struct Definition, Instantiation & Member Access', () => {
    const res = runRepl('bentuk Titik {\ngawe x = 0\n}\ngawe t = anyar Titik()\nt.x\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('0'), 't.x must evaluate to 0');
});

// 11. takon() + REPL Readline Non-Conflict
recordTest('11. takon() in REPL without Readline Conflict', () => {
    // In piped stdin, takon() reads a line and readline resumes seamlessly
    const res = runRepl('gawe nama = takon("Jenengmu: ")\nBudi\nnama\n10 + 5\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('Jenengmu: '), 'Prompt must be printed');
    assert.ok(out.includes('Budi'), 'Variable value must be stored and printed');
    assert.ok(out.includes('15'), 'Subsequent command must execute and print 15');
});

// 12. REPL Error Recovery
recordTest('12. REPL Error Recovery (Runtime & Syntax Errors)', () => {
    // 12a. Runtime error (10 / 0) recovers and evaluates 5 + 5 -> 10
    // 12b. Syntax error (gawe 123) recovers and evaluates 20 + 22 -> 42
    const res = runRepl('10 / 0\n5 + 5\ngawe 123\n20 + 22\n.exit\n');
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('Ora bisa dibagi') || out.includes('Error Jawalang'), 'Must report division error');
    assert.ok(out.includes('10'), 'Must recover and evaluate 5 + 5 -> 10');
    assert.ok(out.includes('42'), 'Must recover from syntax error and evaluate 20 + 22 -> 42');

    // 12c. Multiline continuation syntax error (gawe =\n.\n20 + 22) recovers and evaluates 20 + 22 -> 42
    const res2 = runRepl('gawe =\n.\n20 + 22\n.exit\n');
    const out2 = (res2.stdout || '') + (res2.stderr || '');
    assert.ok(out2.includes('42'), 'Must recover from multiline syntax error and evaluate 20 + 22 -> 42');
});

// 13. REPL Multiline Statements & Delimiters
recordTest('13. REPL Multiline Statements & Delimiters', () => {
    const input = [
        'yen bener {',
        '    tulis("ya")',
        '}',
        'guna kuadrat(x) {',
        '    bali x * x',
        '}',
        'kuadrat(5)',
        '"string karo () [] {} kurung"',
        '.exit',
        ''
    ].join('\n');

    const res = runRepl(input);
    const out = (res.stdout || '') + (res.stderr || '');
    assert.ok(out.includes('ya'), 'Must execute multiline yen block');
    assert.ok(out.includes('25'), 'Must execute multiline function kuadrat(5)');
    assert.ok(out.includes('string karo () [] {} kurung'), 'Delimiters in string must not break detection');
});

// 14. REPL Meta Commands
recordTest('14. REPL Meta Commands (.help, .bantu, .clear, .resik, .exit, .metu)', () => {
    const resHelp = runRepl('.bantu\n.exit\n');
    const outHelp = (resHelp.stdout || '') + (resHelp.stderr || '');
    assert.ok(outHelp.includes('.help') && outHelp.includes('.metu'), 'Help must list meta commands');

    const resClear = runRepl('.resik\n1 + 1\n.metu\n');
    assert.strictEqual(resClear.status, 0, '.metu must exit with code 0');
    const outClear = (resClear.stdout || '') + (resClear.stderr || '');
    assert.ok(outClear.includes('2'), '.resik must not corrupt REPL session');
});

// 15. REPL Session Isolation
recordTest('15. REPL Session Isolation (independent processes)', () => {
    // Process 1: defines secret
    const p1 = runRepl('gawe rahasia = 123\n.exit\n');
    assert.strictEqual(p1.status, 0);

    // Process 2: accesses secret -> must fail
    const p2 = runRepl('rahasia\n.exit\n');
    const out2 = (p2.stdout || '') + (p2.stderr || '');
    assert.ok(out2.includes('durung digawe') || out2.includes('Error Jawalang'), 'rahasia must not be accessible in new session');
});

// 16. Non-TTY Behavior
recordTest('16. Non-TTY Behavior (jawa without arguments in pipe)', () => {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'jawa.cmd' : 'jawa';
    const res = spawnSync(binName, [], {
        cwd: TEMP_DIR,
        encoding: 'utf8',
        shell: isWin,
        input: ''
    });
    const combined = (res.stdout || '') + (res.stderr || '');
    assert.strictEqual(res.status, 1, `Expected exit code 1 in non-TTY without file, got ${res.status}`);
    assert.ok(combined.includes('Error: No input file specified.'), `Expected "No input file specified.", got: ${combined}`);
});

// 17. Debug Mode in REPL
recordTest('17. REPL Debug Mode (--debug prints stack trace)', () => {
    const resNormal = runRepl('10 / 0\n.exit\n');
    const outNormal = (resNormal.stdout || '') + (resNormal.stderr || '');
    assert.ok(!outNormal.includes('at evaluate'), 'Normal error must not show verbose JS stack trace');

    const resDebug = runRepl('10 / 0\n.exit\n', { args: ['--debug'] });
    const outDebug = (resDebug.stdout || '') + (resDebug.stderr || '');
    assert.ok(outDebug.includes('interpreter.js') || outDebug.includes('at '), 'Debug mode must show stack trace');
});

// 18. Package Content & Integrity Audit
recordTest('18. Package Content & Integrity Audit (npm pack --dry-run)', () => {
    const out = execSync('npm pack --dry-run --json', { cwd: PROJECT_ROOT, encoding: 'utf8' });
    const [packInfo] = JSON.parse(out);

    const filenames = packInfo.files.map(f => f.path);
    const forbidden = ['.git', 'scratch', 'release', 'language-server', 'vscode-extension', 'assets'];

    for (const f of filenames) {
        for (const forb of forbidden) {
            assert.ok(!f.startsWith(forb + '/') && !f.startsWith(forb + '\\'), `Forbidden file in package: ${f}`);
        }
        assert.ok(!f.endsWith('.exe'), `Binary exe found in package: ${f}`);
        assert.ok(!f.includes('D:\\') && !f.includes('D:/'), `Absolute path leak in package file: ${f}`);
    }

    assert.ok(filenames.includes('bin/jawa.js'), 'bin/jawa.js missing');
    assert.ok(filenames.includes('bin/jawalang.js'), 'bin/jawalang.js missing');
    assert.ok(filenames.includes('src/repl.js'), 'src/repl.js missing');
    assert.ok(filenames.includes('package.json'), 'package.json missing');
    assert.ok(filenames.includes('Readme.md'), 'Readme.md missing');
});

// Cleanup temp dir after verification
try {
    if (fs.existsSync(TEMP_DIR)) {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
} catch (_) {}

console.log('\n====================================================');
const totalPassed = results.filter(r => r.passed).length;
console.log(`POST-PUBLISH VERIFICATION: ${totalPassed}/${results.length} PASSED`);
console.log('====================================================\n');

if (totalPassed !== results.length) {
    process.exit(1);
}
