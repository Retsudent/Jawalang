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
const { getReferences } = require('./references');
const { renameSymbol } = require('./rename');
const { getSignatureHelp } = require('./signatureHelp');
const { formatDocument } = require('./formatter');
const { getCodeActions, CodeActionKind } = require('./codeActions');
const { getSemanticTokens, semanticTokensLegend } = require('./semanticTokens');

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
            documentSymbolProvider: true,
            referencesProvider: true,
            renameProvider: true,
            signatureHelpProvider: {
                triggerCharacters: ['(', ','],
                retriggerCharacters: [',']
            },
            formattingProvider: true,
            codeActionProvider: {
                codeActionKinds: [
                    CodeActionKind.QuickFix,
                    CodeActionKind.SourceOrganizeImports
                ]
            },
            semanticTokensProvider: {
                legend: semanticTokensLegend,
                full: true
            }
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

connection.onReferences((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getReferences(analysis, params.position, params.context);
    } catch (err) {
        debugLog('Error in onReferences:', err.message);
        return [];
    }
});

connection.onRenameRequest((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return renameSymbol(analysis, params.position, params.newName);
    } catch (err) {
        debugLog('Error in onRenameRequest:', err.message);
        return null;
    }
});

connection.onSignatureHelp((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getSignatureHelp(analysis, params.position);
    } catch (err) {
        debugLog('Error in onSignatureHelp:', err.message);
        return null;
    }
});

connection.onDocumentFormatting((params) => {
    try {
        const uri = params.textDocument.uri;
        let text = '';
        const doc = documentManager.documents.get(uri);
        if (doc) {
            text = doc.getText();
        } else {
            const cached = documentManager.cache.get(uri);
            if (cached && cached.analysis && cached.analysis.text) {
                text = cached.analysis.text;
            }
        }
        if (!text) {
            return [];
        }
        return formatDocument(text, params.options);
    } catch (err) {
        debugLog('Error in onDocumentFormatting:', err.message);
        return [];
    }
});

connection.onCodeAction((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getCodeActions(analysis, params.range, params.context);
    } catch (err) {
        debugLog('Error in onCodeAction:', err.message);
        return [];
    }
});

connection.languages.semanticTokens.on((params) => {
    try {
        const analysis = documentManager.getAnalysis(params.textDocument.uri);
        return getSemanticTokens(analysis);
    } catch (err) {
        debugLog('Error in onSemanticTokens:', err.message);
        return { data: [] };
    }
});

// Bind document manager to connection
documentManager.listen(connection);

// Listen on connection
connection.listen();

