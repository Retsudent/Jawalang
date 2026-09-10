# Jawalang Language Server (LSP) V1.3.0

Language Server Protocol (LSP) implementasi resmi kanggo basa pamrograman **Jawalang** (`.jawa`).

Jawalang Language Server nyedhiyakake kapabilitas IDE profesional liwat protokol standar LSP (Language Server Protocol v3.17) liwat antarmuka `stdio`. Ing rilis **V1.3.0 (Phase 9: LSP Polish & Release Hardening)**, kabeh 11 kapabilitas wis di-audit, diverifikasi, lan difinalisasi kanggo lingkungan produksi.

---

## Fitur & Kapabilitas Utama

* **Diagnostik Real-time (`textDocument/publishDiagnostics`)**:
  * Pelaporan kesalahan leksikal lan sintaks kanthi baris lan karakter akurat.
  * Analisis semantik: deteksi variabel sing durung didefinisi (`ora ditemokake`), fungsi sing durung didefinisi, lan salah gunggung parameter fungsi.
  * Deteksi duplikasi deklarasi: fungsi dobel, struct dobel, variabel dobel ing scope padha, parameter fungsi dobel, sarta properti/metode struct dobel.
  * Validasi pewarisan & cycle guards: deteksi self-inheritance, missing parent struct, sarta deteksi siklus pewarisan (circular inheritance) kanggo nyegah rekursi tanpa wates.
  * Validasi panggunaan `iki` (mung sah ing njero metode struct) lan `super` (mung sah ing njero metode struct turunan).
  * Validasi impor modul lan ekspor simbol.

* **Go to Definition (`textDocument/definition`)**:
  * Navigasi langsung menyang deklarasi variabel lokal, parameter fungsi, deklarasi fungsi, lan deklarasi struct (`bentuk`).
  * Cross-file navigation kanggo simbol sing diimpor saka modul liya nggunakake URI kanonik.

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
  * Resolusi pewarisan (`ngembangake`) otomatis njupuk kabeh anggota leluhur kanthi deduplikasi lan proteksi siklus.
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

* **Code Actions & Quick Fix (`textDocument/codeAction`)**:
  * **Organize Imports (`source.organizeImports`)**:
    * Pengurutan alfabetis pranyatan `impor` adhedhasar path modul.
    * Penggabungan otomatis pranyatan impor selektif saka path modul sing padha.
    * Pengurutan simbol impor selektif kanthi njaga alias `minangka` (`impor { tambah minangka jumlah, kali } saka "./math.jawa"`).
    * Format multiline kanggo impor kanthi 4+ specifiers.
    * Idempotensi lan no-op: ngasilake `[]` yen impor wis resik lan teratur.
  * **Remove Duplicate Imports (`quickfix`)**:
    * Deteksi lan pambusukan pranyatan impor duplikat.
    * Deteksi lan pambusukan specifier duplikat ing njero siji pranyatan impor selektif (`impor { tambah, tambah }`).
  * **Remove Unused Imports (`quickfix`)**:
    * Analisis grafik referensi lan token kanggo mbusak impor selektif utawa namespace sing ora tau digunakake.
  * **QuickFix Diagnostik**:
    * Koreksi tipo (Levenshtein distance $\le 2$) kanggo fungsi, variabel, lan struct sing ora ditemokake, kalebu saran fungsi bawaan (`dawe` $\to$ `dawa`).
    * Saran impor simbol ekspor saka modul proyek sing wis kerekam ing cache analyzer.
  * **Keamanan Mutlak**: Murni analisis statis tanpa eksekusi runtime, tanpa manipulasi string/komentar, lan netepi saringan `context.only`.

* **Semantic Tokens Highlighting (`textDocument/semanticTokens/full`)**:
  * Pewarnaan sintaks semantik akurat adhedhasar analisis ruang lingkup (lexical scope), simbol, struct, pewarisan, modul namespace, lan built-in library.
  * Standar LSP Legend: 13 jinis token (`namespace`, `type`, `class`, `function`, `method`, `property`, `variable`, `parameter`, `keyword`, `number`, `string`, `comment`, `operator`) lan 2 modifier (`declaration`, `defaultLibrary`).
  * Delta-encoding 5-tuple relatif standar LSP kanthi sortir kaku (line ASC, character ASC), pencegahan duplikat, lan bebas overlapping.
  * Resolusi shadowing leksikal: parameter fungsi tetep diklasifikasikake minangka `parameter` ing njero fungsi sanajan padha jeneng karo variabel global.
  * Pembeda cetha antarane fungsi pangguna (`function`), metode struct (`method`), konstruktor `wiwiti` (`method` + `declaration`), field/properti (`property`), lan tembung kunci `iki`/`super`.
  * Dhukungan namespace modul (`impor ... minangka math` $\to$ `namespace`) sarta simbol impor selektif mawa alias.
  * Fungsi bawaan (built-ins) otomatis entuk modifier `defaultLibrary`.
  * Proteksi lengkap marang string literal lan komentar: ora ana token simbol utawa tembung kunci sing katut ing njero teks string utawa komentar.
  * Presisi karakter UTF-16 lan toleransi dhuwur marang dokumen malformed (ora tau crash).

---

## Capability Matrix

| No | Kapabilitas LSP | Metode Protocol | Status |
| :-: | :--- | :--- | :---: |
| 1 | **Diagnostics** | `textDocument/publishDiagnostics` | ✅ |
| 2 | **Completion** | `textDocument/completion` | ✅ |
| 3 | **Hover** | `textDocument/hover` | ✅ |
| 4 | **Definition** | `textDocument/definition` | ✅ |
| 5 | **Document Symbols** | `textDocument/documentSymbol` | ✅ |
| 6 | **References** | `textDocument/references` | ✅ |
| 7 | **Rename** | `textDocument/rename` | ✅ |
| 8 | **Signature Help** | `textDocument/signatureHelp` | ✅ |
| 9 | **Formatting** | `textDocument/formatting` | ✅ |
| 10 | **Code Actions** | `textDocument/codeAction` | ✅ |
| 11 | **Semantic Tokens** | `textDocument/semanticTokens/full` | ✅ |

*Cathetan: Server mung ngiklanake kapabilitas sing bener-bener wis diimplementasikake lan lolos uji kanthi lengkap.*

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
    ├── src/symbols.js (Hierarchical outline symbols)
    ├── src/signatureHelp.js (Signature help provider)
    ├── src/formatter.js (Deterministic code formatter)
    ├── src/codeActions.js (Code Actions & Quick Fix provider)
    └── src/semanticTokens.js (Semantic Tokens provider)
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
* `--version`, `-v`: Nampilake versi Language Server (`v1.3.0`).
* `--debug`: Ngaktifake logging diagnostik lan debug menyang `stderr`.
* `--stdio`: Migunakake transport stdio kanggo protokol JSON-RPC (standar LSP).

---

## Pengujian Unit

Kabeh tes unit LSP disedhiyakake ing direktori `test/`:

```bash
# Nglakokake kabeh 12 tes unit LSP
node test/run_tests.js
```

Daftar 12 Berkas Tes Unit:
1. `test/diagnostics.test.js`: Validasi diagnostik sintaks, semantik, duplikasi deklarasi, lan cycle guard.
2. `test/definitions.test.js`: Validasi go-to-definition lokal lan cross-file kanthi URI kanonik.
3. `test/completion.test.js`: Validasi autokomplit cakupan, anggota struct, `iki`, `super`, lan modul.
4. `test/hover.test.js`: Validasi hover jinis data, fungsi, struct, lan built-in.
5. `test/symbols.test.js`: Validasi outline hierarkis dokumen.
6. `test/modules.test.js`: Validasi analisis modul lan siklus impor.
7. `test/references.test.js`: Validasi Find All References (variabel lokal/global/shadowed, parameter, fungsi, struct, metode, inheritance super, selective import, namespace).
8. `test/rename.test.js`: Validasi Rename Symbol (deklarasi, referensi, cakupan lokal, shadowing, fungsi, struct, field, metode, inheritance super, proteksi built-in/keyword/wiwiti/string/komentar, validasi identifier, deteksi tabrakan leksikal, sarta WorkspaceEdit).
9. `test/signatureHelp.test.js`: Validasi Signature Help & Active Parameter (fungsi pangguna, parameter bersarang, ekspresi, impor selektif/alias, namespace modul, metode struct, metode warisan, override, super, konstruktor, super constructor, built-in metadata, string/komentar/array/objek safety, sarta isolasi malformed input).
10. `test/formatter.test.js`: Validasi Formatting (4 spasi, operator spacing, cuddled keywords, object multiline, array inline, CRLF/LF, idempotensi, lan malformed safety).
11. `test/codeActions.test.js`: Validasi Code Actions (Organize Imports, duplicate removal, unused imports, typo QuickFix, missing import QuickFix, lan context.only filter).
12. `test/semanticTokens.test.js`: Validasi Semantic Tokens (13 token types, 2 modifiers, delta encoding, scope shadowing, defaultLibrary, strings & comments safety, UTF-16, lan determinisme).

---

## Lisensi

MIT License.
