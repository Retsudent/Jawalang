# Indeks Dokumentasi Jawalang (Documentation Index)

[← Beranda Proyèk](../Readme.md)

---

Sugeng rawuh ing dokumentasi resmi **Jawalang**. Ing kene panjenengan bisa nemokake pandhuan teknis lengkap ngenani sintaksis basa, sistem tipe data, pustaka bawaan, arsitektur sistem, sarta perkakas pangembang.

---

## 📚 Dhaptar Topik Dokumentasi

| No | Topik | Katrangan | Tautan Berkas |
| :---: | :--- | :--- | :--- |
| **01** | **Pandhuan Miwiti** | Prasyarat, instalasi (NPM & Windows), lan eksekusi program pisanan | [getting-started.md](getting-started.md) |
| **02** | **Sintaks & Tembung Kunci** | Filosofi sintaks, dhaptar lengkap tembung kunci (*keywords*), lan komentar | [syntax.md](syntax.md) |
| **03** | **Variabel, Tipe Data & Input** | Deklarasi variabel (`gawe`), sistem tipe data runtime, pamariksa `jinis()`, semantik `null`, lan fungsi input `takon()` | [variables.md](variables.md) |
| **04** | **Operator & Precedence** | Operator aritmatika, perbandingan, logika (`lan`, `utawa`, `ora`), lan tingkatan prioritas (*precedence table*) | [operators.md](operators.md) |
| **05** | **Struktur Kontrol** | Percabangan kondisi (`yen`, `liyane`, `liyane yen`), perulangan (`nalika`, `kanggo`), lan kontrol (`mandheg`, `lanjut`) | [control-flow.md](control-flow.md) |
| **06** | **Fungsi & Ruang Lingkup** | Deklarasi fungsi (`guna`, `bali`), parameter, lexical scoping, variable shadowing, lan *first-class functions* | [functions.md](functions.md) |
| **07** | **Struktur Data: Array & Obyek** | Manipulasi array lan obyek/dictionary, dot notation, bracket indexing, deep assignment, lan fungsi bawaan | [data-structures.md](data-structures.md) |
| **08** | **Higher-Order Functions** | Pustaka koleksi fungsional (`terapkan`, `saring`, `itung`, `ana`, `kabeh`, `golek`, `urut`, `balik`, `gabung`) lan utilitas string | [higher-order-functions.md](higher-order-functions.md) |
| **09** | **OOP & Structs** | Pemrograman berorientasi obyek: `bentuk`, konstruktor `wiwiti`, instansiasi `anyar`, `iki`, pewarisan `ngembangake`, lan `super` | [oop.md](oop.md) |
| **10** | **Sistem Modul** | Ekspor simbol (`ekspor`), impor selektif (`impor { ... } saka`), import alias (`minangka`), namespace modul, lan proteksi siklus | [modules.md](modules.md) |
| **11** | **Pananganan Kasalahan** | Sistem eksepsi: `coba`, `tangkep`, `lempar`, propagasi call stack, lan isolasi kontrol | [error-handling.md](error-handling.md) |
| **12** | **Interactive REPL** | Cangkang interaktif: evaluasi ekspresi langsung, deteksi multiline, printah meta (`.bantu`, `.metu`, `.resik`), lan mode debug | [repl.md](repl.md) |
| **13** | **CLI & Windows Tooling** | Antarmuka baris perintah `jawa`, launcher native `jawa.exe`, integrasi Windows Explorer, asosiasi berkas, lan skrip rilis | [cli.md](cli.md) |
| **14** | **Language Server Protocol (LSP)** | Kapabilitas IDE: diagnostik, definition, references, rename, signature help, autocompletion V2, formatting, code actions, lan semantic tokens | [lsp.md](lsp.md) |
| **15** | **Arsitektur & Struktur Proyèk** | Pipa eksekusi (Lexer $\to$ Parser $\to$ Interpreter), arsitektur Language Server, lan peta direktori proyek | [architecture.md](architecture.md) |

---

## 📋 Laporan Audit & Verifikasi Teknis

Ing ngisor iki dokumen verifikasi, audit spesifikasi, lan status proyek:
- [Language Specification Audit V1.2.0](LANGUAGE_SPEC_AUDIT_V1.2.0.md) — Audit kelengkapan spesifikasi leksikal lan sintaksis basa.
- [LSP Capability Audit V1.3.0](LSP_CAPABILITY_AUDIT_V1.3.0.md) — Audit jero kapabilitas Language Server Protocol.
- [NPM Package Audit V1.1.0](NPM_PACKAGE_V1.1.0.md) — Verifikasi integritas paket npm, file whitelisting, lan binary launcher.
- [Portability Validation Report](PORTABILITY.md) — Audit portabilitas lintas folder lan lingkungan Windows.
- [Post-Publish Verification V1.2.0](POST_PUBLISH_VERIFICATION_V1.2.0.md) — Laporan uji live registry npm sawise rilis V1.2.0.
- [Project Status & Test Suite Summary](PROJECT_STATUS.md) — Ringkesan lengkap status milestone lan 670+ tes otomatis.

---

[← Bali menyang Beranda Proyèk](../Readme.md)
