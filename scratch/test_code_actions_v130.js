/**
 * Jawalang V1.3.0 — Phase 7: Code Actions Protocol Integration Suite
 *
 * Verifies textDocument/codeAction over actual JSON-RPC stdio protocol
 * to language-server/bin/jawalang-language-server.js.
 */

const { spawn } = require('child_process');
const path = require('path');
const assert = require('assert');
const testCodeActionsUnit = require('../language-server/test/codeActions.test');

console.log('====================================================');
console.log('     JAWALANG V1.3.0 — CODE ACTIONS VALIDATION      ');
console.log('====================================================\n');

// 1. Run Unit Scenarios
console.log('--- Step 1: Running Code Actions Unit Suite ---');
testCodeActionsUnit();

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
        // Scenario 1: Initialize and verify codeActionProvider capability
        const initResult = await client.request('initialize', {
            processId: process.pid,
            rootUri: 'file:///c:/Jawalang',
            capabilities: {}
        });

        assert.ok(initResult.capabilities, 'Initialize must return server capabilities');
        assert.ok(initResult.capabilities.codeActionProvider, 'Server must advertise codeActionProvider');
        assert.deepStrictEqual(
            initResult.capabilities.codeActionProvider.codeActionKinds,
            ['quickfix', 'source.organizeImports'],
            'Server must advertise correct codeActionKinds'
        );
        console.log('PASS [Protocol  1]: Initialize capability check (codeActionProvider advertised)');

        client.notify('initialized', {});

        let docCounter = 1;
        async function openAndGetActions(text, context = { diagnostics: [] }, range = { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }) {
            const uri = `file:///c:/Jawalang/test_ca_${docCounter++}.jawa`;
            client.notify('textDocument/didOpen', {
                textDocument: {
                    uri,
                    languageId: 'jawalang',
                    version: 1,
                    text
                }
            });
            await new Promise(r => setTimeout(r, 60)); // allow indexing
            const actions = await client.request('textDocument/codeAction', {
                textDocument: { uri },
                range,
                context
            });
            return { actions, uri };
        }

        // Scenario 2: Basic codeAction request (organize imports)
        {
            const text = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
            const { actions } = await openAndGetActions(text);
            assert.ok(Array.isArray(actions));
            const org = actions.find(a => a.kind === 'source.organizeImports');
            assert.ok(org, 'Expected organizeImports action');
            console.log('PASS [Protocol  2]: Basic codeAction request (organize imports found)');
        }

        // Scenario 3: context.only filter for source.organizeImports
        {
            const text = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
            const { actions } = await openAndGetActions(text, { diagnostics: [], only: ['source.organizeImports'] });
            assert.strictEqual(actions.length, 1);
            assert.strictEqual(actions[0].kind, 'source.organizeImports');
            console.log('PASS [Protocol  3]: context.only filtering for source.organizeImports');
        }

        // Scenario 4: context.only filter for quickfix
        {
            const text = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
            const { actions } = await openAndGetActions(text, { diagnostics: [], only: ['quickfix'] });
            const org = actions.find(a => a.kind === 'source.organizeImports');
            assert.strictEqual(org, undefined, 'Quickfix filter must exclude organize imports');
            console.log('PASS [Protocol  4]: context.only filtering excludes organizeImports for quickfix');
        }

        // Scenario 5: Duplicate import removal
        {
            const text = 'impor "./math.jawa"\nimpor "./math.jawa"\n';
            const { actions } = await openAndGetActions(text);
            const dup = actions.find(a => a.title.includes('Remove duplicate import'));
            assert.ok(dup, 'Expected Remove duplicate import action');
            assert.strictEqual(dup.kind, 'quickfix');
            console.log('PASS [Protocol  5]: Duplicate import removal quickfix');
        }

        // Scenario 6: Selective import deduplication
        {
            const text = 'impor { tambah, tambah } saka "./math.jawa"\ngawe x = tambah(1, 2)';
            const { actions } = await openAndGetActions(text);
            const dupSpec = actions.find(a => a.title === 'Remove duplicate import "tambah"');
            assert.ok(dupSpec, 'Expected Remove duplicate import specifier action');
            console.log('PASS [Protocol  6]: Selective import duplicate specifier removal');
        }

        // Scenario 7: Selective imports organize and merge
        {
            const text = 'impor { kali } saka "./math.jawa"\nimpor { tambah } saka "./math.jawa"\n';
            const { actions, uri } = await openAndGetActions(text, { only: ['source.organizeImports'] });
            assert.strictEqual(actions.length, 1);
            const edit = actions[0].edit.changes[uri][0];
            assert.strictEqual(edit.newText, 'impor { kali, tambah } saka "./math.jawa"');
            console.log('PASS [Protocol  7]: Selective imports organize and merge');
        }

        // Scenario 8: Import alias preservation
        {
            const text = 'impor { tambah minangka jumlah } saka "./math.jawa"\nimpor { bagi } saka "./math.jawa"\n';
            const { actions, uri } = await openAndGetActions(text, { only: ['source.organizeImports'] });
            assert.strictEqual(actions.length, 1);
            const edit = actions[0].edit.changes[uri][0];
            assert.ok(edit.newText.includes('tambah minangka jumlah'));
            console.log('PASS [Protocol  8]: Import alias preservation in organize imports');
        }

        // Scenario 9: Namespace import formatting and sorting
        {
            const text = 'impor "./z.jawa" minangka z\nimpor "./a.jawa" minangka a\n';
            const { actions, uri } = await openAndGetActions(text, { only: ['source.organizeImports'] });
            assert.strictEqual(actions.length, 1);
            const edit = actions[0].edit.changes[uri][0];
            assert.strictEqual(edit.newText, 'impor "./a.jawa" minangka a\nimpor "./z.jawa" minangka z');
            console.log('PASS [Protocol  9]: Namespace import formatting and sorting');
        }

        // Scenario 10: Unused namespace import quickfix
        {
            const text = 'impor "./unused.jawa" minangka unused\ngawe x = 10\n';
            const { actions } = await openAndGetActions(text);
            const unusedAct = actions.find(a => a.title.includes('Remove unused namespace import "unused"'));
            assert.ok(unusedAct, 'Expected Remove unused namespace import action');
            console.log('PASS [Protocol 10]: Unused namespace import quickfix');
        }

        // Scenario 11: Typo quickfix for undefined function
        {
            const text = 'guna tambah(a, b) {\nbali a + b\n}\ngawe x = tambha(1, 2)\n';
            const { actions } = await openAndGetActions(text, {
                diagnostics: [
                    {
                        message: 'Fungsi "tambha" ora ditemokake.',
                        range: { start: { line: 3, character: 9 }, end: { line: 3, character: 15 } }
                    }
                ]
            });
            const fix = actions.find(a => a.title === 'Change to "tambah"');
            assert.ok(fix, 'Expected Change to "tambah" quickfix');
            assert.strictEqual(fix.kind, 'quickfix');
            console.log('PASS [Protocol 11]: Typo quickfix for undefined function');
        }

        // Scenario 12: Typo quickfix for undefined variable
        {
            const text = 'gawe skorUtama = 100\ntulis skorUtame\n';
            const { actions } = await openAndGetActions(text, {
                diagnostics: [
                    {
                        message: 'Variabel "skorUtame" ora ditemokake.',
                        range: { start: { line: 1, character: 6 }, end: { line: 1, character: 15 } }
                    }
                ]
            });
            const fix = actions.find(a => a.title === 'Change to "skorUtama"');
            assert.ok(fix, 'Expected Change to "skorUtama" quickfix');
            console.log('PASS [Protocol 12]: Typo quickfix for undefined variable');
        }

        // Scenario 13: Malformed document does not crash server
        {
            const text = 'guna (((( broken syntax';
            const { actions } = await openAndGetActions(text);
            assert.ok(Array.isArray(actions));
            console.log('PASS [Protocol 13]: Malformed document does not crash server');
        }

        // Scenario 14: Unknown diagnostic safely handled
        {
            const text = 'gawe x = 10\n';
            const { actions } = await openAndGetActions(text, {
                diagnostics: [
                    {
                        message: 'Custom unknown diagnostic that engine does not recognize',
                        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } }
                    }
                ]
            });
            assert.ok(Array.isArray(actions));
            console.log('PASS [Protocol 14]: Unknown diagnostic safely handled');
        }

        // Scenario 15: Clean document with no imports/diagnostics returns []
        {
            const text = 'gawe a = 1\ngawe b = 2\ngawe c = a + b\n';
            const { actions } = await openAndGetActions(text);
            assert.deepStrictEqual(actions, []);
            console.log('PASS [Protocol 15]: Clean document without imports/diagnostics returns []');
        }

        // Scenario 16: Deterministic output across consecutive calls
        {
            const text = 'impor "./c.jawa"\nimpor "./b.jawa"\nimpor "./a.jawa"\n';
            const res1 = await openAndGetActions(text);
            const res2 = await openAndGetActions(text);
            assert.deepStrictEqual(res1.actions.map(a => a.title), res2.actions.map(a => a.title));
            console.log('PASS [Protocol 16]: Deterministic output across calls');
        }

        // Scenario 17: UTF-16 precision
        {
            const text = 'impor "./b.jawa" // Aksara Jawa: ꦲꦤꦕꦫꦏ\nimpor "./a.jawa"\n';
            const { actions } = await openAndGetActions(text, { only: ['source.organizeImports'] });
            assert.strictEqual(actions.length, 1);
            console.log('PASS [Protocol 17]: UTF-16 characters handled safely');
        }

        // Scenario 18: VS Code compatibility (valid CodeAction structure)
        {
            const text = 'impor "./b.jawa"\nimpor "./a.jawa"\n';
            const { actions } = await openAndGetActions(text);
            for (const act of actions) {
                assert.ok(act.title, 'CodeAction must have title');
                assert.ok(act.kind, 'CodeAction must have kind');
                assert.ok(act.edit, 'CodeAction must have edit');
                assert.ok(act.edit.changes, 'edit must have changes map');
            }
            console.log('PASS [Protocol 18]: VS Code compatibility of CodeAction structure');
        }

        console.log('\n====================================================');
        console.log(' ALL CODE ACTIONS PROTOCOL TESTS PASSED (18/18)      ');
        console.log('====================================================');
    } finally {
        await client.close();
    }
}

runProtocolTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
