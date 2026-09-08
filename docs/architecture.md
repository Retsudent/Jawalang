# Arsitektur & Struktur Proyèk (Architecture & Project Structure)

[← Sadurunge: Language Server Protocol](lsp.md) | [Indeks Dokumentasi](README.md)

---

Dokumen iki nerangake arsitektur teknis sistem internal Jawalang, saka pemindaian token nganti eksekusi runtime lan layanan Language Server.

---

## 1. Pipa Eksekusi Basa (Execution Pipeline)

```text
Berkas Sumber (.jawa)
        │
        ▼
   src/lexer.js       ──► Deretan Token (Tokens mawa posisi loc: line, col, offset)
        │
        ▼
   src/parser.js      ──► Abstract Syntax Tree (AST mawa Node Semantik)
        │
        ▼
src/interpreter.js    ──► Eksekusi Runtime (Environment Scope Chain, Struct, Heap)
```

1. **Lexer (`src/lexer.js`)**:
   - Ngowahi karakter mentah dadi stream token leksikal.
   - Saben token dilengkapi informasi posisi `loc: { start: { line, character, offset }, end: { line, character, offset } }`.
   - Isolasi karakter escape string lan komentar baris `//`.
2. **Parser (`src/parser.js`)**:
   - Nggunakake pendekatan *Recursive Descent Parsing* kanthi prioritas operator (precedence climbing).
   - Ngasilake wit sintaksis abstrak (*Abstract Syntax Tree / AST*) kanthi node terstruktur.
   - Pambungkus kesalahan sintaksis kanthi informasi baris lan pituduh basa Jawa / Indonesia.
3. **Interpreter (`src/interpreter.js`)**:
   - Ngeksekusi node AST adhedhasar rantai lingkungan leksikal (*Lexical Environment Chain*).
   - Ngatur isolasi memori obyek, struct, metode, konstruktor, lan pewarisan.
   - Ngetrapake proteksi keamanan: wates rekursi 500 call stack lan wates perulangan 100.000 iterasi.
4. **Module Loader (`src/module_loader.js`)**:
   - Ngatur resolusi path kanonikal (`fs.realpathSync.native`).
   - Caching modul (`LOADING`, `LOADED`, `FAILED`) lan deteksi ketergantungan muter (*circular imports*).

---

## 2. Arsitektur Language Server (`language-server/`)

Language Server Jawalang nyedhiyakake analisis statis tingkat dhuwur tanpa ngeksekusi kode pangguna:

```text
Editor (VS Code, etc.)
         │
    LSP over stdio (JSON-RPC)
         │
         ▼
language-server/src/server.js
         │
 ┌───────┴────────────────────────┬─────────────────────────┐
 │                                │                         │
 ▼                                ▼                         ▼
DocumentManager             analyzer.js              modules.js
(Manajemen Berkas)          (Tabel Simbol, Scope,    (Cache Simbol Ekspor
                             Reference Graph)         Modul Proyek)
                                  │
         ┌───────────────┬────────┴───────┬───────────────┐
         ▼               ▼                ▼               ▼
   completion.js    references.js     rename.js     formatter.js
   (Autocomplete)   (Find References) (Rename)      (Format Dokumen)
         │               │                │               │
         ▼               ▼                ▼               ▼
 signatureHelp.js   codeActions.js  semanticTokens.js  definitions.js
```

- **`analyzer.js`**: Pusat analisis statis sing nindakake parsing toleran, registrasi tabel simbol, pambentukan hierarki *scope tree*, lan pambangunan *reference graph*.
- **`semanticTokens.js`**: Engine pewarnaan semantik kanthi 13 tipe token, 2 modifier, delta-encoding LSP, lan proteksi string/komentar.
- **`formatter.js`**: Engine pemformat dokumen murni statis mawa aturan indentasi 4 spasi lan perapian spasi operator.
- **`codeActions.js`**: Engine tumindak kode otomatis kanggo pengorganisasian impor lan koreksi tipo leksikal.

---

## 3. Peta Direktori Proyèk

```text
Jawalang/
├── package.json               # Metadata proyek, npm scripts, lan bin configuration
├── index.js                   # Entry point program lan eksekutor berkas
├── bin/
│   ├── jawa.js                # CLI executable Node.js mawa shebang
│   ├── jawalang.js            # Alias CLI executable
│   ├── jawa.cmd               # Batch wrapper kanggo Windows Command Prompt
│   └── jawa.exe               # Launcher native Windows binary (~21 KB)
├── src/
│   ├── lexer.js               # Tokenizer kanthi pelacakan posisi karakter
│   ├── parser.js              # Recursive descent AST parser
│   ├── interpreter.js         # Runtime execution engine & environment
│   ├── module_loader.js       # Module resolver, cache, & circular guard
│   ├── repl.js                # Interactive shell engine & multiline buffer
│   ├── cli.js                 # CLI argument parsing & error formatter
│   └── launcher/
│       └── jawa.cs            # Kode sumber C# launcher native Windows
├── language-server/
│   ├── bin/
│   │   └── jawalang-language-server.js  # LSP binary entry point
│   ├── src/
│   │   ├── server.js          # LSP protocol lifecycle & capability handler
│   │   ├── analyzer.js        # Static analysis, symbol table & scope tree
│   │   ├── semanticTokens.js  # LSP semantic highlighting engine
│   │   ├── formatter.js       # Token-aware code formatting engine
│   │   ├── codeActions.js     # Organize imports & quick fixes
│   │   ├── completion.js      # Context-aware completion V2
│   │   ├── signatureHelp.js   # Parameter tracking & signature help
│   │   ├── rename.js          # Semantic symbol renaming
│   │   ├── references.js      # Cross-scope reference finder
│   │   └── definitions.js     # Definition provider
│   └── test/                  # Test suite unit Language Server (12 suite)
├── vscode-extension/
│   ├── package.json           # VS Code extension manifest & contributions
│   ├── language-configuration.json # Bracket pairing & comment config
│   ├── syntaxes/
│   │   └── jawalang.tmLanguage.json # Fallback TextMate grammar
│   └── jawalang-vscode-1.0.0.vsix   # Paket VSIX ekstensi siap pasang
├── docs/                      # Dokumentasi teknis terstruktur lengkap
├── examples/                  # Contoh kode sumber program Jawalang (.jawa)
└── scripts/
    ├── install.ps1            # Skrip instalasi otomatis Windows (HKCU, PATH)
    ├── uninstall.ps1          # Skrip uninstalasi aman Windows
    ├── build-windows.ps1      # Skrip kompilasi launcher native jawa.exe
    └── package-release.ps1    # Skrip pambungkus rilis standalone
```

---

[← Sadurunge: Language Server Protocol](lsp.md) | [Indeks Dokumentasi](README.md)
