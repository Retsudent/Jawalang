/**
 * Jawalang V1.3.0 — Phase 8: Semantic Tokens Protocol Integration Suite
 *
 * Verifies textDocument/semanticTokens/full over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const { pathToUri } = require('../language-server/src/utils');
const { decodeSemanticTokens, semanticTokensLegend } = require('../language-server/src/semanticTokens');

console.log('====================================================');
console.log('    JAWALANG V1.3.0 — SEMANTIC TOKENS PROTOCOL     ');
console.log('====================================================\n');

class LSPClient {
    constructor(serverPath) {
        this.process = spawn('node', [serverPath, '--stdio'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        this.buffer = Buffer.alloc(0);
        this.messageId = 1;
        this.pendingRequests = new Map();

        this.process.stdout.on('data', (chunk) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            this.processBuffer();
        });

        this.process.stderr.on('data', () => {
            // debug stream
        });
    }

    processBuffer() {
        while (true) {
            const headerEnd = this.buffer.indexOf('\r\n\r\n');
            if (headerEnd === -1) break;

            const header = this.buffer.subarray(0, headerEnd).toString('utf8');
            const match = /Content-Length:\s*(\d+)/i.exec(header);
            if (!match) {
                this.buffer = this.buffer.subarray(headerEnd + 4);
                continue;
            }

            const contentLength = parseInt(match[1], 10);
            const bodyStart = headerEnd + 4;
            const bodyEnd = bodyStart + contentLength;

            if (this.buffer.length < bodyEnd) break;

            const body = this.buffer.subarray(bodyStart, bodyEnd).toString('utf8');
            this.buffer = this.buffer.subarray(bodyEnd);

            try {
                const message = JSON.parse(body);
                this.handleMessage(message);
            } catch (err) {
                console.error('Failed to parse JSON-RPC message:', err);
            }
        }
    }

    handleMessage(msg) {
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
            const { resolve, reject } = this.pendingRequests.get(msg.id);
            this.pendingRequests.delete(msg.id);
            if (msg.error) {
                reject(new Error(msg.error.message || 'JSON-RPC Error'));
            } else {
                resolve(msg.result);
            }
        }
    }

    send(payload) {
        const json = JSON.stringify(payload);
        const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
        this.process.stdin.write(header + json);
    }

    request(method, params) {
        const id = this.messageId++;
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.send({
                jsonrpc: '2.0',
                id,
                method,
                params
            });
        });
    }

    notify(method, params) {
        this.send({
            jsonrpc: '2.0',
            method,
            params
        });
    }

    close() {
        return new Promise((resolve) => {
            this.process.on('exit', () => resolve());
            this.process.kill();
        });
    }
}

async function runProtocolTests() {
    const serverPath = path.resolve(__dirname, '../language-server/bin/jawalang-language-server.js');
    const client = new LSPClient(serverPath);

    let docCounter = 1;
    async function openAndGetTokens(text) {
        const uri = pathToUri(path.resolve(__dirname, `test_st_${docCounter++}.jawa`));
        client.notify('textDocument/didOpen', {
            textDocument: {
                uri,
                languageId: 'jawalang',
                version: 1,
                text
            }
        });
        await new Promise(r => setTimeout(r, 60)); // allow indexing
        const res = await client.request('textDocument/semanticTokens/full', {
            textDocument: { uri }
        });
        const decoded = decodeSemanticTokens(res && res.data ? res.data : [], semanticTokensLegend);
        return { res, decoded, uri };
    }

    try {
        // 1. Initialize & verify semanticTokensProvider
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: pathToUri(path.resolve(__dirname, '..')),
            capabilities: {}
        });

        assert.ok(initResult.capabilities, 'Initialize must return capabilities');
        assert.ok(initResult.capabilities.semanticTokensProvider, 'Server must advertise semanticTokensProvider');
        const legend = initResult.capabilities.semanticTokensProvider.legend;
        assert.ok(legend, 'semanticTokensProvider must include legend');
        assert.ok(Array.isArray(legend.tokenTypes), 'Legend must have tokenTypes');
        assert.ok(Array.isArray(legend.tokenModifiers), 'Legend must have tokenModifiers');
        assert.strictEqual(initResult.capabilities.semanticTokensProvider.full, true);
        console.log('PASS [Protocol  1]: Initialize capability check (semanticTokensProvider & legend)');

        client.notify('initialized', {});

        // 2. Full request & basic keywords
        {
            const text = 'gawe x = 10\nbali x';
            const { res, decoded } = await openAndGetTokens(text);
            assert.ok(Array.isArray(res.data));
            const gaweTok = decoded.find(t => t.line === 0 && t.character === 0);
            const baliTok = decoded.find(t => t.line === 1 && t.character === 0);
            assert.ok(gaweTok && gaweTok.tokenType === 'keyword');
            assert.ok(baliTok && baliTok.tokenType === 'keyword');
            console.log('PASS [Protocol  2]: Basic keyword tokens');
        }

        // 3. Variables declaration and reference
        {
            const text = 'gawe total = 100\ntulis total';
            const { decoded } = await openAndGetTokens(text);
            const declTok = decoded.find(t => t.line === 0 && t.character === 5);
            const refTok = decoded.find(t => t.line === 1 && t.character === 6);
            assert.ok(declTok && declTok.tokenType === 'variable');
            assert.ok(refTok && refTok.tokenType === 'variable');
            console.log('PASS [Protocol  3]: Variable declaration and reference');
        }

        // 4. Function declaration and call
        {
            const text = 'guna hitung() {}\nhitung()';
            const { decoded } = await openAndGetTokens(text);
            const fnDecl = decoded.find(t => t.line === 0 && t.character === 5);
            const fnCall = decoded.find(t => t.line === 1 && t.character === 0);
            assert.ok(fnDecl && fnDecl.tokenType === 'function');
            assert.ok(fnCall && fnCall.tokenType === 'function');
            console.log('PASS [Protocol  4]: Function declaration and invocation');
        }

        // 5. Function parameters
        {
            const text = 'guna tambah(a, b) {\n    bali a + b\n}';
            const { decoded } = await openAndGetTokens(text);
            const p1Decl = decoded.find(t => t.line === 0 && t.character === 12);
            const p2Decl = decoded.find(t => t.line === 0 && t.character === 15);
            const p1Use = decoded.find(t => t.line === 1 && t.character === 9);
            const p2Use = decoded.find(t => t.line === 1 && t.character === 13);
            assert.ok(p1Decl && p1Decl.tokenType === 'parameter');
            assert.ok(p2Decl && p2Decl.tokenType === 'parameter');
            assert.ok(p1Use && p1Use.tokenType === 'parameter');
            assert.ok(p2Use && p2Use.tokenType === 'parameter');
            console.log('PASS [Protocol  5]: Function parameters and scope references');
        }

        // 6. Scope shadowing (parameter shadows global variable)
        {
            const text = 'gawe x = 100\nguna tes(x) {\n    tulis x\n}';
            const { decoded } = await openAndGetTokens(text);
            const globX = decoded.find(t => t.line === 0 && t.character === 5);
            const paramX = decoded.find(t => t.line === 1 && t.character === 9);
            const innerX = decoded.find(t => t.line === 2 && t.character === 10);
            assert.ok(globX && globX.tokenType === 'variable');
            assert.ok(paramX && paramX.tokenType === 'parameter');
            assert.ok(innerX && innerX.tokenType === 'parameter');
            console.log('PASS [Protocol  6]: Scope shadowing parameter vs global variable');
        }

        // 7. Struct declaration
        {
            const text = 'bentuk Mobil {\n    gawe merk\n}';
            const { decoded } = await openAndGetTokens(text);
            const structTok = decoded.find(t => t.line === 0 && t.character === 7);
            assert.ok(structTok && structTok.tokenType === 'class');
            console.log('PASS [Protocol  7]: Struct declaration classified as class');
        }

        // 8. Constructor wiwiti
        {
            const text = 'bentuk Mobil {\n    wiwiti(merk) {}\n}';
            const { decoded } = await openAndGetTokens(text);
            const ctorTok = decoded.find(t => t.line === 1 && t.character === 4);
            assert.ok(ctorTok && ctorTok.tokenType === 'method');
            console.log('PASS [Protocol  8]: Constructor wiwiti classified as method');
        }

        // 9. Methods in struct and invocation
        {
            const text = 'bentuk Mobil {\n    guna jalan() {}\n}\ngawe m = anyar Mobil()\nm.jalan()';
            const { decoded } = await openAndGetTokens(text);
            const mDecl = decoded.find(t => t.line === 1 && t.character === 9);
            const mCall = decoded.find(t => t.line === 4 && t.character === 2);
            assert.ok(mDecl && mDecl.tokenType === 'method');
            assert.ok(mCall && mCall.tokenType === 'method');
            console.log('PASS [Protocol  9]: Method declaration and call');
        }

        // 10. Properties on struct instance
        {
            const text = 'bentuk Mobil {\n    gawe warna\n}\ngawe m = anyar Mobil()\nm.warna = "biru"';
            const { decoded } = await openAndGetTokens(text);
            const propAccess = decoded.find(t => t.line === 4 && t.character === 2);
            assert.ok(propAccess && propAccess.tokenType === 'property');
            console.log('PASS [Protocol 10]: Property access on struct instance');
        }

        // 11. iki keyword and member access
        {
            const text = 'bentuk Mobil {\n    wiwiti(w) {\n        iki.warna = w\n    }\n}';
            const { decoded } = await openAndGetTokens(text);
            const ikiTok = decoded.find(t => t.line === 2 && t.character === 8);
            const propTok = decoded.find(t => t.line === 2 && t.character === 12);
            assert.ok(ikiTok && ikiTok.tokenType === 'keyword');
            assert.ok(propTok && propTok.tokenType === 'property');
            console.log('PASS [Protocol 11]: iki keyword and property access');
        }

        // 12. super keyword and inherited call
        {
            const text = 'bentuk Sub ngembangake Base {\n    guna aksi() {\n        super.aksi()\n    }\n}';
            const { decoded } = await openAndGetTokens(text);
            const superTok = decoded.find(t => t.line === 2 && t.character === 8);
            const callTok = decoded.find(t => t.line === 2 && t.character === 14);
            assert.ok(superTok && superTok.tokenType === 'keyword');
            assert.ok(callTok && callTok.tokenType === 'method');
            console.log('PASS [Protocol 12]: super keyword and inherited method call');
        }

        // 13. Inheritance ngembangake
        {
            const text = 'bentuk Anak ngembangake Induk {}';
            const { decoded } = await openAndGetTokens(text);
            const ngTok = decoded.find(t => t.line === 0 && t.character === 12);
            const indukTok = decoded.find(t => t.line === 0 && t.character === 24);
            assert.ok(ngTok && ngTok.tokenType === 'keyword');
            assert.ok(indukTok && indukTok.tokenType === 'class');
            console.log('PASS [Protocol 13]: Inheritance ngembangake keyword and parent class');
        }

        // 14. Namespace import and usage
        {
            const text = 'impor "./math.jawa" minangka math\nmath.tambah()';
            const { decoded } = await openAndGetTokens(text);
            const nsTok = decoded.find(t => t.line === 1 && t.character === 0);
            const fnTok = decoded.find(t => t.line === 1 && t.character === 5);
            assert.ok(nsTok && nsTok.tokenType === 'namespace');
            assert.ok(fnTok && fnTok.tokenType === 'function');
            console.log('PASS [Protocol 14]: Namespace import and member invocation');
        }

        // 15. Selective import
        {
            const text = 'impor { tambah } saka "./math.jawa"\ntambah(1, 2)';
            const { decoded } = await openAndGetTokens(text);
            const impFn = decoded.find(t => t.line === 0 && t.character === 8);
            const callFn = decoded.find(t => t.line === 1 && t.character === 0);
            assert.ok(impFn && impFn.tokenType === 'function');
            assert.ok(callFn && callFn.tokenType === 'function');
            console.log('PASS [Protocol 15]: Selective import');
        }

        // 16. Selective import with alias
        {
            const text = 'impor { kali minangka perkalian } saka "./math.jawa"\nperkalian(2, 3)';
            const { decoded } = await openAndGetTokens(text);
            const origTok = decoded.find(t => t.line === 0 && t.character === 8);
            const aliasTok = decoded.find(t => t.line === 0 && t.character === 22);
            const callTok = decoded.find(t => t.line === 1 && t.character === 0);
            assert.ok(origTok && origTok.tokenType === 'function');
            assert.ok(aliasTok && aliasTok.tokenType === 'function');
            assert.ok(callTok && callTok.tokenType === 'function');
            console.log('PASS [Protocol 16]: Selective import with alias');
        }

        // 17. Strings protected from inner tokens
        {
            const text = 'gawe pesan = "guna tambah(a, b) { bali a + b }"\ntulis pesan';
            const { decoded } = await openAndGetTokens(text);
            const strTok = decoded.find(t => t.line === 0 && t.character === 13);
            assert.ok(strTok && strTok.tokenType === 'string');
            // Inner code inside string should NOT generate function/parameter tokens on line 0
            const innerTokens = decoded.filter(t => t.line === 0 && t.character > 13);
            assert.strictEqual(innerTokens.length, 0, 'No tokens should be generated inside string literal');
            console.log('PASS [Protocol 17]: String literal isolation (no inner tokens)');
        }

        // 18. Comments protected from inner tokens
        {
            const text = '// bentuk Mobil { gawe ban }\nguna halo() {}';
            const { decoded } = await openAndGetTokens(text);
            const cmTok = decoded.find(t => t.line === 0 && t.character === 0);
            assert.ok(cmTok && cmTok.tokenType === 'comment');
            const line0Tokens = decoded.filter(t => t.line === 0);
            assert.strictEqual(line0Tokens.length, 1, 'Only comment token on line 0');
            console.log('PASS [Protocol 18]: Comment isolation (no inner tokens)');
        }

        // 19. Numbers and Decimals
        {
            const text = 'gawe a = 42\ngawe b = 3.14';
            const { decoded } = await openAndGetTokens(text);
            const numA = decoded.find(t => t.line === 0 && t.character === 9);
            const numB = decoded.find(t => t.line === 1 && t.character === 9);
            assert.ok(numA && numA.tokenType === 'number');
            assert.ok(numB && numB.tokenType === 'number');
            console.log('PASS [Protocol 19]: Number and decimal literals');
        }

        // 20. Operators
        {
            const text = 'gawe c = 1 + 2 * 3 == 7';
            const { decoded } = await openAndGetTokens(text);
            const opEq = decoded.find(t => t.line === 0 && t.character === 7);
            const opPlus = decoded.find(t => t.line === 0 && t.character === 11);
            const opMul = decoded.find(t => t.line === 0 && t.character === 15);
            const opEqEq = decoded.find(t => t.line === 0 && t.character === 19);
            assert.ok(opEq && opEq.tokenType === 'operator');
            assert.ok(opPlus && opPlus.tokenType === 'operator');
            assert.ok(opMul && opMul.tokenType === 'operator');
            assert.ok(opEqEq && opEqEq.tokenType === 'operator');
            console.log('PASS [Protocol 20]: Operator tokens');
        }

        // 21. Built-in functions with defaultLibrary
        {
            const text = 'gawe t = jinis(123)\ngawe l = dawa("abc")';
            const { decoded } = await openAndGetTokens(text);
            const jinisTok = decoded.find(t => t.line === 0 && t.character === 9);
            const dawaTok = decoded.find(t => t.line === 1 && t.character === 9);
            assert.ok(jinisTok && jinisTok.tokenType === 'function');
            assert.ok(jinisTok.modifiers & 2, 'jinis must have defaultLibrary modifier');
            assert.ok(dawaTok && dawaTok.tokenType === 'function');
            assert.ok(dawaTok.modifiers & 2, 'dawa must have defaultLibrary modifier');
            console.log('PASS [Protocol 21]: Built-in functions with defaultLibrary modifier');
        }

        // 22. Malformed / Incomplete document (resilience)
        {
            const text = 'guna incomplete(\n bentuk {\n gawe = ';
            const { res, decoded } = await openAndGetTokens(text);
            assert.ok(res && Array.isArray(res.data), 'Malformed source must not crash');
            assert.ok(Array.isArray(decoded));
            console.log('PASS [Protocol 22]: Malformed document resilience');
        }

        // 23. UTF-16 Unicode character positions
        {
            const text = 'gawe teks = "Halo \uD83D\uDE00 Dunia"\ntulis teks';
            const { decoded } = await openAndGetTokens(text);
            const strTok = decoded.find(t => t.line === 0 && t.character === 12);
            assert.ok(strTok && strTok.tokenType === 'string');
            const tulisTok = decoded.find(t => t.line === 1 && t.character === 0);
            assert.ok(tulisTok && tulisTok.tokenType === 'keyword');
            console.log('PASS [Protocol 23]: UTF-16 Unicode character positions');
        }

        // 24. Deterministic response
        {
            const text = 'guna foo(x, y) { bali x + y }\nfoo(10, 20)';
            const res1 = await openAndGetTokens(text);
            const res2 = await openAndGetTokens(text);
            assert.deepStrictEqual(res1.res.data, res2.res.data, 'Repeated requests must return identical tokens');
            console.log('PASS [Protocol 24]: Deterministic response across requests');
        }

        console.log('\n====================================================');
        console.log('  ALL SEMANTIC TOKENS PROTOCOL TESTS PASSED (24/24) ');
        console.log('====================================================\n');
    } finally {
        await client.close();
    }
}

runProtocolTests().catch((err) => {
    console.error('FATAL PROTOCOL TEST FAILURE:', err);
    process.exit(1);
});
