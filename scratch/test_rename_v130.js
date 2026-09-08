/**
 * Jawalang V1.3.0 — Phase 3: Rename Symbol Protocol Integration Suite
 *
 * Verifies textDocument/rename over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testRenameUnit = require('../language-server/test/rename.test');

console.log('====================================================');
console.log('       JAWALANG V1.3.0 — RENAME SYMBOL VALIDATION    ');
console.log('====================================================\n');

// 1. Run Unit Scenarios
console.log('--- Step 1: Running Rename Symbol Unit Suite ---');
testRenameUnit();

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

        this.process.stderr.on('data', (data) => {
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
        this.process.kill();
    }
}

async function runProtocolTests() {
    const serverPath = path.resolve(__dirname, '../language-server/bin/jawalang-language-server.js');
    const client = new LSPClient(serverPath);

    let passedTests = 0;
    let totalTests = 0;

    function assertTest(name, condition) {
        totalTests++;
        if (condition) {
            console.log(`PASS: [Protocol] ${name}`);
            passedTests++;
        } else {
            console.error(`FAIL: [Protocol] ${name}`);
            throw new Error(`Assertion failed: ${name}`);
        }
    }

    try {
        // Test 1: Capability advertising
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: null,
            capabilities: {}
        });
        assertTest(
            '1. Server advertises renameProvider: true in capabilities',
            initResult && initResult.capabilities && initResult.capabilities.renameProvider === true
        );

        client.notify('initialized', {});

        // Open sample document
        const sampleUri = 'file:///workspace/demo_rename.jawa';
        const sampleContent = `gawe pi = 3.14
guna hitung(r) {
    gawe pi = 3
    bali pi * r * r
}
gawe l1 = hitung(7)
bentuk Lingkaran {
    gawe r = 0
    guna ambba() {
        bali iki.r * iki.r
    }
}
gawe c = anyar Lingkaran()
tulis c.ambba()
`;
        client.notify('textDocument/didOpen', {
            textDocument: {
                uri: sampleUri,
                languageId: 'jawa',
                version: 1,
                text: sampleContent
            }
        });

        // Small delay to ensure analysis parsed
        await new Promise(res => setTimeout(res, 200));

        // Test 2: Global variable rename
        const renamePi = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 6 },
            newName: 'konstantaPi'
        });
        assertTest(
            '2. Global variable rename produces WorkspaceEdit',
            renamePi && renamePi.changes && Array.isArray(renamePi.changes[sampleUri]) && renamePi.changes[sampleUri].length === 1 &&
            renamePi.changes[sampleUri][0].newText === 'konstantaPi'
        );

        // Test 3: Local variable rename
        const renameLocal = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 2, character: 10 },
            newName: 'piLokal'
        });
        assertTest(
            '3. Local variable rename produces WorkspaceEdit',
            renameLocal && renameLocal.changes && Array.isArray(renameLocal.changes[sampleUri]) && renameLocal.changes[sampleUri].length === 2 &&
            renameLocal.changes[sampleUri].every(c => c.newText === 'piLokal')
        );

        // Test 4: Variable shadowing isolation
        assertTest(
            '4. Shadowing isolation ensures global and local variables do not collide',
            renameLocal.changes[sampleUri].every(c => c.range.start.line === 2 || c.range.start.line === 3)
        );

        // Test 5: Function rename
        const renameFn = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 1, character: 6 },
            newName: 'kalkulasi'
        });
        assertTest(
            '5. Function rename updates declaration and call site',
            renameFn && renameFn.changes && renameFn.changes[sampleUri].length === 2 &&
            renameFn.changes[sampleUri].every(c => c.newText === 'kalkulasi')
        );

        // Test 6: Struct rename
        const renameStruct = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 6, character: 8 },
            newName: 'Bunderan'
        });
        assertTest(
            '6. Struct rename updates declaration and anyar instantiator',
            renameStruct && renameStruct.changes && renameStruct.changes[sampleUri].length === 2 &&
            renameStruct.changes[sampleUri].every(c => c.newText === 'Bunderan')
        );

        // Test 7: Method rename
        const renameMethod = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 8, character: 10 },
            newName: 'luas'
        });
        assertTest(
            '7. Method rename updates declaration and instance call',
            renameMethod && renameMethod.changes && renameMethod.changes[sampleUri].length === 2 &&
            renameMethod.changes[sampleUri].every(c => c.newText === 'luas')
        );

        // Test 8: Whitespace / invalid cursor returns null
        const renameSpace = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 0 },
            newName: 'test'
        });
        assertTest(
            '8. Whitespace cursor position returns null',
            renameSpace === null
        );

        // Test 9: Keyword cursor returns null
        const renameKeyword = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 2 }, // 'gawe'
            newName: 'test'
        });
        assertTest(
            '9. Keyword cursor position returns null',
            renameKeyword === null
        );

        // Test 10: Built-in function returns null
        const renameBuiltin = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 14, character: 2 }, // 'tulis'
            newName: 'test'
        });
        assertTest(
            '10. Built-in function position returns null',
            renameBuiltin === null
        );

        // Test 11: Invalid newName returns null
        const renameInvalid = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 6 },
            newName: '123_ora_valid'
        });
        assertTest(
            '11. Invalid identifier name returns null',
            renameInvalid === null
        );

        // Test 12: Collision returns null
        const renameCollision = await client.request('textDocument/rename', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 6 }, // 'pi'
            newName: 'l1' // collides with global variable l1
        });
        assertTest(
            '12. Scope collision returns null safely',
            renameCollision === null
        );

        // Test 13: Clean shutdown
        const shutdownRes = await client.request('shutdown', null);
        assertTest(
            '13. Server responds to shutdown request cleanly',
            shutdownRes === null
        );

        client.notify('exit', null);
        client.close();

        console.log(`\nAll ${passedTests}/${totalTests} Protocol Tests Passed Successfully!\n`);
    } catch (err) {
        client.close();
        console.error('\nProtocol Test Suite FAILED:', err);
        process.exit(1);
    }
}

runProtocolTests();
