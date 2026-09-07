# Jawalang Project Status & Architecture Report

**Version**: `v1.2.0` (Interactive REPL & Core), Baseline `v1.1.0` (NPM Distribution)  
**Status**: Feature Complete, Stable, Interactive REPL Ready, & 100% Portable  
**Tanggal**: 7 September 2026  

---

## 1. Ringkesan Proyèk (Executive Summary)

Jawalang yaiku basa pamrograman mandiri kanthi tembung kunci lan semantik adhedhasar basa Jawa. Proyèk iki wis rampung ngliwati kabeh fase pangembangan utama: wiwit saka implementasi inti pambangun basa (Lexer, Parser, AST, Interpreter), sistem jinis data, fungsi minangka first-class citizen (`guna`), sistem modul modular (V1-V3), struktur data objek lan struct kanthi konsep OOP (konstruktor, method, inheritance, `super`), nganti integrasi lengkap ing sistem operasi Windows (CLI, native launcher `jawa.exe`, installer HKCU, asosiasi berkas `.jawa`, context menu Explorer), Language Server Protocol (LSP), sarta ekstensi resmi VS Code.

Ing tonggak **V1.0.1**, infrastruktur proyek wis diresiki kanthi total saka hardcoded path, ndadekake repository iki portabel sacara absolut lan bisa dikloning menyang folder utawa drive apa wae tanpa konfigurasi manual.

---

## 2. Arsitektur Subsistem (Architecture & Subsystems)

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Tooling                        │
│  ┌────────────────────────────┐ ┌────────────────────────┐  │
│  │    VS Code Extension       │ │ Language Server (LSP)  │  │
│  │ (tmLanguage, snippets, UI) │ │(Diagnostics, Hover,etc)│  │
│  └─────────────┬──────────────┘ └───────────┬────────────┘  │
└────────────────┼────────────────────────────┼───────────────┘
                 │                            │
┌────────────────┼────────────────────────────┼───────────────┐
│                ▼                            ▼               │
│               CLI Engine & Native Launcher                  │
│       ┌───────────────┐ ┌─────────────┐ ┌───────────────┐   │
│       │  bin/jawa.exe │ │ bin/jawa.js │ │  bin/jawa.cmd │   │
│       └───────┬───────┘ └──────┬──────┘ └───────┬───────┘   │
│               └───────────┬────┘────────────────┘           │
│                           ▼                                 │
│                      src/cli.js                             │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Language Runtime                     │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐  │
│  │ src/lexer.js │ ──> │src/parser.js │ ──> │     AST     │  │
│  └──────────────┘     └──────────────┘     └──────┬──────┘  │
│                                                   ▼         │
│                                         ┌─────────────────┐ │
│                                         │src/interpreter.js││
│                                         └────────┬────────┘ │
│                                                  ▼          │
│                                         ┌─────────────────┐ │
│                                         │src/module_loader│ │
│                                         └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.1. Lexer (`src/lexer.js`)
Tokenizer adhedhasar regular expression sing ngowahi teks kode mentah dadi stream token mawa informasi baris lan kolom (`loc`). Ndhukung tembung kunci basa Jawa (`gawe`, `tetep`, `yen`, `liyane`, `nalika`, `saben`, `mupangate`, `guna`, `bali`, `coba`, `tangkep`, `pungkasan`, `uncalake`, `struktur`, `anyar`, `iki`, `super`, `ekspor`, `impor`, `minangka`).

### 2.2. Parser (`src/parser.js`)
Recursive Descent Parser sing mbangun Abstract Syntax Tree (AST) kanthi validasi kesalahan sintaks sing cetha lan format pesen kesalahan mawa indikator pointer visual (`^`).

### 2.3. Interpreter (`src/interpreter.js`)
Tree-walking interpreter mawa manajemen *lexical environment*, penanganan eksepsi (`coba` / `tangkep` / `uncalake`), fungsi kelas siji (closures, callbacks), sarta sistem pewarisan berorientasi objek (`struktur`, `turunan_saka`, `super`).

### 2.4. Module System (`src/module_loader.js`)
Sistem modul mandiri mawa caching adhedhasar canonical path (`fs.realpathSync.native`), isolasi scope, ndhukung ekspor variabel, fungsi, lan struct, sarta impor relatif sing independen saka direktori pemanggilan (CWD).

### 2.5. Windows CLI & Launcher (`src/launcher/jawa.cs`, `src/cli.js`, `bin/`)
- `bin/jawa.exe`: Executable native C# compiled via Roslyn/CSC, kanthi icon resmi Jawalang.
- `src/cli.js`: Driver CLI kanthi verifikasi ekstensi `.jawa`, pelaporan kesalahan sing ramah pangguna, flag `--version`, `--help`, lan `--debug`.
- Installer PowerShell mandiri (`scripts/install.ps1`) kanggo registrasi Windows Explorer tanpa Administrator rights.

### 2.6. Language Server Protocol (`language-server/`)
Server LSP mandiri mawa implementasi JSON-RPC liwat stdio. Ndhukung:
- Diagnostics (deteksi sintaks, variabel/fungsi ora dingerteni, parameter mismatch).
- Go to Definition (variabel, fungsi, struct, parameter, impor lintas modul).
- Autocompletion (kata kunci, variabel ing scope, member instance struct `iki.`, namespace ekspor modul).
- Hover Tooltip (jinis data, dokumentasi fungsi built-in, struktur method).
- Document Symbols (hirarki navigasi simbul berkas).

### 2.7. VS Code Extension (`vscode-extension/`)
Ekstensi resmi mawa sintaks grammar TextMate (`source.jawa`), konfigurasi tanda kurung otomatis, snippet kode Jawa lengkap, sarta integrasi klien LSP.

---

## 3. Inventarisasi & Status Pengujian (Test Suites Inventory)

Kabeh suite tes dievaluasi lan diverifikasi kanthi asil **100% PASS**:

| Kategori Tes | Jumlah Suite / Kasus | Asil | Deskripsi |
|---|:---:|:---:|---|
| **Positive Example Programs** | 27 berkas | **PASS (27/27)** | Eksekusi lengkap program tuladha saka dasar nganti OOP lan modul. |
| **Negative Error Cases** | 19 berkas | **PASS (19/19)** | Verifikasi kabeh kesalahan sintaks lan runtime mandheg mawa exit code 1. |
| **Scratch Test Runners** | 16 suite | **PASS (16/16)** | Pengujian fitur jero (struct, dot notation, higher-order, CLI, module v2/v3). |
| **Language Server (LSP)** | 6 suite | **PASS (6/6)** | Diagnostics, Definition, Completion, Hover, Symbols, Module Resolution. |
| **VS Code Extension** | 8 suite | **PASS (8/8)** | Manifest, grammar scopes, bracket pairs, LSP client settings, packaging. |
| **Distribution Hardening** | 10 kasus | **PASS (10/10)** | Validasi launcher, zero path leak, installer HKCU, quoted paths. |
| **Portability Verification** | 11 kategori | **PASS (11/11)** | Verifikasi otomatis scanner `scratch/test_portability.js`. |

**Total Pengujian Inti**: 62 unit program/runner regresi + 24 unit tooling/portability = **86+ test checks lulus 100%**.

---

## 4. Validasi Portabilitas V1.0.1

Asil scanner otomatis `scratch/test_portability.js`:

```text
=== Jawalang V1.0.1 Portability Validation ===
Hardcoded Path Audit ......... PASS
Dynamic Project Root ......... PASS
Scratch Runners .............. PASS
NPM Test Portability ......... PASS
LSP Test Portability ......... PASS
CLI Portability .............. PASS
Module Resolution ............ PASS
VS Code Test Portability ..... PASS
Installer Portability ........ PASS
Release Script ............... PASS
Clean Clone Test ............. PASS
TOTAL: 11/11 PASS
```

---

## 5. Watesan & Cathetan Arsitektur (Known Limitations)

1. **Model Eksekusi Sinkron**:
   Interpreter mlaku kanthi cara evaluasi AST langsung sacara sinkron. Fitur asinkron (`async`/`await`, event loop non-blocking kustom) dudu target kanggo rilis iki.
2. **Pustaka Standar I/O & Matematika**:
   Manipulasi I/O saiki fokus ing `tulis`, `takon`, sarta manipulasi array/objek/string liwat built-in. Manipulasi berkas sistem (file system API langsung saka basa Jawa) disengaja durung dibukak kanggo njaga keamanan eksekusi.
3. **Platform Native Launcher**:
   Launcher binary `bin/jawa.exe` dikhususake kanggo arsitektur Windows x64. Ing platform Unix/macOS, pangguna bisa nggunakake `node bin/jawa.js` utawa shell script wrapper langsung.
4. **REPL History Persistence**:
   Riwayat baris perintah REPL saiki disimpen sajrone sesi aktif proses lumaku lan durung disimpen sacara permanen menyang file riwayat disk (`.jawa_history`).
