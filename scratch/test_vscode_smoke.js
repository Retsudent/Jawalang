const assert = require('assert');
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXT_DIR = path.join(PROJECT_ROOT, 'vscode-extension');
const SMOKE_DIR = path.join(__dirname, 'vscode-smoke');

let total = 0;
let passed = 0;

function runTest(name, fn) {
    total++;
    try {
        fn();
        console.log(`PASS [${total.toString().padStart(2, ' ')}]: ${name}`);
        passed++;
    } catch (err) {
        console.error(`FAIL [${total.toString().padStart(2, ' ')}]: ${name}`);
        console.error('   Error:', err.message);
    }
}

console.log('=== JAWALANG VS CODE EXTENSION SMOKE TESTS ===\n');

// 1. Extension Installed & Manifest ID
runTest('Extension is installed in VS Code with ID jawalang.jawalang-vscode', () => {
    const list = child_process.execSync('code --list-extensions', { encoding: 'utf8' });
    assert.ok(list.includes('jawalang.jawalang-vscode'), 'jawalang.jawalang-vscode not in code --list-extensions');
});

// 2. Language Registration & Configuration
runTest('Language registration maps .jawa to jawalang language with configuration', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    const lang = pkg.contributes.languages.find(l => l.id === 'jawalang');
    assert.ok(lang, 'jawalang language contribution missing');
    assert.ok(lang.extensions.includes('.jawa'), '.jawa not registered');
    assert.strictEqual(lang.configuration, './language-configuration.json');

    const conf = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'language-configuration.json'), 'utf8'));
    assert.strictEqual(conf.comments.lineComment, '//');
    assert.ok(conf.brackets.length >= 3);
});

// 3. Syntax Highlighting Grammar Coverage
runTest('Syntax grammar defines all required scopes and token matches', () => {
    const grammar = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'syntaxes', 'jawalang.tmLanguage.json'), 'utf8'));
    assert.strictEqual(grammar.scopeName, 'source.jawa');
    const repo = grammar.repository;
    assert.ok(repo.keywords, 'keywords repository missing');
    assert.ok(repo.builtins, 'builtins repository missing');
    assert.ok(repo.strings, 'strings repository missing');
    assert.ok(repo.numbers, 'numbers repository missing');
    assert.ok(repo.constants, 'constants repository missing');
    assert.ok(repo['function-declaration'], 'function-declaration repository missing');
    assert.ok(repo['struct-declaration'], 'struct-declaration repository missing');
    assert.ok(repo['member-access'], 'member-access repository missing');
    assert.ok(repo.operators, 'operators repository missing');
});

// 4. Command Contribution
runTest('jawalang.runFile command defined in package.json with proper title and icon', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    const cmd = pkg.contributes.commands.find(c => c.command === 'jawalang.runFile');
    assert.ok(cmd, 'jawalang.runFile command missing');
    assert.strictEqual(cmd.title, 'Jawalang: Run File');
    assert.strictEqual(cmd.icon, '$(play)');
});

// 5. Run Button & Context Menus
runTest('Editor title menu and command palette configure jawalang.runFile with when clause', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    const editorTitle = pkg.contributes.menus['editor/title'];
    assert.ok(editorTitle, 'editor/title menu contribution missing');
    const navBtn = editorTitle.find(m => m.command === 'jawalang.runFile');
    assert.ok(navBtn, 'jawalang.runFile not in editor/title');
    assert.strictEqual(navBtn.when, 'editorLangId == jawalang');
    assert.strictEqual(navBtn.group, 'navigation');

    const cmdPalette = pkg.contributes.menus.commandPalette;
    assert.ok(cmdPalette, 'commandPalette menu contribution missing');
    const palItem = cmdPalette.find(m => m.command === 'jawalang.runFile');
    assert.ok(palItem, 'jawalang.runFile not in commandPalette');
    assert.strictEqual(palItem.when, 'editorLangId == jawalang');
});

// 6. Path with Spaces Execution
runTest('Execution handles paths with spaces properly', () => {
    const spaceFile = path.join(SMOKE_DIR, 'My Jawalang Project', 'hello world.jawa');
    assert.ok(fs.existsSync(spaceFile), 'Fixture with spaces does not exist');
    const out = child_process.execSync(`jawa "${spaceFile}"`, { encoding: 'utf8' }).trim();
    assert.strictEqual(out, 'PATH OK', `Unexpected output: ${out}`);
});

// 7. Absolute Path Outside Workspace Execution
runTest('Execution handles absolute paths outside workspace', () => {
    const tempFile = path.join(os.tmpdir(), 'jawalang_smoke_abs_test.jawa');
    fs.writeFileSync(tempFile, 'tulis "ABSOLUTE PATH OK"\n');
    try {
        const out = child_process.execSync(`jawa "${tempFile}"`, { encoding: 'utf8' }).trim();
        assert.strictEqual(out, 'ABSOLUTE PATH OK', `Unexpected output: ${out}`);
    } finally {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
});

// 8. Interactive takon() Smoke Test
runTest('Interactive takon() reads stdin and writes expected output', () => {
    const interactiveFile = path.join(SMOKE_DIR, 'interactive.jawa');
    const res = child_process.spawnSync('jawa', [interactiveFile], {
        input: 'Budi\n',
        encoding: 'utf8'
    });
    assert.strictEqual(res.status, 0, `Process failed with status ${res.status}: ${res.stderr}`);
    assert.ok(res.stdout.includes('Halo Budi'), `Expected "Halo Budi" in stdout, got: ${res.stdout}`);
});

// 9. Runtime Error Clean Output Smoke Test
runTest('Runtime error displays clean Jawalang error message without Node stack trace', () => {
    const errFile = path.join(SMOKE_DIR, 'error.jawa');
    const res = child_process.spawnSync('jawa', [errFile], { encoding: 'utf8' });
    assert.strictEqual(res.status, 1, `Expected exit code 1, got ${res.status}`);
    const fullOut = (res.stdout + '\n' + res.stderr);
    assert.ok(fullOut.includes('Error Jawalang') || fullOut.includes('ora ditemokake') || fullOut.includes('durung digawe'),
        `Expected Jawalang error message, got: ${fullOut}`);
    assert.ok(!fullOut.includes('at Module._compile') && !fullOut.includes('node:internal'),
        'Unhandled Node.js stack trace found in error output');
});

// 10. Autocomplete Provider Coverage
runTest('Autocomplete provider registers all keywords and built-in functions', () => {
    const ext = require(path.join(EXT_DIR, 'src', 'extension.js'));
    assert.ok(ext.KEYWORDS.length >= 30, `Expected >= 30 keywords, got ${ext.KEYWORDS.length}`);
    assert.ok(Object.keys(ext.BUILTINS).length >= 24, `Expected >= 24 builtins, got ${Object.keys(ext.BUILTINS).length}`);

    const keywordLabels = ext.KEYWORDS.map(k => typeof k === 'string' ? k : k.label);

    // Check specific critical keywords
    const expectedKws = ['gawe', 'guna', 'bali', 'yen', 'liyane', 'nalika', 'kanggo', 'saben', 'bentuk', 'wiwiti', 'ngembangake', 'super', 'anyar', 'iki'];
    for (const kw of expectedKws) {
        assert.ok(keywordLabels.includes(kw), `Keyword ${kw} missing from completions`);
    }

    // Check specific builtins
    const expectedBuiltins = ['tulis', 'takon', 'dawa', 'jupuk', 'nambah', 'busak', 'terapkan', 'saring', 'itung'];
    for (const b of expectedBuiltins) {
        assert.ok(ext.BUILTINS[b], `Builtin ${b} missing from completions`);
    }
});

// 11. Hover Provider Documentation
runTest('Hover provider supplies documentation for keywords and built-in functions', () => {
    const ext = require(path.join(EXT_DIR, 'src', 'extension.js'));
    const kwMap = {};
    for (const k of ext.KEYWORDS) {
        kwMap[k.label] = k;
    }
    assert.ok(kwMap['gawe'], 'Doc for gawe missing');
    assert.ok(kwMap['guna'], 'Doc for guna missing');
    assert.ok(kwMap['bentuk'], 'Doc for bentuk missing');
    assert.ok(kwMap['ngembangake'], 'Doc for ngembangake missing');
    assert.ok(kwMap['super'], 'Doc for super missing');
    assert.ok(ext.BUILTINS['tulis'], 'Doc for tulis missing');
    assert.ok(ext.BUILTINS['takon'], 'Doc for takon missing');
});

// 12. Snippets Integrity
runTest('All code snippets have valid prefixes, bodies, and descriptions', () => {
    const snippets = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'snippets', 'jawalang.json'), 'utf8'));
    const count = Object.keys(snippets).length;
    assert.ok(count >= 18, `Expected >= 18 snippets, got ${count}`);
    for (const [name, snip] of Object.entries(snippets)) {
        assert.ok(snip.prefix, `Snippet ${name} missing prefix`);
        assert.ok(snip.body, `Snippet ${name} missing body`);
        assert.ok(snip.description, `Snippet ${name} missing description`);
    }
});

// 13. Icons Integrity
runTest('Extension icon (PNG) and language icon (SVG) exist and have valid headers', () => {
    const pngPath = path.join(EXT_DIR, 'icons', 'jawalang.png');
    const svgPath = path.join(EXT_DIR, 'icons', 'jawalang.svg');
    assert.ok(fs.existsSync(pngPath), 'jawalang.png missing');
    assert.ok(fs.existsSync(svgPath), 'jawalang.svg missing');

    const pngBuf = fs.readFileSync(pngPath);
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    assert.strictEqual(pngBuf[0], 0x89);
    assert.strictEqual(pngBuf[1], 0x50);
    assert.strictEqual(pngBuf[2], 0x4E);
    assert.strictEqual(pngBuf[3], 0x47);

    const svgText = fs.readFileSync(svgPath, 'utf8');
    assert.ok(svgText.includes('<svg') && svgText.includes('</svg>'), 'Invalid SVG content');
});

// 14. Configuration Settings
runTest('Settings jawalang.executablePath and jawalang.runInTerminal configured with defaults', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    const props = pkg.contributes.configuration.properties;
    assert.ok(props['jawalang.executablePath'], 'jawalang.executablePath setting missing');
    assert.strictEqual(props['jawalang.executablePath'].default, 'jawa');
    assert.ok(props['jawalang.runInTerminal'], 'jawalang.runInTerminal setting missing');
    assert.strictEqual(props['jawalang.runInTerminal'].default, true);
});

// 15. Non-Jawalang File Association Isolation
runTest('Non-Jawalang files (.js, .py, .txt) are NOT associated with Jawalang language', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    const lang = pkg.contributes.languages.find(l => l.id === 'jawalang');
    assert.deepStrictEqual(lang.extensions, ['.jawa'], 'Only .jawa extension must be registered');
});

// 16. Comprehensive Highlight Fixture Execution
runTest('scratch/vscode-smoke/highlight.jawa runs cleanly through jawalang runtime', () => {
    const hlFile = path.join(SMOKE_DIR, 'highlight.jawa');
    const out = child_process.execSync(`jawa "${hlFile}"`, { encoding: 'utf8' });
    assert.ok(out.includes('Hasil petung: 42'), 'Arithmetic/function failed');
    assert.ok(out.includes('Tejo obah mlaku nganggo sikil'), 'Inheritance/super failed');
});

console.log(`\n========================================`);
console.log(`Smoke Tests Finished: ${passed}/${total} PASSED`);
console.log(`========================================\n`);

if (passed !== total) process.exit(1);
