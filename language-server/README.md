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

* **Find All References (`textDocument/references`)**:
  * Nemokake kabeh lokasi referensi lan panggunaan simbol kanthi presisi dhuwur (cakupan lokal, global, lan shadowing).
  * Nyakup variabel, parameter fungsi, metode struct, panggilan fungsi, instansiasi struct (`anyar`), properti instance (`iki.prop`), referensi warisan (`super.method()`), sarta simbol impor selektif lan namespace modul.
  * Dilengkapi opsi `context.includeDeclaration` lan proteksi otomatis marang tembung kunci utawa fungsi built-in.

* **Rename Symbol (`textDocument/rename`)**:
  * Ngganti jeneng simbol kanthi aman liwat `WorkspaceEdit` LSP standar tanpa text replacement global / regex.
  * Nggunakake identitas simbol semantik (`SymbolObject` & Reference Graph) saengga mung ngowahi deklarasi lan referensi sing bener.
  * Proteksi lengkap marang tembung kunci, fungsi built-in, konstruktor `wiwiti`, string literal, komentar, lan jeneng simbol ora sah.
  * Deteksi tabrakan jeneng leksikal (collision detection) ing cakupan target.
  * Urutan edit `WorkspaceEdit` disusun kanthi urutan mudhun (descending line & character) kanggo nyegah karusakan offset.

* **Signature Help (`textDocument/signatureHelp`)**:
  * Bantuan tandha tangan lan parameter aktif (`activeParameter`) kanthi presisi dhuwur adhedhasar aliran token leksikal (ora nggunakake regex global).
  * Nyengkuyung panggilan fungsi pangguna, konstruktor struct (`anyar StructName(...)`), konstruktor warisan (`super(...)`), metode instance struct (`w.salam(...)`, `iki.salam(...)`), metode warisan (`super.method(...)`), fungsi ekspor modul namespace (`math.tambah(...)`), sarta fungsi impor selektif lan alias.
  * Ngisolasi panggilan bersarang (nested calls), koma ing njero array literal `[...]`, object literal `{...}`, string literal `""`, lan komentar baris `//`.
  * Dhukungan kanggo fungsi bawaan Jawalang (`dawa`, `terapkan`, `takon`, lsp) kanthi label tandha tangan lan dokumentasi.

* **Semantic Context-Aware Completion V2 (`textDocument/completion`)**:
  * Rekomendasi simbol kontekstual adhedhasar cakupan leksikal aktif (global, lokal blok, nested, lan parameter fungsi) kanthi resolusi shadowing sing akurat.
  * Anggota instance struct: nampilake field (`Field`) lan metode (`Method`) nalika ngetik `instance.` adhedhasar inferensi tipe instansiasi `anyar Struct()`.
  * Anggota `iki.` ing njero metode utawa konstruktor struct nampilake field lan metode struct kasebut.
  * Anggota `super.` ing struct turunan nampilake field lan metode saka struct induk langsung tanpa katut override turunan.
  * Resolusi pewarisan (`ngembangake`) otomatis njupuk kabeh anggota leluhur kanthi deduplikasi lan prioritas override anak.
  * Namespace modul: nampilake simbol sing diekspor dening modul nalika ngetik `namespace.` (simbol internal ora katut).
  * Dhukungan impor selektif lan alias impor (`impor { tambah minangka jumlah }`).
  * Filter cerdas sawise tembung kunci `anyar `: mung nampilake simbol struct/kelas sing sah.
  * Proteksi lengkap: ora nampilake autokomplit ing njero string (`"..."`) utawa komentar baris (`//`).
  * Panggunaan `textEdit` standar kanthi range panggantian tembung lan prefix sing presisi.
  * Dokumen lengkap lan tuladha kanggo 24 fungsi built-in Jawalang lan kabeh tembung kunci (keywords).

* **Semantic Hover (`textDocument/hover`)**:
  * Tipe data inferensi variabel (`string`, `number`, `boolean`, `array`, `object`, `instance of <Struct>`).
  * Tanda tangan fungsi lan dhaptar parameter.
  * Ringkesan struktur `bentuk` (field lan metode).
  * Dokumentasi lengkap fungsi built-in lan tembung kunci mawa conto kode Jawa.

* **Document Symbols (`textDocument/documentSymbol`)**:
  * Peta outline hierarkis dokumen: Struct minangka kelas, metode, konstruktor (`wiwiti`), field, fungsi, lan variabel global.

* **Document Formatting (`textDocument/formatting`)**:
  * Format dokumen otomatis kanthi engine token-aware deterministik lan murni statis (tanpa eksekusi runtime).
  * Indentasi standar 4 spasi (tanpa tab) adhedhasar level sarang (nesting level).
  * Perapian spasi operator biner (`+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `=`, `lan`, `utawa`) lan operator unary (`-`, `+`, `ora`) sing nempel ing operand.
  * Format kurawal blok (`{` lan `}`) sarta cuddling tembung kunci (`} liyane {`, `} liyane yen ... {`, `} tangkep err {`, `} saka ...`).
  * Format deklarasi struct, konstruktor `wiwiti`, pewarisan `ngembangake`, lan pemanggilan `super`.
  * Object literal diformat multiline ing assignment; inline object tetep dijaga ing njero ekspresi.
  * Array inline lan array bersarang (`[[1, 2], [3, 4]]`) tetep rapi tanpa pemotongan baris paksa.
  * Njaga komentar (`//`) lan string literal mawa karakter escape 100% aman lan verbatim.
  * Dhukungan otomatis baris pungkasan CRLF (`\r\n`) lan LF (`\n`).
  * Jaminan idempotensi: `format(format(kode)) === format(kode)`.
  * Malformed-code safety: ngasilake `[]` kanthi aman tanpa ngrusak berkas utawa njalari server crash.

* **Capability Matrix**:
  | Kapabilitas LSP | Status |
  | :--- | :---: |
  | `textDocument/publishDiagnostics` | ✅ |
  | `textDocument/completion` | ✅ |
  | `textDocument/hover` | ✅ |
  | `textDocument/definition` | ✅ |
  | `textDocument/references` | ✅ |
  | `textDocument/rename` | ✅ |
  | `textDocument/documentSymbol` | ✅ |
  | `textDocument/signatureHelp` | ✅ |
  | `textDocument/formatting` | ✅ |
  | `textDocument/semanticTokens` | ⏳ |
  | `workspace/symbol` | ⏳ |
  | `codeAction` | ⏳ |
  | `foldingRange` | ⏳ |

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
    ├── src/references.js (Find all references provider)
    ├── src/rename.js (Rename symbol provider)
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
7. `test/references.test.js`: Validasi Find All References (variabel lokal/global/shadowed, parameter, fungsi, struct, metode, inheritance super, selective import, namespace).
8. `test/rename.test.js`: Validasi Rename Symbol (deklarasi, referensi, cakupan lokal, shadowing, fungsi, struct, field, metode, inheritance super, proteksi built-in/keyword/wiwiti/string/komentar, validasi identifier, deteksi tabrakan leksikal, sarta WorkspaceEdit).
9. `test/signatureHelp.test.js`: Validasi Signature Help & Active Parameter (fungsi pangguna, parameter bersarang, ekspresi, impor selektif/alias, namespace modul, metode struct, metode warisan, override, super, konstruktor, super constructor, built-in metadata, string/komentar/array/objek safety, sarta isolasi malformed input).

---

## Lisensi

MIT License.
