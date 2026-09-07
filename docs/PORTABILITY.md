# Jawalang Portability & Environment Guide

Panduan iki nerangake arsitektur portabilitas Jawalang, syarat lingkungan sistem, cara instalasi mandiri, verifikasi tes otomatis, sarta penanganan path ing macem-macem lingkungan eksekusi.

---

## 1. Ringkesan Portabilitas (Portability Overview)

Wiwit rilis **V1.0.1 (Portability & Infrastructure Cleanup)**, kabeh komponen Jawalang wis 100% bebas saka ketergantungan path absolut pangembang (kayata `D:\Jawascript` utawa path profil pangguna tartamtu).

Repository iki bisa:
- Dikloning menyang folder utawa drive apa wae (`C:`, `D:`, `E:`, lsp.).
- Dijaluk saka folder sing ngemot karakter spasi (contone: `C:\Proyek Kula\Jawalang`).
- Dijaluk liwat Working Directory (CWD) apa wae tanpa ngrusak resolusi impor modul relatif.
- Dijaluk lan dites langsung tanpa mbutuhake langkah `npm install` amarga modul inti ora nggunakake dependensi pihak katelu (zero npm dependencies for core interpreter).

---

## 2. Syarat Sistem (System Requirements)

| Komponen | Syarat Minimal | Katerangan |
|---|---|---|
| **Sistem Operasi** | Windows 10 / 11 (64-bit) | Kanggo native launcher `jawa.exe`, PowerShell scripts, lan registrasi Windows Explorer. |
| **Runtime Node.js** | Node.js v16.0.0+ | Inti lexer, parser, interpreter, lan LSP server mlaku ing dhuwur Node.js runtime. |
| **PowerShell** | PowerShell 5.1+ utawa PowerShell 7+ | Kanggo script `build-launcher.ps1`, `install.ps1`, lan `package-release.ps1`. |
| **C# Compiler (csc.exe)** | .NET Framework 4.x / Roslyn | Kasedhiya otomatis ing `%SystemRoot%\Microsoft.NET\Framework64\v4.0.30319\csc.exe`. |
| **VS Code (Opsional)** | VS Code v1.75.0+ | Kanggo extension Jawalang lan Language Server Protocol (LSP). |

---

## 3. Struktur Resolusi Path Dinamis (Dynamic Path Resolution)

### 3.1. Project Root Discovery
Kabeh script entry point nemtokake project root kanthi dinamis:
- **Node.js Scripts (`bin/jawa.js`, `scratch/*.js`)**:
  ```javascript
  const PROJECT_ROOT = path.resolve(__dirname, '..');
  ```
- **PowerShell Scripts (`scripts/*.ps1`)**:
  ```powershell
  $projectRoot = Split-Path -Parent $PSScriptRoot
  ```
- **Native C# Launcher (`src/launcher/jawa.cs`)**:
  ```csharp
  string baseDir = AppDomain.CurrentDomain.BaseDirectory;
  string projectRoot = Path.GetFullPath(Path.Combine(baseDir, ".."));
  ```

### 3.2. Resolusi Modul Relatif (`impor`)
Nalika program ngimpor modul liyane mawa path relatif:
```jawa
impor "./submodul.jawa" minangka sub
```
Engine `ModuleLoader` ing `src/module_loader.js` tansah ngitung path target adhedhasar folder berkas sing lagi dieksekusi (`path.dirname(currentFilePath)`), **dudu** adhedhasar `process.cwd()`. Iki mesthekake program Jawalang bisa dijaluk saka ngendi wae liwat CLI kanthi asil sing padha persis.

### 3.3. Dhukungan Path Ngemot Spasi (Spaces in Paths)
Kabeh eksekusi child process lan script wrapper nggunakake tanda petik ganda (`"..."`):
```javascript
execSync(`"${process.execPath}" "${cliScript}" "${filePath}"`);
```
Launcher Windows `jawa.cmd`, `jawa.exe`, sarta registrasi context menu Explorer uga wis diverifikasi nampa path kanthi spasi kanthi bener.

---

## 4. Cara Menjalankan Tes Portabilitas & Regresi

Jawalang nyedhiyakake suite verifikasi lengkap sing bisa dijaluk saka sembarang working directory:

### 4.1. Automated Portability Validator (11/11 Checks)
Jalukna scanner portabilitas mandiri:
```bash
node scratch/test_portability.js
```
Output sing diarepake:
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

### 4.2. Full Regression Test Suite (64 Test Suites)
Jalukna regresi lengkap liwat npm:
```bash
npm test
```
Utawa langsung liwat node saka CWD apa wae:
```bash
node <path-menyang-jawalang>/scratch/run_full_regression.js
```
Verifikasi iki nguji:
1. **27 Positive Example Programs** (Sintaks, tipe data, struct, loop, fungsi, higher-order functions, modul, OOP).
2. **19 Negative Error Cases** (Validasi kesalahan sintaks lan runtime ngasilake exit code 1).
3. **16 Scratch Test Suites** (Pengujian jero kanggo dot notation, inheritance, collections, exceptions, CLI).

### 4.3. Language Server Protocol (LSP) Tests
```bash
node language-server/test/run_tests.js
```
Verifikasi 6 suite LSP: Diagnostics, Definitions, Completion, Hover, Document Symbols, lan Module Resolution.

### 4.4. VS Code Extension Tests
```bash
node vscode-extension/tests/test_extension.js
```
Verifikasi 8 suite ekstensi kalebu tmLanguage grammar, language configuration, lan konfigurasi LSP client.

---

## 5. Panduan Instalasi & Mode Portabel

Jawalang nyedhiyakake installer PowerShell sing aman lan fleksibel:

### 5.1. Instalasi Standar (User-level `%LOCALAPPDATA%`)
```powershell
.\scripts\install.ps1
```
- Nyalin payload menyang `%LOCALAPPDATA%\Jawalang`.
- Nambahake `%LOCALAPPDATA%\Jawalang\bin` menyang User `PATH`.
- Ndhaptar ekstensi `.jawa` lan menu klik-tengen Explorer menyang registry `HKCU:\Software\Classes` (tanpa butuh hak Administrator).

### 5.2. Mode Portabel / In-Place
Yen sampeyan pengin nggunakake Jawalang langsung saka folder git clone tanpa nyalin berkas menyang AppData:
```powershell
.\scripts\install.ps1 -Portable
```
Utawa:
```powershell
.\scripts\install.ps1 -InPlace
```

### 5.3. Custom Target Directory
```powershell
.\scripts\install.ps1 -TargetDir "D:\Tools\Jawalang"
```

### 5.4. Resik-resik & Uninstalasi
Kanggo mbusak Jawalang saka registry lan User PATH kanthi resik tanpa ngganggu aplikasi liyane:
```powershell
.\scripts\uninstall.ps1
```
Yen pengin mbusak berkas instalasi ing AppData bebarengan:
```powershell
.\scripts\uninstall.ps1 -RemoveFiles
```

---

## 6. Packaging Standalone Distribution

Kanggo mbangun paket rilis mandiri sing resik:
```powershell
.\scripts\package-release.ps1
```
Script iki kanthi otomatis:
1. Nglakokake kompilasi anyar `bin/jawa.exe` mawa C# compiler sistem.
2. Nggawe struktur folder `release/Jawalang-v<version>-windows-x64/`.
3. Nyalin modul inti (`bin`, `src`, `assets`, `scripts`, `examples`, `package.json`, `Readme.md`, `LICENSE`).
4. Nggawe arsip ZIP mandiri `release/Jawalang-v<version>-windows-x64.zip`.

---

## 7. Troubleshooting Masalah Path

| Gejala Masalah | Penyebab Utama | Solusi |
|---|---|---|
| `Cannot find module ...` nalika mlaku saka terminal liya | Path relatif ora ditangani kanthi bener | Gunakake `path.resolve` utawa `__dirname` ing script pambiyantu. |
| Perbedaan huruf drive (`c:\` vs `C:\`) ing Windows | Windows filesystem case-preserving nanging path lookup case-insensitive | Gunakake `fs.realpathSync.native` kanggo njupuk canonical casing saka OS. |
| `File not found` ing path mawa spasi | Kurang tanda petik ing passing argument CLI | Tansah bungkus path mawa tanda petik ganda (`"${filePath}"`). |
| Script PowerShell dicegah amarga ExecutionPolicy | Kebijakan eksekusi script Windows diwatesi | Jaluk nganggo parameter `-ExecutionPolicy Bypass`. |
