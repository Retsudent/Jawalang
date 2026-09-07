# Changelog

Kabeh owah-owahan wigati ing Jawalang Language Server bakal dicathet ing berkas iki.

Format iki manut [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), lan project iki manut [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-07

### Added
- **Language Server Protocol (LSP) Core Engine**
  - Implementasi standalone LSP server liwat stdio transport nganggo paket resmi `vscode-languageserver`.
  - In-memory document manager (`TextDocuments`) kanthi validasi incremental lan cache pinter.
  - Positioning pipeline: `lineOffsets` binary-search ing `src/lexer.js` lan zero-based range/position ing `src/parser.js`.
- **Fitur Diagnostik Semantik**
  - Laporan kesalahan sintaks kanthi rentang baris lan kolom persis.
  * Deteksi variabel lan fungsi sing durung didefinisi (`ora ditemokake`).
  * Deteksi ketidaksesuaian cacah parameter fungsi (warning).
  * Validasi panggunaan tembung kunci kontekstual `iki` lan `super`.
- **Go To Definition Provider**
  - Navigasi leksikal kanggo variabel, parameter fungsi, deklarasi fungsi, lan deklarasi struct.
  - Cross-file navigation kanggo simbol ekspor saka modul sing diimpor liwat klausa `impor { ... } saka "..."`.
- **Semantic Completion Provider**
  - Autocomplete simbol lokal, parameter fungsi, fungsi, lan struct ing cakupan aktif.
  - Member access completion: `instance.<field/method>`, `iki.<field/method>`, lan `super.<method>`.
  - Namespace completion: nampilake mung simbol sing diekspor dening modul target nalika ngetik `namespace.<export>`.
  - Dhaptar 24 fungsi built-in lan tembung kunci mawa dokumentasi.
- **Semantic Hover Provider**
  - Inferensi tipe ekspresi dasar (`string`, `number`, `boolean`, `array`, `object`, `instance of <Struct>`).
  - Dokumentasi fungsi, tandha tangan parameter, lan ringkesan struct.
- **Document Symbols Provider**
  - Hirarki outline dokumen kanggo struct (class), field, konstruktor, metode, fungsi, lan variabel.
- **Module Awareness & Security**
  - Static module export analyzer tanpa ngeksekusi kode pangguna (`no arbitrary execution`).
  - Cycle detection kanggo nyegah loop rekursi ing impor siklis.
- **CLI Executable**
  - `bin/jawalang-language-server.js` kanthi dhukungan opsi `--help`, `--version`, `--debug`, lan `--stdio`.
- **VS Code Extension Integration**
  - Integrasi Language Client menyang ekstensi VS Code kanthi setelan konfigurasi `jawalang.languageServer.enabled`, `path`, lan `debug`.
  - Fallback otomatis menyang provider statis nalika LSP dipateni utawa gagal mlaku.
