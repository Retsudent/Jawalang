/**
 * Jawalang V1.3.0 — Phase 4: Signature Help Protocol Integration Suite
 *
 * Verifies textDocument/signatureHelp over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testSignatureHelpUnit = require('../language-server/test/signatureHelp.test');

console.log('====================================================');
console.log('    JAWALANG V1.3.0 — SIGNATURE HELP VALIDATION     ');
console.log('====================================================\n');

// 1. Run Unit Scenarios
console.log('--- Step 1: Running Signature Help Unit Suite ---');
testSignatureHelpUnit();

// 2. Protocol-Level Integration Test via JSON-RPC over stdio
console.log('--- Step 2: Protocol-Level JSON-RPC stdio Tests ---');

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
    const serverPath = path.resolve(__dirname, '..', 'language-server', 'bin', 'jawalang-language-server.js');
    const client = new LSPClient(serverPath);

    try {
        // 1. Initialize
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: 'file:///' + path.resolve(__dirname, '..').replace(/\\/g, '/'),
            capabilities: {}
        });

        assert.ok(initResult.capabilities, 'Expected capabilities in init response');
        assert.ok(initResult.capabilities.signatureHelpProvider, 'Expected signatureHelpProvider capability');
        assert.deepStrictEqual(initResult.capabilities.signatureHelpProvider.triggerCharacters, ['(', ',']);
        console.log('PASS [Protocol 1]: Server advertises signatureHelpProvider capability with trigger characters');

        client.notify('initialized', {});

        // 2. Open document with function and call
        const uri1 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_basic.jawa').replace(/\\/g, '/');
        const doc1Text = [
            'guna tambah(a, b) {',
            '    bali a + b',
            '}',
            'tambah(',
            'tambah(10, '
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri1,
                languageId: 'jawalang',
                version: 1,
                text: doc1Text
            }
        });

        // 3. Basic function signature help at tambah(
        const sig1 = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri1 },
            position: { line: 3, character: 7 }
        });
        assert.ok(sig1, 'Expected signature help for tambah(');
        assert.strictEqual(sig1.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig1.signatures[0].parameters.length, 2);
        assert.strictEqual(sig1.activeParameter, 0);
        console.log('PASS [Protocol 2]: Basic function signature help');

        // 4. Active parameter 1 at tambah(10,
        const sig2 = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri1 },
            position: { line: 4, character: 11 }
        });
        assert.ok(sig2);
        assert.strictEqual(sig2.signatures[0].label, 'tambah(a, b)');
        assert.strictEqual(sig2.activeParameter, 1);
        console.log('PASS [Protocol 3]: Active parameter 1 after comma');

        // 5. Nested call resolution
        const uri2 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_nested.jawa').replace(/\\/g, '/');
        const doc2Text = [
            'guna tambah(a, b) { bali a + b }',
            'guna kali(x, y) { bali x * y }',
            'kali(tambah(10, 20), '
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri2,
                languageId: 'jawalang',
                version: 1,
                text: doc2Text
            }
        });

        const sigNested = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri2 },
            position: { line: 2, character: 21 }
        });
        assert.ok(sigNested);
        assert.strictEqual(sigNested.signatures[0].label, 'kali(x, y)');
        assert.strictEqual(sigNested.activeParameter, 1);
        console.log('PASS [Protocol 4]: Nested call argument resolves to outer call');

        // 6. Struct method call
        const uri3 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_struct.jawa').replace(/\\/g, '/');
        const doc3Text = [
            'bentuk Mobil {',
            '    guna mlaku(kecepatan, wektu) {',
            '        tulis kecepatan',
            '    }',
            '}',
            'gawe m = anyar Mobil()',
            'm.mlaku('
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri3,
                languageId: 'jawalang',
                version: 1,
                text: doc3Text
            }
        });

        const sigMethod = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri3 },
            position: { line: 6, character: 8 }
        });
        assert.ok(sigMethod);
        assert.strictEqual(sigMethod.signatures[0].label, 'mlaku(kecepatan, wektu)');
        assert.strictEqual(sigMethod.activeParameter, 0);
        console.log('PASS [Protocol 5]: Struct method signature help');

        // 7. Constructor invocation
        const uri4 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_ctor.jawa').replace(/\\/g, '/');
        const doc4Text = [
            'bentuk Wong {',
            '    guna wiwiti(nama, umur) {}',
            '}',
            'gawe w = anyar Wong('
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri4,
                languageId: 'jawalang',
                version: 1,
                text: doc4Text
            }
        });

        const sigCtor = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri4 },
            position: { line: 3, character: 20 }
        });
        assert.ok(sigCtor);
        assert.strictEqual(sigCtor.signatures[0].label, 'Wong(nama, umur)');
        assert.strictEqual(sigCtor.signatures[0].parameters.length, 2);
        console.log('PASS [Protocol 6]: Constructor anyar StructName(params)');

        // 8. Super constructor inside subclass wiwiti
        const uri5 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_super.jawa').replace(/\\/g, '/');
        const doc5Text = [
            'bentuk Induk {',
            '    guna wiwiti(label) {}',
            '}',
            'bentuk Anak ngembangake Induk {',
            '    guna wiwiti(label, id) {',
            '        super(',
            '    }',
            '}'
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri5,
                languageId: 'jawalang',
                version: 1,
                text: doc5Text
            }
        });

        const sigSuper = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri5 },
            position: { line: 5, character: 14 }
        });
        assert.ok(sigSuper);
        assert.strictEqual(sigSuper.signatures[0].label, 'super(label)');
        console.log('PASS [Protocol 7]: Super constructor call inside subclass wiwiti');

        // 9. Built-in function
        const uri6 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_builtin.jawa').replace(/\\/g, '/');
        const doc6Text = 'dawa(';

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri6,
                languageId: 'jawalang',
                version: 1,
                text: doc6Text
            }
        });

        const sigBuiltin = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri6 },
            position: { line: 0, character: 5 }
        });
        assert.ok(sigBuiltin);
        assert.strictEqual(sigBuiltin.signatures[0].label, 'dawa(koleksi)');
        assert.ok(sigBuiltin.signatures[0].documentation);
        console.log('PASS [Protocol 8]: Built-in function dawa provides signature & docs');

        // 10. Namespace function call
        const uri7 = 'file:///' + path.resolve(__dirname, '..', 'language-server', 'test', 'fixtures', 'modules', 'consumer_ns.jawa').replace(/\\/g, '/');
        const doc7Text = [
            'impor "./math" minangka math',
            'math.kurang('
        ].join('\n');

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri7,
                languageId: 'jawalang',
                version: 1,
                text: doc7Text
            }
        });

        const sigNs = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri7 },
            position: { line: 1, character: 12 }
        });
        assert.ok(sigNs);
        assert.strictEqual(sigNs.signatures[0].label, 'kurang(a, b)');
        console.log('PASS [Protocol 9]: Module namespace function call');

        // 11. Unknown function call returns null
        const uri8 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_unknown.jawa').replace(/\\/g, '/');
        const doc8Text = 'oraDikenal(';

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri8,
                languageId: 'jawalang',
                version: 1,
                text: doc8Text
            }
        });

        const sigUnknown = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri8 },
            position: { line: 0, character: 11 }
        });
        assert.strictEqual(sigUnknown, null);
        console.log('PASS [Protocol 10]: Unknown function returns null');

        // 12. Cursor outside call returns null
        const uri9 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_outside.jawa').replace(/\\/g, '/');
        const doc9Text = 'gawe x = 10\ntulis x';

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri9,
                languageId: 'jawalang',
                version: 1,
                text: doc9Text
            }
        });

        const sigOutside = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri9 },
            position: { line: 1, character: 0 }
        });
        assert.strictEqual(sigOutside, null);
        console.log('PASS [Protocol 11]: Cursor outside function call returns null');

        // 13. Malformed document safety
        const uri10 = 'file:///' + path.resolve(__dirname, '..', 'examples', 'test_sig_malformed.jawa').replace(/\\/g, '/');
        const doc10Text = 'gawe = @#$%% (\n(((***';

        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: uri10,
                languageId: 'jawalang',
                version: 1,
                text: doc10Text
            }
        });

        const sigMalformed = await client.request('textDocument/signatureHelp', {
            textDocument: { uri: uri10 },
            position: { line: 0, character: 10 }
        });
        assert.strictEqual(sigMalformed, null);
        console.log('PASS [Protocol 12]: Malformed source handles gracefully without server crash');

        // 14. Shutdown & exit
        const shutdownResult = await client.request('shutdown', {});
        assert.strictEqual(shutdownResult, null);
        client.notify('exit', {});
        console.log('PASS [Protocol 13]: Shutdown and exit completed cleanly');

        await client.close();

        console.log('\n====================================================');
        console.log('  ALL SIGNATURE HELP PROTOCOL TESTS PASSED (13/13)  ');
        console.log('====================================================\n');
    } catch (err) {
        console.error('PROTOCOL TEST FAILED:', err);
        await client.close();
        process.exit(1);
    }
}

runProtocolTests();
