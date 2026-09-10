# Language Server Protocol (LSP) & Integrasi VS Code

[← Sadurunge: CLI & Windows Tooling](cli.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Arsitektur Proyèk →](architecture.md)

---

Jawalang nyedhiyakake implementasi resmi **Language Server Protocol (LSP)** sing nyengkuyung pengalaman pangembangan profesional (*developer experience*) ing editor modern kayata Visual Studio Code.

Ing rilis **V1.3.0 (Phase 9: LSP Polish & Release Hardening)**, kabeh 11 kapabilitas LSP wis diuji, di-audit kanthi jero, diisolasi marang kasalahan dokumen (malformed recovery), diselarasake koordinat UTF-16, lan difinalisasi kanggo release freeze.

---

## 1. Arsitektur Language Server

Server LSP Jawalang dumunung ing direktori `language-server/` mawa binary executable `language-server/bin/jawalang-language-server.js`. Server komunikasi liwat protokol standar JSON-RPC liwat antarmuka `stdio`:

```bash
# Priksa versi Language Server
node language-server/bin/jawalang-language-server.js --version

# Bantuan opsi CLI
node language-server/bin/jawalang-language-server.js --help

# Miwiti server ing mode stdio
node language-server/bin/jawalang-language-server.js --stdio

# Miwiti server kanthi logging debug menyang stderr
node language-server/bin/jawalang-language-server.js --stdio --debug
```

### Karakteristik Arsitektur
- **100% Static Analysis**: Murni analisis leksikal, parsing AST, lan grafik simbol tanpa tau ngeksekusi kode pangguna.
- **Zero Global Mutable Contamination**: Saben panjaluk dokumen dianalisis ing njero DocumentManager kanthi isolasi cakupan dokumen.
- **In-Memory Cache & Invalidation**: Cache analisis otomatis dianyari nalika nampa event `textDocument/didChange` lan diresiki nalika `textDocument/didClose`.
- **Fail-Safe Error Boundaries**: Kabeh panjaluk LSP dibungkus blok proteksi saengga kesalahan sintaks utawa parsing ora tau njalari proses server crash.

---

## 2. Kapabilitas LSP sing Kasedhiya (Capabilities Matrix)

Kabeh kapabilitas ing ngisor iki wis diaudit lan diverifikasi 100% aktif lan konsisten karo spesifikasi LSP V3.17:

| No | Kapabilitas LSP | Metode Protocol | Katrangan | Status |
| :-: | :--- | :--- | :--- | :---: |
| 1 | **Real-time Diagnostics** | `textDocument/publishDiagnostics` | Laporan kesalahan leksikal, sintaksis, simbol ora ditemokake, duplikasi deklarasi, lan siklus pewarisan kanthi range UTF-16 presisi | ✅ |
| 2 | **Context-Aware Completion V2** | `textDocument/completion` | Rekomendasi simbol leksikal kontekstual: cakupan lokal, anggota instance struct (`w.`), `iki.`, `super.`, namespace (`math.`), lan filter `anyar` | ✅ |
| 3 | **Semantic Hover** | `textDocument/hover` | Inferensi jinis data variabel, tandha tangan fungsi, rincian field/metode struct, sarta dokumentasi built-in lan keyword | ✅ |
| 4 | **Go to Definition** | `textDocument/definition` | Navigasi langsung menyang deklarasi variabel lokal, parameter, fungsi, struct, metode, lan modul ekspor cross-file kanthi URI kanonik | ✅ |
| 5 | **Document Outline Symbols** | `textDocument/documentSymbol` | Peta struktur hierarkis simbol berkas (struct minangka kelas, metode, field, konstruktor `wiwiti`, fungsi, lan variabel) | ✅ |
| 6 | **Find All References** | `textDocument/references` | Nemokake kabeh lokasi panggunaan simbol mawa resolusi leksikal, pelacakan deklarasi, shadowing safety, lan isolasi properti | ✅ |
| 7 | **Rename Symbol** | `textDocument/rename` | Ngganti jeneng simbol kanthi aman liwat WorkspaceEdit standar kanthi deteksi tabrakan leksikal (collision) lan urutan edit descending | ✅ |
| 8 | **Signature Help** | `textDocument/signatureHelp` | Bantuan tandha tangan lan parameter aktif (`activeParameter`) adhedhasar token stream: panggilan bersarang, konstruktor, super, lan built-in | ✅ |
| 9 | **Document Formatting** | `textDocument/formatting` | Format otomatis deterministik kanthi indentasi 4 spasi, perapian operator, penataan blok kurawal, idempotensi, lan proteksi string/komentar | ✅ |
| 10 | **Code Actions & Quick Fix** | `textDocument/codeAction` | Tindakan otomatis: Organize Imports (`Shift+Alt+O`), pambusukan impor duplikat/ora dienggo, koreksi tipo Levenshtein, lan saran impor modul | ✅ |
| 11 | **Semantic Tokens Highlighting** | `textDocument/semanticTokens/full` | Pewarnaan sintaks semantik mawa 13 jinis token lan 2 modifier adhedhasar simbol lan scope kanthi enkoding delta relatif standar LSP | ✅ |

---

## 3. Rincian Fitur Utama LSP

### A. Diagnostics & Static Analysis Hardening
- **Sintaks & Leksikal**: Nangkep karakter ora sah, kurung utawa kurawal sing durung ditutup, sarta string literal tanpa tutup.
- **Resolusi Simbol**: Ndeteksi variabel utawa fungsi sing ora dingerteni (`ora ditemokake`) tanpa ngasilake diagnostik palsu marang fungsi bawaan (built-in).
- **Deteksi Duplikasi Deklarasi**:
  - Duplikasi deklarasi fungsi ing cakupan sing padha.
  - Duplikasi deklarasi struct (`bentuk`).
  - Duplikasi variabel ing cakupan leksikal sing padha.
  - Duplikasi parameter ing deklarasi fungsi.
  - Duplikasi properti lan metode ing njero deklarasi struct.
- **Validasi Pewarisan & Siklus (Cycle Guards)**:
  - Ndeteksi struct ngembangake awake dhewe (*self-inheritance*).
  - Ndeteksi struct induk sing ora ditemokake (*missing parent*).
  - Ndeteksi siklus pewarisan melingkar (*circular inheritance*, conto: `A` ngembangake `B` lan `B` ngembangake `A`) kanthi guard `visitedStructs` supaya ora tau micu perulangan tanpa wates (*infinite recursion*).

### B. Context-Aware Completion V2
- **Cakupan Leksikal**: Mung nampilake variabel lan parameter sing sah ing posisi kursor, kanthi prioritas shadowing lokal.
- **Anggota Struct**: Ngetik `titik` sawise variabel instance (`instance.`) otomatis nampilake properti lan metode struct kasebut, kalebu anggota sing diwarisi saka leluhur.
- **Konstruktor `anyar`**: Sawise tembung kunci `anyar `, autokomplit kanthi cerdas mung nyaring simbol struct/kelas.
- **`iki.` lan `super.`**:
  - `iki.` nampilake kabeh properti lan metode struct aktif.
  - `super.` mung nampilake properti lan metode saka struct induk langsung tanpa katut override turunan.
- **Modul Namespace**: Ngetik `namespace.` mung nampilake simbol sing kanthi eksplisit diekspor (`ekspor`) dening modul kasebut. Simbol privat internal modul ora tau bocor.
- **Proteksi String & Komentar**: Autokomplit otomatis dipateni nalika kursor ana ing njero string literal utawa komentar.

### C. Semantic Tokens Highlighting
- **13 Token Types**: `namespace`, `type`, `class`, `function`, `method`, `property`, `variable`, `parameter`, `keyword`, `number`, `string`, `comment`, `operator`.
- **2 Token Modifiers**: `declaration` (`1`), `defaultLibrary` (`2`).
- **Pembedaan Presisi**:
  - Parameter fungsi diwernani minangka `parameter` (dudu variabel umum) sanajan nduweni jeneng sing padha karo variabel global.
  - Metode struct dibedakake saka fungsi independen.
  - Konstruktor `wiwiti` diwernani minangka metode kanthi modifier `declaration`.
  - Fungsi bawaan (built-in) otomatis entuk modifier `defaultLibrary`.
- **Delta-Encoding Standar LSP**: Array 5-tuple diurutake kanthi ketat (line ASC, char ASC), bebas overlap, lan ora ana start position duplikat.

### D. Code Actions & Quick Fixes
- **Organize Imports (`source.organizeImports`)**:
  - Ngurutake baris impor kanthi alfabetis adhedhasar path modul.
  - Nggabungake impor selektif saka path modul sing padha kanthi otomatis.
  - Ngurutake specifier selektif kanthi njaga alias `minangka`.
  - Format multiline otomatis kanggo impor mawa 4+ specifiers.
- **Remove Duplicate Imports (`quickfix`)**: Mbusak baris impor duplikat utawa specifier duplikat ing pranyatan impor.
- **Remove Unused Imports (`quickfix`)**: Mbusak impor sing ora tau digunakake ing kode adhedhasar grafik referensi.
- **Typo QuickFix (`quickfix`)**: Nyaranake koreksi tipo adhedhasar jarak Levenshtein ($\le 2$) kanggo variabel, fungsi, struct, lan built-in bawaan (`dawe` $\to$ `dawa`).
- **Missing Import QuickFix (`quickfix`)**: Nyaranake ngimpor simbol ekspor sing kasedhiya saka modul-modul liya ing workspace.

### E. Document Formatting
- **Indentasi Standar**: 4 spasi per level sarang (*nesting level*).
- **Spasi Operator**: Spasi seragam ing sakubenge operator biner (`+`, `-`, `*`, `/`, `==`, `lan`, `utawa`) lan operator unary sing nempel ing operand (`-10`, `ora aktif`).
- **Cuddled Keywords**: `} liyane {`, `} liyane yen ... {`, `} tangkep err {`.
- **Idempotensi**: Dijamin `format(format(x)) === format(x)` ing kabeh struktur kode.
- **Integritas String & Komentar**: Komentar baris (`//`) lan isi string mawa karakter escape utawa baris anyar ora tau dimodifikasi.
- **Line Endings**: Ndeteksi lan njaga baris pungkasan Windows CRLF (`\r\n`) utawa Unix LF (`\n`) kanthi otomatis.

---

## 4. Standar Presisi UTF-16

Sesuai spesifikasi resmi Language Server Protocol, kabeh posisi baris lan karakter diitung adhedhasar **UTF-16 Code Units**:
- Karakter reguler ASCII diitung 1 unit.
- Karakter multibyte ing njero Basic Multilingual Plane (kayata Aksara Jawa: `ꦗ`, `ꦮ`) diitung miturut ukuran UTF-16 code unit.
- Karakter ing njaba BMP mawa *surrogate pairs* (kayata karakter emoji `😀`) diitung minangka 2 code units.
- Kabeh provider (diagnostics, completion, hover, definition, references, rename, signature help, code action, semantic tokens) wis diuji nggunakake utilitas konversi offset terpusat (`offsetAt` lan `positionAt`) saengga posisi kursor sawise emoji utawa karakter multibyte tansah presisi.

---

## 5. Ekstensi Visual Studio Code

Ekstensi resmi kasedhiya ing folder `vscode-extension/`:
- **Instalasi Paket VSIX**:
  ```powershell
  code --install-extension vscode-extension/jawalang-vscode-1.0.0.vsix
  ```
- **Fitur Ekstensi**:
  - Tombol ▶ *"Run Jawalang File"* ing pojok tengen ndhuwur editor.
  - Perintah `Jawalang: Run File` ing Command Palette (`Ctrl+Shift+P`).
  - Integrasi otomatis karo Jawalang Language Server liwat LSP Client bawaan.
  - Fallback TextMate grammar nalika LSP durung diuripake.
  - Format Document liwat `Shift + Alt + F` utawa klik tengen -> *Format Document*.
  - Quick Fix / Refactoring liwat `Ctrl + .` utawa lampu kuning VS Code.
  - Snippets kode cepet (`gawe`, `guna`, `bentuk`, `wiwiti`, `coba`, `impor`, lsp).

---

[← Sadurunge: CLI & Windows Tooling](cli.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Arsitektur Proyèk →](architecture.md)
