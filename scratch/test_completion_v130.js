/**
 * Jawalang V1.3.0 — Phase 5: Completion V2 Protocol Integration Suite
 *
 * Verifies textDocument/completion over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testCompletionUnit = require('../language-server/test/completion.test');

console.log('====================================================');
console.log('    JAWALANG V1.3.0 — COMPLETION V2 VALIDATION     ');
console.log('====================================================\n');

// 1. Run Unit Scenarios
console.log('--- Step 1: Running Completion Unit Suite (40 Scenarios) ---');
testCompletionUnit();

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

    sendRequest(method, params) {
        const id = this.messageId++;
        const message = {
            jsonrpc: '2.0',
            id,
            method,
            params
        };
        const body = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`;

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.process.stdin.write(header + body);
        });
    }

    sendNotification(method, params) {
        const message = {
            jsonrpc: '2.0',
            method,
            params
        };
        const body = JSON.stringify(message);
        const header = `Content-Length: ${Buffer.byteLength(body, 'utf8')}\r\n\r\n`;
        this.process.stdin.write(header + body);
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
        // Test 1: Initialize
        const initResult = await client.sendRequest('initialize', {
            processId: process.pid,
            rootUri: 'file:///' + __dirname.replace(/\\/g, '/'),
            capabilities: {}
        });
        assert.ok(initResult && initResult.capabilities);
        console.log('PASS [Protocol 1]: Server initializes successfully');

        // Test 2: Capability check
        assert.ok(initResult.capabilities.completionProvider, 'Server must advertise completionProvider');
        assert.ok(initResult.capabilities.completionProvider.triggerCharacters.includes('.'), 'Trigger characters must include "."');
        console.log('PASS [Protocol 2]: Server advertises completionProvider with trigger characters');

        client.sendNotification('initialized', {});

        // Test 3: Global Completion
        const uri1 = 'file:///protocol_comp_global.jawa';
        const doc1 = 'gawe globalSiji = 100\ngawe globalLoro = 200\nglo';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri1, languageId: 'jawalang', version: 1, text: doc1 }
        });
        const comp1 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri1 },
            position: { line: 2, character: 3 }
        });
        assert.ok(Array.isArray(comp1) && comp1.some(it => it.label === 'globalSiji'));
        console.log('PASS [Protocol 3]: Global scope completion via JSON-RPC');

        // Test 4: Local Scope Completion
        const uri2 = 'file:///protocol_comp_local.jawa';
        const doc2 = 'guna petung() {\n    gawe lokalVar = 42\n    lok\n}';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri2, languageId: 'jawalang', version: 1, text: doc2 }
        });
        const comp2 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri2 },
            position: { line: 2, character: 7 }
        });
        assert.ok(Array.isArray(comp2) && comp2.some(it => it.label === 'lokalVar'));
        console.log('PASS [Protocol 4]: Local scope completion inside function');

        // Test 5: Function Completion with detail
        const uri3 = 'file:///protocol_comp_fn.jawa';
        const doc3 = 'guna tambah(a, b) { bali a + b }\ntam';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri3, languageId: 'jawalang', version: 1, text: doc3 }
        });
        const comp3 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri3 },
            position: { line: 1, character: 3 }
        });
        const fnItem = comp3.find(it => it.label === 'tambah');
        assert.ok(fnItem && fnItem.kind === 3 && fnItem.detail.includes('tambah(a, b)'));
        console.log('PASS [Protocol 5]: Function completion with signature detail');

        // Test 6: Struct Completion
        const uri4 = 'file:///protocol_comp_struct.jawa';
        const doc4 = 'bentuk Wong { gawe jeneng = "" }\nWo';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri4, languageId: 'jawalang', version: 1, text: doc4 }
        });
        const comp4 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri4 },
            position: { line: 1, character: 2 }
        });
        const sItem = comp4.find(it => it.label === 'Wong');
        assert.ok(sItem && sItem.kind === 7);
        console.log('PASS [Protocol 6]: Struct completion with class kind');

        // Test 7: Dot Member Completion
        const uri5 = 'file:///protocol_comp_dot.jawa';
        const doc5 = 'bentuk Titik {\n    gawe x = 0\n    guna obah() {}\n}\ngawe t = anyar Titik()\nt.';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri5, languageId: 'jawalang', version: 1, text: doc5 }
        });
        const comp5 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri5 },
            position: { line: 5, character: 2 }
        });
        const labels5 = comp5.map(it => it.label);
        assert.ok(labels5.includes('x') && labels5.includes('obah'));
        console.log('PASS [Protocol 7]: Dot member completion on struct instance');

        // Test 8: Namespace Completion
        const callerPath = path.resolve(__dirname, '../language-server/test/fixtures/modules/caller.jawa');
        const uri6 = 'file:///' + callerPath.replace(/\\/g, '/');
        const doc6 = 'impor "./math" minangka math\nmath.';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri6, languageId: 'jawalang', version: 1, text: doc6 }
        });
        const comp6 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri6 },
            position: { line: 1, character: 5 }
        });
        const labels6 = comp6.map(it => it.label);
        assert.ok(labels6.includes('tambah') && labels6.includes('PI') && !labels6.includes('rahasia'));
        console.log('PASS [Protocol 8]: Module namespace exported member completion');

        // Test 9: Selective Import Completion
        const uri7 = 'file:///' + callerPath.replace(/\\/g, '/') + '_sel.jawa';
        const doc7 = 'impor { tambah } saka "./math"\ntam';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri7, languageId: 'jawalang', version: 1, text: doc7 }
        });
        const comp7 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri7 },
            position: { line: 1, character: 3 }
        });
        const labels7 = comp7.map(it => it.label);
        assert.ok(labels7.includes('tambah') && !labels7.includes('kurang'));
        console.log('PASS [Protocol 9]: Selective import symbol completion');

        // Test 10: Import Alias Completion
        const uri8 = 'file:///' + callerPath.replace(/\\/g, '/') + '_alias.jawa';
        const doc8 = 'impor { tambah minangka jumlah } saka "./math"\nju';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri8, languageId: 'jawalang', version: 1, text: doc8 }
        });
        const comp8 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri8 },
            position: { line: 1, character: 2 }
        });
        const labels8 = comp8.map(it => it.label);
        assert.ok(labels8.includes('jumlah') && !labels8.includes('tambah'));
        console.log('PASS [Protocol 10]: Import alias completion resolution');

        // Test 11: Inheritance Member Completion
        const uri9 = 'file:///protocol_comp_inherit.jawa';
        const doc9 = 'bentuk Induk { gawe asal = "" }\nbentuk Anak ngembangake Induk { gawe nama = "" }\ngawe a = anyar Anak()\na.';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri9, languageId: 'jawalang', version: 1, text: doc9 }
        });
        const comp9 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri9 },
            position: { line: 3, character: 2 }
        });
        const labels9 = comp9.map(it => it.label);
        assert.ok(labels9.includes('asal') && labels9.includes('nama'));
        console.log('PASS [Protocol 11]: Inherited struct member completion');

        // Test 12: Super Member Completion
        const uri10 = 'file:///protocol_comp_super.jawa';
        const doc10 = 'bentuk Induk { guna salam() {} }\nbentuk Anak ngembangake Induk {\n    guna salam(x) {}\n    guna test() {\n        super.\n    }\n}';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri10, languageId: 'jawalang', version: 1, text: doc10 }
        });
        const comp10 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri10 },
            position: { line: 4, character: 14 }
        });
        const superItem = comp10.find(it => it.label === 'salam');
        assert.ok(superItem && superItem.detail === 'guna salam()');
        console.log('PASS [Protocol 12]: super. member completion resolves parent implementation');

        // Test 13: Malformed Document Resilience
        const uri11 = 'file:///protocol_comp_malformed.jawa';
        const doc11 = 'guna rusak(\n';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri11, languageId: 'jawalang', version: 1, text: doc11 }
        });
        const comp11 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri11 },
            position: { line: 1, character: 0 }
        });
        assert.ok(Array.isArray(comp11));
        console.log('PASS [Protocol 13]: Malformed document handles gracefully without crash');

        // Test 14: String & Comment Safety
        const uri12 = 'file:///protocol_comp_safety.jawa';
        const doc12 = 'tulis "nam\n// nam';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri12, languageId: 'jawalang', version: 1, text: doc12 }
        });
        const compStr = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri12 },
            position: { line: 0, character: 10 }
        });
        const compComm = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri12 },
            position: { line: 1, character: 6 }
        });
        assert.strictEqual(compStr.length, 0);
        assert.strictEqual(compComm.length, 0);
        console.log('PASS [Protocol 14]: Zero completions inside string and comment');

        // Test 15: Completion Range & TextEdit
        const uri13 = 'file:///protocol_comp_range.jawa';
        const doc13 = 'gawe namaPanjang = "Budi"\nnam';
        client.sendNotification('textDocument/didOpen', {
            textDocument: { uri: uri13, languageId: 'jawalang', version: 1, text: doc13 }
        });
        const comp13 = await client.sendRequest('textDocument/completion', {
            textDocument: { uri: uri13 },
            position: { line: 1, character: 3 }
        });
        const target = comp13.find(it => it.label === 'namaPanjang');
        assert.ok(target && target.textEdit);
        assert.deepStrictEqual(target.textEdit.range, {
            start: { line: 1, character: 0 },
            end: { line: 1, character: 3 }
        });
        console.log('PASS [Protocol 15]: Accurate textEdit completion replacement range');

        // Shutdown & Exit
        await client.sendRequest('shutdown', {});
        client.sendNotification('exit', {});
        await client.close();

        console.log('\n====================================================');
        console.log('  ALL COMPLETION PROTOCOL TESTS PASSED (15/15)     ');
        console.log('====================================================\n');
    } catch (err) {
        console.error('Test failed with error:', err);
        await client.close();
        process.exit(1);
    }
}

runProtocolTests();
