# JSON Architecture

Arsitektur serialisasi dan deserialisasi JSON pada Jawalang V1.4.0 dirancang untuk menyediakan interoperabilitas data yang aman, deterministik, murni (*pure*), dan berkinerja tinggi tanpa kompromi pada sistem tipe atau integritas runtime.

---

## Supported Jawalang Types

JSON adalah format pertukaran data (*data interchange format*), bukan representasi eksekusi kode. Oleh karena itu, hanya tipe data murni yang didukung:

| Tipe Jawalang | Tipe JSON | Contoh Encoding | Contoh Decoding |
|---|---|---|---|
| `nomer` (number) | `number` | `10` -> `10`, `3.14` -> `3.14` | `10` -> `10`, `3.14` -> `3.14` |
| `tulisan` (string) | `string` | `"halo"` -> `"\"halo\""` | `"\"halo\""` -> `"halo"` |
| `bener_luput` (boolean) | `boolean` | `bener` -> `true`, `salah` -> `false` | `true` -> `bener`, `false` -> `salah` |
| `null` | `null` | `null` -> `null` | `null` -> `null` |
| `larik` (array) | `array` | `[1, 2, 3]` -> `[1,2,3]` | `[1,2,3]` -> `[1, 2, 3]` |
| `obyek` (object) | `object` | `{"a": 1}` -> `{"a":1}` | `{"a":1}` -> `{"a": 1}` |

---

## Encoding Rules

Fungsi `jsonEncode(nilai)` melakukan serialisasi dari nilai Jawalang menjadi string teks JSON berstandar RFC 8259:
1. **Validasi Tipe Menyeluruh (*Deep Validation*)**:
   - Struktur data ditelusuri secara rekursif sebelum atau selama proses serialisasi.
   - Jika ditemukan tipe yang tidak didukung (misal `function`, `datetime`, `struct`, `instance`, `namespace`), proses segera dihentikan dengan melempar runtime error Jawalang.
   - Tidak ada properti fungsi yang diabaikan diam-diam (*silent omission*), dan tidak ada konversi diam-diam menjadi string atau null.
2. **Pendeteksian Siklus (*Circular Reference Detection*)**:
   - Struktur penelusuran melacak himpunan leluhur (*ancestor set*).
   - Jika sebuah objek atau array merujuk kembali pada salah satu leluhurnya dalam rantai traversal aktif (`a -> b -> a`), proses segera melempar error:
     `Circular reference ora bisa diencode dadi JSON (Referensi sirkular tidak bisa di-encode menjadi JSON)`.
   - Representasi grafik acak tanpa siklus (*Directed Acyclic Graph / DAG*), di mana satu objek digunakan di dua cabang berbeda, tetap valid.
3. **Batas Kedalaman Rekursi (*Depth Limit*)**:
   - Dibatasi maksimal 500 tingkat kedalaman untuk mencegah *call stack exhaustion* pada struktur data anomali.
4. **Angka Khusus**:
   - Nilai `NaN`, `Infinity`, dan `-Infinity` dilarang dalam JSON standar dan ditolak dengan error eksplisit.
5. **Kekebalan Mutasi (*Immutability*)**:
   - `jsonEncode` beroperasi secara murni tanpa mengubah atau memutasi objek/array input.

---

## Decoding Rules

Fungsi `jsonDecode(teks)` melakukan deserialisasi dari string teks JSON menjadi struktur data Jawalang asli (*native runtime representations*):
1. **Validasi Input**:
   - Argumen harus bertipe string tunggal.
   - String kosong atau whitespace murni langsung ditolak dengan runtime error Jawalang.
2. **Kesesuaian Tipe**:
   - JSON `null` dikonversi tepat menjadi Jawalang `null` (bukan `undefined`, bukan `0`, bukan `"null"`).
   - JSON `true` / `false` dikonversi menjadi boolean Jawalang `bener` / `salah`.
   - JSON `number` dikonversi menjadi number Jawalang (IEEE 754 64-bit float).
   - JSON `string` dikonversi menjadi string Jawalang dengan decoding escape sequences otomatis (`\n`, `\t`, `\"`, `\\`, unicode `\uXXXX`).
   - JSON `array` dikonversi menjadi array native Jawalang yang dapat diindeks dan dimanipulasi dengan built-in array (`dawa`, `jupuk`, `nambah`, dll.).
   - JSON `object` dikonversi menjadi plain object Jawalang dengan kunci bertipe string.
3. **Penolakan Data Tambahan (*Trailing Data Rejection*)**:
   - String JSON harus memuat tepat satu nilai JSON valid.
   - Pola seperti `"10 20"`, `"true false"`, atau `"{}{}"` ditolak sebagai error format JSON tidak valid.
4. **Isolasi Deserialisasi (*Decode Isolation*)**:
   - Setiap pemanggilan `jsonDecode` menghasilkan pohon struktur data independen di memori heap. Memodifikasi hasil decode tidak mempengaruhi pemanggilan decode sebelumnya.

---

## Null Handling

- Dalam encoding: `jsonEncode(null)` menghasilkan teks `"null"`.
- Dalam decoding: `jsonDecode("null")` menghasilkan nilai `null`.
- Pengecekan tipe dengan `jinis(jsonDecode("null"))` menghasilkan string `"null"`.
- Properti bernilai `null` dalam objek `{ "data": null }` dipertahankan utuh sebagai pasangan kunci dan nilai `null`, tidak dihapus.

---

## Number Handling

- Jawalang runtime menggunakan representasi floating-point ganda IEEE 754 (64-bit).
- Bilangan bulat (*integer*) aman berada dalam rentang `-(2^53 - 1)` sampai `2^53 - 1` (`Number.MIN_SAFE_INTEGER` sampai `Number.MAX_SAFE_INTEGER`).
- Bilangan desimal dan eksponensial (seperti `1e3`, `3.14`, `-0.5`) didukung penuh.
- Nilai di luar batas presisi aman akan mengikuti aturan pembulatan IEEE 754 JavaScript engine standar.

---

## Array Handling

- Array Jawalang dipetakan secara 1-ke-1 dengan JSON array.
- Elemen array dapat berupa tipe heterogen (campuran angka, string, boolean, null, sub-array, sub-objek).
- Hasil decode dapat langsung dimanipulasi menggunakan built-in manipulasi array Jawalang (`jupuk`, `nambah`, `busak`, `terapkan`, `saring`, dll.).

---

## Object Handling

- Object Jawalang dipetakan secara 1-ke-1 dengan JSON object.
- Semua kunci objek dalam format JSON berwujud string.
- **Semantik Kunci Duplikat (*Duplicate Keys*)**:
  - Mengikuti semantik deklarasi objek Jawalang dan RFC 8259, jika teks JSON memuat kunci berulang pada tingkat yang sama (misal `{"k": 1, "k": 2}`), semantik yang berlaku adalah *last-key-wins* (`"k"` bernilai `2`).
- **Urutan Kunci (*Key Ordering*)**:
  - Pengurutan kunci mengikuti urutan penambahan (*insertion order*) mesin V8. Namun, kesetaraan logika data JSON tidak boleh bergantung pada urutan kunci.

---

## Unsupported Runtime Types

Tipe-tipe berikut **secara tegas ditolak** saat proses encoding:

1. **`function` / Closure**:
   - Fungsi mewakili instruksi logika eksekusi, bukan data mentah.
   - Ditolak dengan pesan: `Tipe "function" ora bisa diencode dadi JSON`.
2. **`datetime`**:
   - Objek `datetime` di Jawalang V1.4.0 Phase 11 memiliki representasi enkapsulasi khusus (`_isDateTime`).
   - Format pertukaran waktu (seperti ISO-8601 string vs Unix millisecond integer) memerlukan spesifikasi serialisasi terdedikasi pada fase lanjutan.
   - Ditolak dengan pesan: `Tipe "datetime" ora bisa diencode dadi JSON`.
3. **`struct` & `instance`**:
   - Struct mewakili cetak biru (*class definition*) dan instance mewakili obyek berstate dengan metode dan hierarki pewarisan OOP.
   - Serialisasi OOP memerlukan pola serialisasi berbasis skema / prototipe.
   - Ditolak dengan pesan: `Tipe "instance" ora bisa diencode dadi JSON` atau `Tipe "struct" ora bisa diencode dadi JSON`.
4. **`namespace`**:
   - Namespace modul runtime tidak boleh diekspos sebagai data.
   - Ditolak dengan pesan: `Tipe "namespace" ora bisa diencode dadi JSON`.

---

## Error Handling

- Seluruh kesalahan serialisasi dan deserialisasi dibungkus dalam exception runtime Jawalang yang konsisten.
- Pesan kesalahan disajikan dalam format dwibahasa (Jawa & Indonesia):
  - Kesalahan tipe argumen: `jsonDecode() mung bisa digunakake kanggo string, nanging ditemu: "..."`.
  - Kesalahan jumlah argumen: `Function built-in "jsonEncode" mbutuhake 1 argument, nanging diwenehi 2`.
  - Kesalahan tipe data tidak didukung: `Tipe "..." ora bisa diencode dadi JSON`.
  - Kesalahan referensi sirkular: `Circular reference ora bisa diencode dadi JSON`.
  - Kesalahan kedalaman: `Struktur data keliwat jero (maksimal 500 tingkat)`.
  - Kesalahan sintaks JSON: `Format JSON ora sah: ... (Format JSON tidak valid: ...)`.

---

## Security

1. **Bebas Eksekusi Kode Dinamis (*Zero Dynamic Code Execution*)**:
   - Tidak pernah menggunakan `eval()`, `new Function()`, atau compiler dinamis.
   - Teks JSON murni diproses menggunakan parser data `JSON.parse` bawaan mesin V8 setelah validasi keamanan ketat.
2. **Tanpa Akses Sistem Operasi**:
   - Tidak menggunakan `child_process`, `fs`, atau jaringan.
3. **Pencegahan Denial of Service (DoS)**:
   - Cycle detector dan depth guard mencegah rekursi tak terhingga dan *stack overflow crash*.

---

## Determinism

- Pemrosesan string dan angka beroperasi secara deterministik murni tanpa bergantung pada waktu, locale sistem, atau status lingkungan luar.
- Serialisasi nilai primitif yang identik akan selalu menghasilkan teks JSON yang identik.

---

## Future Extension

1. Opsi *pretty printing* / indentasi (`jsonEncode(data, 4)`).
2. Dukungan serialisasi terstandarisasi untuk `datetime` (misalnya representasi ISO-8601 UTC string otomatis).
3. Serializer berbasis skema untuk struct dan instance obyek OOP (`toJson()` / `fromJson()`).
