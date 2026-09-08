# Pandhuan Miwiti (Getting Started)

[← Beranda](../Readme.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Sintaks Dasar →](syntax.md)

---

**Jawalang** yaiku basa pamrograman prasaja mawa sintaks basa Jawa sing lumaku ing dhuwur runtime Node.js. Dokumen iki bakal nuntun panjenengan saka instalasi nganti nglakokake program pisanan.

---

## 1. Prasyarat (Prerequisites)

Jawalang mbutuhake **Node.js (v14+)** kanggo nglakokake runtime JavaScript ing mburi layar.

1. Priksa kasedhiyan Node.js ing komputer panjenengan:
   ```bash
   node -v
   ```
2. Yen durung kasedhiya utawa versine luwih lawas saka v14, undhuh lan pasang saka situs resmi: [https://nodejs.org](https://nodejs.org).

---

## 2. Instalasi (Installation)

### A. Instalasi liwat NPM (Disaranake / Multiplatform)

Jawalang kasedhiya sacara resmi ing NPM Registry minangka paket global utawa dependensi proyek:

```bash
# Pasang sacara global
npm install -g jawalang

# Priksa asil instalasi
jawa --version
jawalang --version
```

Panjenengan uga bisa nggunakake `npx` tanpa kudu nginstal sacara permanen:

```bash
# Nglakokake berkas program
npx jawalang program.jawa
npx jawa program.jawa

# Miwiti REPL interaktif
npx jawalang repl
```

---

### B. Instalasi ing Windows (Distribution Mode)

Kanggo lingkungan Windows, Jawalang nyedhiyakake skrip instalasi otomatis sing ngatur variabel `PATH`, masang launcher native `jawa.exe`, ndhaptar ekstensi berkas `.jawa`, lan nambah menu klik tengen Explorer.

Bukak PowerShell lan jalanake skrip instalasi:

```powershell
# Standard Distribution Mode (nginstal menyang %LOCALAPPDATA%\Jawalang)
.\scripts\install.ps1

# Portable / In-Place Mode (kanggo pangembang / clone git)
.\scripts\install.ps1 -Portable

# Custom Target Directory
.\scripts\install.ps1 -TargetDir "C:\Tools\Jawalang"
```

Skrip installer iki kanthi otomatis:
1. Mriksa prasyarat Node.js.
2. Mesthekake launcher native `jawa.exe` kasedhiya (utawa ngompilasi otomatis nganggo `csc.exe`).
3. Nyalin payload menyang lokasi target (yen mode distribusi).
4. Nambahake folder `bin` menyang User `PATH` (`HKCU:\Environment`) kanthi aman tanpa duplikasi (idempotent).
5. Ndhaptar asosiasi berkas `.jawa` menyang ProgID `Jawalang.Source`.
6. Masang lambang resmi (`assets\jawalang.ico`).
7. Ndhaptar Context Menu Explorer (*"Run with Jawalang"*).
8. Nganyari cache Windows Explorer liwat broadcast `SHChangeNotify`.

---

## 3. Program Pisanan: "Halo Jagad!"

Gawe berkas anyar mawa jeneng `halo.jawa`:

```jawa
// halo.jawa
tulis "Halo Jagad Jawalang!"

gawe jeneng = "Budi"
tulis "Sugeng rawuh, " + jeneng
```

Jalukna program kasebut liwat terminal:

```bash
jawa halo.jawa
```

Utawa nganggo alias:

```bash
jawalang halo.jawa
```

Utawa nganggo sub-command `run`:

```bash
jawa run halo.jawa
```

Output ing terminal:
```text
Halo Jagad Jawalang!
Sugeng rawuh, Budi
```

---

## 4. Dhukungan Path Berkas

Jawalang ndhukung macem-macem format path berkas:
- **Path Relatif**: `jawa ./halo.jawa` utawa `jawa examples/oi.jawa`
- **Path Absolut**: `jawa C:\Proyek\halo.jawa`
- **Path mawa Spasi**: `jawa "C:\Proyek Kula\halo jagad.jawa"`

---

## 5. Integrasi Windows & Double-Click

Sawise diinstal ing Windows liwat `install.ps1`:
- **Double-Click**: Berkas `.jawa` bisa langsung diklik kaping pindho (double-click) ing Windows Explorer. Konsol bakal mbukak, nglakokake program, lan nampilake pituduh:
  ```text
  Program wis rampung. Pencet Enter kanggo nutup...
  ```
  saengga jendhela konsol ora langsung ilang sadurunge panjenengan maca asile.
- **Klik Tengen Explorer**: Klik tengen ing berkas `.jawa` ngemot menu *"Run with Jawalang"*.

---

## 6. Shell Interaktif (REPL)

Panjenengan bisa nyoba sintaks Jawalang sacara langsung tanpa gawe berkas kanthi mbukak REPL:

```bash
jawa
# utawa
jawa repl
```

Tuladha interaksi:
```text
Jawalang REPL v1.2.0
Ketik .bantu untuk bantuan.

jawa> gawe a = 10
jawa> gawe b = 20
jawa> a + b
30
jawa> .metu
```

Waca dokumentasi jangkep ing [Dokumentasi REPL](repl.md).

---

## 7. Integrasi VS Code

Pasang ekstensi resmi VS Code kanggo entuk *syntax highlighting*, *autocompletion*, *diagnostics*, *formatting*, lan *code actions*:

```powershell
code --install-extension vscode-extension/jawalang-vscode-1.0.0.vsix
```

Waca dokumentasi jangkep ing [Dokumentasi LSP & VS Code](lsp.md).

---

## 8. Pamecahan Masalah (Troubleshooting)

- **Printah `jawa` ora ditemokake sawise instalasi**: Terminal lawas durung maca variabel `PATH` sing anyar. Tutup kabeh jendela terminal/PowerShell, banjur bukak maneh.
- **Node.js ora ditemokake**: Priksa manawa Node.js wis kadhaptar ing PATH kanthi ngetik `node -v`. Yen durung, instal saka [nodejs.org](https://nodejs.org).
- **Ikon berkas durung owah ing Explorer**: Refresh folder Explorer utawa miwiti maneh proses Windows Explorer liwat Task Manager / PowerShell:
  ```powershell
  Stop-Process -Name explorer
  ```

---

[← Beranda](../Readme.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Sintaks Dasar →](syntax.md)
