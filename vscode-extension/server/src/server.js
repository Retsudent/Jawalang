#!/usr/bin/env node

const {
    createConnection,
    ProposedFeatures,
    TextDocumentSyncKind
} = require('vscode-languageserver/node');

const documentManager = require('./documentManager');
const { getCompletions } = require('./completion');
const { getHover } = require('./hover');
const { getDefinition } = require('./definitions');
const { getDocumentSymbols } = require('./symbols');

const pkg = require('../package.json');

// CLI arguments processing
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.error(`Jawalang Language Server v${pkg.version}`);
    console.error('Usage: jawalang-language-server [options]');
    console.error('');
    console.error('Options:');
    console.error('  --help, -h       Tampilake pitulung iki');
    console.error('  --version, -v    Tampilake versi language server');
    console.error('  --debug          Aktifake logging debug menyang stderr');
    console.error('  --stdio          Gunakake stdio transport kanggo LSP (default)');
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    console.error(`Jawalang Language Server v${pkg.version}`);
    process.exit(0);
}

const isDebug = args.includes('--debug');
function debugLog(...msg) {
    if (isDebug) {
        process.stderr.write(`[Jawalang LSP Debug] ${msg.join(' ')}\n`);
    }
}

debugLog('Starting Jawalang Language Server...');

// Create LSP Connection using standard features
const connection = createConnection(ProposedFeatures.all);

connection.onInitialize((params) => {
    debugLog('LSP Initialized by client:', params.clientInfo ? `${params.clientInfo.name} ${params.clientInfo.version}` : 'Unknown');

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['.', ' ', '"', '{']
            },
            hoverProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true
        }
    };
});

connection.onInitialized(() => {
    debugLog('Connection initialized successfully.');
});

// Register Language Features
connection.onCompletion((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getCompletions(analysis, params.position);
    } catch (err) {
        debugLog('Error in onCompletion:', err.message);
        return [];
    }
});

connection.onHover((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getHover(analysis, params.position);
    } catch (err) {
        debugLog('Error in onHover:', err.message);
        return null;
    }
});

connection.onDefinition((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getDefinition(analysis, params.position);
    } catch (err) {
        debugLog('Error in onDefinition:', err.message);
        return null;
    }
});

connection.onDocumentSymbol((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getDocumentSymbols(analysis);
    } catch (err) {
        debugLog('Error in onDocumentSymbol:', err.message);
        return [];
    }
});

// Bind document manager to connection
documentManager.listen(connection);

// Listen on connection
connection.listen();
