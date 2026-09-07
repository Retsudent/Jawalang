const { TextDocuments } = require('vscode-languageserver');
const { TextDocument } = require('vscode-languageserver-textdocument');
const analyzer = require('./analyzer');
const { getDiagnostics } = require('./diagnostics');

class DocumentManager {
    constructor() {
        this.documents = new TextDocuments(TextDocument);
        // Cache: uri -> { version, analysisResult }
        this.cache = new Map();
        this.connection = null;
    }

    listen(connection) {
        this.connection = connection;
        this.documents.listen(connection);

        // Document opened or changed
        this.documents.onDidChangeContent((change) => {
            this.validateDocument(change.document);
        });

        // Document closed
        this.documents.onDidClose((e) => {
            const uri = e.document.uri;
            this.cache.delete(uri);
            if (this.connection) {
                this.connection.sendDiagnostics({ uri, diagnostics: [] });
            }
        });
    }

    validateDocument(document) {
        const uri = document.uri;
        const text = document.getText();
        const version = document.version;

        const analysis = analyzer.analyze(text, uri);
        this.cache.set(uri, {
            version,
            analysis
        });

        if (this.connection) {
            const diags = getDiagnostics(analysis);
            this.connection.sendDiagnostics({ uri, diagnostics: diags });
        }

        return analysis;
    }

    openDocument(uri, text, version = 1) {
        const doc = TextDocument.create(uri, 'jawalang', version, text);
        return this.validateDocument(doc);
    }

    getAnalysis(uri) {
        const doc = this.documents.get(uri);
        if (doc) {
            const cached = this.cache.get(uri);
            if (cached && cached.version === doc.version) {
                return cached.analysis;
            }
            return this.validateDocument(doc);
        }

        // If not managed by TextDocuments (e.g. tests or direct URI)
        const cached = this.cache.get(uri);
        return cached ? cached.analysis : null;
    }

    setAnalysis(uri, analysis) {
        this.cache.set(uri, {
            version: 0,
            analysis
        });
    }
}

const instance = new DocumentManager();
instance.DocumentManager = DocumentManager;
module.exports = instance;
