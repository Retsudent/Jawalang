# Antarmuka Baris Perintah & Tooling Windows (CLI & Windows Tooling)

[← Sadurunge: Interactive REPL](repl.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Language Server Protocol (LSP) →](lsp.md)

---

Jawalang nyedhiyakake antarmuka baris perintah (CLI) resmi mawa printah `jawa` lan `jawalang`, script launcher multiplatform, sarta launcher native Windows `jawa.exe`.

---

## 1. Pandhuan Panggunaan Printah (CLI Usage)

```text
Usage:
  jawa
  jawa repl
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help
```

### Opsi & Sub-Command:
- **`jawa`**: Miwiti sesi cangkang interaktif (REPL) nalika dijaluk ing terminal interaktif.
- **`jawa repl`**: Miwiti sesi cangkang interaktif sacara eksplisit.
- **`jawa <file.jawa>`**: Nglakokake berkas kode sumber Jawalang.
- **`jawa run <file.jawa>`**: Sub-command eksplisit padha karo `jawa <file.jawa>`.
- **`--version` / `-v`**: Nampilake versi resmi Jawalang (kayata `Jawalang v1.2.0`).
- **`--help` / `-h`**: Nampilake pandhuan panggunaan CLI.
- **`--debug`**: Nampilake *full stack trace* Node.js nalika kasalahan dumadi (migunani kanggo debugging).

---

## 2. Dhukungan Path Berkas

Jawalang kanthi otomatis nangani kabeh format path:
```bash
# Path relatif
jawa ./program.jawa
jawa examples/oi.jawa

# Path absolut
jawa C:\Proyek\program.jawa

# Path mawa spasi (diubengi tanda petik)
jawa "C:\Proyek Kula\tes program.jawa"
```

---

## 3. Arsitektur Launcher Native Windows (`jawa.exe`)

Kanggo pengalaman pangguna Windows sing mulus, Jawalang nyedhiyakake launcher native Windows:
- **`bin/jawa.exe`**: Executable native Windows (~21 KB dikompilasi saka `src/launcher/jawa.cs`) sing nemokake instalasi Node.js kanthi otomatis, ngatur path relatif, lan nerusake argumen menyang `bin/jawa.js`.
- **`bin/jawa.cmd`**: Batch file wrapper kanggo kompatibilitas konsol CMD / PowerShell.
- **`bin/jawa.js` & `bin/jawalang.js`**: Skrip executable Node.js mawa shebang standar `#!/usr/bin/env node`.

---

## 4. Integrasi Windows Explorer

Sawise diinstal liwat `scripts/install.ps1`:
1. **Asosiasi Ekstensi Berkas**: Kabeh berkas `.jawa` kanthi otomatis diasosiasikake menyang `Jawalang.Source`.
2. **Lambang Resmi Multi-Layer**: Berkas `.jawa` nampilake lambang resmi Jawalang (`assets/jawalang.ico`) kanthi ukuran 16x16 nganti 256x256.
3. **Menu Klik Tengen ("Run with Jawalang")**: Klik tengen ing berkas `.jawa` ngemot pilihan kanggo langsung nglakokake program kasebut.
4. **Perilaku Klik Dobel (Double-Click)**: Nalika berkas diklik kaping pindho ing Explorer, jendhela konsol bakal mbukak lan nahan layar nganti pangguna mencet Enter:
   ```text
   Program wis rampung. Pencet Enter kanggo nutup...
   ```

---

## 5. Skrip Pambangun & Distribusi (Build & Release)

### Kompilasi Launcher Native
```powershell
npm run build
# utawa
powershell -ExecutionPolicy Bypass -File scripts\build-windows.ps1
```

### Nggawe Paket Rilis Standalone
```powershell
npm run package
# utawa
powershell -ExecutionPolicy Bypass -File scripts\package-release.ps1
```
Skrip iki bakal ngasilake paket distribusi resik ing folder `release/` lan arsip `.zip` sing siyap disebar menyang komputer liya.

### Skrip Instalasi & Uninstalasi
- **Instalasi**: `powershell -ExecutionPolicy Bypass -File scripts\install.ps1`
- **Uninstalasi**: `powershell -ExecutionPolicy Bypass -File scripts\uninstall.ps1`

Skrip uninstaller kanthi resik mbusak kabeh entri registry lan variabel PATH tanpa ngrusak setelan sistem liyane.

---

[← Sadurunge: Interactive REPL](repl.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Language Server Protocol (LSP) →](lsp.md)
