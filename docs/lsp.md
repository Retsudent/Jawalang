# Language Server Protocol (LSP) & Integrasi VS Code

[← Sadurunge: CLI & Windows Tooling](cli.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Arsitektur Proyèk →](architecture.md)

---

Jawalang nyedhiyakake implementasi resmi **Language Server Protocol (LSP)** sing nyengkuyung pengalaman pangembangan profesional (*developer experience*) ing editor modern kayata Visual Studio Code.

---

## 1. Arsitektur Language Server

Server LSP Jawalang dumunung ing direktori `language-server/` mawa binary executable `language-server/bin/jawalang-language-server.js`. Server komunikasi liwat protokol JSON-RPC liwat antarmuka `stdio`:

```bash
# Priksa versi Language Server
node language-server/bin/jawalang-language-server.js --version

# Miwiti server ing mode stdio
node language-server/bin/jawalang-language-server.js --stdio
```

---

## 2. Kapabilitas LSP sing Kasedhiya (Capabilities Matrix)

| Kapabilitas LSP | Metode Protocol | Katrangan | Status |
| :--- | :--- | :--- | :---: |
| **Diagnostik Real-time** | `textDocument/publishDiagnostics` | Laporan kesalahan sintaksis lan semantik kanthi baris lan kolom presisi dhuwur | ✅ |
| **Go to Definition** | `textDocument/definition` | Navigasi langsung menyang deklarasi simbol lokal utawa cross-file ing modul ekspor | ✅ |
| **Find All References** | `textDocument/references` | Nemokake kabeh lokasi panggunaan simbol mawa resolusi ruang lingkup lan shadowing | ✅ |
| **Rename Symbol** | `textDocument/rename` | Ngganti jeneng simbol kanthi aman liwat WorkspaceEdit standar lan deteksi tabrakan jeneng | ✅ |
| **Signature Help** | `textDocument/signatureHelp` | Nampilake parameter aktif lan tandha tangan fungsi, metode, konstruktor, lan built-in | ✅ |
| **Context-Aware Completion V2** | `textDocument/completion` | Rekomendasi simbol cerdas: ruang lingkup lokal, anggota instance (`w.`), `iki.`, `super.`, namespace (`math.`), lan filter `anyar` | ✅ |
| **Document Formatting** | `textDocument/formatting` | Format otomatis deterministik kanthi indentasi 4 spasi, perapian operator, lan idempotensi | ✅ |
| **Code Actions & Quick Fix** | `textDocument/codeAction` | Tindakan otomatis: Organize Imports (`Shift+Alt+O`), pambusukan impor duplikat/ora dienggo, koreksi tipo, lan saran impor | ✅ |
| **Semantic Tokens Highlighting** | `textDocument/semanticTokens/full` | Pewarnaan sintaks semantik mawa 13 jinis token lan 2 modifier adhedhasar simbol lan scope | ✅ |
| **Semantic Hover** | `textDocument/hover` | Inferensi jinis data variabel, tandha tangan fungsi, sarta dokumentasi lengkap built-in | ✅ |
| **Document Outline** | `textDocument/documentSymbol` | Peta struktur hierarki simbol berkas (struct, metode, field, fungsi, lan variabel) | ✅ |

---

## 3. Rincian Fitur Utama LSP

### A. Semantic Highlighting (Semantic Tokens)
- **13 Token Types**: `namespace`, `type`, `class`, `function`, `method`, `property`, `variable`, `parameter`, `keyword`, `number`, `string`, `comment`, `operator`.
- **2 Token Modifiers**: `declaration` (`1`), `defaultLibrary` (`2`).
- **Pembedaan Presisi**: Parameter fungsi diwernani minangka `parameter` (dudu variabel biasa) sanajan ngalami shadowing marang variabel global; metode struct dibedakake saka fungsi biasa; built-in functions otomatis entuk modifier `defaultLibrary`.
- **Proteksi String & Komentar**: Teks ing njero string literal utawa komentar ora tau ngasilake token simbol palsu.

### B. Code Actions & Quick Fixes
- **Organize Imports (`source.organizeImports`)**: Ngurutake baris impor kanthi alfabetis, nggabungake impor selektif saka modul sing padha, lan format multiline kanggo 4+ specifiers.
- **Remove Duplicate Imports (`quickfix`)**: Mbusak baris impor utawa specifier duplikat.
- **Remove Unused Imports (`quickfix`)**: Mbusak impor sing ora tau digunakake ing kode.
- **Typo QuickFix (`quickfix`)**: Nyaranake koreksi simbol sing salah ketik adhedhasar jarak Levenshtein ($\le 2$), kalebu koreksi jeneng built-in (`dawe` $\to$ `dawa`).
- **Missing Import QuickFix (`quickfix`)**: Nyaranake ngimpor simbol ekspor saka modul proyek sing kasedhiya.

### C. Document Formatting
- **Indentasi Standar**: 4 spasi per level sarang (nesting level).
- **Spasi Operator**: Spasi ing sakubenge operator biner (`+`, `-`, `*`, `/`, `==`, `lan`, `utawa`) lan operator unary nempel ing operand (`-10`, `ora aktif`).
- **Cuddled Keywords**: `} liyane {`, `} liyane yen ... {`, `} tangkep err {`.
- **Idempotensi**: `format(format(x)) === format(x)`.

---

## 4. Ekstensi Visual Studio Code

Ekstensi resmi kasedhiya ing folder `vscode-extension/`:
- **Instalasi Paket VSIX**:
  ```powershell
  code --install-extension vscode-extension/jawalang-vscode-1.0.0.vsix
  ```
- **Fitur Ekstensi**:
  - Tombol ▶ *"Run Jawalang File"* ing pojok tengen ndhuwur editor.
  - Perintah `Jawalang: Run File` ing Command Palette (`Ctrl+Shift+P`).
  - Integrasi otomatis karo Jawalang Language Server liwat LSP Client.
  - Fallback TextMate grammar nalika LSP durung dimuat.
  - Snippets kode cepet (`gawe`, `guna`, `bentuk`, `wiwiti`, `coba`, lsp).

---

[← Sadurunge: CLI & Windows Tooling](cli.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Arsitektur Proyèk →](architecture.md)
