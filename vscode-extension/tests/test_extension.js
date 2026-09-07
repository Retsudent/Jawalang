const assert = require('assert');
const fs = require('fs');
const path = require('path');

const EXT_DIR = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(`PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`FAIL: ${name}`);
        console.error('  Error:', err.message);
    }
}

console.log('=== RUNNING JAWALANG VS CODE EXTENSION TESTS ===\n');

// 1. package.json verification
test('package.json has valid manifest and contributions', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.name, 'jawalang-vscode');
    assert.strictEqual(pkg.version, '1.0.0');
    assert.ok(pkg.contributes);
    assert.ok(pkg.contributes.languages);
    assert.strictEqual(pkg.contributes.languages[0].id, 'jawalang');
    assert.deepStrictEqual(pkg.contributes.languages[0].extensions, ['.jawa']);
    assert.ok(pkg.contributes.grammars);
    assert.strictEqual(pkg.contributes.grammars[0].language, 'jawalang');
    assert.strictEqual(pkg.contributes.grammars[0].scopeName, 'source.jawa');
    assert.ok(pkg.contributes.snippets);
    assert.ok(pkg.contributes.commands);
    assert.strictEqual(pkg.contributes.commands[0].command, 'jawalang.runFile');
    assert.ok(pkg.contributes.configuration);
    const props = pkg.contributes.configuration.properties;
    assert.ok(props['jawalang.languageServer.enabled'], 'Missing jawalang.languageServer.enabled setting');
    assert.ok(props['jawalang.languageServer.path'], 'Missing jawalang.languageServer.path setting');
    assert.ok(props['jawalang.languageServer.debug'], 'Missing jawalang.languageServer.debug setting');
    assert.ok(pkg.dependencies && pkg.dependencies['vscode-languageclient'], 'Missing vscode-languageclient dependency');
});

// 2. language-configuration.json verification
test('language-configuration.json has valid brackets, comments, and rules', () => {
    const conf = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'language-configuration.json'), 'utf8'));
    assert.strictEqual(conf.comments.lineComment, '//');
    assert.ok(Array.isArray(conf.brackets));
    assert.ok(Array.isArray(conf.autoClosingPairs));
    assert.ok(conf.indentationRules);
});

// 3. syntaxes/jawalang.tmLanguage.json verification
test('syntaxes/jawalang.tmLanguage.json contains all Jawalang V5 token scopes', () => {
    const grammar = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'syntaxes', 'jawalang.tmLanguage.json'), 'utf8'));
    assert.strictEqual(grammar.scopeName, 'source.jawa');
    assert.ok(grammar.repository.keywords);
    assert.ok(grammar.repository.builtins);
    assert.ok(grammar.repository.strings);
    assert.ok(grammar.repository.numbers);
    assert.ok(grammar.repository.comments);
    assert.ok(grammar.repository['function-declaration']);
    assert.ok(grammar.repository['struct-declaration']);

    // Check presence of V5 keywords
    const kwText = JSON.stringify(grammar.repository);
    const requiredKeywords = [
        'gawe', 'guna', 'bali', 'yen', 'liyane', 'nalika', 'kanggo', 'saben',
        'mandheg', 'lanjut', 'bener', 'salah', 'null', 'coba', 'tangkep', 'lempar',
        'impor', 'ekspor', 'saka', 'minangka', 'bentuk', 'anyar', 'iki', 'wiwiti',
        'ngembangake', 'super', 'tulis', 'takon'
    ];
    for (const kw of requiredKeywords) {
        assert.ok(kwText.includes(kw), `Keyword "${kw}" missing from grammar`);
    }
});

// 4. snippets/jawalang.json verification
test('snippets/jawalang.json provides essential code snippets', () => {
    const snippets = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'snippets', 'jawalang.json'), 'utf8'));
    assert.ok(snippets['Gawe Variabel']);
    assert.ok(snippets['Guna Fungsi']);
    assert.ok(snippets['Bentuk Struct']);
    assert.ok(snippets['Bentuk Pewarisan']);
    assert.ok(snippets['Wiwiti Konstruktor']);
    assert.ok(snippets['Yen Percabangan']);
    assert.ok(snippets['Kanggo Range Loop'] || snippets['Kanggo For Loop']);
    assert.ok(snippets['Coba Tangkep']);
    assert.ok(snippets['Impor Saka']);
});

// 5. src/extension.js exports verification
test('src/extension.js exports activate, deactivate, BUILTINS, and KEYWORDS', () => {
    const ext = require(path.join(EXT_DIR, 'src', 'extension.js'));
    assert.strictEqual(typeof ext.activate, 'function');
    assert.strictEqual(typeof ext.deactivate, 'function');
    assert.ok(ext.BUILTINS);
    assert.ok(ext.KEYWORDS);
    assert.ok(Object.keys(ext.BUILTINS).length >= 20);
    assert.ok(ext.KEYWORDS.length >= 25);
});

// 6. icons/jawalang.svg verification
test('icons/jawalang.svg exists and is valid SVG', () => {
    const svgPath = path.join(EXT_DIR, 'icons', 'jawalang.svg');
    assert.ok(fs.existsSync(svgPath));
    const content = fs.readFileSync(svgPath, 'utf8');
    assert.ok(content.includes('<svg'));
});

// 7. README.md & CHANGELOG.md verification
test('README.md and CHANGELOG.md exist and are documented', () => {
    const readme = fs.readFileSync(path.join(EXT_DIR, 'README.md'), 'utf8');
    const changelog = fs.readFileSync(path.join(EXT_DIR, 'CHANGELOG.md'), 'utf8');
    assert.ok(readme.includes('Jawalang for Visual Studio Code'));
    assert.ok(changelog.includes('1.0.0'));
});

// 8. VSIX package artifact exists and is valid
test('VSIX package artifact exists and has valid size', () => {
    const vsixPath = path.join(EXT_DIR, 'jawalang-vscode-1.0.0.vsix');
    assert.ok(fs.existsSync(vsixPath), 'jawalang-vscode-1.0.0.vsix is missing');
    const stat = fs.statSync(vsixPath);
    assert.ok(stat.size > 10000, `VSIX package too small: ${stat.size} bytes`);
});

console.log(`\nExtension Tests Result: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
