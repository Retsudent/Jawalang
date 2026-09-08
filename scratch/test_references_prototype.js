const assert = require('assert');
const path = require('path');
const analyzer = require('../language-server/src/analyzer');
const { getReferences } = require('../language-server/src/references');
const { pathToUri } = require('../language-server/src/utils');

const uri = pathToUri(path.resolve(__dirname, 'proto.jawa'));

console.log('Testing getReferences from language-server/src/references.js...');

// 1. Variable & Shadowing
const codeVar = `
gawe x = 10
tulis x
guna f() {
    gawe x = 20
    tulis x
}
tulis x
`;
const a1 = analyzer.analyze(codeVar, uri);

// Cursor on global x declaration: line 1, char 5
const refsGlobal = getReferences(a1, { line: 1, character: 5 }, { includeDeclaration: true });
console.log('Global x references (with decl):', refsGlobal.length);
assert.strictEqual(refsGlobal.length, 3, 'Global x should have 1 decl + 2 usages');
assert.strictEqual(refsGlobal[0].range.start.line, 1);
assert.strictEqual(refsGlobal[1].range.start.line, 2);
assert.strictEqual(refsGlobal[2].range.start.line, 7);

// Without declaration
const refsGlobalNoDecl = getReferences(a1, { line: 1, character: 5 }, { includeDeclaration: false });
console.log('Global x references (no decl):', refsGlobalNoDecl.length);
assert.strictEqual(refsGlobalNoDecl.length, 2);
assert.strictEqual(refsGlobalNoDecl[0].range.start.line, 2);
assert.strictEqual(refsGlobalNoDecl[1].range.start.line, 7);

// Cursor on shadowed local x: line 4, char 9
const refsLocal = getReferences(a1, { line: 4, character: 9 }, { includeDeclaration: true });
console.log('Local x references:', refsLocal.length);
assert.strictEqual(refsLocal.length, 2, 'Local x should have 1 decl + 1 usage');
assert.strictEqual(refsLocal[0].range.start.line, 4);
assert.strictEqual(refsLocal[1].range.start.line, 5);

// 2. Struct & Instantiation
const codeStruct = `
bentuk Titik {
    gawe x = 0
}
gawe t1 = anyar Titik()
gawe t2 = anyar Titik()
`;
const a2 = analyzer.analyze(codeStruct, uri);
const refsStruct = getReferences(a2, { line: 1, character: 8 }, { includeDeclaration: true });
console.log('Struct Titik references:', refsStruct.length);
assert.strictEqual(refsStruct.length, 3, 'Struct Titik should have 1 decl + 2 usages');
assert.strictEqual(refsStruct[0].range.start.line, 1);
assert.strictEqual(refsStruct[1].range.start.line, 4);
assert.strictEqual(refsStruct[2].range.start.line, 5);

// 3. Methods & Iki
const codeMethod = `
bentuk Wong {
    gawe jeneng = ""
    guna salam() {
        tulis iki.jeneng
    }
}
gawe w = anyar Wong()
w.salam()
`;
const a3 = analyzer.analyze(codeMethod, uri);
const refsMethod = getReferences(a3, { line: 3, character: 10 }, { includeDeclaration: true });
console.log('Method salam references:', refsMethod.length);
assert.strictEqual(refsMethod.length, 2, 'Method salam should have 1 decl + 1 usage');
assert.strictEqual(refsMethod[0].range.start.line, 3);
assert.strictEqual(refsMethod[1].range.start.line, 8);

// Cursor on w.salam() call site: line 8, char 4
const refsMethodFromCall = getReferences(a3, { line: 8, character: 4 }, { includeDeclaration: true });
assert.strictEqual(refsMethodFromCall.length, 2);

// Cursor on iki.jeneng inside method: line 4, char 18
const refsField = getReferences(a3, { line: 4, character: 18 }, { includeDeclaration: true });
console.log('Field jeneng references:', refsField.length);
assert.strictEqual(refsField.length, 2, 'Field jeneng should have 1 decl + 1 usage');

// 4. Inherited method & super
const codeInh = `
bentuk Induk {
    guna sapa() { tulis "induk" }
}
bentuk Anak ngembangake Induk {
    guna sapa() {
        super.sapa()
    }
}
`;
const a4 = analyzer.analyze(codeInh, uri);
// Cursor on Induk.sapa declaration: line 2, char 10
const refsIndukSapa = getReferences(a4, { line: 2, character: 10 }, { includeDeclaration: true });
console.log('Induk.sapa references:', refsIndukSapa.length);
assert.strictEqual(refsIndukSapa.length, 2);
assert.strictEqual(refsIndukSapa[0].range.start.line, 2); // declaration
assert.strictEqual(refsIndukSapa[1].range.start.line, 6); // super.sapa() call

// 5. Edge cases
const emptyRefs = getReferences(a1, { line: 0, character: 0 });
assert.deepStrictEqual(emptyRefs, []);

const builtinRefs = getReferences(a1, { line: 2, character: 1 }); // "tulis"
assert.deepStrictEqual(builtinRefs, []);

const kwRefs = getReferences(a1, { line: 1, character: 1 }); // "gawe"
assert.deepStrictEqual(kwRefs, []);

console.log('ALL PROTOTYPE REFERENCE TESTS PASSED!');
