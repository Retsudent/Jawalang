# File System — Jawalang V1.4.0

Modul **File System** (Sistem Berkas) Jawalang V1.4.0 Phase 13 menyediakan serangkaian fungsi bawaan (*built-in functions*) untuk operasi pembacaan, penulisan, dan inspeksi berkas/folder secara aman, terisolasi dalam *sandbox*, deterministik, dan portabel.

---

## 1. Security Model

Sistem berkas Jawalang menerapkan prinsip pertahanan berlapis (*defense-in-depth*):
- **Sandboxed Execution**: Program hanya diizinkan mengakses berkas di dalam *sandbox root*.
- **Penolakan Path Absolut**: Seluruh path absolut pengguna (`C:\...`, `/...`, `\\...`) ditolak keras.
- **Pencegahan Traversal**: Pola traversal (`..`, `../`, `foo/../../`) yang berusaha melompat keluar dari sandbox root dicegah.
- **Pencegahan Symlink Escape**: Tautan simbolik (*symlink*) diuji menggunakan target riil (*canonical realpath*) untuk memastikan tidak mengarah ke luar root.
- **Non-Destructive**: Tidak ada API untuk menghapus berkas/folder (`delete`) atau mengubah nama (`rename`) pada fase ini.
- **No Code Execution**: Sistem berkas murni menangani data teks dan tidak pernah mengeksekusi berkas sebagai skrip tanpa izin.

---

## 2. Sandbox Root

Lokasi *Sandbox Root* ditentukan secara otomatis berdasarkan konteks eksekusi:
1. **Program CLI (`jawa <file.jawa>`)**:
   - Direktori berkas entry utama menjadi batas terluar (*sandbox root*):
     $$\text{Root} = \text{path.dirname}(\text{fs.realpathSync}(\text{entryFilePath}))$$
   - Contoh: Menjalankan `jawa app/main.jawa` mengunci root pada `app/`. Program dapat mengakses `app/data.txt` atau `app/sub/file.txt`, namun ditolak mengakses `../secret.txt`.
2. **Interactive REPL (`jawa` / `jawa repl`)**:
   - Root menggunakan direktori kerja proses saat ini (`process.cwd()`).

---

## 3. Daftar Fungsi Built-in

### `macaFile(path)`
Membaca seluruh isi berkas teks berenkode UTF-8 di dalam sandbox root.

- **Parameter**: `path` (*string*) — path relatif berkas.
- **Kembalian**: *string* — teks isi berkas.
- **Catatan**: Jika berkas kosong, mengembalikan string kosong `""`.
- **Contoh**:
  ```jawa
  gawe isi = macaFile("cathetan.txt")
  tulis isi
  ```

---

### `tulisFile(path, isi)`
Menulis teks string berenkode UTF-8 ke berkas di dalam sandbox root.

- **Parameter**:
  - `path` (*string*) — path relatif berkas tujuan.
  - `isi` (*string*) — teks string yang akan ditulis.
- **Kembalian**: `null`.
- **Catatan**: Parameter `isi` wajib berupa string (konversi implisit dilarang keras). Berkas yang sudah ada akan ditimpa (*overwrite*).
- **Contoh**:
  ```jawa
  tulisFile("hasil.txt", "Halo Jawalang V1.4.0")
  ```

---

### `anaPath(path)`
Memeriksa apakah berkas atau folder ada pada path yang ditentukan.

- **Parameter**: `path` (*string*) — path relatif berkas/folder.
- **Kembalian**: *boolean* (`bener` atau `salah`).
- **Catatan**: Jika path melanggar batas keamanan sandbox, fungsi ini melempar runtime error (bukan mengembalikan `salah`).
- **Contoh**:
  ```jawa
  yen anaPath("konfigurasi.json") {
      tulis "Konfigurasi ditemokake!"
  }
  ```

---

### `jinisPath(path)`
Memeriksa jenis entri sistem berkas.

- **Parameter**: `path` (*string*) — path relatif.
- **Kembalian**: *string* (`"file"`, `"folder"`, atau `"oraAna"`).
- **Contoh**:
  ```jawa
  tulis jinisPath("data.txt")  // "file"
  tulis jinisPath("arsip")     // "folder"
  tulis jinisPath("ilang.txt") // "oraAna"
  ```

---

### `isiFolder(path)`
Membaca dan mengembalikan daftar entri di dalam suatu folder.

- **Parameter**: `path` (*string*) — path relatif folder.
- **Kembalian**: *array* berisi nama-nama berkas/folder (*string*).
- **Catatan**: Hanya mengembalikan nama entri (bukan path absolut).
- **Contoh**:
  ```jawa
  gawe dhaftar = isiFolder("arsip")
  kanggo saben jeneng ing dhaftar {
      tulis "Entry: " + jeneng
  }
  ```

---

### `gaweFolder(path)`
Membuat folder baru secara rekursif (*recursive mkdir*).

- **Parameter**: `path` (*string*) — path folder yang akan dibuat.
- **Kembalian**: `null`.
- **Catatan**: Bersifat idempoten (jika folder sudah ada, operasi dianggap sukses). Melempar error jika path sudah ada sebagai berkas reguler.
- **Contoh**:
  ```jawa
  gaweFolder("proyek/data/arsip")
  ```

---

## 4. Enkoding UTF-8

Semua operasi pembacaan dan penulisan berkas menggunakan enkoding UTF-8 standar. Mendukung karakter multibyte dan aksara Jawa:
```jawa
gawe teks = "ꦗꦮ Jawalang 🌟"
tulisFile("aksara.txt", teks)
gawe waca = macaFile("aksara.txt")
tulis waca == teks // bener
```

---

## 5. Relative & Absolute Paths

1. **Relative Paths**:
   - Seluruh path harus berupa path relatif terhadap sandbox root.
   - Pemisah slash (`/`) dan backslash (`\`) didukung dan dinormalisasi secara otomatis.
2. **Absolute Paths (Ditolak)**:
   - Dilarang menyertakan huruf drive: `C:\file.txt`, `D:/data`.
   - Dilarang menyertakan root slash: `/etc/passwd`, `\Windows`.
   - Dilarang menyertakan UNC path: `\\server\share`.
   - Pelanggaran menghasilkan error:
     ```
     Path absolut ora diijini: "<path>" (Path absolut tidak diizinkan)
     ```

---

## 6. Path Traversal & Symlinks

- Upaya navigasi keluar menggunakan `..` (misal `../../secret.txt` atau `foo/../../secret.txt`) akan divalidasi dan ditolak.
- Symlink atau junction yang mengarah ke luar sandbox root akan terdeteksi melalui pemeriksaan kanonikal dan digagalkan:
  ```
  Path "<path>" ora diijini amarga target metu saka sandbox (Symlink escape terdeteksi)
  ```

---

## 7. Error & Exception Handling

Semua kegagalan I/O dan pelanggaran keamanan menghasilkan error runtime Jawalang yang terstruktur dan dapat ditangkap menggunakan blok `coba ... tangkep`:

```jawa
coba {
    macaFile("berkas_ora_ana.txt")
} tangkep err {
    tulis "Kacekel kesalahan: " + err
}
```

---

## 8. Integrasi Modul JSON

Modul File System bekerja secara harmonis dengan modul JSON (`jsonEncode` dan `jsonDecode`) untuk serialisasi struktur data kompleks:

```jawa
gawe konfigurasi = {
    "jeneng": "Sistem Kasir",
    "versi": 1.4,
    "fitur": ["stok", "laporan"]
}

// Simpan dadi JSON
tulisFile("konfig.json", jsonEncode(konfigurasi))

// Maca bali saka berkas
gawe data = jsonDecode(macaFile("konfig.json"))
tulis data["jeneng"] // "Sistem Kasir"
```

---

## 9. Perilaku REPL & Modul

1. **REPL**:
   - Mode REPL menggunakan direktori kerja saat ini (`process.cwd()`) sebagai root.
2. **Impor Modul**:
   - Mengimpor modul yang berada di subfolder (misal `impor "lib/alat.jawa"`) **tidak mengubah** sandbox root.
   - Pemanggilan `macaFile("data.txt")` di dalam modul `lib/alat.jawa` tetap merujuk pada sandbox root program utama.

---

## 10. Batasan (Limitations)

1. **Operasi Destruktif**: Menghapus file (`delete`) atau folder (`rmdir`) belum didukung pada Phase 13.
2. **Time-of-Check to Time-of-Use (TOCTOU)**: Validasi sandbox dilakukan di tingkat proses aplikasi (*best-effort*). Jika proses eksternal di OS mengubah struktur symlink secara simultan, batas keamanan lokal bergantung pada OS host.
3. **Ukuran Berkas**: Pembacaan bersifat sinkron seluruh berkas (*read-all-into-memory*). Disarankan untuk berkas data berukuran wajar (di bawah puluhan megabyte).
