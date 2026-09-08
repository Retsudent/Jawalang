/**
 * Jawalang V1.3.0 — Phase 2: Find References Protocol Integration Suite
 * 
 * Verifies textDocument/references over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testReferencesUnit = require('../language-server/test/references.test');

console.log('====================================================');
console.log('    JAWALANG V1.3.0 — FIND REFERENCES VALIDATION    ');
console.log('====================================================\n');

// 1. Run All 22 Unit Scenarios
console.log('--- Step 1: Running References Unit Suite ---');
testReferencesUnit();
console.log('All 22 References Unit Scenarios Passed!\n');

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
            // console.error('[Server Error Output]:', data.toString());
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
        // Test 1: initialize returns referencesProvider: true
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: null,
            capabilities: {}
        });
        assertTest(
            'Server advertises referencesProvider: true in capabilities',
            initResult && initResult.capabilities && initResult.capabilities.referencesProvider === true
        );

        client.notify('initialized', {});

        // Open sample document
        const sampleUri = 'file:///workspace/demo_references.jawa';
        const sampleContent = `gawe pi = 3.14
guna hitung(r) {
    bali pi * r * r
}
gawe l1 = hitung(7)
gawe l2 = hitung(14)
bentuk Lingkaran {
    gawe r = 0
    guna ambba() {
        bali hitung(iki.r)
    }
}
gawe c = anyar Lingkaran()
c.r = 10
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

        // Test 2: Find References on global variable 'pi'
        // Line 0, char 6 -> 'pi'
        const refsPi = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 6 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on variable "pi" returns decl + usage in hitung()', 
            Array.isArray(refsPi) && refsPi.length === 2 && refsPi[0].range.start.line === 0 && refsPi[1].range.start.line === 2
        );

        // Test 3: Find References on variable 'pi' without declaration
        const refsPiNoDecl = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 6 },
            context: { includeDeclaration: false }
        });
        assertTest('Find References on variable "pi" with includeDeclaration: false returns only 1 usage', 
            Array.isArray(refsPiNoDecl) && refsPiNoDecl.length === 1 && refsPiNoDecl[0].range.start.line === 2
        );

        // Test 4: Find References on function 'hitung' from declaration
        // Line 1, char 6 -> 'hitung'
        const refsHitung = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 1, character: 6 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on function "hitung" returns decl + 3 call sites', 
            Array.isArray(refsHitung) && refsHitung.length === 4
        );

        // Test 5: Find References on function 'hitung' from call site
        // Line 4, char 12 -> 'hitung(7)'
        const refsHitungCall = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 4, character: 12 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References triggered from call site returns all 4 references', 
            Array.isArray(refsHitungCall) && refsHitungCall.length === 4
        );

        // Test 6: Find References on parameter 'r' inside function hitung
        // Line 1, char 12 -> 'r'
        const refsParamR = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 1, character: 12 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on function parameter "r" returns decl + 2 usages', 
            Array.isArray(refsParamR) && refsParamR.length === 3
        );

        // Test 7: Find References on struct 'Lingkaran'
        // Line 6, char 8 -> 'Lingkaran'
        const refsStruct = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 6, character: 8 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on struct "Lingkaran" returns decl + anyar site', 
            Array.isArray(refsStruct) && refsStruct.length === 2
        );

        // Test 8: Find References on method 'ambba'
        // Line 8, char 10 -> 'ambba'
        const refsMethod = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 8, character: 10 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on method "ambba" returns decl + call site', 
            Array.isArray(refsMethod) && refsMethod.length === 2 && refsMethod[0].range.start.line === 8 && refsMethod[1].range.start.line === 14
        );

        // Test 9: Find References on unknown symbol returns []
        const refsUnknown = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 30 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on unknown position returns []', 
            Array.isArray(refsUnknown) && refsUnknown.length === 0
        );

        // Test 10: Find References on keyword 'gawe' returns []
        const refsKeyword = await client.request('textDocument/references', {
            textDocument: { uri: sampleUri },
            position: { line: 0, character: 1 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on keyword "gawe" returns [] without error', 
            Array.isArray(refsKeyword) && refsKeyword.length === 0
        );

        // Test 11: Find References on non-opened document URI returns []
        const refsNonOpened = await client.request('textDocument/references', {
            textDocument: { uri: 'file:///workspace/ora_ana.jawa' },
            position: { line: 0, character: 0 },
            context: { includeDeclaration: true }
        });
        assertTest('Find References on non-opened document returns [] safely', 
            Array.isArray(refsNonOpened) && refsNonOpened.length === 0
        );

        // Test 12: Shutdown returns null
        const shutdownRes = await client.request('shutdown', null);
        assertTest('LSP Server cleanly responds to shutdown', shutdownRes === null || shutdownRes === undefined);

        console.log(`\nAll ${totalTests} Protocol-Level Integration Tests PASSED!\n`);
    } finally {
        client.close();
    }
}

runProtocolTests().catch((err) => {
    console.error('Protocol Test Failed:', err);
    process.exit(1);
});
