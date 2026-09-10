# File System Architecture — Jawalang V1.4.0

Dokumen ini mendefinisikan arsitektur sistem berkas (*file system*) untuk Jawalang V1.4.0 Phase 13. Modul ini menyediakan kemampuan I/O berkas dasar yang aman, modular, terisolasi, deterministik, dan portabel lintas platform.

---

## 1. Runtime Architecture

Arsitektur sistem berkas Jawalang didesain sebagai komponen standar murni (*standard library*) pada layer [`src/stdlib/filesystem.js`](file:///c:/Jawalang/src/stdlib/filesystem.js) tanpa memodifikasi sintaks bahasa maupun parser Jawalang.

```
Jawalang Source Program (.jawa)
              │
              ▼
   Interpreter Evaluation (src/interpreter.js)
              │
              ▼
   Built-in Registry (builtins[calleeName])
              │
              ▼
Centralized Path Security Layer (src/stdlib/filesystem.js)
  ├── 1. Argument & String Validation
  ├── 2. Absolute Path Rejection
  ├── 3. Lexical Path Normalization & Containment Check
  ├── 4. Realpath & Symlink Escape Verification
  └── 5. Safe System Call Execution (Node.js synchronous fs)
              │
              ▼
Host Operating System File System (Sandboxed Root)
```

Seluruh operasi I/O berkas diwajibkan melewati satu gerbang keamanan terpusat (*centralized path resolver*) yaitu `resolveSandboxPath(userPath, options)`. Tidak ada fungsi built-in yang diperbolehkan memanggil API sistem berkas host secara langsung tanpa melewati validasi ini.

---

## 2. Sandbox Model

Sistem berkas Jawalang mengadopsi model *Sandboxed Working Root*:
1. **Eksekusi Berkas CLI (`jawa <file.jawa>`)**:
   - Sandbox root ditentukan secara otomatis dari direktori tempat berkas entry utama berada:
     $$\text{Sandbox Root} = \text{path.dirname}(\text{fs.realpathSync}(\text{entryFilePath}))$$
   - Contoh: Menjalankan `jawa C:\Projects\App\main.jawa` mengunci sandbox root pada `C:\Projects\App`. Seluruh pembacaan dan penulisan berkas hanya diizinkan di dalam direktori `C:\Projects\App` dan sub-direktorinya.
2. **Mode Interaktif REPL (`jawa` / `jawa repl`)**:
   - Sandbox root dikunci pada direktori kerja proses saat ini (`process.cwd()`).
3. **Isolasi Impor Modul (`impor`)**:
   - Mengimpor berkas modul dari sub-folder (misalnya `impor "modules/helper.jawa"`) **TIDAK** mengubah sandbox root.
   - Panggilan `macaFile("data.txt")` di dalam modul manapun akan tetap merujuk dan dibatasi oleh sandbox root program utama. Hal ini menjamin bahwa hak akses filesystem bersifat deterministik dan dapat diprediksi.

---

## 3. Path Resolution & Containment Check

Semua path yang diberikan oleh pengguna diproses secara deterministik:

### A. Penolakan Path Absolut
Pengguna dilarang memberikan path absolut dalam bentuk apapun:
- Path dengan huruf drive Windows (misal: `C:\data.txt`, `D:/app/file.txt`).
- Path POSIX absolut (misal: `/etc/passwd`, `/var/log`).
- Path jaringan UNC Windows (misal: `\\server\share\file.txt`).

Jika terdeteksi path absolut, runtime Jawalang melempar error:
`Path absolut ora diijini: "<path>" (Path absolut tidak diizinkan)`

### B. Normalisasi & Pencegahan Traversal
Path traversal menggunakan komponen `..` atau `.` diurai menggunakan `path.resolve(sandboxRoot, userPath)`.
Keberadaan path di dalam sandbox diperiksa menggunakan fungsi containment:
```javascript
function isSubPath(parent, child) {
    let p = path.resolve(parent);
    let c = path.resolve(child);
    if (process.platform === "win32") {
        p = p.toLowerCase();
        c = c.toLowerCase();
    }
    const rel = path.relative(p, c);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}
```
Jika `rel` bernilai `""`, target adalah sandbox root itu sendiri. Jika `!rel.startsWith("..")` dan bukan path absolut, maka target dijamin berada di bawah sandbox root.

Upaya traversal yang melompat keluar dari sandbox (misal: `../../secret.txt`, `foo/../../secret.txt`) akan ditolak keras:
`Path "<path>" ora diijini amarga metu saka sandbox (Path berada di luar sandbox)`

---

## 4. Symlink & Junction Handling

Tautan simbolik (*symbolic links*) maupun *NTFS directory junctions* berpotensi menjadi celah *sandbox escape* jika tautan di dalam sandbox mengarah ke berkas atau direktori di luar sandbox root.

Untuk memitigasi celah ini:
1. Jika target path telah ada di disk, path tersebut diselesaikan menggunakan `fs.realpathSync.native` (atau `fs.realpathSync`).
2. Target nyata (*canonical path*) diuji kembali menggunakan `isSubPath(canonicalRoot, realTarget)`.
3. Jika target path belum ada di disk (misal saat operasi `tulisFile` atau `gaweFolder`), resolver akan menelusuri direktori induk terdekat yang telah ada di disk dan memastikan *canonical path* induk tersebut berada di dalam sandbox root.
4. Jika tautan mengarah ke luar sandbox root, operasi dibatalkan dan error dilemparkan:
   `Path "<path>" ora diijini amarga target metu saka sandbox (Symlink escape terdeteksi)`

Pembuatan symlink oleh kode Jawalang pengguna **DILARANG** pada Phase 13.

---

## 5. Supported Jawalang Types & Conversion

| API Jawalang | Parameter | Tipe Argumen | Tipe Kembalian | Deskripsi |
|---|---|---|---|---|
| `macaFile(path)` | 1 | `string` | `string` | Membaca isi berkas teks berenkode UTF-8. Berkas kosong mengembalikan string kosong `""`. |
| `tulisFile(path, isi)` | 2 | `string`, `string` | `null` | Menulis string teks berenkode UTF-8 ke berkas. Input `isi` harus berupa `string`. |
| `anaPath(path)` | 1 | `string` | `boolean` | Memeriksa keberadaan berkas/folder (`bener` / `salah`). Jika path melanggar sandbox, melempar error. |
| `jinisPath(path)` | 1 | `string` | `string` | Mengembalikan `"file"`, `"folder"`, atau `"oraAna"`. |
| `isiFolder(path)` | 1 | `string` | `array` | Mengembalikan array daftar nama entry string di dalam folder. |
| `gaweFolder(path)` | 1 | `string` | `null` | Membuat folder baru secara rekursif. Idempoten jika sudah ada; error jika path adalah berkas. |

### Aturan Konversi & Tipe Data
- Seluruh isi berkas dibaca dan ditulis dalam format **string UTF-8**. Tidak ada tipe `Buffer` JavaScript yang dibocorkan ke runtime Jawalang.
- Konversi implisit dilarang keras: `tulisFile("a.txt", 10)` menghasilkan runtime error Jawalang.
- Untuk menyimpan objek atau array terstruktur ke berkas, pengguna harus mengombinasikan dengan modul JSON (`jsonEncode` dan `jsonDecode`).

---

## 6. Error Boundary & Exception Integration

Seluruh error filesystem host (seperti `ENOENT`, `EACCES`, `EISDIR`, `ENOTDIR`) ditangkap secara aman dan ditransformasikan menjadi pesan bilingual resmi Jawalang:
- Berkas tidak ditemukan: `File "<path>" ora ditemokake (File tidak ditemukan)`
- Path adalah folder saat dibaca sebagai berkas: `Path "<path>" minangka folder, dudu file (Path adalah direktori, bukan file)`
- Izin ditolak: `Ora bisa maca/nulis file "<path>": permission denied`
- Tidak ada raw Node.js stack trace yang dibocorkan ke pengguna pada mode normal.

Seluruh error filesystem kompatibel penuh dengan blok penanganan eksepsi Jawalang:
```jawa
coba {
    macaFile("rahasia.txt")
} tangkep err {
    tulis "Gagal maca file: " + err
}
```

---

## 7. Sync / Async Decision

Runtime interpreter Jawalang saat ini sepenuhnya berbasis sinkron (*synchronous recursive descent execution*). Menambahkan operasi asinkron (Promise/Async-Await) pada level interpreter akan menuntut perombakan arsitektur AST dan evaluator secara masif.

Oleh karena itu, modul filesystem Phase 13 diimplementasikan secara **sinkron murni** (*synchronous I/O*) menggunakan API `fs` sinkron bawaan Node.js (`fs.readFileSync`, `fs.writeFileSync`, `fs.statSync`, `fs.readdirSync`, `fs.mkdirSync`). Pendekatan ini selaras dengan eksekusi deterministik dan linear program Jawalang.

---

## 8. Portability & Case Sensitivity

1. **Pemisah Path (*Path Separators*)**:
   - Mendukung pemisah `/` (forward slash) dan `\` (backslash). Keduanya dinormalisasi secara platform-agnostik menggunakan modul `path` Node.js.
2. **Sensitivitas Huruf (*Case Sensitivity*)**:
   - Pada platform Windows (`win32`), perbandingan containment dinormalisasi secara *case-insensitive* untuk mencegah inkonsistensi antara huruf drive atau nama folder kapital/non-kapital (misalnya `C:\Project` vs `c:\project`).
   - Pada platform POSIX (Linux/macOS), perbandingan menjaga integritas *case-sensitivity* asli sistem operasi.
3. **Pemberhentian Baris (*Newline Handling*)**:
   - Pembacaan berkas mempertahankan karakter newline asli (`LF` atau `CRLF`) tanpa pemotongan atau konversi tersembunyi.

---

## 9. Security Limitations & TOCTOU

1. **Batas Keamanan Sandbox**:
   - Sandbox dirancang sebagai lapisan pembatas logis aplikasi (*application-level directory boundary*), bukan isolasi perangkat keras tingkat kernel (seperti seccomp/chroot/container).
2. **Race Condition (TOCTOU)**:
   - Diakui adanya potensi celah *Time-of-Check to Time-of-Use* (TOCTOU) jika terdapat proses luar berbahaya yang memanipulasi symlink pada sistem host tepat di antara langkah validasi path dan operasi berkas. Untuk mitigasi lokal dalam aplikasi terisolasi, pengecekan bersifat *best-effort*.

---

## 10. Future Destructive APIs

Operasi destruktif berikut secara eksplisit **DITANGGUHKAN** dan dilarang pada Phase 13:
- Penghapusan berkas (`busakFile` / `hapusFile`)
- Penghapusan direktori (`busakFolder` / `hapusFolder`)
- Pengubahan nama berkas/folder (`renameFile` / `pindahFile`)
- Modifikasi izin akses (`chmod`, `chown`)
- Pembuatan tautan simbolik (`gaweSymlink`)

Operasi tersebut akan dirancang pada fase terpisah setelah mekanisme konfirmasi dan kebijakan hak akses lanjutan diformulasikan.
