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

// 17. Language Server CLI Startup
runTest('Language Server CLI starts cleanly with --version and --help', () => {
    const serverScript = path.join(PROJECT_ROOT, 'language-server', 'src', 'server.js');
    const verRes = child_process.spawnSync('node', [serverScript, '--version'], { encoding: 'utf8' });
    assert.strictEqual(verRes.status, 0);
    assert.ok((verRes.stdout + verRes.stderr).includes('Jawalang Language Server'));

    const helpRes = child_process.spawnSync('node', [serverScript, '--help'], { encoding: 'utf8' });
    assert.strictEqual(helpRes.status, 0);
    assert.ok((helpRes.stdout + helpRes.stderr).includes('Options:'));
});

// 18. Language Server Completion Provider & Dot Completion Smoke
runTest('Language Server provides context-aware dot completion on struct instances', () => {
    const analyzer = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'analyzer'));
    const { getCompletions } = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'completion'));
    const code = [
        'bentuk Mobil {',
        '    gawe merk',
        '    guna klakson() {}',
        '}',
        'gawe m = anyar Mobil()',
        'm.'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///smoke_test.jawa');
    const items = getCompletions(analysis, { line: 5, character: 2 });
    assert.ok(items && items.length >= 2, 'Expected at least 2 completions for m.');
    const labels = items.map(it => it.label);
    assert.ok(labels.includes('merk'), 'Expected merk in completion');
    assert.ok(labels.includes('klakson'), 'Expected klakson in completion');
});

// 19. Language Server Formatting Provider Smoke
runTest('Language Server formats unformatted Jawalang document cleanly', () => {
    const { formatDocument } = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'formatter'));
    const unformatted = 'guna tambah(a,b){\nbali a+b\n}';
    const edits = formatDocument(unformatted);
    assert.ok(edits && edits.length === 1);
    assert.strictEqual(edits[0].newText, 'guna tambah(a, b) {\n    bali a + b\n}');
});

// 20. Language Server Code Action Provider Smoke
runTest('Language Server provides Organize Imports and QuickFix code actions', () => {
    const analyzer = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'analyzer'));
    const { getCodeActions, CodeActionKind } = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'codeActions'));
    const code = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///smoke_ca.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    assert.ok(actions && actions.length > 0);
    const org = actions.find(a => a.kind === CodeActionKind.SourceOrganizeImports);
    assert.ok(org, 'Expected organize imports action in smoke test');
});

// 21. Language Server Semantic Tokens Provider Smoke
runTest('Language Server provides accurate semantic tokens classification and isolation', () => {
    const analyzer = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'analyzer'));
    const { getSemanticTokens, decodeSemanticTokens, semanticTokensLegend } = require(path.join(PROJECT_ROOT, 'language-server', 'src', 'semanticTokens'));

    const code = [
        'impor "./math.jawa" minangka math',
        'bentuk Wong {',
        '    gawe jeneng',
        '    guna salam() { bali iki.jeneng }',
        '}',
        'guna hitung(a, b) {',
        '    gawe hasil = a + b',
        '    bali hasil',
        '}',
        'gawe pesan = "guna palsu(x) {}"',
        '// komentar bentuk Tipuan {}',
        'gawe w = anyar Wong()',
        'w.salam()',
        'math.tambah()'
    ].join('\n');

    const analysis = analyzer.analyze(code, 'file:///smoke_tokens.jawa');
    const res = getSemanticTokens(analysis);
    assert.ok(res && Array.isArray(res.data), 'Expected semantic tokens data array');
    const decoded = decodeSemanticTokens(res.data, semanticTokensLegend);
    assert.ok(decoded.length > 0, 'Expected decoded semantic tokens');

    // Namespace classification
    const nsTok = decoded.find(t => t.line === 0 && t.character === 29);
    assert.ok(nsTok && nsTok.tokenType === 'namespace', 'math on line 0 must be namespace');

    // Struct classification (class)
    const structTok = decoded.find(t => t.line === 1 && t.character === 7);
    assert.ok(structTok && structTok.tokenType === 'class', 'Wong must be class');

    // Property declaration
    const fieldTok = decoded.find(t => t.line === 2 && t.character === 9);
    assert.ok(fieldTok && fieldTok.tokenType === 'property', 'jeneng must be property');

    // Method declaration
    const methodTok = decoded.find(t => t.line === 3 && t.character === 9);
    assert.ok(methodTok && methodTok.tokenType === 'method', 'salam must be method');

    // Function declaration & parameters
    const fnTok = decoded.find(t => t.line === 5 && t.character === 5);
    const paramA = decoded.find(t => t.line === 5 && t.character === 12);
    assert.ok(fnTok && fnTok.tokenType === 'function', 'hitung must be function');
    assert.ok(paramA && paramA.tokenType === 'parameter', 'a must be parameter');

    // Variable declaration
    const varHasil = decoded.find(t => t.line === 6 && t.character === 9);
    assert.ok(varHasil && varHasil.tokenType === 'variable', 'hasil must be variable');

    // String isolation: no function token inside "guna palsu(x) {}"
    const strTok = decoded.find(t => t.line === 9 && t.character === 13);
    assert.ok(strTok && strTok.tokenType === 'string');
    const innerStrTokens = decoded.filter(t => t.line === 9 && t.character > 13);
    assert.strictEqual(innerStrTokens.length, 0, 'No tokens inside string literal');

    // Comment isolation: no class token inside comment
    const commentTok = decoded.find(t => t.line === 10 && t.character === 0);
    assert.ok(commentTok && commentTok.tokenType === 'comment');
    const line10Tokens = decoded.filter(t => t.line === 10);
    assert.strictEqual(line10Tokens.length, 1, 'Only comment token on line 10');

    // Method call and namespace call
    const mCall = decoded.find(t => t.line === 12 && t.character === 2);
    assert.ok(mCall && mCall.tokenType === 'method', 'w.salam() must be method');
    const nsCall = decoded.find(t => t.line === 13 && t.character === 5);
    assert.ok(nsCall && nsCall.tokenType === 'function', 'math.tambah() must be function');
});

console.log(`\n========================================`);
console.log(`Smoke Tests Finished: ${passed}/${total} PASSED`);
console.log(`========================================\n`);

if (passed !== total) process.exit(1);

