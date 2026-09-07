const fs = require('fs');
const path = require('path');

const readmePath = 'D:\\Jawascript\\Readme.md';
let content = fs.readFileSync(readmePath, 'utf8');

const targetSection = `## 🚀 Jawalang CLI & Windows Integration V1.1 — Distribution Hardening

Jawalang nyedhiyakake antarmuka baris perintah (CLI) resmi mawa printah \`jawa\`, script launcher \`jawa.js\` / \`jawa.cmd\`, sarta executable native Windows \`jawa.exe\` kang 100% portabel lan siap didistribusikake menyang komputer Windows liyane.

---

### 1. Prerequisites (Prasyarat)

Jawalang mbutuhake **Node.js (v14+)** kanggo nglakokake runtime JavaScript ing mburi layar.
- Priksa instalasi Node.js kanthi ngetik: \`node -v\`.
- Yen durung kasedhiya, undhuh saka [https://nodejs.org](https://nodejs.org).
- Installer \`install.ps1\` bakal otomatis mriksa kasedhiyan Node.js sadurunge nerusake proses instalasi.

---

### 2. Installation (Instalasi)

Jawalang nyedhiyakake instalasi per-user ing Windows (\`HKCU\`) tanpa mbutuhake hak Administrator:

#### A. Standard Distribution Mode (Disaranake kanggo Pangguna Umum)
Nginstal Jawalang kanthi mandiri menyang \`%LOCALAPPDATA%\\Jawalang\`:
\`\`\`powershell
.\\scripts\\install.ps1
\`\`\`

#### B. Portable / In-Place Mode (Kanggo Pangembang / Git Clone)
Nginstal langsung ing folder papan Jawalang saiki tanpa nyalin berkas:
\`\`\`powershell
.\\scripts\\install.ps1 -Portable
\`\`\`

#### C. Custom Installation Directory
\`\`\`powershell
.\\scripts\\install.ps1 -TargetDir "C:\\Tools\\Jawalang"
\`\`\`

Script iki kanthi otomatis:
1. Mriksa prasyarat Node.js.
2. Mesthekake launcher \`jawa.exe\` kasedhiya (utawa ngompilasi otomatis nganggo \`csc.exe\`).
3. Nyalin payload menyang lokasi target (yen mode distribusi).
4. Nambahake folder \`bin\` menyang User \`PATH\` (\`HKCU:\\Environment\`) kanthi case-insensitive lan perlindungan anti-duplikasi (idempotent).
5. Ndhaptar asosiasi berkas \`.jawa\` menyang ProgID \`Jawalang.Source\`.
6. Masang \`DefaultIcon\` resmi (\`assets\\jawalang.ico\`).
7. Ndhaptar Context Menu Explorer (*"Run with Jawalang"*).
8. Nganyari cache Windows Explorer liwat broadcast \`SHChangeNotify\`.

---

### 3. Usage (Panggunaan)

Jalukna program Jawalang liwat terminal (CMD utawa PowerShell):

\`\`\`bash
jawa program.jawa
\`\`\`

Utawa nggunakake sub-command \`run\`:

\`\`\`bash
jawa run program.jawa
\`\`\`

Kekaron printah kasebut ngasilake tumindak sing padha persis. Jawalang nampa:
- Path relatif: \`jawa ./program.jawa\`
- Path absolut: \`jawa C:\\Proyek\\program.jawa\`
- Path mawa spasi: \`jawa "C:\\Proyek Kula\\tes program.jawa"\`

---

### 4. Version & Help

#### Priksa Versi
Mundhut langsung saka siji *source of truth* yaiku \`package.json\`:
\`\`\`bash
jawa --version
# utawa
jawa -v
\`\`\`
Output:
\`\`\`text
Jawalang v1.0.0
\`\`\`

#### Pandhuan (Help)
\`\`\`bash
jawa --help
# utawa
jawa -h
\`\`\`
Output:
\`\`\`text
Jawalang

Usage:
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help

Commands:
  run       Run a Jawalang program
  --version Show Jawalang version
  --help    Show this help message
  --debug   Run with full error stack trace
\`\`\`

---

### 5. Windows Integration & Double-Click

- **Asosiasi Berkas \`.jawa\`**: Berkas \`.jawa\` otomatis kadhaptar menyang \`Jawalang.Source\`.
- **Double-Click Behavior**: Nalika berkas \`.jawa\` diklik dobel ing Windows Explorer, launcher kanthi otomatis mbukak jendhela konsol, nglakokake program, lan nampilake:
  \`\`\`text
  Program wis rampung. Pencet Enter kanggo nutup...
  \`\`\`
  supaya jendhela konsol ora langsung ilang sadurunge pangguna maca asile.
- **Custom Icon (\`assets/jawalang.ico\`)**: Berkas \`.jawa\` nampilake logo resmi Jawalang kanthi resolusi multi-layer (16x16 nganti 256x256).
- **Context Menu Explorer ("Run with Jawalang")**: Klik tengen ing berkas \`.jawa\` ngemot menu *"Run with Jawalang"* mawa lambang resmi kanggo eksekusi cepet.
- **Program Interaktif**: Program kang nggunakake \`takon()\` (kayata \`examples/cli/interactive.jawa\`) lumaku kanthi normal ing jero terminal utawa nalika diklik dobel.

---

### 6. Build & Packaging Release

#### Kompilasi Launcher
\`\`\`powershell
npm run build
# utawa
powershell -ExecutionPolicy Bypass -File scripts\\build-windows.ps1
\`\`\`

#### Nggawe Paket Distribusi Mandiri (Release)
\`\`\`powershell
npm run package
# utawa
powershell -ExecutionPolicy Bypass -File scripts\\package-release.ps1
\`\`\`
Printah iki bakal ngasilake paket distribusi resik ing:
- Folder: \`release/Jawalang-v1.0.0-windows-x64/\`
- Arsip ZIP: \`release/Jawalang-v1.0.0-windows-x64.zip\`

Paket iki bisa langsung disalin menyang komputer Windows liyane lan diinstal liwat \`.\\scripts\\install.ps1\`.

---

### 7. Uninstallation (Uninstalasi)

Kanggo ngresiki kabeh asosiasi registry lan mbusak folder \`bin\` Jawalang saka User PATH kanthi aman:

\`\`\`powershell
.\\scripts\\uninstall.ps1
\`\`\`

Uninstaller mung mbusak entri sing bener-bener digawe dening Jawalang, tanpa ngganggu PATH utawa berkas sistem liyane.

---

### 8. Troubleshooting

- **Printah \`jawa\` ora ditemokake sawise instalasi**: Terminal lawas bisa uga durung maca PATH anyar. Tutup lan bukak maneh jendhela PowerShell / CMD anyar.
- **Ikon durung owah ing Explorer**: Windows Explorer kadhangkala nyimpen cache ikon lawas. Cukup refresh folder utawa miwiti maneh proses Explorer (\`Stop-Process -Name explorer\`).
- **Node.js ora ditemokake**: Priksa manawa Node.js wis kadhaptar ing PATH sistem utawa instal Node.js saka [https://nodejs.org](https://nodejs.org).

---

## 🏗️ Struktur Proyèk

- \`package.json\` — Metadata proyek, konfigurasi \`"bin": { "jawa": "./bin/jawa.js" }\`, lan scripts build/package.
- \`src/cli.js\` — **Core CLI Engine**: Logika verifikasi argumen, format kesalahan, penanganan flag, lan pemanggilan interpreter.
- \`src/launcher/jawa.cs\` — Kode sumber C# kanggo executable native Windows \`jawa.exe\`.
- \`bin/jawa.js\` — Entry point executable Node.js mawa shebang standard.
- \`bin/cli.js\` — Forwarder kompatibilitas lawas menyang \`src/cli.js\`.
- \`bin/jawa.cmd\` — Wrapper batch file kanggo lingkungan CMD / PowerShell.
- \`bin/jawa.exe\` — Executable binary native Windows launcher (~21 KB).
- \`scripts/install.ps1\` — Script instalasi mandiri Windows (idempotent, HKCU, Node prerequisite check).
- \`scripts/uninstall.ps1\` — Script uninstalasi aman lan resik-resik registry/PATH.
- \`scripts/build-windows.ps1\` — Script pambangun launcher Windows.
- \`scripts/package-release.ps1\` — Script otomatis pambungkus paket rilis standalone.
- \`assets/jawalang.ico\` — Windows multi-resolution icon binary.
- \`assets/jawalang.svg\` — Vektor logo asli Jawalang.
- \`src/lexer.js\` — **Tokenizer**: Ngowahi kode mentah dadi deretan token.
- \`src/parser.js\` — **Recursive Descent Parser**: Ngolah token dadi Abstract Syntax Tree (AST).
- \`src/interpreter.js\` — **Interpreter**: Eksekusi AST mawa lexical scoping, struct, method, lan inheritance.
- \`examples/\` — Tuladha program Jawalang lengkap mawa tes-tes fitur.
- \`examples/cli/\` — Test fixture integrasi CLI, modul relatif, lan program interaktif.
- \`release/\` — Direktori paket rilis standalone (\`Jawalang-v1.0.0-windows-x64\` lan \`.zip\`).
`;

const marker = content.indexOf('## 🚀 Jawalang CLI');
if (marker !== -1) {
    content = content.substring(0, marker) + targetSection;
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log('Readme.md updated for V1.1.');
} else {
    content += '\n\n---\n\n' + targetSection;
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log('Readme.md appended for V1.1.');
}
