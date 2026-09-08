const assert = require('assert');
const path = require('path');
const analyzer = require('../src/analyzer');
const {
    TOKEN_TYPES,
    TOKEN_MODIFIERS,
    MODIFIER_DECLARATION,
    MODIFIER_DEFAULT_LIBRARY,
    semanticTokensLegend,
    getSemanticTokens,
    decodeSemanticTokens,
    encodeSemanticTokens
} = require('../src/semanticTokens');

function runTests() {
    console.log('--- Semantic Tokens Unit Tests ---');

    function getTokens(code, uri = 'file:///test_sem.jawa') {
        const analysis = analyzer.analyze(code, uri);
        const { data } = getSemanticTokens(analysis);
        const decoded = decodeSemanticTokens(data, semanticTokensLegend);
        return { data, decoded, analysis };
    }

    // 1. Keyword classification
    {
        const code = 'gawe x = 10\nyen bener { bali salah }';
        const { decoded } = getTokens(code);
        const gaweTok = decoded.find(t => t.line === 0 && t.character === 0);
        assert.ok(gaweTok, 'gawe token found');
        assert.strictEqual(gaweTok.tokenType, 'keyword');

        const yenTok = decoded.find(t => t.line === 1 && t.character === 0);
        assert.ok(yenTok && yenTok.tokenType === 'keyword');

        const benerTok = decoded.find(t => t.line === 1 && t.character === 4);
        assert.ok(benerTok && benerTok.tokenType === 'keyword');

        const baliTok = decoded.find(t => t.line === 1 && t.character === 12);
        assert.ok(baliTok && baliTok.tokenType === 'keyword');
        console.log('PASS: 1. Keyword classification');
    }

    // 2. Variable declaration
    {
        const code = 'gawe angka = 42';
        const { decoded } = getTokens(code);
        const varTok = decoded.find(t => t.line === 0 && t.character === 5);
        assert.ok(varTok, 'Variable token found');
        assert.strictEqual(varTok.tokenType, 'variable');
        assert.strictEqual(varTok.length, 5);
        assert.ok((varTok.modifiers & MODIFIER_DECLARATION) !== 0, 'Variable declaration should have declaration modifier');
        console.log('PASS: 2. Variable declaration');
    }

    // 3. Variable reference
    {
        const code = 'gawe x = 10\ntulis x';
        const { decoded } = getTokens(code);
        const refTok = decoded.find(t => t.line === 1 && t.character === 6);
        assert.ok(refTok, 'Variable reference found');
        assert.strictEqual(refTok.tokenType, 'variable');
        assert.strictEqual(refTok.modifiers, 0, 'Variable reference should not have declaration modifier');
        console.log('PASS: 3. Variable reference');
    }

    // 4. Function declaration
    {
        const code = 'guna tambah(a, b) {\n    bali a + b\n}';
        const { decoded } = getTokens(code);
        const fnTok = decoded.find(t => t.line === 0 && t.character === 5);
        assert.ok(fnTok, 'Function declaration found');
        assert.strictEqual(fnTok.tokenType, 'function');
        assert.strictEqual(fnTok.length, 6);
        assert.ok((fnTok.modifiers & MODIFIER_DECLARATION) !== 0, 'Function declaration modifier expected');
        console.log('PASS: 4. Function declaration');
    }

    // 5. Function call
    {
        const code = 'guna kali(a, b) { bali a * b }\ngawe hasil = kali(2, 3)';
        const { decoded } = getTokens(code);
        const callTok = decoded.find(t => t.line === 1 && t.character === 13);
        assert.ok(callTok, 'Function call found');
        assert.strictEqual(callTok.tokenType, 'function');
        assert.strictEqual(callTok.length, 4);
        console.log('PASS: 5. Function call');
    }

    // 6. Parameter declaration
    {
        const code = 'guna sapa(jeneng) {\n    tulis jeneng\n}';
        const { decoded } = getTokens(code);
        const paramDecl = decoded.find(t => t.line === 0 && t.character === 10);
        assert.ok(paramDecl, 'Parameter declaration found');
        assert.strictEqual(paramDecl.tokenType, 'parameter');
        assert.strictEqual(paramDecl.length, 6);
        assert.ok((paramDecl.modifiers & MODIFIER_DECLARATION) !== 0, 'Parameter declaration modifier expected');
        console.log('PASS: 6. Parameter declaration');
    }

    // 7. Function scope parameter references
    {
        const code = 'guna petung(x, y) {\n    bali x + y\n}';
        const { decoded } = getTokens(code);
        const refX = decoded.find(t => t.line === 1 && t.character === 9);
        const refY = decoded.find(t => t.line === 1 && t.character === 13);
        assert.ok(refX && refX.tokenType === 'parameter', 'Parameter x reference must be parameter');
        assert.ok(refY && refY.tokenType === 'parameter', 'Parameter y reference must be parameter');
        console.log('PASS: 7. Function scope parameter references');
    }

    // 8. Shadowing: Parameter shadows global variable
    {
        const code = 'gawe x = 100\nguna uji(x) {\n    tulis x\n}\ntulis x';
        const { decoded } = getTokens(code);
        // Inside function: x at line 2 char 10 should be parameter
        const innerX = decoded.find(t => t.line === 2 && t.character === 10);
        assert.ok(innerX, 'Inner x found');
        assert.strictEqual(innerX.tokenType, 'parameter');

        // Outside function: x at line 4 char 6 should be variable
        const outerX = decoded.find(t => t.line === 4 && t.character === 6);
        assert.ok(outerX, 'Outer x found');
        assert.strictEqual(outerX.tokenType, 'variable');
        console.log('PASS: 8. Shadowing resolution');
    }

    // 9. Struct declaration
    {
        const code = 'bentuk Mobil {\n    gawe merk = "Toyota"\n}';
        const { decoded } = getTokens(code);
        const structTok = decoded.find(t => t.line === 0 && t.character === 7);
        assert.ok(structTok, 'Struct declaration found');
        assert.strictEqual(structTok.tokenType, 'class');
        assert.strictEqual(structTok.length, 5);
        assert.ok((structTok.modifiers & MODIFIER_DECLARATION) !== 0);
        console.log('PASS: 9. Struct declaration');
    }

    // 10. Constructor wiwiti
    {
        const code = 'bentuk Wong {\n    guna wiwiti(n) {\n        iki.n = n\n    }\n}';
        const { decoded } = getTokens(code);
        const ctorTok = decoded.find(t => t.line === 1 && t.character === 9);
        assert.ok(ctorTok, 'Constructor found');
        assert.strictEqual(ctorTok.tokenType, 'method');
        assert.strictEqual(ctorTok.length, 6);
        assert.ok((ctorTok.modifiers & MODIFIER_DECLARATION) !== 0);
        console.log('PASS: 10. Constructor wiwiti');
    }

    // 11. Method declaration and instance invocation
    {
        const code = 'bentuk Kucing {\n    guna nyuwun() { tulis "Meow" }\n}\ngawe k = anyar Kucing()\nk.nyuwun()';
        const { decoded } = getTokens(code);
        // Declaration at line 1 char 9
        const methodDecl = decoded.find(t => t.line === 1 && t.character === 9);
        assert.ok(methodDecl && methodDecl.tokenType === 'method');

        // Invocation at line 4 char 2
        const methodCall = decoded.find(t => t.line === 4 && t.character === 2);
        assert.ok(methodCall && methodCall.tokenType === 'method');
        console.log('PASS: 11. Method declaration and instance invocation');
    }

    // 12. Struct field declaration and access
    {
        const code = 'bentuk Titik {\n    gawe x = 0\n}\ngawe p = anyar Titik()\np.x = 10';
        const { decoded } = getTokens(code);
        // Field declaration
        const fieldDecl = decoded.find(t => t.line === 1 && t.character === 9);
        assert.ok(fieldDecl && fieldDecl.tokenType === 'property');

        // Field access
        const fieldAccess = decoded.find(t => t.line === 4 && t.character === 2);
        assert.ok(fieldAccess && fieldAccess.tokenType === 'property');
        console.log('PASS: 12. Struct field declaration and access');
    }

    // 13. iki keyword and property access
    {
        const code = 'bentuk Wong {\n    gawe umur = 0\n    guna tambahUmur() {\n        iki.umur = iki.umur + 1\n    }\n}';
        const { decoded } = getTokens(code);
        const ikiTok = decoded.find(t => t.line === 3 && t.character === 8);
        assert.ok(ikiTok && ikiTok.tokenType === 'keyword');

        const propTok = decoded.find(t => t.line === 3 && t.character === 12);
        assert.ok(propTok && propTok.tokenType === 'property');
        console.log('PASS: 13. iki keyword and property access');
    }

    // 14. super keyword and method call
    {
        const code = 'bentuk B {\n    guna salam() {\n        super.salam()\n    }\n}';
        const { decoded } = getTokens(code);
        const superTok = decoded.find(t => t.line === 2 && t.character === 8);
        assert.ok(superTok && superTok.tokenType === 'keyword');

        const superMethod = decoded.find(t => t.line === 2 && t.character === 14);
        assert.ok(superMethod && superMethod.tokenType === 'method');
        console.log('PASS: 14. super keyword and method call');
    }

    // 15. Inheritance ngembangake
    {
        const code = 'bentuk Induk {}\nbentuk Anak ngembangake Induk {}';
        const { decoded } = getTokens(code);
        const anakTok = decoded.find(t => t.line === 1 && t.character === 7);
        const ngembangakeTok = decoded.find(t => t.line === 1 && t.character === 12);
        const indukTok = decoded.find(t => t.line === 1 && t.character === 24);

        assert.ok(anakTok && anakTok.tokenType === 'class');
        assert.ok(ngembangakeTok && ngembangakeTok.tokenType === 'keyword');
        assert.ok(indukTok && indukTok.tokenType === 'class');
        console.log('PASS: 15. Inheritance ngembangake');
    }

    // 16. Namespace import and usage
    {
        const code = 'impor "./math.jawa" minangka math\nmath.tambah(1, 2)';
        const { decoded } = getTokens(code);
        const nsDecl = decoded.find(t => t.line === 0 && t.character === 29);
        assert.ok(nsDecl && nsDecl.tokenType === 'namespace');

        const nsUse = decoded.find(t => t.line === 1 && t.character === 0);
        assert.ok(nsUse && nsUse.tokenType === 'namespace');

        const fnUse = decoded.find(t => t.line === 1 && t.character === 5);
        assert.ok(fnUse && fnUse.tokenType === 'function');
        console.log('PASS: 16. Namespace import and usage');
    }

    // 17. Selective import
    {
        const code = 'impor { tambah } saka "./math.jawa"\ntambah(1, 2)';
        const { decoded } = getTokens(code);
        const impFn = decoded.find(t => t.line === 0 && t.character === 8);
        assert.ok(impFn && impFn.tokenType === 'function');

        const callFn = decoded.find(t => t.line === 1 && t.character === 0);
        assert.ok(callFn && callFn.tokenType === 'function');
        console.log('PASS: 17. Selective import');
    }

    // 18. Selective import with alias
    {
        const code = 'impor { kali minangka perbanyakan } saka "./math.jawa"\nperbanyakan(2, 3)';
        const { decoded } = getTokens(code);
        const origTok = decoded.find(t => t.line === 0 && t.character === 8);
        assert.ok(origTok && origTok.tokenType === 'function');

        const minangkaTok = decoded.find(t => t.line === 0 && t.character === 13);
        assert.ok(minangkaTok && minangkaTok.tokenType === 'keyword');

        const aliasTok = decoded.find(t => t.line === 0 && t.character === 22);
        assert.ok(aliasTok && aliasTok.tokenType === 'function');

        const aliasCall = decoded.find(t => t.line === 1 && t.character === 0);
        assert.ok(aliasCall && aliasCall.tokenType === 'function');
        console.log('PASS: 18. Selective import with alias');
    }

    // 19. Export declaration
    {
        const code = 'ekspor guna kurangi(a, b) { bali a - b }';
        const { decoded } = getTokens(code);
        const eksporTok = decoded.find(t => t.line === 0 && t.character === 0);
        assert.ok(eksporTok && eksporTok.tokenType === 'keyword');

        const gunaTok = decoded.find(t => t.line === 0 && t.character === 7);
        assert.ok(gunaTok && gunaTok.tokenType === 'keyword');

        const fnTok = decoded.find(t => t.line === 0 && t.character === 12);
        assert.ok(fnTok && fnTok.tokenType === 'function');
        console.log('PASS: 19. Export declaration');
    }

    // 20. New instance anyar
    {
        const code = 'bentuk Kotak {}\ngawe k = anyar Kotak()';
        const { decoded } = getTokens(code);
        const anyarTok = decoded.find(t => t.line === 1 && t.character === 9);
        assert.ok(anyarTok && anyarTok.tokenType === 'keyword');

        const classTok = decoded.find(t => t.line === 1 && t.character === 15);
        assert.ok(classTok && classTok.tokenType === 'class');
        console.log('PASS: 20. New instance anyar');
    }

    // 21. Object literal properties
    {
        const code = 'gawe user = { nama: "Barch", umur: 20 }';
        const { decoded } = getTokens(code);
        const namaProp = decoded.find(t => t.line === 0 && t.character === 14);
        assert.ok(namaProp && namaProp.tokenType === 'property');

        const umurProp = decoded.find(t => t.line === 0 && t.character === 29);
        assert.ok(umurProp && umurProp.tokenType === 'property');
        console.log('PASS: 21. Object literal properties');
    }

    // 22. Array literal
    {
        const code = 'gawe arr = [10, 20, 30]';
        const { decoded } = getTokens(code);
        const arrVar = decoded.find(t => t.line === 0 && t.character === 5);
        assert.ok(arrVar && arrVar.tokenType === 'variable');
        console.log('PASS: 22. Array literal');
    }

    // 23. Number literal
    {
        const code = 'gawe x = 12345';
        const { decoded } = getTokens(code);
        const numTok = decoded.find(t => t.line === 0 && t.character === 9);
        assert.ok(numTok && numTok.tokenType === 'number');
        assert.strictEqual(numTok.length, 5);
        console.log('PASS: 23. Number literal');
    }

    // 24. Decimal literal
    {
        const code = 'gawe pi = 3.14159';
        const { decoded } = getTokens(code);
        const decTok = decoded.find(t => t.line === 0 && t.character === 10);
        assert.ok(decTok && decTok.tokenType === 'number');
        assert.strictEqual(decTok.length, 7);
        console.log('PASS: 24. Decimal literal');
    }

    // 25. String literal
    {
        const code = 'gawe s = "Halo Jawalang"';
        const { decoded } = getTokens(code);
        const strTok = decoded.find(t => t.line === 0 && t.character === 9);
        assert.ok(strTok && strTok.tokenType === 'string');
        assert.strictEqual(strTok.length, 15);
        console.log('PASS: 25. String literal');
    }

    // 26. Comment
    {
        const code = '// Iki komentar Jawalang\ngawe x = 10';
        const { decoded } = getTokens(code);
        const comTok = decoded.find(t => t.line === 0 && t.character === 0);
        assert.ok(comTok && comTok.tokenType === 'comment');
        console.log('PASS: 26. Comment');
    }

    // 27. Binary operators
    {
        const code = 'gawe res = 10 + 20 * 30 == 700';
        const { decoded } = getTokens(code);
        const opPlus = decoded.find(t => t.line === 0 && t.character === 14);
        const opMul = decoded.find(t => t.line === 0 && t.character === 19);
        const opEq = decoded.find(t => t.line === 0 && t.character === 24);

        assert.ok(opPlus && opPlus.tokenType === 'operator');
        assert.ok(opMul && opMul.tokenType === 'operator');
        assert.ok(opEq && opEq.tokenType === 'operator');
        console.log('PASS: 27. Binary operators');
    }

    // 28. Unary operator
    {
        const code = 'gawe x = -y';
        const { decoded } = getTokens(code);
        const opMinus = decoded.find(t => t.line === 0 && t.character === 9);
        assert.ok(opMinus && opMinus.tokenType === 'operator');
        console.log('PASS: 28. Unary operator');
    }

    // 29. Nested expressions
    {
        const code = 'gawe res = (a + b) * (c - d)';
        const { decoded } = getTokens(code);
        const opMul = decoded.find(t => t.line === 0 && t.character === 19);
        assert.ok(opMul && opMul.tokenType === 'operator');
        console.log('PASS: 29. Nested expressions');
    }

    // 30. Nested function call
    {
        const code = 'guna f(x) { bali x }\nguna g(y) { bali y }\ngawe res = f(g(10))';
        const { decoded } = getTokens(code);
        const fCall = decoded.find(t => t.line === 2 && t.character === 11);
        const gCall = decoded.find(t => t.line === 2 && t.character === 13);
        assert.ok(fCall && fCall.tokenType === 'function');
        assert.ok(gCall && gCall.tokenType === 'function');
        console.log('PASS: 30. Nested function call');
    }

    // 31. Higher Order Function (HOF)
    {
        const code = 'guna lipat(x) { bali x * 2 }\ngawe data = [1, 2, 3]\ngawe hasil = terapkan(lipat, data)';
        const { decoded } = getTokens(code);
        const hofTok = decoded.find(t => t.line === 2 && t.character === 13);
        assert.ok(hofTok, 'terapkan found');
        assert.strictEqual(hofTok.tokenType, 'function');
        assert.ok((hofTok.modifiers & MODIFIER_DEFAULT_LIBRARY) !== 0, 'terapkan is defaultLibrary');

        const callbackTok = decoded.find(t => t.line === 2 && t.character === 22);
        assert.ok(callbackTok, 'lipat callback found');
        assert.strictEqual(callbackTok.tokenType, 'function');
        console.log('PASS: 31. Higher Order Function (HOF)');
    }

    // 32. Built-in function
    {
        const code = 'gawe l = dawa([1, 2, 3])';
        const { decoded } = getTokens(code);
        const dawaTok = decoded.find(t => t.line === 0 && t.character === 9);
        assert.ok(dawaTok && dawaTok.tokenType === 'function');
        assert.ok((dawaTok.modifiers & MODIFIER_DEFAULT_LIBRARY) !== 0);
        console.log('PASS: 32. Built-in function');
    }

    // 33. First-class function reference
    {
        const code = 'guna cetak(x) { tulis x }\ngawe ref = cetak\nref(10)';
        const { decoded } = getTokens(code);
        // 'ref' at declaration is variable
        const refDecl = decoded.find(t => t.line === 1 && t.character === 5);
        assert.ok(refDecl && refDecl.tokenType === 'variable');

        // 'cetak' on right hand side is function
        const fnRef = decoded.find(t => t.line === 1 && t.character === 11);
        assert.ok(fnRef && fnRef.tokenType === 'function');

        // 'ref' at invocation remains variable
        const refCall = decoded.find(t => t.line === 2 && t.character === 0);
        assert.ok(refCall && refCall.tokenType === 'variable');
        console.log('PASS: 33. First-class function reference');
    }

    // 34. Malformed source resilience
    {
        const code = 'guna ((( broken syntax\nbentuk';
        const { data, decoded } = getTokens(code);
        assert.ok(Array.isArray(data));
        assert.ok(Array.isArray(decoded));
        console.log('PASS: 34. Malformed source resilience');
    }

    // 35. Empty source
    {
        const { data, decoded } = getTokens('');
        assert.deepStrictEqual(data, []);
        assert.deepStrictEqual(decoded, []);
        console.log('PASS: 35. Empty source');
    }

    // 36. Unicode string
    {
        const code = 'gawe s = "ꦲꦤꦕꦫꦏ"';
        const { decoded } = getTokens(code);
        const strTok = decoded.find(t => t.line === 0 && t.character === 9);
        assert.ok(strTok && strTok.tokenType === 'string');
        assert.strictEqual(strTok.length, 7); // 5 characters + 2 quotes = 7 UTF-16 code units
        console.log('PASS: 36. Unicode string');
    }

    // 37. UTF-16 precision
    {
        const code = 'gawe x = "Jawa ꦗꦮ"\ngawe y = 10';
        const { decoded } = getTokens(code);
        const yTok = decoded.find(t => t.line === 1 && t.character === 5);
        assert.ok(yTok && yTok.tokenType === 'variable');
        console.log('PASS: 37. UTF-16 precision');
    }

    // 38. Duplicate prevention
    {
        const code = 'gawe a = 1\ngawe b = 2';
        const { decoded } = getTokens(code);
        const positions = new Set();
        for (const tok of decoded) {
            const key = `${tok.line}:${tok.character}`;
            assert.ok(!positions.has(key), `Duplicate token at ${key}`);
            positions.add(key);
        }
        console.log('PASS: 38. Duplicate prevention');
    }

    // 39. Overlap prevention
    {
        const code = 'gawe teks = "halo dunya" + 123';
        const { decoded } = getTokens(code);
        for (let i = 0; i < decoded.length - 1; i++) {
            const t1 = decoded[i];
            const t2 = decoded[i + 1];
            if (t1.line === t2.line) {
                assert.ok(t1.character + t1.length <= t2.character, `Overlap between ${t1.tokenType} and ${t2.tokenType} on line ${t1.line}`);
            }
        }
        console.log('PASS: 39. Overlap prevention');
    }

    // 40. Deterministic ordering
    {
        const code = 'bentuk Wong {\n    gawe jeneng = "Budi"\n    guna salam() { tulis iki.jeneng }\n}\ngawe w = anyar Wong()\nw.salam()';
        const res1 = getTokens(code);
        const res2 = getTokens(code);
        assert.deepStrictEqual(res1.data, res2.data, 'Output must be strictly deterministic across calls');
        console.log('PASS: 40. Deterministic ordering');
    }

    // 41. Namespace private symbol isolation
    {
        const code = 'impor "./math.jawa" minangka math\nmath.secret()';
        const { decoded } = getTokens(code);
        const nsTok = decoded.find(t => t.line === 1 && t.character === 0);
        assert.ok(nsTok && nsTok.tokenType === 'namespace');
        console.log('PASS: 41. Namespace private symbol isolation');
    }

    // 42. Inherited method classification
    {
        const code = 'bentuk Induk {\n    guna salamInduk() {}\n}\nbentuk Anak ngembangake Induk {}\ngawe a = anyar Anak()\na.salamInduk()';
        const { decoded } = getTokens(code);
        const callTok = decoded.find(t => t.line === 5 && t.character === 2);
        assert.ok(callTok && callTok.tokenType === 'method');
        console.log('PASS: 42. Inherited method classification');
    }

    // 43. Overridden method classification
    {
        const code = 'bentuk Induk {\n    guna salam() {}\n}\nbentuk Anak ngembangake Induk {\n    guna salam() {}\n}\ngawe a = anyar Anak()\na.salam()';
        const { decoded } = getTokens(code);
        const callTok = decoded.find(t => t.line === 7 && t.character === 2);
        assert.ok(callTok && callTok.tokenType === 'method');
        console.log('PASS: 43. Overridden method classification');
    }

    // 44. Dynamic string indexing protection
    {
        const code = 'gawe w = {}\nw["salam"] = 10';
        const { decoded } = getTokens(code);
        const strTok = decoded.find(t => t.line === 1 && t.character === 2);
        assert.ok(strTok, 'String token found in brackets');
        assert.strictEqual(strTok.tokenType, 'string', 'String inside bracket indexing must remain string');
        console.log('PASS: 44. Dynamic string indexing protection');
    }

    // 45. No runtime execution
    {
        // Code with infinite loop or error that would hang/crash if executed
        const code = 'nalika bener {\n    // infinite loop must never execute\n}\nlempar "Fatal"';
        const { data, decoded } = getTokens(code);
        assert.ok(Array.isArray(data));
        assert.ok(Array.isArray(decoded));
        console.log('PASS: 45. No runtime execution');
    }

    // 46. Legend completeness
    {
        assert.strictEqual(TOKEN_TYPES.length, 13);
        assert.strictEqual(TOKEN_MODIFIERS.length, 2);
        console.log('PASS: 46. Legend completeness');
    }

    console.log('\n====================================================');
    console.log('  ALL SEMANTIC TOKENS UNIT TESTS PASSED (46/46)     ');
    console.log('====================================================');
}

if (require.main === module) {
    runTests();
}

module.exports = runTests;
