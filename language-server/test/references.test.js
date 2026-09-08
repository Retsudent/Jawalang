const assert = require('assert');
const path = require('path');
const fs = require('fs');

const analyzer = require('../src/analyzer');
const { getReferences } = require('../src/references');
const { pathToUri } = require('../src/utils');

function testReferences() {
    console.log('--- References Tests ---');

    const testUri = pathToUri(path.resolve(__dirname, 'fixtures/references_test.jawa'));

    // 1. Global Variable References (with and without declaration)
    {
        const code = `gawe pesen = "Halo"
tulis pesen
gawe salinan = pesen`;
        const analysis = analyzer.analyze(code, testUri);

        // Cursor on declaration: line 0, char 5
        const withDecl = getReferences(analysis, { line: 0, character: 5 }, { includeDeclaration: true });
        assert.strictEqual(withDecl.length, 3, 'Global variable should have 3 locations (1 decl + 2 usages)');
        assert.strictEqual(withDecl[0].range.start.line, 0);
        assert.strictEqual(withDecl[1].range.start.line, 1);
        assert.strictEqual(withDecl[2].range.start.line, 2);

        // Without declaration
        const withoutDecl = getReferences(analysis, { line: 0, character: 5 }, { includeDeclaration: false });
        assert.strictEqual(withoutDecl.length, 2, 'Global variable without declaration should have 2 usages');
        assert.strictEqual(withoutDecl[0].range.start.line, 1);
        assert.strictEqual(withoutDecl[1].range.start.line, 2);

        console.log('PASS: Global variable references (with & without declaration)');
    }

    // 2. Local Variable References
    {
        const code = `guna etung() {
    gawe total = 100
    tulis total
    bali total
}`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 9 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Local variable should have 1 decl + 2 usages');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 2);
        assert.strictEqual(refs[2].range.start.line, 3);
        console.log('PASS: Local variable references inside function');
    }

    // 3. Function Parameter References
    {
        const code = `guna tambah(angkaA, angkaB) {
    gawe hasil = angkaA + angkaB
    bali hasil
}`;
        const analysis = analyzer.analyze(code, testUri);
        const refsA = getReferences(analysis, { line: 0, character: 13 }, { includeDeclaration: true });
        assert.strictEqual(refsA.length, 2, 'Parameter angkaA should have 1 decl + 1 usage');
        assert.strictEqual(refsA[0].range.start.line, 0);
        assert.strictEqual(refsA[1].range.start.line, 1);

        const refsB = getReferences(analysis, { line: 0, character: 22 }, { includeDeclaration: true });
        assert.strictEqual(refsB.length, 2, 'Parameter angkaB should have 1 decl + 1 usage');
        assert.strictEqual(refsB[0].range.start.line, 0);
        assert.strictEqual(refsB[1].range.start.line, 1);
        console.log('PASS: Parameter references in function declaration');
    }

    // 4. Struct Method Parameter References
    {
        const code = `bentuk Kalkulator {
    guna kali(faktor) {
        bali faktor * 2
    }
}`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 15 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 2, 'Method parameter should have 1 decl + 1 usage');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 2);
        console.log('PASS: Parameter references in struct method');
    }

    // 5. Variable Shadowing (Local does not contaminate Global)
    {
        const code = `gawe x = 1
guna tes() {
    gawe x = 2
    tulis x
}
tulis x`;
        const analysis = analyzer.analyze(code, testUri);

        // Local x
        const refsLocal = getReferences(analysis, { line: 2, character: 9 }, { includeDeclaration: true });
        assert.strictEqual(refsLocal.length, 2, 'Local x should only include local declaration and local usage');
        assert.strictEqual(refsLocal[0].range.start.line, 2);
        assert.strictEqual(refsLocal[1].range.start.line, 3);

        // Global x
        const refsGlobal = getReferences(analysis, { line: 0, character: 5 }, { includeDeclaration: true });
        assert.strictEqual(refsGlobal.length, 2, 'Global x should only include global declaration and global usage');
        assert.strictEqual(refsGlobal[0].range.start.line, 0);
        assert.strictEqual(refsGlobal[1].range.start.line, 5);

        console.log('PASS: Variable shadowing resolution');
    }

    // 6. Function Declaration References Across Multiple Calls
    {
        const code = `guna sapa() {
    tulis "Halo"
}
sapa()
sapa()
sapa()`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 0, character: 6 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 4, 'Function sapa should have 1 decl + 3 calls');
        assert.strictEqual(refs[0].range.start.line, 0);
        assert.strictEqual(refs[1].range.start.line, 3);
        assert.strictEqual(refs[2].range.start.line, 4);
        assert.strictEqual(refs[3].range.start.line, 5);
        console.log('PASS: Function declaration with multiple call sites');
    }

    // 7. Reference Triggered From Call Site
    {
        const code = `guna cetak(pesan) { tulis pesan }
cetak("a")
cetak("b")`;
        const analysis = analyzer.analyze(code, testUri);
        // Cursor on callee at line 1, char 2
        const refs = getReferences(analysis, { line: 1, character: 2 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Triggering from call site should find decl and all call sites');
        console.log('PASS: Reference triggered from call site');
    }

    // 8. Struct Declaration and Instantiation References
    {
        const code = `bentuk Mobil {
    gawe merk = "Sedan"
}
gawe m1 = anyar Mobil()
gawe m2 = anyar Mobil()`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 0, character: 8 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Struct Mobil should have 1 decl + 2 instantiations');
        assert.strictEqual(refs[0].range.start.line, 0);
        assert.strictEqual(refs[1].range.start.line, 3);
        assert.strictEqual(refs[2].range.start.line, 4);
        console.log('PASS: Struct declaration and anyar Mobil() references');
    }

    // 9. Struct Reference Triggered From anyar Site
    {
        const code = `bentuk Kucing {}
gawe k = anyar Kucing()`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 15 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 2);
        assert.strictEqual(refs[0].range.start.line, 0);
        assert.strictEqual(refs[1].range.start.line, 1);
        console.log('PASS: Struct reference triggered from anyar keyword target');
    }

    // 10. Struct Field References via iki.field
    {
        const code = `bentuk Barang {
    gawe rega = 1000
    guna setRega(r) {
        iki.rega = r
    }
    guna getRega() {
        bali iki.rega
    }
}`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 10 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Field rega should have 1 decl + 2 iki.rega usages');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 3);
        assert.strictEqual(refs[2].range.start.line, 6);
        console.log('PASS: Struct field references via iki.field');
    }

    // 11. Struct Field References via Instance Assignment
    {
        const code = `bentuk Titik {
    gawe x = 0
}
gawe p = anyar Titik()
p.x = 50
tulis p.x`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 9 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Field x should have 1 decl + 1 assignment + 1 read');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 4);
        assert.strictEqual(refs[2].range.start.line, 5);
        console.log('PASS: Struct field references via instance property assignment and read');
    }

    // 12. Struct Method References via Instance Call
    {
        const code = `bentuk Robot {
    guna obah() { tulis "obah" }
}
gawe r = anyar Robot()
r.obah()
r.obah()`;
        const analysis = analyzer.analyze(code, testUri);
        const refs = getReferences(analysis, { line: 1, character: 10 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Method obah should have 1 decl + 2 calls');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 4);
        assert.strictEqual(refs[2].range.start.line, 5);
        console.log('PASS: Struct method references via instance calls');
    }

    // 13. Inherited Method References via super.method()
    {
        const code = `bentuk Bapa {
    guna salam() { tulis "bapa" }
}
bentuk Bocah ngembangake Bapa {
    guna salam() {
        super.salam()
    }
}`;
        const analysis = analyzer.analyze(code, testUri);
        // Cursor on Bapa.salam: line 1, char 10
        const refs = getReferences(analysis, { line: 1, character: 10 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 2, 'Bapa.salam should have 1 decl + 1 super.salam call');
        assert.strictEqual(refs[0].range.start.line, 1);
        assert.strictEqual(refs[1].range.start.line, 5);
        console.log('PASS: Inherited method references via super.method()');
    }

    // 14. Overridden Method Separation
    {
        const code = `bentuk Induk {
    guna aksi() { tulis 1 }
}
bentuk Anak ngembangake Induk {
    guna aksi() { tulis 2 }
}
gawe a = anyar Anak()
a.aksi()`;
        const analysis = analyzer.analyze(code, testUri);
        // Cursor on Anak.aksi: line 4, char 10
        const refsAnak = getReferences(analysis, { line: 4, character: 10 }, { includeDeclaration: true });
        assert.strictEqual(refsAnak.length, 2, 'Anak.aksi should have its own decl + call, not Induk.aksi');
        assert.strictEqual(refsAnak[0].range.start.line, 4);
        assert.strictEqual(refsAnak[1].range.start.line, 7);
        console.log('PASS: Overridden method separation');
    }

    // 15. Selective Import References
    {
        const fixturePath = path.resolve(__dirname, 'fixtures/modules/math.jawa');
        const callerUri = pathToUri(path.resolve(__dirname, 'fixtures/modules/caller.jawa'));
        const code = `impor { tambah } saka "./math"
gawe res = tambah(10, 20)
tulis tambah(1, 2)`;
        const analysis = analyzer.analyze(code, callerUri);
        const refs = getReferences(analysis, { line: 0, character: 10 }, { includeDeclaration: true });
        assert.strictEqual(refs.length, 3, 'Imported tambah should have declaration in math.jawa + 2 call sites in caller.jawa');
        assert.ok(refs.some(r => r.uri.includes('math.jawa') && r.range.start.line === 3), 'Should include declaration in math.jawa');
        assert.ok(refs.some(r => r.uri.includes('caller.jawa') && r.range.start.line === 1), 'Should include call at line 1');
        assert.ok(refs.some(r => r.uri.includes('caller.jawa') && r.range.start.line === 2), 'Should include call at line 2');
        console.log('PASS: Selective import references');
    }

    // 16. Namespace Import References
    {
        const callerUri = pathToUri(path.resolve(__dirname, 'fixtures/modules/caller_ns.jawa'));
        const code = `impor "./math" minangka petung
gawe a = petung.tambah(1, 2)
gawe b = petung.tambah(3, 4)`;
        const analysis = analyzer.analyze(code, callerUri);
        // Cursor on petung namespace
        const refsNs = getReferences(analysis, { line: 0, character: 25 }, { includeDeclaration: true });
        assert.strictEqual(refsNs.length, 3, 'Namespace petung should have 1 decl + 2 accesses');

        // Cursor on petung.tambah member: line 1, char 18
        const refsMember = getReferences(analysis, { line: 1, character: 18 }, { includeDeclaration: false });
        assert.strictEqual(refsMember.length, 2, 'Namespace exported member should have 2 calls');
        console.log('PASS: Namespace import and exported member references');
    }

    // 17. Position at Identifier Start, Middle, and End
    {
        const code = `gawe jenengKu = "Antigravity"
tulis jenengKu`;
        const analysis = analyzer.analyze(code, testUri);
        // Start: line 0, char 5
        const rStart = getReferences(analysis, { line: 0, character: 5 }, { includeDeclaration: true });
        // Middle: line 0, char 8
        const rMid = getReferences(analysis, { line: 0, character: 8 }, { includeDeclaration: true });
        // End: line 0, char 13
        const rEnd = getReferences(analysis, { line: 0, character: 13 }, { includeDeclaration: true });

        assert.strictEqual(rStart.length, 2);
        assert.strictEqual(rMid.length, 2);
        assert.strictEqual(rEnd.length, 2);
        console.log('PASS: Position accuracy at start, middle, and end of identifier');
    }

    // 18. Position on Whitespace / Outside Range Returns []
    {
        const code = `gawe x = 10`;
        const analysis = analyzer.analyze(code, testUri);
        const rWhite = getReferences(analysis, { line: 0, character: 4 }); // whitespace after gawe
        assert.deepStrictEqual(rWhite, []);

        const rOutOfRange = getReferences(analysis, { line: 10, character: 0 });
        assert.deepStrictEqual(rOutOfRange, []);
        console.log('PASS: Position on whitespace or out of bounds returns []');
    }

    // 19. Keywords and Built-in Functions Return [] (No False References)
    {
        const code = `gawe x = 10
tulis x
yen bener { mandheg }`;
        const analysis = analyzer.analyze(code, testUri);
        const rTulis = getReferences(analysis, { line: 1, character: 1 }); // built-in tulis
        assert.deepStrictEqual(rTulis, []);

        const rGawe = getReferences(analysis, { line: 0, character: 1 }); // keyword gawe
        assert.deepStrictEqual(rGawe, []);

        const rYen = getReferences(analysis, { line: 2, character: 1 }); // keyword yen
        assert.deepStrictEqual(rYen, []);
        console.log('PASS: Built-in functions and keywords return [] without error');
    }

    // 20. Unknown / Undefined Symbol Returns []
    {
        const code = `tulis oraAna`;
        const analysis = analyzer.analyze(code, testUri);
        const rUnknown = getReferences(analysis, { line: 0, character: 8 });
        assert.deepStrictEqual(rUnknown, []);
        console.log('PASS: Undefined symbol returns [] without error');
    }

    // 21. Empty Document Handling
    {
        const analysis = analyzer.analyze('', testUri);
        const rEmpty = getReferences(analysis, { line: 0, character: 0 });
        assert.deepStrictEqual(rEmpty, []);
        console.log('PASS: Empty document returns [] cleanly');
    }

    // 22. Malformed Syntax Document
    {
        const analysis = analyzer.analyze('gawe = @#$%^&', testUri);
        const rMalformed = getReferences(analysis, { line: 0, character: 2 });
        assert.deepStrictEqual(rMalformed, []);
        console.log('PASS: Malformed document returns [] safely');
    }
}

if (require.main === module) {
    testReferences();
}

module.exports = testReferences;
