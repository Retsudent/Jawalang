# Jawalang V1.1.0 — NPM Package Implementation Report

**Milestone**: Jawalang V1.1.0 (NPM Distribution)  
**Package**: `jawalang@1.1.0`  
**Tarball**: `jawalang-1.1.0.tgz`  
**Status**: `PASS` (Ready for Publication upon explicit user approval)  
**Tanggal**: 7 September 2026  

---

## 1. Changes Implemented

Ing implementasi Fase 2 iki, owah-owahan kasebut ditindakake kanthi teliti tanpa ngowahi sintaks utawa semantik runtime Jawalang:

1. **`package.json` Hardening & Whitelist**:
   - Nganyari versi saka `1.0.0` menyang `1.1.0`.
   - Nambahake pemetaan binary ganda: `"jawa": "bin/jawa.js"` lan `"jawalang": "bin/jawa.js"`.
   - Nambahake whitelist ketat `"files"` mung kanggo 10 berkas runtime inti (`bin/jawa.js`, `src/*.js`, `index.js`, `Readme.md`, `LICENSE`).
   - Nambahake deklarasi batas runtime `"engines": { "node": ">=16.0.0" }`.
   - Nambahake metadata resmi: repository (`git+https://github.com/Retsudent/Jawalang.git`), homepage, bugs tracker, lan keywords.
   - Nambahake skrip `"test:portability": "node scratch/test_portability.js"`.

2. **Normalisasi Line Endings `bin/jawa.js`**:
   - Ngowahi line endings saka CRLF (`\r\n`) dadi murni LF (`\n`).
   - Mbuktekake baris pisanan yaiku shebang standar Unix `#!/usr/bin/env node` tanpa karakter carriage return (`\r`) sing bisa ngrusak eksekusi ing Linux lan macOS.

3. **Proteksi Modul Programmatik `index.js`**:
   - Nambahake guard `if (require.main === module)` supaya eksekusi CLI lawas (`node index.js berkas.jawa`) tetep lumaku.
   - Ngekspor API programmatik resmi: `lexer`, `parser`, `interpreter`, `runFile`, `runSource`, `VERSION`, lan `HELP_TEXT` tanpa micu `process.exit()`.

4. **Automated NPM Package Validation Suite**:
   - Nggawe [`scratch/test_npm_api.js`](file:///c:/Jawalang/scratch/test_npm_api.js) kanggo verifikasi ekspor pustaka Node.js.
   - Nggawe [`scratch/test_npm_package.js`](file:///c:/Jawalang/scratch/test_npm_package.js) sing nguji 15 poin verifikasi packaging sacara otomatis (instalasi lokal, global, `npx`, modul, input `takon`, lan error handling).

---

## 2. Updated `package.json`

```json
{
  "name": "jawalang",
  "version": "1.1.0",
  "description": "Basa pamrograman prasaja mawa sintaks basa Jawa",
  "main": "index.js",
  "bin": {
    "jawa": "bin/jawa.js",
    "jawalang": "bin/jawa.js"
  },
  "files": [
    "bin/jawa.js",
    "src/cli.js",
    "src/lexer.js",
    "src/parser.js",
    "src/interpreter.js",
    "src/module_loader.js",
    "index.js",
    "Readme.md",
    "LICENSE"
  ],
  "engines": {
    "node": ">=16.0.0"
  },
  "scripts": {
    "test": "node scratch/run_full_regression.js",
    "test:portability": "node scratch/test_portability.js",
    "build": "powershell -ExecutionPolicy Bypass -File scripts/build-windows.ps1",
    "package": "powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Retsudent/Jawalang.git"
  },
  "homepage": "https://github.com/Retsudent/Jawalang",
  "bugs": {
    "url": "https://github.com/Retsudent/Jawalang/issues"
  },
  "keywords": [
    "jawalang",
    "programming-language",
    "javanese",
    "interpreter",
    "cli"
  ],
  "author": "",
  "license": "MIT"
}
```

---

## 3. Package Contents

Isi tarball final (`jawalang-1.1.0.tgz`) diisolasi murni mung ngemot 10 berkas:

```text
package/
├── LICENSE
├── Readme.md
├── package.json
├── index.js
├── bin/
│   └── jawa.js
└── src/
    ├── cli.js
    ├── lexer.js
    ├── parser.js
    ├── interpreter.js
    └── module_loader.js
```

### Excluded Verification:
- **`scratch/`**: 0 berkas lumebu (100% excluded).
- **`release/`**: 0 berkas lumebu (100% excluded).
- **`scripts/`**: 0 berkas lumebu (100% excluded).
- **`assets/`**: 0 berkas lumebu (100% excluded).
- **`language-server/`**: 0 berkas lumebu (100% excluded).
- **`vscode-extension/`**: 0 berkas lumebu (100% excluded, kalebu 900+ berkas `node_modules`).
- **`.git/` & biner `.exe`**: 0 berkas lumebu (100% excluded).

---

## 4. Tarball Size Comparison

| Metrik | Sadurunge Audit (V1.0.0) | Sasampune Packaging (V1.1.0) | Penghematan |
|---|:---:|:---:|:---:|
| **Total Berkas** | 1.026 berkas | **10 berkas** | **-99.0%** |
| **Unpacked Size** | 5.9 MB | **238.7 kB** | **-96.0%** |
| **Packed Tarball Size** | 1.2 MB | **45.7 kB** | **-96.2%** |

Ukuran final 45.7 kB entheng banget, cepet diundhuh liwat jaringan alon, lan resik saka kembung (bloatware).

---

## 5. Local Install Test

Pengujian instalasi lokal ditindakake ing direktori resik anyar ing jaba repository mawa path sing ngemot spasi (`%TEMP%\Jawalang NPM Test Space <timestamp>`):

```bash
npm init -y
npm install c:\Jawalang\jawalang-1.1.0.tgz
```

- **Asil**: Lulus 100%. Struktur `node_modules/jawalang` terpasang kanthi berkas biner ing `node_modules/.bin/jawa` lan `node_modules/.bin/jawalang`.

---

## 6. Global Install Test

```bash
npm install -g c:\Jawalang\jawalang-1.1.0.tgz
```

- **Asil**: Lulus 100%.
- **Verifikasi Lokasi Executable**:
  ```text
  where.exe jawa     ──> C:\Users\<User>\AppData\Roaming\npm\jawa.cmd
  where.exe jawalang ──> C:\Users\<User>\AppData\Roaming\npm\jawalang.cmd
  ```
  Kekaron perintah resmi ngarah menyang direktori global npm, dudu path proyek lokal.

---

## 7. `npx` Compatibility Test

Ing direktori lokal tanpa dependensi global:
- `npx jawa --version` ──> `Jawalang v1.1.0` (**PASS**)
- `npx jawalang --version` ──> `Jawalang v1.1.0` (**PASS**)
- `npx jawa hello.jawa` ──> `Sugeng Rawuh V1.1.0` (**PASS**)
- `npx jawalang hello.jawa` ──> `Sugeng Rawuh V1.1.0` (**PASS**)

---

## 8. CLI Command Execution Test

Saka sembarang folder kerja terminal Windows (PowerShell lan CMD):
```bash
jawa --version       # Output: Jawalang v1.1.0 (PASS)
jawalang --version   # Output: Jawalang v1.1.0 (PASS)
jawa --help          # Menampilkan pesan bantuan lengkap (PASS)
jawalang --help      # Menampilkan pesan bantuan lengkap (PASS)
jawa program.jawa    # Menjalankan program Jawalang (PASS)
jawalang program.jawa# Menjalankan program Jawalang (PASS)
```

---

## 9. Module Resolution Test

Pengujian modul impor relatif (`impor "./helper.jawa" minangka h`) ditindakake saka folder kerja sing beda karo lokasi berkas skrip:
- **Fixture**: `mod_sub/helper.jawa` ngekspor fungsi `petung(a, b) { bali a * b }`. `mod_sub/main.jawa` ngimpor `./helper.jawa`.
- **Eksekusi**: `jawa mod_sub/main.jawa` dijaluk saka direktori root temp.
- **Asil**: `42` (**PASS**). Resolusi modul tetep setya ngetutake folder berkas importer, dudu working directory pemanggil.

---

## 10. Input Test (`takon()`)

Pengujian fungsi built-in standard input liwat npm binary:
- **Program**:
  ```jawa
  gawe jeneng = takon("Jeneng: ")
  tulis "Sugeng " + jeneng
  ```
- **Input Pipa**: `Budi\n`
- **Output**: `Sugeng Budi` (**PASS**).
- **Asil**: `fs.readSync(0, ...)` mlaku sampurna liwat wrapper npm shim.

---

## 11. Runtime Regression Results

Eksekusi suite regresi lengkap Jawalang (`npm test`):
- **Positive Test Cases**: **27/27 PASS (100%)**
- **Negative Error Cases**: **19/19 PASS (100%)**
- **Scratch Negative Runners**: **16/16 PASS (100%)**
- **Total Status**: `FINAL REGRESSION STATUS: ALL PASS (100%)`.

---

## 12. Language Server Protocol (LSP) Regression

Eksekusi pengujian suite LSP (`node language-server/test/run_tests.js`):
- Diagnostics Tests: **PASS**
- Definitions Tests: **PASS**
- Completion Tests: **PASS**
- Hover Tests: **PASS**
- Document Symbols Tests: **PASS**
- Modules Tests: **PASS**
- **Total Status**: `ALL LANGUAGE SERVER UNIT TESTS PASSED (6/6 SUITES)`.

---

## 13. VS Code Extension Regression

Eksekusi pengujian ekstensi (`node vscode-extension/tests/test_extension.js`):
- Manifest & contributions: **PASS**
- Language configuration: **PASS**
- Syntax scopes & tmLanguage: **PASS**
- Snippets: **PASS**
- Extension exports: **PASS**
- Icon SVG: **PASS**
- Readme & Changelog: **PASS**
- VSIX artifact integrity: **PASS**
- **Total Status**: `Extension Tests Result: 8/8 passed`.

---

## 14. Portability Regression

Eksekusi pengujian portabilitas (`npm run test:portability`):
- Hardcoded Path Audit: **PASS**
- Dynamic Project Root: **PASS**
- Scratch Runners: **PASS**
- NPM Test Portability: **PASS**
- LSP Test Portability: **PASS**
- CLI Portability: **PASS**
- Module Resolution: **PASS**
- VS Code Test Portability: **PASS**
- Installer Portability: **PASS**
- Release Script: **PASS**
- Clean Clone Test: **PASS**
- **Total Status**: `TOTAL: 11/11 PASS`.

---

## 15. Security & Dependency Audit

- **`npm audit`**: 0 vulnerabilities (0 dependensi pihak katelu).
- **Sensitive files check**: 0 kredensial, 0 token, 0 berkas `.env`, 0 path pangembang pribadi.
- **Node system API**: Ora ana panggunaan `child_process`, `eval()`, utawa panulisan berkas `fs.writeFile` ing njero kode runtime.

---

## 16. `npm publish --dry-run` Verification

Eksekusi perintah dry-run pungkasan sadurunge publikasi:

```text
npm notice package: jawalang@1.1.0
npm notice Tarball Contents
npm notice 1.1kB LICENSE
npm notice 61.2kB Readme.md
npm notice 50B bin/jawa.js
npm notice 1.5kB index.js
npm notice 1.1kB package.json
npm notice 4.0kB src/cli.js
npm notice 91.9kB src/interpreter.js
npm notice 11.2kB src/lexer.js
npm notice 4.4kB src/module_loader.js
npm notice 62.2kB src/parser.js
npm notice Tarball Details
npm notice name: jawalang
npm notice version: 1.1.0
npm notice filename: jawalang-1.1.0.tgz
npm notice package size: 45.7 kB
npm notice unpacked size: 238.7 kB
npm notice total files: 10
npm notice Publishing to https://registry.npmjs.org/ with tag latest and default access (dry-run)
+ jawalang@1.1.0
```

Hasil: **0 Warning, 0 Error, Siap 100%**.

---

## 17. Known Limitations

1. **Publikasi Resmi**: `npm publish` sengaja durung dilakokake, ngenteni persetujuan eksplisit saka pangguna.
2. **Lingkungan Linux & macOS Non-Windows**: Senadyan kabeh kode runtime nggunakake standar POSIX Node.js lan shebang LF, verifikasi ing mesin kernel Linux lan macOS fisik durung dicoba ing sesi iki amarga keterbatasan sistem operasi host (Windows).
3. **Pemisahan Standalone Windows**: Biner `bin/jawa.exe` ora kalebu ing package npm, nanging tetep kasedhiya ing repository kanggo instalasi Windows Explorer mandiri.

---

## 18. Manual vs Automated Verification Breakdown

### AUTOMATED (Kabeh Teruji liwat Skrip & 100% Lulus)
- Metadata & format `package.json` (Automated).
- Line ending LF lan shebang `bin/jawa.js` (Automated).
- Ekspor modul programmatik `index.js` (Automated liwat `scratch/test_npm_api.js`).
- Pambangunan lan isi tarball `jawalang-1.1.0.tgz` (Automated).
- Instalasi lokal lan global tarball ing path mawa spasi (Automated liwat `scratch/test_npm_package.js`).
- Eksekusi `npx jawa` lan `npx jawalang` (Automated).
- Eksekusi `jawa` lan `jawalang` CLI global (Automated).
- Resolusi modul impor relatif saka direktori eksternal (Automated).
- Standard input `takon()` liwat biner npm (Automated).
- Regresi kesalahan runtime lan exit code 1 (Automated).
- Regresi inti 62 suite, LSP 6 suite, Extension 8 suite, lan Portability 11 suite (Automated).
- Verifikasi `npm publish --dry-run` (Automated).

### MANUAL (Diverifikasi Langsung dening Operator)
- Konfirmasi kasedhiyan jeneng paket `jawalang` ing npm registry publik (404 Not Found).
- Konfirmasi pituduh path `where.exe jawa` lan `where.exe jawalang` ing User AppData.

### NOT VERIFIED (Amarga Keterbatasan Lingkungan Host)
- Eksekusi fisik ing kernel asli Linux (Ubuntu / Alpine).
- Eksekusi fisik ing kernel asli macOS (Darwin).
