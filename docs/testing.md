# Testing & Assertion Standard Library

Panduan resmi penggunaan fondasi pengujian dan assertion (*Testing & Assertion Foundation*) pada Standard Library Jawalang V1.4.0.

---

## Ringkasan (Overview)

Mulai Jawalang V1.4.0 Phase 14, Jawalang menyediakan modul standar bawaan untuk menulis unit test dan assertion terhadap kode Jawalang secara langsung tanpa memerlukan syntax khusus pada parser, tanpa state global, dan tanpa dependensi eksternal.

Testing builtins diakses sebagai fungsi first-class biasa:
- `uji(kondisi, [pesan])`
- `ujiPadha(aktual, expected, [pesan])`
- `ujiBeda(aktual, expected, [pesan])`
- `ujiJinis(nilai, tipe, [pesan])`
- `ujiError(fungsi, [pesan])`

---

## Semantik Assertion

### Hasil Berhasil (PASS)
Jika suatu assertion berhasil terpenuhi:
- Fungsi mengembalikan nilai `bener` (boolean `true`).
- **Tidak mencetak apapun** secara otomatis ke konsol (`stdout`) agar tidak mencemari output program pengujian.

### Hasil Gagal (FAIL)
Jika assertion tidak terpenuhi:
- Fungsi **melempar runtime error Jawalang** yang informatif.
- Program berhenti dan mencetak rincian kegagalan, ATAU dapat ditangkap secara terkontrol menggunakan konstruksi `coba ... tangkep`.
- **Tidak melakukan crash paksa pada proses Node.js** (`no process.exit`).

---

## Referensi Fungsi Built-in

### 1. `uji(kondisi: boolean, [pesan: string])`
Memeriksa apakah ekspresi kondisi bernilai boolean `bener` (true).

- **Argumen**:
  - `kondisi` (*boolean*, wajib): Kondisi yang harus bernilai `bener`. Jika diberikan tipe data lain selain boolean (misalnya string atau number), akan melempar error validasi tipe.
  - `pesan` (*string*, opsional): Pesan kustom penjelas kegagalan assertion.
- **Return**: `bener`
- **Contoh**:
  ```jawa
  uji(10 > 5)
  uji(2 + 2 == 4, "Penjumlahan dasar kudu bener")
  ```
- **Pesan Kegagalan**:
  ```text
  Assertion gagal: kondisi kudu bener
  ```
  atau jika dengan pesan kustom:
  ```text
  Assertion gagal: Penjumlahan dasar kudu bener
  kondisi kudu bener
  ```

---

### 2. `ujiPadha(aktual: any, expected: any, [pesan: string])`
Memeriksa kesetaraan nilai antara `aktual` dan `expected` menggunakan semantik kesetaraan `==` Jawalang (*strict type*, tanpa pemaksaan tipe otomatis).

- **Argumen**:
  - `aktual` (*any*, wajib): Nilai aktual hasil eksekusi program.
  - `expected` (*any*, wajib): Nilai ekspektasi yang diharapkan.
  - `pesan` (*string*, opsional): Pesan kustom jika assertion gagal.
- **Return**: `bener`
- **Contoh**:
  ```jawa
  gawe hasil = 5 * 2
  ujiPadha(hasil, 10)
  ujiPadha("Jawa", "Jawa", "String kudu padha")
  ```
- **Pesan Kegagalan**:
  ```text
  Assertion gagal:
  expected: 10
  actual: 20
  ```

---

### 3. `ujiBeda(aktual: any, expected: any, [pesan: string])`
Memeriksa apakah nilai `aktual` berbeda (*inequality*, `!=`) dari nilai `expected`.

- **Argumen**:
  - `aktual` (*any*, wajib)
  - `expected` (*any*, wajib)
  - `pesan` (*string*, opsional)
- **Return**: `bener`
- **Contoh**:
  ```jawa
  ujiBeda(10, 20)
  ujiBeda("A", "B", "Karakter kudu beda")
  ```
- **Pesan Kegagalan**:
  ```text
  Assertion gagal:
  nilai kudu beda, nanging padha-padha: 10
  ```

---

### 4. `ujiJinis(nilai: any, tipe: string, [pesan: string])`
Memeriksa apakah tipe data runtime dari `nilai` sesuai dengan nama string `tipe` yang ditentukan (menggunakan sistem tipe `jinis()` Jawalang).

- **Daftar Tipe yang Didukung**:
  - `"null"`
  - `"number"`
  - `"string"`
  - `"boolean"`
  - `"array"`
  - `"object"`
  - `"function"`
  - `"struct"`
  - `"instance"`
  - `"namespace"`
  - `"datetime"`
- **Argumen**:
  - `nilai` (*any*, wajib)
  - `tipe` (*string*, wajib): Nama tipe target. Jika bukan string, melempar error validasi.
  - `pesan` (*string*, opsional)
- **Return**: `bener`
- **Contoh**:
  ```jawa
  ujiJinis(42, "number")
  ujiJinis([1, 2, 3], "array")
  ujiJinis({ "k": 1 }, "object")
  ujiJinis(saiki(), "datetime")
  ```
- **Pesan Kegagalan**:
  ```text
  Assertion gagal:
  expected type "number"
  actual type "string"
  ```

---

### 5. `ujiError(fungsi: function, [pesan: string])`
Memeriksa apakah pemanggilan `fungsi()` melempar *runtime error*.

- **Argumen**:
  - `fungsi` (*function*, wajib): Fungsi tanpa parameter (named function atau bound method).
  - `pesan` (*string*, opsional)
- **Return**: `bener`
- **Perilaku**:
  - Jika `fungsi()` melempar runtime error (misalnya lewat `lempar`, pembagian dengan 0, akses variabel tak terdefinisi, dll), assertion **PASS**.
  - Jika `fungsi()` selesai secara normal tanpa error, assertion **FAIL**.
  - Sinyal kontrol alur (`bali`, `mandheg`, `lanjut`) tidak dianggap sebagai error dan diteruskan sebagaimana mestinya.
- **Contoh**:
  ```jawa
  guna rusak() {
      lempar "ana kasalahan"
  }

  ujiError(rusak)
  ```
- **Pesan Kegagalan**:
  ```text
  Assertion gagal: fungsi kudu ngasilake error (fungsi harus menghasilkan error)
  ```

---

## Integrasi Penanganan Eksepsi (`coba ... tangkep`)

Seluruh kegagalan assertion menghasilkan error standar Jawalang, sehingga dapat ditangkap dan diuji secara aman:

```jawa
gawe gagal = salah

coba {
    ujiPadha(1, 2)
} tangkep err {
    gagal = bener
    tulis "Berhasil menangkap kegagalan test: " + err
}

uji(gagal)
```

---

## Semantik Kesetaraan Array & Objek

Sesuai semantik runtime Jawalang:
- Array dan Objek menggunakan *reference equality* pada operator `==`.
- Dua array atau objek terpisah dengan isi serupa dianggap berbeda secara referensi (`ujiBeda(arr1, arr2)` akan PASS).
- Untuk menguji isi elemen array atau properti objek, uji masing-masing indeks atau kunci secara eksplisit:
  ```jawa
  gawe arr = [10, 20]
  ujiPadha(arr[0], 10)
  ujiPadha(arr[1], 20)
  ```

---

## Modul & REPL

1. **Modul**: Seluruh built-in testing otomatis tersedia di seluruh modul Jawalang tanpa perlu diimpor secara manual.
2. **REPL**: Jika suatu assertion gagal di sesi interaktif `jawa`, error akan dicetak dan sesi REPL tetap hidup tanpa crash.

---

## Batasan Desain (Limitations)

Phase 14 adalah **Assertion Foundation** dan sengaja membatasi fitur-fitur berikut untuk fase berikutnya:
- Belum ada runner otomatis CLI (`jawa test`).
- Belum ada auto-discovery file test (*test pattern matcher*).
- Belum ada reporter CLI bertingkat (*pretty test reporter*).
- Tidak menyertakan framework mock, spy, snapshot, atau fixtures.
