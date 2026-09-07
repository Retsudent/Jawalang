const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';
const EXT_DIR = path.join(ROOT, 'vscode-extension');

// Ensure directories exist
const dirs = [
    EXT_DIR,
    path.join(EXT_DIR, 'syntaxes'),
    path.join(EXT_DIR, 'snippets'),
    path.join(EXT_DIR, 'src'),
    path.join(EXT_DIR, 'icons'),
    path.join(EXT_DIR, 'tests')
];

for (const d of dirs) {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
    }
}

// 1. package.json
const pkgJson = {
    "name": "jawalang-vscode",
    "displayName": "Jawalang",
    "description": "Professional developer tooling for the Jawalang programming language",
    "version": "1.0.0",
    "publisher": "jawalang",
    "repository": {
        "type": "git",
        "url": "https://github.com/Retsudent/Jawalang"
    },
    "engines": {
        "vscode": "^1.75.0"
    },
    "categories": [
        "Programming Languages",
        "Snippets"
    ],
    "keywords": [
        "jawalang",
        "javanese",
        "programming language",
        "basa jawa"
    ],
    "icon": "icons/jawalang.svg",
    "activationEvents": [
        "onLanguage:jawalang"
    ],
    "main": "./src/extension.js",
    "contributes": {
        "languages": [
            {
                "id": "jawalang",
                "aliases": ["Jawalang", "jawalang"],
                "extensions": [".jawa"],
                "configuration": "./language-configuration.json",
                "icon": {
                    "light": "./icons/jawalang.svg",
                    "dark": "./icons/jawalang.svg"
                }
            }
        ],
        "grammars": [
            {
                "language": "jawalang",
                "scopeName": "source.jawa",
                "path": "./syntaxes/jawalang.tmLanguage.json"
            }
        ],
        "snippets": [
            {
                "language": "jawalang",
                "path": "./snippets/jawalang.json"
            }
        ],
        "commands": [
            {
                "command": "jawalang.runFile",
                "title": "Jawalang: Run File",
                "icon": "$(play)"
            }
        ],
        "menus": {
            "editor/title": [
                {
                    "command": "jawalang.runFile",
                    "when": "editorLangId == jawalang",
                    "group": "navigation"
                }
            ],
            "commandPalette": [
                {
                    "command": "jawalang.runFile",
                    "when": "editorLangId == jawalang"
                }
            ]
        },
        "configuration": {
            "title": "Jawalang",
            "properties": {
                "jawalang.executablePath": {
                    "type": "string",
                    "default": "jawa",
                    "description": "Path to the Jawalang CLI executable (e.g. 'jawa' or full path to 'jawa.exe')"
                },
                "jawalang.runInTerminal": {
                    "type": "boolean",
                    "default": true,
                    "description": "Whether to run Jawalang files in the integrated terminal"
                }
            }
        }
    },
    "scripts": {
        "test": "node tests/test_extension.js",
        "package": "npx @vscode/vsce package --no-dependencies"
    }
};

fs.writeFileSync(path.join(EXT_DIR, 'package.json'), JSON.stringify(pkgJson, null, 2) + '\n', 'utf8');

// 2. language-configuration.json
const langConfig = {
    "comments": {
        "lineComment": "//"
    },
    "brackets": [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
    ],
    "autoClosingPairs": [
        { "open": "{", "close": "}" },
        { "open": "[", "close": "]" },
        { "open": "(", "close": ")" },
        { "open": "\"", "close": "\"", "notIn": ["string"] }
    ],
    "surroundingPairs": [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
        ["\"", "\""]
    ],
    "folding": {
        "markers": {
            "start": "^\\s*//\\s*#?region\\b",
            "end": "^\\s*//\\s*#?endregion\\b"
        }
    },
    "indentationRules": {
        "increaseIndentPattern": "^.*(\\{[^}\"']*|\\([^)\"']*|\\[[^\\]\"']*)$",
        "decreaseIndentPattern": "^\\s*[\\}\\]\\)].*$"
    },
    "wordPattern": "(-?\\d*\\.\\d\\w*)|([^\\`\\~\\!\\@\\#\\%\\^\\&\\*\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s]+)"
};

fs.writeFileSync(path.join(EXT_DIR, 'language-configuration.json'), JSON.stringify(langConfig, null, 2) + '\n', 'utf8');

// 3. syntaxes/jawalang.tmLanguage.json
const tmLanguage = {
    "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
    "name": "Jawalang",
    "scopeName": "source.jawa",
    "patterns": [
        { "include": "#comments" },
        { "include": "#strings" },
        { "include": "#numbers" },
        { "include": "#constants" },
        { "include": "#function-declaration" },
        { "include": "#struct-declaration" },
        { "include": "#keywords" },
        { "include": "#builtins" },
        { "include": "#function-calls" },
        { "include": "#member-access" },
        { "include": "#operators" }
    ],
    "repository": {
        "comments": {
            "patterns": [
                {
                    "name": "comment.line.double-slash.jawa",
                    "match": "//.*$"
                }
            ]
        },
        "strings": {
            "patterns": [
                {
                    "name": "string.quoted.double.jawa",
                    "begin": "\"",
                    "end": "\"",
                    "patterns": [
                        {
                            "name": "constant.character.escape.jawa",
                            "match": "\\\\."
                        }
                    ]
                }
            ]
        },
        "numbers": {
            "patterns": [
                {
                    "name": "constant.numeric.jawa",
                    "match": "\\b[0-9]+(\\.[0-9]+)?\\b"
                }
            ]
        },
        "constants": {
            "patterns": [
                {
                    "name": "constant.language.boolean.jawa",
                    "match": "\\b(bener|salah)\\b"
                },
                {
                    "name": "constant.language.null.jawa",
                    "match": "\\b(null)\\b"
                },
                {
                    "name": "variable.language.this.jawa",
                    "match": "\\b(iki)\\b"
                },
                {
                    "name": "variable.language.super.jawa",
                    "match": "\\b(super)\\b"
                }
            ]
        },
        "function-declaration": {
            "patterns": [
                {
                    "match": "\\b(guna)\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?=\\()",
                    "captures": {
                        "1": { "name": "storage.type.function.jawa" },
                        "2": { "name": "entity.name.function.jawa" }
                    }
                }
            ]
        },
        "struct-declaration": {
            "patterns": [
                {
                    "match": "\\b(bentuk)\\s+([a-zA-Z_][a-zA-Z0-9_]*)(\\s+(ngembangake)\\s+([a-zA-Z_][a-zA-Z0-9_.]*))?",
                    "captures": {
                        "1": { "name": "storage.type.struct.jawa" },
                        "2": { "name": "entity.name.type.struct.jawa" },
                        "4": { "name": "storage.modifier.inheritance.jawa" },
                        "5": { "name": "entity.other.inherited-class.jawa" }
                    }
                }
            ]
        },
        "keywords": {
            "patterns": [
                {
                    "name": "storage.type.jawa",
                    "match": "\\b(gawe|wiwiti)\\b"
                },
                {
                    "name": "keyword.control.jawa",
                    "match": "\\b(yen|liyane|nalika|kanggo|saben|ing|nganti|langkah|mandheg|lanjut|bali)\\b"
                },
                {
                    "name": "keyword.control.exception.jawa",
                    "match": "\\b(coba|tangkep|lempar)\\b"
                },
                {
                    "name": "keyword.control.import.jawa",
                    "match": "\\b(impor|ekspor|saka|minangka)\\b"
                },
                {
                    "name": "keyword.operator.new.jawa",
                    "match": "\\b(anyar)\\b"
                },
                {
                    "name": "keyword.operator.logical.jawa",
                    "match": "\\b(lan|utawa|ora)\\b"
                }
            ]
        },
        "builtins": {
            "patterns": [
                {
                    "name": "support.function.builtin.jawa",
                    "match": "\\b(tulis|takon|dawa|jupuk|nambah|busak|motong|ngganti|gedhe|cilik|jinis|kunci|nilai|duwe|terapkan|saring|itung|gabung|balik|urut|ana|kabeh|golek|indeks)\\b"
                }
            ]
        },
        "function-calls": {
            "patterns": [
                {
                    "name": "entity.name.function.call.jawa",
                    "match": "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?=\\()"
                }
            ]
        },
        "member-access": {
            "patterns": [
                {
                    "match": "\\.([a-zA-Z_][a-zA-Z0-9_]*)",
                    "captures": {
                        "1": { "name": "variable.other.property.jawa" }
                    }
                }
            ]
        },
        "operators": {
            "patterns": [
                {
                    "name": "keyword.operator.comparison.jawa",
                    "match": "(==|!=|<=|>=|<|>)"
                },
                {
                    "name": "keyword.operator.assignment.jawa",
                    "match": "="
                },
                {
                    "name": "keyword.operator.arithmetic.jawa",
                    "match": "(\\+|-|\\*|/)"
                }
            ]
        }
    }
};

fs.writeFileSync(path.join(EXT_DIR, 'syntaxes', 'jawalang.tmLanguage.json'), JSON.stringify(tmLanguage, null, 2) + '\n', 'utf8');

// 4. snippets/jawalang.json
const snippets = {
    "Gawe Variabel": {
        "prefix": "gawe",
        "body": [
            "gawe ${1:jeneng} = ${2:nilai}"
        ],
        "description": "Deklarasi variabel Jawalang"
    },
    "Guna Fungsi": {
        "prefix": "guna",
        "body": [
            "guna ${1:nama}(${2:param}) {",
            "\t${0}",
            "}"
        ],
        "description": "Deklarasi fungsi Jawalang"
    },
    "Wiwiti Konstruktor": {
        "prefix": "wiwiti",
        "body": [
            "wiwiti(${1:param}) {",
            "\t${0}",
            "}"
        ],
        "description": "Konstruktor struct Jawalang"
    },
    "Bentuk Struct": {
        "prefix": "bentuk",
        "body": [
            "bentuk ${1:Nama} {",
            "\tgawe ${2:field} = ${3:\"\"}",
            "",
            "\twiwiti(${4:param}) {",
            "\t\tiki.${2:field} = ${4:param}",
            "\t}",
            "",
            "\tguna ${5:metode}() {",
            "\t\t${0}",
            "\t}",
            "}"
        ],
        "description": "Deklarasi struct Jawalang"
    },
    "Bentuk Pewarisan": {
        "prefix": "bentuk-ngembangake",
        "body": [
            "bentuk ${1:Anak} ngembangake ${2:Induk} {",
            "\twiwiti(${3:param}) {",
            "\t\tsuper(${3:param})",
            "\t\t${0}",
            "\t}",
            "}"
        ],
        "description": "Pewarisan struct Jawalang"
    },
    "Anyar Instance": {
        "prefix": "anyar",
        "body": [
            "anyar ${1:Struct}(${2:args})"
        ],
        "description": "Instansiasi struct anyar"
    },
    "Yen Percabangan": {
        "prefix": "yen",
        "body": [
            "yen ${1:kondisi} {",
            "\t${0}",
            "}"
        ],
        "description": "Percabangan if"
    },
    "Yen Liyane": {
        "prefix": "yen-liyane",
        "body": [
            "yen ${1:kondisi} {",
            "\t${2}",
            "} liyane {",
            "\t${0}",
            "}"
        ],
        "description": "Percabangan if-else"
    },
    "Nalika While Loop": {
        "prefix": "nalika",
        "body": [
            "nalika ${1:kondisi} {",
            "\t${0}",
            "}"
        ],
        "description": "Perulangan while"
    },
    "Kanggo For Loop": {
        "prefix": "kanggo",
        "body": [
            "kanggo ${1:i} = ${2:0}; ${1:i} < ${3:10}; ${1:i} = ${1:i} + 1 {",
            "\t${0}",
            "}"
        ],
        "description": "Perulangan for standard"
    },
    "Saben Foreach Loop": {
        "prefix": "saben",
        "body": [
            "saben ${1:item} ing ${2:koleksi} {",
            "\t${0}",
            "}"
        ],
        "description": "Perulangan foreach array"
    },
    "Bali Return": {
        "prefix": "bali",
        "body": [
            "bali ${0}"
        ],
        "description": "Mbalekake nilai fungsi"
    },
    "Coba Tangkep": {
        "prefix": "coba",
        "body": [
            "coba {",
            "\t${1}",
            "} tangkep ${2:err} {",
            "\t${0}",
            "}"
        ],
        "description": "Pananganan kasalahan try-catch"
    },
    "Lempar Eksepsi": {
        "prefix": "lempar",
        "body": [
            "lempar ${1:\"Pesen kesalahan\"}"
        ],
        "description": "Mbuwang eksepsi error"
    },
    "Impor Modul": {
        "prefix": "impor",
        "body": [
            "impor \"${1:modul.jawa}\""
        ],
        "description": "Impor modul kabeh"
    },
    "Impor Saka": {
        "prefix": "impor-saka",
        "body": [
            "impor { ${1:simbol} } saka \"${2:modul.jawa}\""
        ],
        "description": "Selective import simbol saka modul"
    },
    "Impor Namespace": {
        "prefix": "impor-namespace",
        "body": [
            "impor \"${1:modul.jawa}\" minangka ${2:ns}"
        ],
        "description": "Impor modul minangka namespace"
    },
    "Tulis Cithak": {
        "prefix": "tulis",
        "body": [
            "tulis ${0}"
        ],
        "description": "Cithak menyang konsol"
    },
    "Takon Input": {
        "prefix": "takon",
        "body": [
            "takon(\"${1:Prompt: }\")"
        ],
        "description": "Nampa input pangguna"
    }
};

fs.writeFileSync(path.join(EXT_DIR, 'snippets', 'jawalang.json'), JSON.stringify(snippets, null, 2) + '\n', 'utf8');

// 5. src/extension.js
const extensionJsContent = `const path = require('path');

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
        const cmd = \`& "\${executablePath}" "\${filePath}"\`;
        terminalInstance.sendText(cmd);
    });

    // 2. Register Autocomplete Provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('jawalang', {
        provideCompletionItems(document, position) {
            const items = [];

            // Keywords
            for (const kw of KEYWORDS) {
                const item = new vscode.CompletionItem(kw.label, vscode.CompletionItemKind.Keyword);
                item.detail = kw.detail;
                item.documentation = new vscode.MarkdownString(\`\`\`jawa\\n\${kw.doc}\\n\`\`\`);
                items.push(item);
            }

            // Built-in functions
            for (const [name, info] of Object.entries(BUILTINS)) {
                const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Function);
                item.detail = info.signature;
                item.documentation = new vscode.MarkdownString(\`\${info.description}\\n\\n**Tuladha:**\\n\`\`\`jawa\\n\${info.example}\\n\`\`\`);
                items.push(item);
            }

            return items;
        }
    });

    // 3. Register Hover Provider
    const hoverProvider = vscode.languages.registerHoverProvider('jawalang', {
        provideHover(document, position) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) return null;

            const word = document.getText(range);

            if (BUILTINS[word]) {
                const info = BUILTINS[word];
                const md = new vscode.MarkdownString();
                md.appendCodeblock(info.signature, 'jawa');
                md.appendMarkdown(\`\\n\${info.description}\\n\\n**Tuladha:**\\n\`);
                md.appendCodeblock(info.example, 'jawa');
                return new vscode.Hover(md);
            }

            const kw = KEYWORDS.find(k => k.label === word);
            if (kw) {
                const md = new vscode.MarkdownString();
                md.appendMarkdown(\`**(keyword) \${kw.label}** — \${kw.detail}\\n\\n\`);
                md.appendCodeblock(kw.doc, 'jawa');
                return new vscode.Hover(md);
            }

            return null;
        }
    });

    context.subscriptions.push(runCommand, completionProvider, hoverProvider);
}

function deactivate() {
    if (terminalInstance) {
        terminalInstance.dispose();
        terminalInstance = null;
    }
}

module.exports = {
    activate,
    deactivate,
    BUILTINS,
    KEYWORDS
};
`;

fs.writeFileSync(path.join(EXT_DIR, 'src', 'extension.js'), extensionJsContent, 'utf8');

// 6. Copy icons/jawalang.svg
const srcSvg = path.join(ROOT, 'assets', 'jawalang.svg');
const dstSvg = path.join(EXT_DIR, 'icons', 'jawalang.svg');
if (fs.existsSync(srcSvg)) {
    fs.copyFileSync(srcSvg, dstSvg);
}

// 7. README.md
const readmeContent = `# Jawalang for Visual Studio Code

Ekstensi resmi **Jawalang** kanggo Visual Studio Code. Nyedhiyakake dhukungan basa pamrograman Jawa (*Javanese Programming Language*) kanthi pengalaman pangembang profesional (*developer experience*).

---

## 🌟 Fitur Utama

- **Pangenalan Basa (.jawa)**: Otomatis ngenali berkas mawa ekstensi \`.jawa\` minangka basa Jawalang.
- **Syntax Highlighting Lengkap**: Nyakup kabeh keyword Jawalang V5 (\`gawe\`, \`guna\`, \`bentuk\`, \`wiwiti\`, \`ngembangake\`, \`super\`, \`coba\`, \`tangkep\`, lsp), string mawa escape sequences, angka desimal, komentar baris, sarta deklarasi/panggilan fungsi lan struct.
- **Konfigurasi Basa**: Pasangan otomatis tanda kurung \`{}\`, \`[]\`, \`()\`, tanda petik \`""\`, komentar baris \`//\`, lan aturan indentasi cerdas.
- **Snippets Kode Praktis**: Template cepet kanggo \`gawe\`, \`guna\`, \`bentuk\`, \`wiwiti\`, \`yen\`, \`nalika\`, \`kanggo\`, \`saben\`, \`coba\`, \`impor\`, lan sapiturute.
- **Tombol & Printah Run Jawalang**: Eksekusi berkas aktif langsung ing Integrated Terminal VS Code liwat tombol ▶ ing pojok tengen ndhuwur utawa printah \`Jawalang: Run File\`.
- **Dukungan Terminal Interaktif**: Program mawa fungsi input \`takon()\` lumaku kanthi interaktif lan lancar.
- **Autocomplete & IntelliSense**: Saran tembung cerdas kanggo kabeh keyword lan 24 fungsi built-in Jawalang.
- **Hover Documentation**: Informasi dokumentasi resmi, signature, lan conto kode nalika kursor kaseleh ing dhuwure fungsi built-in utawa keyword.

---

## 🚀 Pandhuan Instalasi

### 1. Prasyarat
Pesthekake komputer panjenengan wis nduweni:
1. **Node.js (v14+)** ([https://nodejs.org](https://nodejs.org)).
2. **Jawalang CLI**: Pasang Jawalang CLI liwat installer resmi:
   \`\`\`powershell
   powershell -ExecutionPolicy Bypass -File .\\scripts\\install.ps1
   \`\`\`
   Priksa instalasi ing terminal:
   \`\`\`bash
   jawa --version
   \`\`\`

### 2. Pasang Ekstensi VS Code
Instal berkas \`jawalang-vscode-1.0.0.vsix\` liwat terminal:
\`\`\`bash
code --install-extension jawalang-vscode-1.0.0.vsix
\`\`\`
Utawa ing VS Code:
1. Bukak tab **Extensions** (\`Ctrl+Shift+X\`).
2. Klik tombol titik telu (\`...\`) ing pojok ndhuwur.
3. Pilih **Install from VSIX...** banjur pilih berkas \`jawalang-vscode-1.0.0.vsix\`.

---

## ⚙️ Setelan (Settings)

Ekstensi nyedhiyakake setelan kang bisa diowahi ing VS Code Settings:

| Setelan | Default | Katrangan |
| :--- | :--- | :--- |
| \`jawalang.executablePath\` | \`"jawa"\` | Path menyang executable CLI Jawalang (kayata \`jawa\` utawa path jangkep menyang \`jawa.exe\`). |
| \`jawalang.runInTerminal\` | \`true\` | Nglakokake program ing integrated terminal VS Code. |

---

## 📝 Lisensi
MIT License © Jawalang Team
`;

fs.writeFileSync(path.join(EXT_DIR, 'README.md'), readmeContent, 'utf8');

// 8. CHANGELOG.md
const changelogContent = `# Changelog

Kabeh owah-owahan resmi ekstensi Jawalang VS Code kacathet ing berkas iki.

## [1.0.0] - 2026-09-07
### Ditambahake
- Registrasi basa resmi Jawalang kanggo berkas \`.jawa\`.
- TextMate grammar syntax highlighting lengkap kanggo Jawalang V5.
- Konfigurasi basa (comments, auto-closing brackets/quotes, indentation).
- 18 code snippets praktis mawa tabstops.
- Printah \`Jawalang: Run File\` lan tombol play ▶ ing editor title bar.
- Autocomplete provider kanggo 32 keywords lan 24 fungsi built-in.
- Hover documentation provider mawa Markdown, signatures, lan contoh kode.
- Setelan konfigurasi \`jawalang.executablePath\` lan \`jawalang.runInTerminal\`.
- Ikon resmi Jawalang SVG.
`;

fs.writeFileSync(path.join(EXT_DIR, 'CHANGELOG.md'), changelogContent, 'utf8');

// 9. tests/test_extension.js
const testExtensionContent = `const assert = require('assert');
const fs = require('fs');
const path = require('path');

const EXT_DIR = path.resolve(__dirname, '..');

let passed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(\`PASS: \${name}\`);
        passed++;
    } catch (err) {
        console.error(\`FAIL: \${name}\`);
        console.error('  Error:', err.message);
    }
}

console.log('=== RUNNING JAWALANG VS CODE EXTENSION TESTS ===\\n');

// 1. package.json verification
test('package.json has valid manifest and contributions', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'package.json'), 'utf8'));
    assert.strictEqual(pkg.name, 'jawalang-vscode');
    assert.strictEqual(pkg.version, '1.0.0');
    assert.ok(pkg.contributes);
    assert.ok(pkg.contributes.languages);
    assert.strictEqual(pkg.contributes.languages[0].id, 'jawalang');
    assert.deepStrictEqual(pkg.contributes.languages[0].extensions, ['.jawa']);
    assert.ok(pkg.contributes.grammars);
    assert.strictEqual(pkg.contributes.grammars[0].language, 'jawalang');
    assert.strictEqual(pkg.contributes.grammars[0].scopeName, 'source.jawa');
    assert.ok(pkg.contributes.snippets);
    assert.ok(pkg.contributes.commands);
    assert.strictEqual(pkg.contributes.commands[0].command, 'jawalang.runFile');
    assert.ok(pkg.contributes.configuration);
});

// 2. language-configuration.json verification
test('language-configuration.json has valid brackets, comments, and rules', () => {
    const conf = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'language-configuration.json'), 'utf8'));
    assert.strictEqual(conf.comments.lineComment, '//');
    assert.ok(Array.isArray(conf.brackets));
    assert.ok(Array.isArray(conf.autoClosingPairs));
    assert.ok(conf.indentationRules);
});

// 3. syntaxes/jawalang.tmLanguage.json verification
test('syntaxes/jawalang.tmLanguage.json contains all Jawalang V5 token scopes', () => {
    const grammar = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'syntaxes', 'jawalang.tmLanguage.json'), 'utf8'));
    assert.strictEqual(grammar.scopeName, 'source.jawa');
    assert.ok(grammar.repository.keywords);
    assert.ok(grammar.repository.builtins);
    assert.ok(grammar.repository.strings);
    assert.ok(grammar.repository.numbers);
    assert.ok(grammar.repository.comments);
    assert.ok(grammar.repository['function-declaration']);
    assert.ok(grammar.repository['struct-declaration']);

    // Check presence of V5 keywords
    const kwText = JSON.stringify(grammar.repository);
    const requiredKeywords = [
        'gawe', 'guna', 'bali', 'yen', 'liyane', 'nalika', 'kanggo', 'saben',
        'mandheg', 'lanjut', 'bener', 'salah', 'null', 'coba', 'tangkep', 'lempar',
        'impor', 'ekspor', 'saka', 'minangka', 'bentuk', 'anyar', 'iki', 'wiwiti',
        'ngembangake', 'super', 'tulis', 'takon'
    ];
    for (const kw of requiredKeywords) {
        assert.ok(kwText.includes(kw), \`Keyword "\${kw}" missing from grammar\`);
    }
});

// 4. snippets/jawalang.json verification
test('snippets/jawalang.json provides essential code snippets', () => {
    const snippets = JSON.parse(fs.readFileSync(path.join(EXT_DIR, 'snippets', 'jawalang.json'), 'utf8'));
    assert.ok(snippets['Gawe Variabel']);
    assert.ok(snippets['Guna Fungsi']);
    assert.ok(snippets['Bentuk Struct']);
    assert.ok(snippets['Bentuk Pewarisan']);
    assert.ok(snippets['Wiwiti Konstruktor']);
    assert.ok(snippets['Yen Percabangan']);
    assert.ok(snippets['Kanggo For Loop']);
    assert.ok(snippets['Coba Tangkep']);
    assert.ok(snippets['Impor Saka']);
});

// 5. src/extension.js exports verification
test('src/extension.js exports activate, deactivate, BUILTINS, and KEYWORDS', () => {
    const ext = require(path.join(EXT_DIR, 'src', 'extension.js'));
    assert.strictEqual(typeof ext.activate, 'function');
    assert.strictEqual(typeof ext.deactivate, 'function');
    assert.ok(ext.BUILTINS);
    assert.ok(ext.KEYWORDS);
    assert.ok(Object.keys(ext.BUILTINS).length >= 20);
    assert.ok(ext.KEYWORDS.length >= 25);
});

// 6. icons/jawalang.svg verification
test('icons/jawalang.svg exists and is valid SVG', () => {
    const svgPath = path.join(EXT_DIR, 'icons', 'jawalang.svg');
    assert.ok(fs.existsSync(svgPath));
    const content = fs.readFileSync(svgPath, 'utf8');
    assert.ok(content.includes('<svg'));
});

// 7. README.md & CHANGELOG.md verification
test('README.md and CHANGELOG.md exist and are documented', () => {
    const readme = fs.readFileSync(path.join(EXT_DIR, 'README.md'), 'utf8');
    const changelog = fs.readFileSync(path.join(EXT_DIR, 'CHANGELOG.md'), 'utf8');
    assert.ok(readme.includes('Jawalang for Visual Studio Code'));
    assert.ok(changelog.includes('1.0.0'));
});

console.log(\`\\nExtension Tests Result: \${passed}/\${total} passed\`);
if (passed !== total) process.exit(1);
`;

fs.writeFileSync(path.join(EXT_DIR, 'tests', 'test_extension.js'), testExtensionContent, 'utf8');

console.log('All vscode-extension files created successfully.');
