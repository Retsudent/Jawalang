# Jawalang for Visual Studio Code

Ekstensi resmi **Jawalang** kanggo Visual Studio Code. Nyedhiyakake dhukungan basa pamrograman Jawa (*Javanese Programming Language*) kanthi pengalaman pangembang profesional (*developer experience*).

---

## 🌟 Fitur Utama

- **Pangenalan Basa (.jawa)**: Otomatis ngenali berkas mawa ekstensi `.jawa` minangka basa Jawalang.
- **Syntax Highlighting Lengkap**: Nyakup kabeh keyword Jawalang V5 (`gawe`, `guna`, `bentuk`, `wiwiti`, `ngembangake`, `super`, `coba`, `tangkep`, lsp), string mawa escape sequences, angka desimal, komentar baris, sarta deklarasi/panggilan fungsi lan struct.
- **Konfigurasi Basa**: Pasangan otomatis tanda kurung `{}`, `[]`, `()`, tanda petik `""`, komentar baris `//`, lan aturan indentasi cerdas.
- **Snippets Kode Praktis**: Template cepet kanggo `gawe`, `guna`, `bentuk`, `wiwiti`, `yen`, `nalika`, `kanggo`, `saben`, `coba`, `impor`, lan sapiturute.
- **Tombol & Printah Run Jawalang**: Eksekusi berkas aktif langsung ing Integrated Terminal VS Code liwat tombol ▶ ing pojok tengen ndhuwur utawa printah `Jawalang: Run File`.
- **Language Server Protocol (LSP)**: Dilengkapi Jawalang Language Server kanthi kapabilitas cerdas:
  - **Diagnostik Real-time**: Laporan kesalahan sintaks lan semantik kanthi akurat.
  - **Go to Definition**: Navigasi menyang deklarasi variabel, fungsi, struct, lan modul sing diimpor.
  - **Find All References**: Nemokake kabeh referensi panggunaan variabel, parameter, fungsi, struct, metode (`iki.method`, `super.method`), lan modul.
  - **Rename Symbol**: Ngganti jeneng simbol kanthi aman lan semantik liwat WorkspaceEdit (F2 ing VS Code) kanthi proteksi leksikal lan collision checking.
  - **Signature Help**: Nampilake pratandha parameter lan parameter aktif (`activeParameter`) kanthi akurat nalika ngetik panggilan fungsi, konstruktor (`anyar Struct(...)`), metode struct, `super(...)`, `super.method(...)`, namespace modul, lan fungsi bawaan.
  - **Autocomplete Semantik V2**: Rekomendasi simbol leksikal kontekstual, anggota struct (`instance.`, `iki.`, `super.`), namespace modul (`math.`), filter khusus `anyar`, sarta proteksi ing njero string lan komentar.
  - **Format Document**: Format otomatis kode Jawalang liwat `Shift + Alt + F`, klik tengen -> *Format Document*, utawa Format on Save. Nyedhiyakake indentasi 4 spasi standar, perapian spasi operator biner lan unary, format block kurawal (`{` lan `}`), penataan struct/metode/konstruktor, lan njamin keamanan string/komentar sarta idempotensi.
  - **Hover Semantik**: Nuduhake tipe data inferensi, signature, lan dokumentasi built-in.
  - **Outline Dokumen (Document Symbols)**: Peta struktur hirarkis file ing panel Outline VS Code.
- **Dukungan Terminal Interaktif**: Program mawa fungsi input `takon()` lumaku kanthi interaktif lan lancar.

---

## 🚀 Pandhuan Instalasi

### 1. Prasyarat
Pesthekake komputer panjenengan wis nduweni:
1. **Node.js (v18+)** ([https://nodejs.org](https://nodejs.org)).
2. **Jawalang CLI**: Pasang Jawalang CLI liwat installer resmi:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
   ```
   Priksa instalasi ing terminal:
   ```bash
   jawa --version
   ```

### 2. Pasang Ekstensi VS Code
Instal berkas `jawalang-vscode-1.0.0.vsix` liwat terminal:
```bash
code --install-extension jawalang-vscode-1.0.0.vsix
```
Utawa ing VS Code:
1. Bukak tab **Extensions** (`Ctrl+Shift+X`).
2. Klik tombol titik telu (`...`) ing pojok ndhuwur.
3. Pilih **Install from VSIX...** banjur pilih berkas `jawalang-vscode-1.0.0.vsix`.

---

## ⚙️ Setelan (Settings)

Ekstensi nyedhiyakake setelan kang bisa diowahi ing VS Code Settings:

| Setelan | Default | Katrangan |
| :--- | :--- | :--- |
| `jawalang.executablePath` | `"jawa"` | Path menyang executable CLI Jawalang (kayata `jawa` utawa path jangkep menyang `jawa.exe`). |
| `jawalang.runInTerminal` | `true` | Nglakokake program ing integrated terminal VS Code. |
| `jawalang.languageServer.enabled` | `true` | Ngaktifake Jawalang Language Server (LSP) kanggo diagnostik, definisi, lan autokomplit semantik. |
| `jawalang.languageServer.path` | `""` | Path custom menyang executable/script Language Server (standar: nggunakake server bawaan ekstensi). |
| `jawalang.languageServer.debug` | `false` | Ngaktifake logging debug menyang konsol stderr. |

---

## 📝 Lisensi
MIT License © Jawalang Team
