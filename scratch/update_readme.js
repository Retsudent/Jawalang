const fs = require('fs');
const path = require('path');

const readmePath = 'D:\\Jawascript\\Readme.md';
let content = fs.readFileSync(readmePath, 'utf8');

const targetSection = `## 🚀 Jawalang CLI & Windows Integration V1

Jawalang nyedhiyakake antarmuka baris perintah (CLI) resmi mawa printah \`jawa\`, script launcher \`jawa.js\` / \`jawa.cmd\`, lan executable native Windows \`jawa.exe\`.

### 1. Installation

Jawalang nyedhiyakake installer otomatis tanpa mbutuhake hak Administrator (per-user installation ing \`HKCU\`):

\`\`\`powershell
.\\scripts\\install.ps1
\`\`\`

Script iki kanthi otomatis:
1. Nggawe lan ngompilasi launcher native \`bin\\jawa.exe\` mawa custom icon Jawalang.
2. Nambahake folder \`bin\` menyang User \`PATH\` (\`HKCU:\\Environment\`).
3. Ndhaptar asosiasi berkas \`.jawa\` menyang ProgID \`Jawalang.Source\`.
4. Masang DefaultIcon resmi (\`assets\\jawalang.ico\`).
5. Ndhaptar context menu Explorer ("Run with Jawalang").
6. Nganyari cache Windows Explorer liwat broadcast \`SHChangeNotify\`.

---

### 2. Usage

Jalukna program Jawalang liwat terminal:

\`\`\`bash
jawa program.jawa
\`\`\`

Utawa nggunakake sub-command \`run\`:

\`\`\`bash
jawa run program.jawa
\`\`\`

Kekaron perintah kasebut ngasilake tumindak sing padha persis. Program nampa path relatif (\`./program.jawa\`), path absolut (\`D:\\proyek\\program.jawa\`), sarta path sing ngemot spasi (\`"C:\\Proyek Kula\\tes.jawa"\`).

---

### 3. Version

Priksa versi Jawalang saka sumber tunggal (\`package.json\`):

\`\`\`bash
jawa --version
\`\`\`
utawa:
\`\`\`bash
jawa -v
\`\`\`

Output:
\`\`\`text
Jawalang v1.0.0
\`\`\`

---

### 4. Help

Tampilake pandhuan panggunaan CLI:

\`\`\`bash
jawa --help
\`\`\`
utawa:
\`\`\`bash
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

### 5. Windows Integration

- **Asosiasi Berkas \`.jawa\`**: Berkas \`.jawa\` kadhaptar menyang \`Jawalang.Source\`.
- **Double-Click Behavior**: Nalika berkas \`.jawa\` diklik dobel ing Windows Explorer, jendhela konsol bakal mbukak, nglakokake program, lan nampilake:
  \`\`\`text
  Program wis rampung. Pencet Enter kanggo nutup...
  \`\`\`
  supaya jendhela konsol ora langsung ilang sadurunge pangguna maca asile.
- **Custom Icon (\`assets/jawalang.ico\`)**: Berkas \`.jawa\` nampilake logo resmi Jawalang kanthi resolusi multi-layer (16x16 nganti 256x256).
- **Context Menu ("Run with Jawalang")**: Klik tengen ing berkas \`.jawa\` ngemot menu *"Run with Jawalang"* mawa lambang resmi kanggo eksekusi langsung.
- **Uninstallation**: Kanggo ngresiki kabeh asosiasi registry lan mbusak Jawalang saka User PATH kanthi resik:
  \`\`\`powershell
  .\\scripts\\uninstall.ps1
  \`\`\`

---

## 🏗️ Struktur Proyèk

- \`package.json\` — Metadata proyek, konfigurasi \`"bin": { "jawa": "./bin/jawa.js" }\`, lan canonical version.
- \`src/cli.js\` — **Core CLI Engine**: Logika verifikasi argumen, format kesalahan, penanganan flag, lan pemanggilan interpreter.
- \`src/launcher/jawa.cs\` — Kode sumber C# kanggo executable native Windows \`jawa.exe\`.
- \`bin/jawa.js\` — Entry point executable Node.js mawa shebang standard.
- \`bin/cli.js\` — Forwarder kompatibilitas lawas menyang \`src/cli.js\`.
- \`bin/jawa.cmd\` — Wrapper batch file kanggo lingkungan CMD / PowerShell.
- \`bin/jawa.exe\` — Executable binary native Windows launcher.
- \`scripts/install.ps1\` — Script instalasi mandiri Windows (idempotent, HKCU).
- \`scripts/uninstall.ps1\` — Script uninstalasi lan resik-resik registry.
- \`scripts/build-launcher.ps1\` — Script kompilasi \`jawa.exe\`.
- \`scripts/generate-icon.ps1\` — Script pambangun icon \`jawalang.ico\`.
- \`assets/jawalang.ico\` — Windows multi-resolution icon binary.
- \`assets/jawalang.svg\` — Vektor logo asli Jawalang.
- \`src/lexer.js\` — **Tokenizer**: Ngowahi kode mentah dadi deretan token.
- \`src/parser.js\` — **Recursive Descent Parser**: Ngolah token dadi Abstract Syntax Tree (AST).
- \`src/interpreter.js\` — **Interpreter**: Eksekusi AST mawa lexical scoping, struct, method, lan inheritance.
- \`examples/\` — Tuladha program Jawalang lengkap mawa tes-tes fitur.
- \`examples/cli/\` — Test fixture integrasi CLI lan modul relatif (\`main.jawa\` lan \`helper.jawa\`).
`;

// Find "# Jawalang CLI" in content and replace until end
const marker = content.indexOf('# Jawalang CLI');
if (marker !== -1) {
    content = content.substring(0, marker) + targetSection;
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log('Readme.md updated.');
} else {
    // Append to content
    content += '\n\n---\n\n' + targetSection;
    fs.writeFileSync(readmePath, content, 'utf8');
    console.log('Readme.md appended.');
}
