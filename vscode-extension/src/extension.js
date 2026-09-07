const path = require('path');

/**
 * Built-in documentation map for hover and autocomplete
 */
const BUILTINS = {
    tulis: {
        signature: 'tulis <ekspresi>',
        description: 'Nyithak nilai ekspresi menyang konsol (stdout) kanthi baris anyar.',
        example: 'tulis "Halo Jagad!"'
    },
    takon: {
        signature: 'takon(prompt?: string): string',
        description: 'Nampa input teks interaktif saka pangguna liwat terminal (stdin).',
        example: 'gawe jeneng = takon("Jenengmu: ")'
    },
    dawa: {
        signature: 'dawa(koleksi: array | string): number',
        description: 'Mbalekake dawane array utawa cacahe karakter ing string.',
        example: 'dawa([1, 2, 3]) // => 3'
    },
    jupuk: {
        signature: 'jupuk(array, indeks: number): any',
        description: 'Njupuk elemen array ing indeks tartamtu kanthi aman.',
        example: 'jupuk([10, 20, 30], 1) // => 20'
    },
    nambah: {
        signature: 'nambah(array, elemen: any): array',
        description: 'Nambah elemen anyar ing mburi array.',
        example: 'nambah(data, "anyar")'
    },
    busak: {
        signature: 'busak(array, indeks: number): any',
        description: 'Mbusak elemen ing indeks tartamtu saka array.',
        example: 'busak(data, 0)'
    },
    motong: {
        signature: 'motong(teks: string, mulai: number, pungkasan: number): string',
        description: 'Motong bagean string adhedhasar indeks wiwitan lan pungkasan.',
        example: 'motong("Jawalang", 0, 4) // => "Jawa"'
    },
    ngganti: {
        signature: 'ngganti(teks: string, target: string, pangganti: string): string',
        description: 'Ngganti tembung ing njero teks nganggo teks pangganti.',
        example: 'ngganti("Halo Budi", "Budi", "Siti")'
    },
    gedhe: {
        signature: 'gedhe(teks: string): string',
        description: 'Ngowahi kabeh huruf string dadi huruf kapital (uppercase).',
        example: 'gedhe("jawa") // => "JAWA"'
    },
    cilik: {
        signature: 'cilik(teks: string): string',
        description: 'Ngowahi kabeh huruf string dadi huruf cilik (lowercase).',
        example: 'cilik("JAWA") // => "jawa"'
    },
    jinis: {
        signature: 'jinis(nilai: any): string',
        description: 'Mbalekake jeneng tipe data nilai ("string", "number", "boolean", "array", "object", "function", "instance", "struct", "null").',
        example: 'jinis(10) // => "number"'
    },
    kunci: {
        signature: 'kunci(obyek: object): string[]',
        description: 'Mbalekake kabeh jeneng properti (keys) saka sawijining obyek.',
        example: 'kunci({ "a": 1, "b": 2 }) // => ["a", "b"]'
    },
    nilai: {
        signature: 'nilai(obyek: object): any[]',
        description: 'Mbalekake kabeh nilai (values) saka sawijining obyek.',
        example: 'nilai({ "a": 1, "b": 2 }) // => [1, 2]'
    },
    duwe: {
        signature: 'duwe(obyek: object, kunci: string): boolean',
        description: 'Priksa apa sawijining kunci ana ing jero obyek.',
        example: 'duwe(user, "jeneng") // => bener'
    },
    terapkan: {
        signature: 'terapkan(fungsi: (item) => any, array: any[]): any[]',
        description: 'Fungsi HOF map: ngowahi saben elemen array nganggo fungsi transformasi.',
        example: 'terapkan(kuadrat, [1, 2, 3]) // => [1, 4, 9]'
    },
    saring: {
        signature: 'saring(predikat: (item) => boolean, array: any[]): any[]',
        description: 'Fungsi HOF filter: nyaring elemen array sing ngasilake bener.',
        example: 'saring(genap, [1, 2, 3, 4]) // => [2, 4]'
    },
    itung: {
        signature: 'itung(predikat: (item) => boolean, array: any[]): number',
        description: 'Fungsi HOF count: ngetung cacahe elemen sing nyukupi predikat.',
        example: 'itung(genap, [1, 2, 3, 4]) // => 2'
    },
    gabung: {
        signature: 'gabung(array: any[], pamisah: string): string',
        description: 'Nggabungake elemen-elemen array dadi sak string kanthi pamisah.',
        example: 'gabung(["a", "b", "c"], "-") // => "a-b-c"'
    },
    balik: {
        signature: 'balik(array: any[]): any[]',
        description: 'Mbalekake array anyar mawa urutan kewalik (non-mutating).',
        example: 'balik([1, 2, 3]) // => [3, 2, 1]'
    },
    urut: {
        signature: 'urut(array: number[]): number[]',
        description: 'Mbalekake array anyar kanthi urutan angka munggah (non-mutating).',
        example: 'urut([3, 1, 2]) // => [1, 2, 3]'
    },
    ana: {
        signature: 'ana(predikat: (item) => boolean, array: any[]): boolean',
        description: 'Priksa apa minimal ana siji elemen sing nyukupi predikat (some).',
        example: 'ana(genap, [1, 2, 3]) // => bener'
    },
    kabeh: {
        signature: 'kabeh(predikat: (item) => boolean, array: any[]): boolean',
        description: 'Priksa apa kabeh elemen nyukupi predikat (every).',
        example: 'kabeh(genap, [2, 4, 6]) // => bener'
    },
    golek: {
        signature: 'golek(predikat: (item) => boolean, array: any[]): any',
        description: 'Nggoleki elemen pisanan sing nyukupi predikat.',
        example: 'golek(genap, [1, 4, 5]) // => 4'
    },
    indeks: {
        signature: 'indeks(array: any[], target: any): number',
        description: 'Mbalekake posisi indeks pisanan saka target ing array (utawa -1).',
        example: 'indeks(["a", "b"], "b") // => 1'
    }
};

const KEYWORDS = [
    { label: 'gawe', detail: 'Deklarasi variabel', doc: 'gawe jeneng = nilai' },
    { label: 'guna', detail: 'Deklarasi fungsi', doc: 'guna jeneng(param) { bali ... }' },
    { label: 'bali', detail: 'Return statement', doc: 'bali nilai' },
    { label: 'yen', detail: 'Percabangan if', doc: 'yen kondisi { ... }' },
    { label: 'liyane', detail: 'Percabangan else', doc: 'liyane { ... }' },
    { label: 'nalika', detail: 'Perulangan while', doc: 'nalika kondisi { ... }' },
    { label: 'kanggo', detail: 'Perulangan for', doc: 'kanggo i = 0; i < 10; i = i + 1 { ... }' },
    { label: 'saben', detail: 'Perulangan foreach', doc: 'saben item ing koleksi { ... }' },
    { label: 'ing', detail: 'Keyword operator foreach', doc: 'saben x ing list' },
    { label: 'nganti', detail: 'Batas perulangan', doc: 'kanggo i ing 1 nganti 10' },
    { label: 'langkah', detail: 'Step perulangan', doc: 'langkah 2' },
    { label: 'mandheg', detail: 'Break loop', doc: 'mandheg' },
    { label: 'lanjut', detail: 'Continue loop', doc: 'lanjut' },
    { label: 'bener', detail: 'Literal boolean true', doc: 'bener' },
    { label: 'salah', detail: 'Literal boolean false', doc: 'salah' },
    { label: 'null', detail: 'Literal nilai null', doc: 'null' },
    { label: 'lan', detail: 'Operator logika AND', doc: 'a lan b' },
    { label: 'utawa', detail: 'Operator logika OR', doc: 'a utawa b' },
    { label: 'ora', detail: 'Operator logika NOT', doc: 'ora bener' },
    { label: 'coba', detail: 'Blok try catch', doc: 'coba { ... } tangkep e { ... }' },
    { label: 'tangkep', detail: 'Penangkap eksepsi', doc: 'tangkep err { ... }' },
    { label: 'lempar', detail: 'Throw error eksepsi', doc: 'lempar "kesalahan"' },
    { label: 'impor', detail: 'Import modul', doc: 'impor "modul.jawa"' },
    { label: 'ekspor', detail: 'Export modul', doc: 'ekspor guna ...' },
    { label: 'saka', detail: 'Klausa from import', doc: 'impor { a } saka "modul"' },
    { label: 'minangka', detail: 'Alias / namespace', doc: 'impor "m" minangka math' },
    { label: 'bentuk', detail: 'Deklarasi struct', doc: 'bentuk Jeneng { ... }' },
    { label: 'anyar', detail: 'Instansiasi struct', doc: 'gawe x = anyar Struct()' },
    { label: 'iki', detail: 'Referensi receiver aktif (this)', doc: 'iki.jeneng = val' },
    { label: 'wiwiti', detail: 'Konstruktor struct', doc: 'wiwiti(args) { ... }' },
    { label: 'ngembangake', detail: 'Pewarisan struct (extends)', doc: 'bentuk Anak ngembangake Induk' },
    { label: 'super', detail: 'Referensi induk struct', doc: 'super(args); super.metode()' }
];

let terminalInstance = null;
let client = null;

function activate(context) {
    let vscode;
    try {
        vscode = require('vscode');
    } catch {
        // Standalone test environment
        return;
    }

    // 1. Register "Jawalang: Run File" command
    const runCommand = vscode.commands.registerCommand('jawalang.runFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Ora ana berkas Jawalang (.jawa) sing lagi dibukak.');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'jawalang' && path.extname(document.fileName) !== '.jawa') {
            vscode.window.showWarningMessage('Berkas aktif dudu berkas Jawalang (.jawa).');
            return;
        }

        // Save document if dirty
        if (document.isDirty) {
            document.save();
        }

        const config = vscode.workspace.getConfiguration('jawalang');
        const executablePath = config.get('executablePath', 'jawa');

        // Create or reuse terminal
        if (!terminalInstance || terminalInstance.exitStatus !== undefined) {
            terminalInstance = vscode.window.createTerminal('Jawalang');
        }

        terminalInstance.show();

        // Safe quoting for spaces in path
        const filePath = document.fileName;
        const cmd = `& "${executablePath}" "${filePath}"`;
        terminalInstance.sendText(cmd);
    });
    context.subscriptions.push(runCommand);

    // 2. Language Server Integration
    const config = vscode.workspace.getConfiguration('jawalang');
    const lspEnabled = config.get('languageServer.enabled', true);
    const lspDebug = config.get('languageServer.debug', false);
    const customLspPath = config.get('languageServer.path', '');

    let lspStarted = false;
    if (lspEnabled) {
        try {
            const { LanguageClient, TransportKind } = require('vscode-languageclient/node');
            const fs = require('fs');

            let serverModule = customLspPath;
            if (!serverModule || !fs.existsSync(serverModule)) {
                // Development mode relative to vscode-extension
                const devPath = path.resolve(__dirname, '../../language-server/bin/jawalang-language-server.js');
                // Bundled mode inside extension directory
                const bundledPath = path.resolve(__dirname, '../server/bin/jawalang-language-server.js');

                if (fs.existsSync(devPath)) {
                    serverModule = devPath;
                } else if (fs.existsSync(bundledPath)) {
                    serverModule = bundledPath;
                }
            }

            if (serverModule && fs.existsSync(serverModule)) {
                const serverArgs = ['--stdio'];
                if (lspDebug) {
                    serverArgs.push('--debug');
                }

                const serverOptions = {
                    run: { module: serverModule, transport: TransportKind.stdio, args: serverArgs },
                    debug: { module: serverModule, transport: TransportKind.stdio, args: [...serverArgs, '--debug'] }
                };

                const clientOptions = {
                    documentSelector: [{ scheme: 'file', language: 'jawalang' }],
                    synchronize: {
                        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.jawa')
                    }
                };

                client = new LanguageClient(
                    'jawalangLanguageServer',
                    'Jawalang Language Server',
                    serverOptions,
                    clientOptions
                );

                client.start();
                lspStarted = true;
            }
        } catch (err) {
            console.error('[Jawalang Extension] Failed to initialize Language Server:', err);
        }
    }

    // 3. Fallback: If LSP is disabled or failed to start, register basic static providers
    if (!lspStarted) {
        const completionProvider = vscode.languages.registerCompletionItemProvider('jawalang', {
            provideCompletionItems(document, position) {
                const items = [];

                // Keywords
                for (const kw of KEYWORDS) {
                    const item = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
                    item.detail = kw.detail;
                    item.documentation = new vscode.MarkdownString("```jawa\n" + kw.doc + "\n```");
                    items.push(item);
                }

                // Built-in functions
                for (const [name, info] of Object.entries(BUILTINS)) {
                    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                    item.detail = info.signature;
                    item.documentation = new vscode.MarkdownString(info.description + "\n\n**Tuladha:**\n```jawa\n" + info.example + "\n```");
                    items.push(item);
                }

                return items;
            }
        });

        const hoverProvider = vscode.languages.registerHoverProvider('jawalang', {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) return null;

                const word = document.getText(range);

                if (BUILTINS[word]) {
                    const info = BUILTINS[word];
                    const md = new vscode.MarkdownString();
                    md.appendCodeblock(info.signature, 'jawa');
                    md.appendMarkdown(`\n${info.description}\n\n**Tuladha:**\n`);
                    md.appendCodeblock(info.example, 'jawa');
                    return new vscode.Hover(md);
                }

                const kw = KEYWORDS.find(k => k.label === word);
                if (kw) {
                    const md = new vscode.MarkdownString();
                    md.appendMarkdown(`**(keyword) ${kw.label}** — ${kw.detail}\n\n`);
                    md.appendCodeblock(kw.doc, 'jawa');
                    return new vscode.Hover(md);
                }

                return null;
            }
        });

        context.subscriptions.push(completionProvider, hoverProvider);
    }
}

function deactivate() {
    if (terminalInstance) {
        terminalInstance.dispose();
        terminalInstance = null;
    }
    if (client) {
        return client.stop();
    }
}

module.exports = {
    activate,
    deactivate,
    BUILTINS,
    KEYWORDS
};
