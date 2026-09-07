# Jawalang Language Server (LSP) V1

Language Server Protocol (LSP) implementasi resmi kanggo basa pamrograman **Jawalang** (`.jawa`).

Jawalang Language Server nyedhiyakake kapabilitas IDE profesional liwat protokol standar LSP (Language Server Protocol) liwat antarmuka `stdio`.

---

## Fitur Utama

* **Diagnostik Real-time (`textDocument/publishDiagnostics`)**:
  * Pelaporan kesalahan sintaks kanthi baris lan karakter akurat.
  * Analisis semantik: deteksi variabel sing durung didefinisi (`ora ditemokake`), fungsi sing durung didefinisi, lan salah gunggung parameter fungsi.
  * Validasi panggunaan `iki` (mung sah ing njero metode struct) lan `super` (mung sah ing njero metode struct turunan).
  * Validasi impor modul lan ekspor simbol.

* **Go to Definition (`textDocument/definition`)**:
  * Navigasi langsung menyang deklarasi variabel lokal, parameter fungsi, deklarasi fungsi, lan deklarasi struct (`bentuk`).
  * Cross-file navigation kanggo simbol sing diimpor saka modul liya.

* **Semantic Autocomplete (`textDocument/completion`)**:
  * Rekomendasi simbol kontekstual adhedhasar cakupan leksikal aktif.
  * Anggota instance struct: nampilake field lan metode nalika ngetik `instance.`
  * Anggota `iki.` ing njero metode struct lan `super.` ing struct turunan.
  * Namespace modul: nampilake simbol sing diekspor dening modul nalika ngetik `namespace.`
  * Dokumen lengkap lan tuladha kanggo 24 fungsi built-in Jawalang lan kabeh tembung kunci (keywords).

* **Semantic Hover (`textDocument/hover`)**:
  * Tipe data inferensi variabel (`string`, `number`, `boolean`, `array`, `object`, `instance of <Struct>`).
  * Tanda tangan fungsi lan dhaptar parameter.
  * Ringkesan struktur `bentuk` (field lan metode).
  * Dokumentasi lengkap fungsi built-in lan tembung kunci mawa conto kode Jawa.

* **Document Symbols (`textDocument/documentSymbol`)**:
  * Peta outline hierarkis dokumen: Struct minangka kelas, metode, konstruktor (`wiwiti`), field, fungsi, lan variabel global.

* **Module Awareness & Static Import Resolution**:
  * Resolusi path impor relatif kanthi ekstensi `.jawa` otomatis utawa eksplisit.
  * Ekstraksi simbol ekspor kanthi statis (tanpa ngeksekusi kode pangguna).
  * Proteksi siklus impor (circular imports protection).

---

## Arsitektur

```text
Editor (VS Code, etc.)
         │
    LSP over stdio (JSON-RPC)
         ▼
bin/jawalang-language-server.js
         │
src/server.js ─── DocumentManager (in-memory document cache)
         │
src/analyzer.js ─── AST, Scopes, Symbol Table, Type Inference
    ├── src/lexer.js (Position tracking: line, character, offset)
    ├── src/parser.js (AST with loc & nameLoc)
    ├── src/modules.js (Static module resolver & export analyzer)
    ├── src/diagnostics.js (Error & warning publisher)
    ├── src/definitions.js (Go to definition provider)
    ├── src/completion.js (Scope & member completion provider)
    ├── src/hover.js (Type & doc hover provider)
    └── src/symbols.js (Hierarchical outline symbols)
```

---

## Cara Nggunakake CLI

Jawalang Language Server bisa dilakokake langsung liwat terminal:

```bash
# Priksa versi
node bin/jawalang-language-server.js --version

# Bantuan
node bin/jawalang-language-server.js --help

# Nguripake server LSP liwat stdio
node bin/jawalang-language-server.js --stdio

# Nguripake mawa logging debug (menyang stderr)
node bin/jawalang-language-server.js --stdio --debug
```

### Opsi CLI

* `--help`, `-h`: Nampilake pitulung lan opsi CLI.
* `--version`, `-v`: Nampilake versi Language Server (`v1.0.0`).
* `--debug`: Ngaktifake logging diagnostik lan debug menyang `stderr`.
* `--stdio`: Migunakake transport stdio kanggo protokol JSON-RPC (standar LSP).

---

## Pengujian Unit

Kabeh tes unit LSP disedhiyakake ing direktori `test/`:

```bash
# Nglakokake kabeh tes unit LSP
node test/run_tests.js
```

Tes sing kalebu:
1. `test/diagnostics.test.js`: Validasi diagnostik sintaks lan semantik.
2. `test/definitions.test.js`: Validasi go-to-definition lokal lan cross-file.
3. `test/completion.test.js`: Validasi autokomplit cakupan, anggota, lan modul.
4. `test/hover.test.js`: Validasi hover jinis data, fungsi, struct, lan built-in.
5. `test/symbols.test.js`: Validasi outline hierarkis dokumen.
6. `test/modules.test.js`: Validasi analisis modul lan siklus impor.

---

## Lisensi

MIT License.
