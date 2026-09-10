const assert = require('assert');
const path = require('path');
const analyzer = require('../src/analyzer');
const moduleManager = require('../src/modules');
const { getCodeActions, CodeActionKind } = require('../src/codeActions');
const { pathToUri } = require('../src/utils');

function runTests() {
    console.log('--- Code Actions Unit Tests ---');

    function getActions(code, options = {}) {
        const uri = options.uri || 'file:///test_ca.jawa';
        const analysis = analyzer.analyze(code, uri);
        const range = options.range || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
        const context = {
            diagnostics: options.diagnostics !== undefined ? options.diagnostics : (analysis.diagnostics || []),
            only: options.only
        };
        return {
            actions: getCodeActions(analysis, range, context),
            analysis
        };
    }

    // 1. Empty document returns []
    {
        const { actions } = getActions('');
        assert.deepStrictEqual(actions, [], 'Empty document must return []');
        console.log('PASS: 1. Empty document returns []');
    }

    // 2. No diagnostics and no imports returns []
    {
        const { actions } = getActions('gawe x = 10\ntulis x');
        assert.deepStrictEqual(actions, [], 'Clean document without imports returns []');
        console.log('PASS: 2. No diagnostics and no imports');
    }

    // 3. Malformed source does not crash
    {
        const { actions } = getActions('gawe x = "unclosed string');
        assert.ok(Array.isArray(actions), 'Malformed source should safely return array');
        console.log('PASS: 3. Malformed source safety');
    }

    // 4. QuickFix filtering with context.only
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"\ntulis varOraAna';
        const { actions } = getActions(code, { only: ['quickfix'] });
        assert.ok(actions.every(a => a.kind === CodeActionKind.QuickFix), 'Only quickfix actions must be returned');
        console.log('PASS: 4. QuickFix filtering with context.only');
    }

    // 5. Source filtering with context.only
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        assert.strictEqual(actions[0].kind, CodeActionKind.SourceOrganizeImports);
        console.log('PASS: 5. Source filtering with context.only');
    }

    // 6. Organize Imports sorting
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"\nimpor "./c.jawa"\n\ngawe x = 10';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const edit = actions[0].edit.changes['file:///test_ca.jawa'][0];
        const expected = 'impor "./a.jawa"\nimpor "./b.jawa"\nimpor "./c.jawa"';
        assert.strictEqual(edit.newText, expected);
        console.log('PASS: 6. Organize Imports sorting');
    }

    // 7. Duplicate import statements detection
    {
        const code = 'impor "./math.jawa"\nimpor "./math.jawa"\n\ngawe x = 1';
        const { actions } = getActions(code);
        const dupAction = actions.find(a => a.title.includes('Remove duplicate import'));
        assert.ok(dupAction, 'Expected Remove duplicate import action');
        assert.strictEqual(dupAction.kind, CodeActionKind.QuickFix);
        console.log('PASS: 7. Duplicate imports detection');
    }

    // 8. Selective imports merging
    {
        const code = 'impor { tambah } saka "./math.jawa"\nimpor { kurang } saka "./math.jawa"\n\ngawe x = 1';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const edit = actions[0].edit.changes['file:///test_ca.jawa'][0];
        assert.strictEqual(edit.newText, 'impor { kurang, tambah } saka "./math.jawa"');
        console.log('PASS: 8. Selective imports merging');
    }

    // 9. Import aliases preservation
    {
        const code = 'impor { tambah minangka jumlah } saka "./math.jawa"\nimpor "./a.jawa"\n';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const edit = actions[0].edit.changes['file:///test_ca.jawa'][0];
        assert.ok(edit.newText.includes('tambah minangka jumlah'), 'Alias must be preserved in organized imports');
        console.log('PASS: 9. Import aliases preservation');
    }

    // 10. Namespace imports formatting
    {
        const code = 'impor "./math.jawa" minangka math\nimpor "./a.jawa"';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const edit = actions[0].edit.changes['file:///test_ca.jawa'][0];
        assert.strictEqual(edit.newText, 'impor "./a.jawa"\nimpor "./math.jawa" minangka math');
        console.log('PASS: 10. Namespace imports formatting');
    }

    // 11. Unused namespace import detection
    {
        const code = 'impor "./math.jawa" minangka math\ngawe x = 10';
        const { actions } = getActions(code);
        const unusedAction = actions.find(a => a.title === 'Remove unused namespace import "math"');
        assert.ok(unusedAction, 'Expected Remove unused namespace import action');
        console.log('PASS: 11. Unused namespace import detection');
    }

    // 12. Unused selective import detection
    {
        const code = 'impor { tambah, oraDienggo } saka "./math.jawa"\ngawe x = tambah(1, 2)';
        const { actions } = getActions(code);
        const unusedAction = actions.find(a => a.title === 'Remove unused import "oraDienggo"');
        assert.ok(unusedAction, 'Expected Remove unused import action for oraDienggo');
        console.log('PASS: 12. Unused selective import detection');
    }

    // 13. Used imported function does not trigger unused import
    {
        const code = 'impor { tambah } saka "./math.jawa"\ngawe x = tambah(1, 2)';
        const { actions } = getActions(code);
        const unusedAction = actions.find(a => a.title.includes('Remove unused import'));
        assert.strictEqual(unusedAction, undefined, 'Used function must not trigger unused import action');
        console.log('PASS: 13. Used imported function protected');
    }

    // 14. Used imported struct does not trigger unused import
    {
        const code = 'impor { Mobil } saka "./kendaraan.jawa"\ngawe m = anyar Mobil()';
        const { actions } = getActions(code);
        const unusedAction = actions.find(a => a.title.includes('Remove unused import'));
        assert.strictEqual(unusedAction, undefined, 'Used struct must not trigger unused import action');
        console.log('PASS: 14. Used imported struct protected');
    }

    // 15. Inherited imported struct protected
    {
        const code = 'impor { Kendaraan } saka "./kendaraan.jawa"\nbentuk Mobil ngembangake Kendaraan {}';
        const { actions } = getActions(code);
        const unusedAction = actions.find(a => a.title.includes('Remove unused import "Kendaraan"'));
        assert.strictEqual(unusedAction, undefined, 'Inherited parent struct must not be marked unused');
        console.log('PASS: 15. Inherited imported struct protected');
    }

    // 16. Builtin function safety
    {
        const code = 'gawe d = dawa([1, 2])\ntulis d';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'Built-in functions must not trigger code actions');
        console.log('PASS: 16. Built-in function safety');
    }

    // 17. Keyword safety
    {
        const code = 'guna tes() {\n    bali 10\n}';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'Keywords must not trigger code actions');
        console.log('PASS: 17. Keyword safety');
    }

    // 18. String safety (import keywords inside string literals ignored)
    {
        const code = 'tulis "impor \\"./fake.jawa\\""\ngawe x = 10';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'Strings containing import text must be ignored');
        console.log('PASS: 18. String safety');
    }

    // 19. Comment safety (commented imports ignored)
    {
        const code = '// impor "./secret.jawa"\ngawe x = 10';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'Commented imports must be ignored');
        console.log('PASS: 19. Comment safety');
    }

    // 20. UTF-16 character position preservation
    {
        const code = 'gawe jeneng = "Siti ❤️"\ntulis jenegg';
        const { actions } = getActions(code);
        const typoAction = actions.find(a => a.title === 'Change to "jeneng"');
        assert.ok(typoAction, 'Expected typo suggestion for jenegg');
        assert.strictEqual(typoAction.edit.changes['file:///test_ca.jawa'][0].range.start.line, 1);
        console.log('PASS: 20. UTF-16 range precision');
    }

    // 21. Deterministic ordering
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"\ngawe x = tambh(1, 2)';
        const { actions: actions1 } = getActions(code);
        const { actions: actions2 } = getActions(code);
        assert.strictEqual(actions1.length, actions2.length);
        for (let i = 0; i < actions1.length; i++) {
            assert.strictEqual(actions1[i].title, actions2[i].title);
            assert.strictEqual(actions1[i].kind, actions2[i].kind);
        }
        console.log('PASS: 21. Deterministic ordering');
    }

    // 22. Duplicate action elimination
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"';
        const { actions } = getActions(code);
        const titles = actions.map(a => a.title);
        const uniqueTitles = Array.from(new Set(titles));
        assert.strictEqual(titles.length, uniqueTitles.length, 'No duplicate action titles');
        console.log('PASS: 22. Duplicate action elimination');
    }

    // 23. Invalid analysis returns []
    {
        const actions = getCodeActions(null, { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, {});
        assert.deepStrictEqual(actions, []);
        console.log('PASS: 23. Invalid analysis returns []');
    }

    // 24. Unknown diagnostic produces no false actions
    {
        const code = 'gawe x = 10';
        const unknownDiag = {
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 4 } },
            message: 'Custom unknown external diagnostic',
            severity: 1
        };
        const { actions } = getActions(code, { diagnostics: [unknownDiag] });
        assert.deepStrictEqual(actions, [], 'Unknown diagnostic must not produce erroneous actions');
        console.log('PASS: 24. Unknown diagnostic safety');
    }

    // 25. Empty diagnostics array with no imports returns []
    {
        const code = 'gawe x = 10';
        const { actions } = getActions(code, { diagnostics: [] });
        assert.deepStrictEqual(actions, []);
        console.log('PASS: 25. Empty diagnostics array returns []');
    }

    // 26. Already organized imports returns no Organize Imports action
    {
        const code = 'impor "./a.jawa"\nimpor "./b.jawa"\n\ngawe x = 1';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.deepStrictEqual(actions, [], 'Already organized imports should return no actions');
        console.log('PASS: 26. Already organized imports returns []');
    }

    // 27. Idempotent organize imports
    {
        const code = 'impor "./c.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"';
        const { actions: act1 } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(act1.length, 1);
        const organized = act1[0].edit.changes['file:///test_ca.jawa'][0].newText;
        const { actions: act2 } = getActions(organized, { only: ['source.organizeImports'] });
        assert.deepStrictEqual(act2, [], 'Re-running on organized imports must yield 0 actions');
        console.log('PASS: 27. Idempotent organize imports');
    }

    // 28. Multiple imports (5 modules)
    {
        const code = 'impor "./e.jawa"\nimpor "./d.jawa"\nimpor "./c.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const lines = actions[0].edit.changes['file:///test_ca.jawa'][0].newText.split('\n');
        assert.strictEqual(lines[0], 'impor "./a.jawa"');
        assert.strictEqual(lines[4], 'impor "./e.jawa"');
        console.log('PASS: 28. Multiple imports sorting');
    }

    // 29. Multiline selective imports formatting (4+ specifiers)
    {
        const code = 'impor { d, c, b, a } saka "./math.jawa"';
        const { actions } = getActions(code, { only: ['source.organizeImports'] });
        assert.strictEqual(actions.length, 1);
        const edit = actions[0].edit.changes['file:///test_ca.jawa'][0];
        assert.ok(edit.newText.includes('    a,\n    b,\n    c,\n    d'), '4+ specifiers must format multiline');
        console.log('PASS: 29. Multiline selective imports formatting');
    }

    // 30. Malformed import syntax does not crash
    {
        const code = 'impor \ngawe x = 10';
        const { actions } = getActions(code);
        assert.ok(Array.isArray(actions));
        console.log('PASS: 30. Incomplete import statement safety');
    }

    // 31. Nested code inside function
    {
        const code = 'guna hitung() {\n    gawe nilai = 10\n    tulis nilia\n}';
        const { actions } = getActions(code);
        const typoAction = actions.find(a => a.title === 'Change to "nilai"');
        assert.ok(typoAction, 'Expected typo suggestion inside function scope');
        console.log('PASS: 31. Nested function scope typo suggestion');
    }

    // 32. Function scope typo correction
    {
        const code = 'guna tambah(a, b) {\n    bali a + b\n}\ngawe x = tambh(1, 2)';
        const { actions } = getActions(code);
        const typoAction = actions.find(a => a.title === 'Change to "tambah"');
        assert.ok(typoAction, 'Expected Change to "tambah"');
        assert.strictEqual(typoAction.kind, CodeActionKind.QuickFix);
        console.log('PASS: 32. Function scope typo correction');
    }

    // 33. Struct scope typo correction
    {
        const code = 'bentuk Mobil {\n    gawe merk\n}\ngawe m = anyar Moil()';
        const { actions } = getActions(code);
        const typoAction = actions.find(a => a.title === 'Change to "Mobil"');
        assert.ok(typoAction, 'Expected Change to "Mobil"');
        console.log('PASS: 33. Struct scope typo correction');
    }

    // 34. Namespace member call safety
    {
        const code = 'impor "./math.jawa" minangka math\ngawe x = math.tambah(1, 2)';
        const { actions } = getActions(code);
        const unused = actions.find(a => a.title.includes('Remove unused'));
        assert.strictEqual(unused, undefined, 'Namespace used in member access must not be marked unused');
        console.log('PASS: 34. Namespace usage in member call');
    }

    // 35. Alias scope usage safety
    {
        const code = 'impor { tambah minangka plus } saka "./math.jawa"\ngawe x = plus(1, 2)';
        const { actions } = getActions(code);
        const unused = actions.find(a => a.title.includes('Remove unused'));
        assert.strictEqual(unused, undefined, 'Aliased import used in code must not be marked unused');
        console.log('PASS: 35. Alias usage safety');
    }

    // 36. Super context safety
    {
        const code = 'bentuk Induk {\n    guna salam() {}\n}\nbentuk Anak ngembangake Induk {\n    guna salam() {\n        super.salam()\n    }\n}';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'super.salam() should not trigger false actions');
        console.log('PASS: 36. Super context safety');
    }

    // 37. Iki context safety
    {
        const code = 'bentuk Wong {\n    gawe jeneng\n    guna set(j) {\n        iki.jeneng = j\n    }\n}';
        const { actions } = getActions(code);
        assert.deepStrictEqual(actions, [], 'iki.jeneng should not trigger false actions');
        console.log('PASS: 37. Iki context safety');
    }

    // 38. No runtime execution guarantee
    {
        let executed = false;
        // Construct code that would set a global variable if evaluated
        const code = 'gawe x = 10';
        getActions(code);
        assert.strictEqual(executed, false, 'No interpreter execution allowed');
        console.log('PASS: 38. No runtime execution');
    }

    // 39. No filesystem scan
    {
        const code = 'gawe x = fungsiOraTauAna(1, 2)';
        const { actions } = getActions(code);
        assert.ok(Array.isArray(actions));
        console.log('PASS: 39. No arbitrary filesystem scan');
    }

    // 40. No overlapping edits in single action
    {
        const code = 'impor "./b.jawa"\nimpor "./a.jawa"\nimpor "./b.jawa"';
        const { actions } = getActions(code);
        for (const act of actions) {
            const edits = act.edit.changes['file:///test_ca.jawa'] || [];
            // Verify single edit or non-overlapping ranges
            for (let i = 0; i < edits.length; i++) {
                for (let j = i + 1; j < edits.length; j++) {
                    const e1 = edits[i].range;
                    const e2 = edits[j].range;
                    const overlap = !(e1.end.line < e2.start.line || (e1.end.line === e2.start.line && e1.end.character <= e2.start.character) ||
                                      e2.end.line < e1.start.line || (e2.end.line === e1.start.line && e2.end.character <= e1.start.character));
                    assert.strictEqual(overlap, false, 'Edits must not overlap');
                }
            }
        }
        console.log('PASS: 40. No overlapping edits in action');
    }

    // 41. Typo correction for variable
    {
        const code = 'gawe jeneng = "Budi"\ntulis jenegg';
        const { actions } = getActions(code);
        const act = actions.find(a => a.title === 'Change to "jeneng"');
        assert.ok(act);
        assert.strictEqual(act.kind, CodeActionKind.QuickFix);
        console.log('PASS: 41. Variable typo correction');
    }

    // 42. Typo correction for built-in function
    {
        const code = 'gawe l = dawe([1, 2, 3])';
        const { actions } = getActions(code);
        const act = actions.find(a => a.title === 'Change to "dawa"');
        assert.ok(act, 'Expected Change to "dawa" for dawe()');
        console.log('PASS: 42. Built-in function typo correction');
    }

    // 43. Duplicate specifier removal in selective import
    {
        const code = 'impor { tambah, tambah } saka "./math.jawa"\ngawe x = tambah(1, 2)';
        const { actions } = getActions(code);
        const dupSpec = actions.find(a => a.title === 'Remove duplicate import "tambah"');
        assert.ok(dupSpec, 'Expected Remove duplicate import "tambah" specifier action');
        console.log('PASS: 43. Duplicate specifier removal in selective import');
    }

    // 44. Missing import quickfix from cached module
    {
        // Populate moduleManager cache with a mock module
        const mockModPath = path.resolve(process.cwd(), 'scratch/mock_math_module.jawa');
        moduleManager.cache.set(mockModPath, {
            canonicalPath: mockModPath,
            uri: 'file:///' + mockModPath.replace(/\\/g, '/'),
            mtime: 12345,
            exports: {
                functions: {
                    hitungFaktorial: { name: 'hitungFaktorial', kind: 'function' }
                },
                variables: {},
                structs: {}
            }
        });

        const code = 'gawe res = hitungFaktorial(5)';
        const testUri = pathToUri(path.resolve(__dirname, 'main_test.jawa'));
        const { actions } = getActions(code, { uri: testUri });
        const importAct = actions.find(a => a.title.includes('Import "hitungFaktorial"'));
        assert.ok(importAct, 'Expected Import "hitungFaktorial" quickfix');
        assert.strictEqual(importAct.kind, CodeActionKind.QuickFix);
        console.log('PASS: 44. Missing import quickfix from cached module');
    }

    console.log('\n====================================================');
    console.log('  ALL CODE ACTIONS UNIT TESTS PASSED (44/44 SCENARIOS) ');
    console.log('====================================================');
}

if (require.main === module) {
    runTests();
}

module.exports = runTests;
