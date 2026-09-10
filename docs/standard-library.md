# Standard Library Jawalang

Jawalang V1.4.0 memperkenalkan **Standard Library Foundation**, yaitu fondasi pustaka standar bawaan yang dirancang modular, murni (*pure*), deterministik, tanpa efek samping tersembunyi (*side-effect free*), dan memiliki validasi tipe yang ketat.

---

## 1. Modul Matematika (Math)

Semua fungsi matematika berada di namespace global bawaan dan bekerja secara deterministik tanpa mengubah nilai masukan.

### `abs(n)`
Menghitung nilai absolut (jarak non-negatif dari 0) dari sebuah angka.

- **Argumen**: `n` (number)
- **Kembalian**: `number`
- **Contoh**:
  ```jawa
  tulis abs(-10)    # Output: 10
  tulis abs(25.5)   # Output: 25.5
  tulis abs(0)      # Output: 0
  ```

### `min(a, b)`
Mengembalikan nilai terkecil di antara dua angka.

- **Argumen**: `a` (number), `b` (number)
- **Kembalian**: `number`
- **Contoh**:
  ```jawa
  tulis min(10, 20)    # Output: 10
  tulis min(-5, -15)   # Output: -15
  ```

### `max(a, b)`
Mengembalikan nilai terbesar di antara dua angka.

- **Argumen**: `a` (number), `b` (number)
- **Kembalian**: `number`
- **Contoh**:
  ```jawa
  tulis max(10, 20)    # Output: 20
  tulis max(-5, -15)   # Output: -5
  ```

### `akar(n)`
Menghitung akar kuadrat (*square root*) dari sebuah angka non-negatif.

- **Argumen**: `n` (number, `n >= 0`)
- **Kembalian**: `number`
- **Catatan**: Jika argumen bernilai negatif (`n < 0`), runtime Jawalang melempar kesalahan secara eksplisit (tidak menghasilkan `NaN` secara diam-diam).
- **Contoh**:
  ```jawa
  tulis akar(25)     # Output: 5
  tulis akar(2.25)   # Output: 1.5
  ```

### `pangkat(base, exp)`
Menghitung pemangkatan eksponensial $base^{exp}$.

- **Argumen**: `base` (number), `exp` (number)
- **Kembalian**: `number`
- **Catatan**: Mendukung eksponen negatif atau pecahan. Jika basis bernilai negatif dengan eksponen pecahan yang menghasilkan bilangan imajiner, runtime melempar kesalahan secara eksplisit.
- **Contoh**:
  ```jawa
  tulis pangkat(2, 5)     # Output: 32
  tulis pangkat(10, -2)   # Output: 0.01
  tulis pangkat(9, 0.5)   # Output: 3
  ```

---

## 2. Modul Teks (String)

Fungsi manipulasi string bersifat murni (*pure*) dan tidak pernah mengubah string asli (*immutable*).

### `ngemot(teks, bagian)`
Memeriksa apakah string `teks` mengandung substring `bagian` (*contains*).

- **Argumen**: `teks` (string), `bagian` (string)
- **Kembalian**: `boolean` (`bener` atau `luput`)
- **Contoh**:
  ```jawa
  tulis ngemot("Jawalang", "lang")  # Output: bener
  tulis ngemot("Nusantara", "jawa") # Output: luput
  ```

### `diwiwiti(teks, awalan)`
Memeriksa apakah string `teks` diawali oleh prefix `awalan` (*starts with*).

- **Argumen**: `teks` (string), `awalan` (string)
- **Kembalian**: `boolean`
- **Contoh**:
  ```jawa
  tulis diwiwiti("Jawalang", "Jawa") # Output: bener
  tulis diwiwiti("Jawalang", "lang") # Output: luput
  ```

### `dipungkasi(teks, akhiran)`
Memeriksa apakah string `teks` diakhiri oleh suffix `akhiran` (*ends with*).

- **Argumen**: `teks` (string), `akhiran` (string)
- **Kembalian**: `boolean`
- **Contoh**:
  ```jawa
  tulis dipungkasi("Jawalang", "lang") # Output: bener
  tulis dipungkasi("Jawalang", "Jawa") # Output: luput
  ```

### `trim(teks)`
Menghapus seluruh karakter spasi kosong (*whitespace*) di awal dan di akhir string.

- **Argumen**: `teks` (string)
- **Kembalian**: `string`
- **Contoh**:
  ```jawa
  gawe s = "   Budi Santoso   "
  gawe res = trim(s)
  tulis res         # Output: Budi Santoso
  tulis dawa(s)     # Output: 18 (string asli tidak termutasi)
  tulis dawa(res)   # Output: 12
  ```

### `pecah(teks, pemisah)`
Memecah string menjadi array elemen berdasarkan pemisah (*split*). Hasil berupa array native Jawalang yang kompatibel penuh dengan semua operasi array (`dawa`, `jupuk`, `nambah`, `gabung`, dll).

- **Argumen**: `teks` (string), `pemisah` (string)
- **Kembalian**: `array`
- **Contoh**:
  ```jawa
  gawe teks = "apel,mangga,jeruk"
  gawe daftar = pecah(teks, ",")
  tulis dawa(daftar)      # Output: 3
  tulis jupuk(daftar, 0)  # Output: apel
  tulis gabung(daftar, " - ") # Output: apel - mangga - jeruk
  ```

---

## 3. Aturan Tipe (Type Rules)

Standard Library Jawalang menerapkan pemeriksaan tipe yang **sangat ketat (strict typing)**:
1. **Tidak Ada Koersi Implisit**: Nilai string seperti `"10"` tidak akan secara otomatis diubah menjadi angka pada fungsi matematika.
   ```jawa
   abs("10")   # ERROR: Argumen 1 kanggo "abs" kudu arupa nomer, dudu tulisan
   abs(bener)  # ERROR: Argumen 1 kanggo "abs" kudu arupa nomer, dudu bener_luput
   ```
2. **Pengecekan String Ketat**: Fungsi string menolak tipe angka, boolean, array, atau null.
   ```jawa
   trim(100)           # ERROR: Argumen 1 kanggo "trim" kudu arupa tulisan, dudu nomer
   ngemot("teks", 12)  # ERROR: Argumen 2 kanggo "ngemot" kudu arupa tulisan, dudu nomer
   ```
3. **Pencegahan Nilai Null**: Memasukkan `kosong` (null) ke fungsi yang membutuhkan tipe spesifik akan memicu error runtime yang informatif.

---

## 4. Penanganan Kesalahan (Error Handling)

Setiap fungsi bawaan divalidasi dengan cermat:
- **Jumlah Argumen**: Jika argumen yang diberikan kurang atau berlebih dari spesifikasi fungsi, runtime melempar runtime error:
  ```text
  Fungsi "min" mbutuhake 2 argumen, nanging diwenehi 1.
  ```
- **Domain Matematika**:
  ```jawa
  akar(-1)    # ERROR: Argumen kanggo "akar" ora kena angka negatif: -1
  ```
- **Dapat Ditangkap dengan `coba` / `tangkep`**:
  Semua kesalahan validasi standar dapat ditangkap dan diproses dengan aman menggunakan blok penanganan pengecualian native:
  ```jawa
  coba {
      gawe x = akar(-9)
  } tangkep (err) {
      tulis "Kesalahan dicegah: " + err
  }
  ```

---

## 5. First-Class Builtin Functions

Semua fungsi pustaka standar adalah entitas tingkat pertama (*first-class citizens*). Fungsi dapat disimpan dalam variabel, dilewatkan sebagai argumen ke fungsi lain, atau disimpan dalam struktur array dan objek:

```jawa
gawe f = abs
tulis f(-50) # Output: 50

gawe operasi = [abs, trim]
tulis operasi[0](-25)        # Output: 25
tulis operasi[1]("   Halo ") # Output: Halo
```

---

## 6. Kompatibilitas Fungsi Tingkat Tinggi (Higher-Order Functions)

Fungsi pustaka standar dapat dipadukan langsung dengan higher-order functions bawaan Jawalang (`terapkan`, `saring`, `ana`, `kabeh`, `golek`, `itung`):

```jawa
# Memetakan nilai absolut menggunakan terapkan
gawe data = [-10, 20, -30, 40]
gawe positif = terapkan(abs, data)
tulis positif # Output: [10, 20, 30, 40]

# Memotong spasi pada daftar teks
gawe teksKotor = ["  satu ", " dua  ", "tiga "]
gawe teksResik = terapkan(trim, teksKotor)
tulis teksResik # Output: ["satu", "dua", "tiga"]
```

---

## 7. Rencana Pengembangan Standar Library Mendatang (Future Roadmap)

Pada rilis **V1.4.0 Foundation**, fokus utama adalah stabilitas komputasi murni (*pure & deterministic foundation*). Fitur-fitur berikut ini sengaja **belum diimplementasikan** pada fase ini dan dijadwalkan untuk fase rilis mendatang:

- **Date / Time**: Membutuhkan model lokal, kalender, format, dan zona waktu.
- **Random Number Generation**: Membutuhkan spesifikasi pseudo-random generator yang deterministik dan *seedable*.
- **File System (I/O)**: Membutuhkan model perizinan (*sandbox* dan keamanan akses file).
- **Networking / HTTP**: Membutuhkan model asynchronous I/O atau socket runtime.
- **Process / OS Exec**: Membutuhkan isolasi eksekusi sistem operasi.
