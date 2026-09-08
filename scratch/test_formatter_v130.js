/**
 * Jawalang V1.3.0 — Phase 6: Formatting Protocol Integration Suite
 *
 * Verifies textDocument/formatting over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testFormatterUnit = require('../language-server/test/formatter.test');

console.log('====================================================');
console.log('      JAWALANG V1.3.0 — FORMATTING VALIDATION       ');
console.log('====================================================\n');

// 1. Run Unit Scenarios
console.log('--- Step 1: Running Formatter Unit Suite ---');
testFormatterUnit();

// 2. Protocol-Level Integration Test via JSON-RPC over stdio
console.log('\n--- Step 2: Protocol-Level JSON-RPC stdio Tests ---');

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

    try {
        // Scenario 1: Initialize and verify formattingProvider capability
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: 'file:///c:/Jawalang',
            capabilities: {}
        });

        assert.ok(initResult.capabilities, 'Initialize must return server capabilities');
        assert.strictEqual(initResult.capabilities.formattingProvider, true, 'Server must advertise formattingProvider: true');
        console.log('PASS [Protocol  1]: Initialize capability check (formattingProvider: true)');

        client.notify('initialized', {});

        let docCounter = 1;
        async function openAndFormat(text, options = { tabSize: 4, insertSpaces: true }) {
            const uri = `file:///c:/Jawalang/test_format_${docCounter++}.jawa`;
            client.notify('textDocument/didOpen', {
                textDocument: {
                    uri,
                    languageId: 'jawalang',
                    version: 1,
                    text
                }
            });
            await new Promise(r => setTimeout(r, 60)); // allow indexing
            const edits = await client.request('textDocument/formatting', {
                textDocument: { uri },
                options
            });
            return edits;
        }

        function applyEdits(text, edits) {
            if (!edits || edits.length === 0) return text;
            return edits[0].newText;
        }

        // Scenario 2: Basic function formatting
        {
            const text = 'guna tambah(a,b){\nbali a+b\n}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'guna tambah(a, b) {\n    bali a + b\n}');
            console.log('PASS [Protocol  2]: Basic function formatting');
        }

        // Scenario 3: Nested blocks formatting
        {
            const text = 'guna uji(){\nyen bener{\nnalika bener{\ntulis "ok"\n}\n}\n}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            const formatted = applyEdits(text, edits);
            assert.ok(formatted.includes('        nalika bener {\n            tulis "ok"'));
            console.log('PASS [Protocol  3]: Nested blocks formatting');
        }

        // Scenario 4: Operators spacing
        {
            const text = 'gawe x=10+20*30-40/5\ngawe y=-x';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'gawe x = 10 + 20 * 30 - 40 / 5\ngawe y = -x');
            console.log('PASS [Protocol  4]: Binary and unary operators spacing');
        }

        // Scenario 5: Arrays inline
        {
            const text = 'gawe arr=[1,2,[3,4]]';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'gawe arr = [1, 2, [3, 4]]');
            console.log('PASS [Protocol  5]: Array literals inline');
        }

        // Scenario 6: Object literals multiline on assignment
        {
            const text = 'gawe siswa={"nama":"Barch","umur":20}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'gawe siswa = {\n    "nama": "Barch",\n    "umur": 20\n}');
            console.log('PASS [Protocol  6]: Objects multiline formatting');
        }

        // Scenario 7: Struct definition
        {
            const text = 'bentuk Wong{\ngawe jeneng\n\nguna salam(){\ntulis iki.jeneng\n}\n}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'bentuk Wong {\n    gawe jeneng\n\n    guna salam() {\n        tulis iki.jeneng\n    }\n}');
            console.log('PASS [Protocol  7]: Struct definition and method formatting');
        }

        // Scenario 8: Inheritance ngembangake
        {
            const text = 'bentuk Anak ngembangake Induk{\nwiwiti(nama,umur){\nsuper(nama)\niki.umur=umur\n}\n}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            const expected = 'bentuk Anak ngembangake Induk {\n    wiwiti(nama, umur) {\n        super(nama)\n        iki.umur = umur\n    }\n}';
            assert.strictEqual(applyEdits(text, edits), expected);
            console.log('PASS [Protocol  8]: Inheritance ngembangake and constructor formatting');
        }

        // Scenario 9: Super call and invocations
        {
            const text = 'super(nama)\nsuper.salam()';
            const edits = await openAndFormat(text);
            // Already formatted or no spacing change needed
            const formatted = applyEdits(text, edits);
            assert.strictEqual(formatted, 'super(nama)\nsuper.salam()');
            console.log('PASS [Protocol  9]: Super call and method invocation formatting');
        }

        // Scenario 10: Namespace import and usage
        {
            const text = 'impor "./math.jawa" minangka math\ngawe x=math.tambah(1,2)';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), 'impor "./math.jawa" minangka math\ngawe x = math.tambah(1, 2)');
            console.log('PASS [Protocol 10]: Namespace import and member call');
        }

        // Scenario 11: Comments preservation
        {
            const text = '// Header\ngawe x=10 // inline\n// Footer';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.strictEqual(applyEdits(text, edits), '// Header\ngawe x = 10 // inline\n// Footer');
            console.log('PASS [Protocol 11]: Standalone and trailing comments preserved');
        }

        // Scenario 12: Strings verbatim
        {
            const text = 'tulis "a+b=c"';
            const edits = await openAndFormat(text);
            const formatted = applyEdits(text, edits);
            assert.strictEqual(formatted, 'tulis "a+b=c"');
            console.log('PASS [Protocol 12]: String contents preserved verbatim');
        }

        // Scenario 13: Malformed source unclosed quote safe return []
        {
            const text = 'gawe x = "unclosed';
            const edits = await openAndFormat(text);
            assert.deepStrictEqual(edits, [], 'Malformed code must return []');
            console.log('PASS [Protocol 13]: Malformed unclosed string returns [] safely');
        }

        // Scenario 14: CRLF line endings preserved
        {
            const text = 'guna foo(){\r\nbali 10\r\n}';
            const edits = await openAndFormat(text);
            assert.ok(edits && edits.length > 0);
            assert.ok(edits[0].newText.includes('\r\n'), 'Output must preserve CRLF line endings');
            console.log('PASS [Protocol 14]: CRLF line endings preserved');
        }

        // Scenario 15: Idempotency over protocol
        {
            const text = 'guna tambah(a,b){\nyen a>10{\nbali a+b\n}liyane{\nbali 0\n}\n}';
            const edits1 = await openAndFormat(text);
            const pass1 = applyEdits(text, edits1);
            const edits2 = await openAndFormat(pass1);
            assert.deepStrictEqual(edits2, [], 'Formatting already-formatted code must return []');
            console.log('PASS [Protocol 15]: Protocol-level idempotency and no-op empty edits');
        }

        // Scenario 16: Empty document returns []
        {
            const text = '';
            const edits = await openAndFormat(text);
            assert.deepStrictEqual(edits, [], 'Empty document must return []');
            console.log('PASS [Protocol 16]: Empty document returns []');
        }

        console.log('\n====================================================');
        console.log('  ALL FORMATTER PROTOCOL TESTS PASSED (16/16)       ');
        console.log('====================================================');
    } finally {
        await client.close();
    }
}

runProtocolTests().catch((err) => {
    console.error('\nPROTOCOL TEST FAILED:');
    console.error(err);
    process.exit(1);
});
