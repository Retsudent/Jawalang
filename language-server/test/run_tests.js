const testDiagnostics = require('./diagnostics.test');
const testDefinitions = require('./definitions.test');
const testCompletion = require('./completion.test');
const testHover = require('./hover.test');
const testSymbols = require('./symbols.test');
const testModules = require('./modules.test');
const testReferences = require('./references.test');
const testRename = require('./rename.test');
const testSignatureHelp = require('./signatureHelp.test');
const testFormatter = require('./formatter.test');
const testCodeActions = require('./codeActions.test');
const testSemanticTokens = require('./semanticTokens.test');

console.log('====================================================');
console.log('       JAWALANG LANGUAGE SERVER UNIT TESTS          ');
console.log('====================================================\n');

try {
    testDiagnostics();
    console.log('');
    testDefinitions();
    console.log('');
    testCompletion();
    console.log('');
    testHover();
    console.log('');
    testSymbols();
    console.log('');
    testModules();
    console.log('');
    testReferences();
    console.log('');
    testRename();
    console.log('');
    testSignatureHelp();
    console.log('');
    testFormatter();
    console.log('');
    testCodeActions();
    console.log('');
    testSemanticTokens();

    console.log('\n====================================================');
    console.log('  ALL LANGUAGE SERVER UNIT TESTS PASSED (12/12 SUITES)');
    console.log('====================================================');
} catch (err) {
    console.error('\nTEST SUITE FAILED:');
    console.error(err);
    process.exit(1);
}

