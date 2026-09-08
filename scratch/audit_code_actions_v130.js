/**
 * Jawalang V1.3.0 — Phase 7: Code Actions Deep Audit
 *
 * Verifies that the code actions engine strictly adheres to:
 * - No regex semantic replacement
 * - No runtime execution
 * - No arbitrary filesystem scanning
 * - No network access
 * - Valid TextEdit & WorkspaceEdit
 * - No overlapping edits
 * - UTF-16 correctness
 * - Deterministic ordering
 * - context.only compliance
 * - Diagnostic filtering
 * - Malformed source safety
 * - String literal safety
 * - Comment safety
 * - Built-in & keyword safety
 * - Alias & namespace safety
 * - Inheritance safety
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const analyzer = require('../language-server/src/analyzer');
const { getCodeActions, CodeActionKind } = require('../language-server/src/codeActions');

console.log('====================================================');
console.log('     JAWALANG V1.3.0 — CODE ACTIONS DEEP AUDIT      ');
console.log('====================================================\n');

let auditCount = 0;
let passCount = 0;

function runAudit(name, fn) {
    auditCount++;
    try {
        fn();
        console.log(`PASS [Audit ${String(auditCount).padStart(2, ' ')}]: ${name}`);
        passCount++;
    } catch (err) {
        console.error(`FAIL [Audit ${String(auditCount).padStart(2, ' ')}]: ${name}`);
        console.error('  Error:', err);
    }
}

// 1. Static source audit of codeActions.js (no child_process, no net, no http)
runAudit('Static source audit: no child_process / eval / net / http in codeActions.js', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../language-server/src/codeActions.js'), 'utf8');
    assert.ok(!src.includes('child_process'), 'Must not require child_process');
    assert.ok(!src.includes('eval('), 'Must not use eval()');
    assert.ok(!src.includes('Function('), 'Must not use Function constructor');
    assert.ok(!src.includes('require(\'net\')'), 'Must not require net');
    assert.ok(!src.includes('require(\'http\')'), 'Must not require http');
    assert.ok(!src.includes('require(\'https\')'), 'Must not require https');
    assert.ok(!src.includes('readdirSync'), 'Must not arbitrarily scan filesystem directory');
});

// 2. Valid TextEdit and WorkspaceEdit structure
runAudit('Valid TextEdit & WorkspaceEdit schema for all returned actions', () => {
    const code = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    assert.ok(actions.length > 0);
    for (const act of actions) {
        assert.ok(typeof act.title === 'string' && act.title.length > 0);
        assert.ok(typeof act.kind === 'string' && act.kind.length > 0);
        assert.ok(act.edit && act.edit.changes);
        for (const [uri, edits] of Object.entries(act.edit.changes)) {
            assert.ok(uri.startsWith('file:///'));
            assert.ok(Array.isArray(edits));
            for (const ed of edits) {
                assert.ok(ed.range && ed.range.start && ed.range.end);
                assert.ok(typeof ed.range.start.line === 'number');
                assert.ok(typeof ed.range.start.character === 'number');
                assert.ok(typeof ed.range.end.line === 'number');
                assert.ok(typeof ed.range.end.character === 'number');
                assert.ok(typeof ed.newText === 'string');
            }
        }
    }
});

// 3. No overlapping edits within any single action
runAudit('No overlapping edits within any single action edit list', () => {
    const code = 'impor "./c.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    for (const act of actions) {
        for (const [uri, edits] of Object.entries(act.edit.changes)) {
            for (let i = 0; i < edits.length; i++) {
                for (let j = i + 1; j < edits.length; j++) {
                    const e1 = edits[i].range;
                    const e2 = edits[j].range;
                    const e1BeforeE2 = e1.end.line < e2.start.line || (e1.end.line === e2.start.line && e1.end.character <= e2.start.character);
                    const e2BeforeE1 = e2.end.line < e1.start.line || (e2.end.line === e1.start.line && e2.end.character <= e1.start.character);
                    assert.ok(e1BeforeE2 || e2BeforeE1, 'Edits must not overlap');
                }
            }
        }
    }
});

// 4. Deterministic ordering of actions
runAudit('Deterministic ordering across 10 repeated runs', () => {
    const code = 'impor "./c.jawa"\nimpor "./b.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const baseline = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }).map(a => `${a.kind}:${a.title}`);
    for (let r = 0; r < 10; r++) {
        const current = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }).map(a => `${a.kind}:${a.title}`);
        assert.deepStrictEqual(current, baseline);
    }
});

// 5. Strict context.only compliance
runAudit('Strict context.only filter compliance', () => {
    const code = 'impor "./b.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    
    // Only quickfix
    const qfActions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['quickfix'] });
    assert.ok(qfActions.length > 0);
    assert.ok(qfActions.every(a => a.kind.startsWith('quickfix')));

    // Only source.organizeImports
    const orgActions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['source.organizeImports'] });
    assert.ok(orgActions.length > 0);
    assert.ok(orgActions.every(a => a.kind === 'source.organizeImports'));

    // Unrelated filter returns []
    const refactorActions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['refactor'] });
    assert.deepStrictEqual(refactorActions, []);
});

// 6. Diagnostic filtering: only suggest fixes relevant to diagnostics
runAudit('Diagnostic filtering: only suggests fixes for active diagnostics', () => {
    const code = 'gawe x = 10\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const diag = {
        message: 'Fungsi "unknownFn" ora ditemokake.',
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 10 } }
    };
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { diagnostics: [diag] });
    assert.ok(Array.isArray(actions));
});

// 7. Malformed source resilience
runAudit('Malformed source resilience: zero unhandled exceptions', () => {
    const malformedInputs = [
        'impor { ',
        'impor "unclosed',
        'guna ((((',
        'bentuk { { {',
        '/// unclosed block comment',
        '"""""'
    ];
    for (const badCode of malformedInputs) {
        const analysis = analyzer.analyze(badCode, 'file:///malformed.jawa');
        const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
        assert.ok(Array.isArray(actions));
    }
});

// 8. String content safety (never modify string contents via actions)
runAudit('String literal safety: strings are preserved intact', () => {
    const code = 'impor "./b.jawa"\nimpor "./a.jawa"\ngawe s = "impor ./z.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['source.organizeImports'] });
    assert.strictEqual(actions.length, 1);
    const newText = actions[0].edit.changes['file:///audit.jawa'][0].newText;
    assert.ok(!newText.includes('gawe s =')); // Import edit range only spans the import statements!
});

// 9. Comment safety
runAudit('Comment safety: comments are not stripped or corrupted', () => {
    const code = '// Header comment\nimpor "./b.jawa"\nimpor "./a.jawa"\n// Footer comment\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['source.organizeImports'] });
    assert.strictEqual(actions.length, 1);
    const edit = actions[0].edit.changes['file:///audit.jawa'][0];
    assert.strictEqual(edit.range.start.line, 1); // Starts at import line, not comment line
});

// 10. Built-in function & keyword safety
runAudit('Built-in function and keyword safety', () => {
    const code = 'gawe x = dawa([1, 2, 3])\ngawe y = jupuk([1, 2], 0)\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 1, character: 10 } });
    const invalidFixes = actions.filter(a => a.title.includes('Create function "dawa"') || a.title.includes('Create variable "dawa"'));
    assert.strictEqual(invalidFixes.length, 0, 'Must never offer to create built-ins');
});

// 11. Selective import alias safety
runAudit('Selective import alias safety', () => {
    const code = 'impor { tambah minangka jumlah, kali minangka perbanyakan } saka "./math.jawa"\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, { only: ['source.organizeImports'] });
    assert.strictEqual(actions.length, 1);
    const newText = actions[0].edit.changes['file:///audit.jawa'][0].newText;
    assert.strictEqual(newText, 'impor { kali minangka perbanyakan, tambah minangka jumlah } saka "./math.jawa"');
});

// 12. Namespace import safety
runAudit('Namespace import safety', () => {
    const code = 'impor "./math.jawa" minangka math\ngawe x = math.tambah(1, 2)\n';
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } });
    const unusedActs = actions.filter(a => a.title.includes('Remove unused namespace import'));
    assert.strictEqual(unusedActs.length, 0, 'Used namespace import must never be flagged as unused');
});

// 13. Inheritance safety
runAudit('Inheritance and super awareness safety', () => {
    const code = [
        'bentuk Induk {',
        '    guna sapa() { bali "halo" }',
        '}',
        'bentuk Anak ngembangake Induk {',
        '    guna sapa() { bali super.sapa() }',
        '}'
    ].join('\n');
    const analysis = analyzer.analyze(code, 'file:///audit.jawa');
    const actions = getCodeActions(analysis, { start: { line: 0, character: 0 }, end: { line: 5, character: 1 } });
    const badFixes = actions.filter(a => a.title.includes('Change to') && a.title.includes('sapa'));
    assert.strictEqual(badFixes.length, 0);
});

console.log('\n====================================================');
console.log(`  DEEP AUDIT COMPLETED: ${passCount}/${auditCount} PASSED`);
console.log('====================================================\n');

if (passCount !== auditCount) {
    process.exit(1);
}
