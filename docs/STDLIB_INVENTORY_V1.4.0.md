# Jawalang V1.4.0 Builtin Inventory

Dokumen ini memuat daftar lengkap seluruh built-in function yang tersedia di Jawalang V1.4.0 (62 built-in: 23 built-in legacy + 10 built-in standard library foundation + 16 built-in Date & Time + 2 built-in JSON & Serialization + 6 built-in File System Foundation + 5 built-in Testing & Assertion Foundation).

---

## 1. Built-in Testing & Assertion Foundation Baru (V1.4.0 Phase 14)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan & Perilaku |
|---|---|---|---|---|---|
| `uji` | Testing | 1-2 (`kondisi: boolean`, `[pesan: string]`) | `boolean` | No | Memeriksa apakah kondisi bernilai boolean `bener`. Jika salah, melempar runtime error assertion. Lolos mengembalikan `bener` tanpa output konsol. |
| `ujiPadha` | Testing | 2-3 (`aktual: any`, `expected: any`, `[pesan: string]`) | `boolean` | No | Memeriksa apakah nilai `aktual` sama dengan `expected` (`==`) menurut semantik Jawalang (strict type, reference equality untuk array/objek, timestamp untuk datetime). Melempar error assertion jika berbeda. |
| `ujiBeda` | Testing | 2-3 (`aktual: any`, `expected: any`, `[pesan: string]`) | `boolean` | No | Memeriksa apakah nilai `aktual` berbeda dari `expected` (`!=`). Melempar error assertion jika nilainya sama. |
| `ujiJinis` | Testing | 2-3 (`nilai: any`, `tipe: string`, `[pesan: string]`) | `boolean` | No | Memeriksa apakah tipe data runtime nilai sesuai dengan nama string `tipe` ("number", "string", "boolean", "array", "object", "function", "null", "datetime", "struct", "instance", "namespace"). |
| `ujiError` | Testing | 1-2 (`fungsi: function`, `[pesan: string]`) | `boolean` | No | Memeriksa apakah pemanggilan `fungsi()` melempar runtime error. Lolos jika terjadi runtime error; melempar error assertion jika fungsi selesai normal tanpa melempar error. |

---

## 2. Built-in File System Foundation (V1.4.0 Phase 13)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan & Perilaku |
|---|---|---|---|---|---|
| `macaFile` | File System | 1 (`path: string`) | `string` | No | Membaca isi berkas teks berenkode UTF-8 di dalam sandbox root. Berkas kosong mengembalikan `""`. Melempar error pada path di luar sandbox, path absolut, atau jika berkas tidak ditemukan. |
| `tulisFile` | File System | 2 (`path: string`, `isi: string`) | `null` | No | Menulis string teks berenkode UTF-8 ke berkas di dalam sandbox root. Parameter `isi` wajib bertipe string. Menimpa berkas jika sudah ada. |
| `anaPath` | File System | 1 (`path: string`) | `boolean` | No | Memeriksa apakah berkas atau direktori ada pada path yang ditentukan (`bener` atau `salah`). Pelanggaran keamanan sandbox melempar error. |
| `jinisPath` | File System | 1 (`path: string`) | `string` | No | Memeriksa jenis entri sistem berkas (`"file"`, `"folder"`, atau `"oraAna"`). |
| `isiFolder` | File System | 1 (`path: string`) | `array` | No | Mengembalikan daftar nama entri di dalam folder sebagai array string. Hanya nama entri, bukan path absolut. |
| `gaweFolder` | File System | 1 (`path: string`) | `null` | No | Membuat folder baru secara rekursif di dalam sandbox root. Bersifat idempoten jika sudah ada; melempar error jika path sudah ada sebagai berkas. |

---

## 3. Built-in JSON & Serialization Standard Library (V1.4.0 Phase 12)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan & Perilaku |
|---|---|---|---|---|---|
| `jsonEncode` | Serialization | 1 (`nilai: any`) | `string` | No | Mengonversi struktur data Jawalang (`number`, `string`, `boolean`, `null`, `array`, `object`) menjadi string JSON RFC 8259. Deep validation, cycle guard, depth limit 500. Menolak function, datetime, struct, instance, namespace. |
| `jsonDecode` | Serialization | 1 (`teks: string`) | `any` | No | Mengurai string teks format JSON menjadi representasi runtime native Jawalang (`number`, `string`, `boolean`, `null`, `array`, `object`). Menolak input kosong, malformed, dan trailing data. Isolasi heap terjamin. |

---

## 4. Built-in Date & Time Standard Library (V1.4.0 Phase 11)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan & Perilaku |
|---|---|---|---|---|---|
| `saiki` | DateTime | 0 | `datetime` | No | Mengembalikan waktu sistem saat ini sebagai objek runtime `datetime` immutable. |
| `timestamp` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil Unix timestamp integer milidetik sejak epoch (UTC). Melempar error pada non-datetime. |
| `gaweWektu` | DateTime | 1, 3, atau 6 | `datetime` | No | Membuat `datetime` baru dari `(ms)` atau `(thn, bln, tgl[, jam, mnt, dtk])`. Bulan 1-based (1-12). Validasi kalender & kabisat ketat. |
| `taun` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen tahun (UTC) 4 digit. Melempar error pada non-datetime. |
| `wulan` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen bulan (UTC) 1-based (1–12). Melempar error pada non-datetime. |
| `dina` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen tanggal/hari (UTC) 1–31. Melempar error pada non-datetime. |
| `jam` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen jam (UTC) 0–23. Melempar error pada non-datetime. |
| `menit` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen menit (UTC) 0–59. Melempar error pada non-datetime. |
| `detik` | DateTime | 1 (`waktu: datetime`) | `number` | No | Mengambil komponen detik (UTC) 0–59. Melempar error pada non-datetime. |
| `formatWektu` | DateTime | 2 (`waktu: datetime`, `pola: string`) | `string` | No | Memformat `datetime` berdasarkan token `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss` dalam UTC. |
| `parseWektu` | DateTime | 1 (`teks: string`) | `datetime` | No | Parsing deterministik format `YYYY-MM-DD` atau `YYYY-MM-DD HH:mm:ss`. Validasi kalender riil & kabisat. |
| `sadurunge` | DateTime | 2 (`a: datetime`, `b: datetime`) | `boolean` | No | Memeriksa apakah `a` terjadi sebelum `b` (`a < b`). Strict datetime type. |
| `sawise` | DateTime | 2 (`a: datetime`, `b: datetime`) | `boolean` | No | Memeriksa apakah `a` terjadi sesudah `b` (`a > b`). Strict datetime type. |
| `padhaWektu` | DateTime | 2 (`a: datetime`, `b: datetime`) | `boolean` | No | Memeriksa apakah timestamp `a` dan `b` sama persis (`a == b`). Strict datetime type. |
| `tambahWektu` | DateTime | 2 (`waktu: datetime`, `detik: number`) | `datetime` | No | Mengembalikan `datetime` baru hasil penambahan sejumlah detik. Immutability terjamin. |
| `kurangWektu` | DateTime | 2 (`waktu: datetime`, `detik: number`) | `datetime` | No | Mengembalikan `datetime` baru hasil pengurangan sejumlah detik. Immutability terjamin. |

---

## 5. Built-in Standard Library Foundation (V1.4.0 Phase 10)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan & Perilaku |
|---|---|---|---|---|---|
| `abs` | Math | 1 (`n: number`) | `number` | No | Nilai absolut angka (misal `-10` -> `10`). Melempar error pada non-angka. |
| `min` | Math | 2 (`a: number`, `b: number`) | `number` | No | Nilai terkecil dari dua angka. Melempar error pada non-angka. |
| `max` | Math | 2 (`a: number`, `b: number`) | `number` | No | Nilai terbesar dari dua angka. Melempar error pada non-angka. |
| `akar` | Math | 1 (`n: number`) | `number` | No | Akar kuadrat non-negatif. Melempar error pada angka negatif atau non-angka. |
| `pangkat` | Math | 2 (`base: number`, `exp: number`) | `number` | No | Pemangkatan eksponensial. Melempar error pada tipe non-angka atau hasil kompleks. |
| `ngemot` | String | 2 (`teks: string`, `bagian: string`) | `boolean` | No | Pengecekan apakah `teks` memuat substring `bagian`. Strict string type. |
| `diwiwiti` | String | 2 (`teks: string`, `awalan: string`) | `boolean` | No | Pengecekan apakah `teks` diawali dengan prefix `awalan`. Strict string type. |
| `dipungkasi` | String | 2 (`teks: string`, `akhiran: string`) | `boolean` | No | Pengecekan apakah `teks` diakhiri dengan suffix `akhiran`. Strict string type. |
| `trim` | String | 1 (`teks: string`) | `string` | No | Menghapus spasi/whitespace di awal dan akhir teks. Tidak memutasi argumen asli. |
| `pecah` | String | 2 (`teks: string`, `pemisah: string`) | `array` | No | Memecah teks berdasarkan pemisah menjadi representasi Array Jawalang valid. |

---

## 6. Built-in Legacy yang Dipertahankan (V1.0 - V1.3)

| Function | Category | Arguments | Return Type | Mutates Argument | Keterangan |
|---|---|---|---|---|---|
| `jinis` | Type Introspection | 1 (`val: any`) | `string` | No | Mendapatkan tipe data runtime (`"number"`, `"string"`, `"boolean"`, `"datetime"`, dll). |
| `dawa` | Collection / String | 1 (`val: array\|string`) | `number` | No | Mengembalikan panjang array atau string. |
| `jupuk` | Array | 2 (`arr: array`, `idx: number`) | `any` | No | Mengambil elemen array pada indeks tertentu (0-indexed). |
| `nambah` | Array | 2 (`arr: array`, `val: any`) | `array` | Yes | Menambahkan elemen ke ujung array. |
| `busak` | Array | 2 (`arr: array`, `idx: number`) | `any` | Yes | Menghapus elemen array pada indeks tertentu. |
| `motong` | Array / String | 3 (`val: array\|string`, `start`, `end`) | `array\|string` | No | Mengambil irisan slice array atau string. |
| `ngganti` | Array / String | 3 (`val`, `search`, `replace`) | `array\|string` | No | Mengganti elemen pada array atau substring pada string. |
| `gedhe` | String | 1 (`teks: string`) | `string` | No | Mengubah teks ke huruf besar (UPPERCASE). |
| `cilik` | String | 1 (`teks: string`) | `string` | No | Mengubah teks ke huruf kecil (lowercase). |
| `takon` | I/O | 1 (`prompt: string`) | `string` | No | Membaca input pengguna dari terminal/stdin secara sinkron. |
| `kunci` | Object | 1 (`obj: object`) | `array` | No | Mengambil daftar kunci (keys) dari sebuah objek. |
| `nilai` | Object | 1 (`obj: object`) | `array` | No | Mengambil daftar nilai (values) dari sebuah objek. |
| `duwe` | Object | 2 (`obj: object`, `key: string`) | `boolean` | No | Memeriksa apakah objek memiliki property key tertentu. |
| `terapkan` | Higher-Order Func | 2 (`fn: function`, `arr: array`) | `array` | No | Memetakan (map) setiap elemen array menggunakan fungsi callable. |
| `saring` | Higher-Order Func | 2 (`fn: function`, `arr: array`) | `array` | No | Menyaring (filter) elemen array berdasarkan predikat. |
| `itung` | Higher-Order Func | 3 (`fn`, `arr: array`, `init: any`) | `any` | No | Mengurangi/mengakumulasi (reduce) elemen array. |
| `gabung` | Array | 2 (`arr: array`, `sep: string`) | `string` | No | Menggabungkan elemen-elemen array menjadi string dengan pemisah `sep`. |
| `balik` | Array | 1 (`arr: array`) | `array` | No | Membalik urutan elemen array (menghasilkan salinan baru). |
| `urut` | Array | 1-2 (`arr: array`, `[comparator]`) | `array` | No | Mengurutkan elemen array (menghasilkan salinan baru). |
| `ana` | Higher-Order Func | 2 (`fn: function`, `arr: array`) | `boolean` | No | Memeriksa apakah minimal satu elemen memenuhi predikat (some). |
| `kabeh` | Higher-Order Func | 2 (`fn: function`, `arr: array`) | `boolean` | No | Memeriksa apakah seluruh elemen memenuhi predikat (every). |
| `golek` | Higher-Order Func | 2 (`fn: function`, `arr: array`) | `any` | No | Mencari elemen pertama yang memenuhi predikat (find). |
| `indeks` | Array / String | 2 (`haystack`, `needle`) | `number` | No | Mencari indeks kemunculan elemen/karakter pertama (-1 jika tidak ada). |

---

## 7. Matriks Kompatibilitas Fitur

| Fitur | V1.3.0 | V1.4.0 Phase 10 | V1.4.0 Phase 11 | V1.4.0 Phase 12 | V1.4.0 Phase 13 | V1.4.0 Phase 14 | Keterangan |
|---|---|---|---|---|---|---|---|
| Total Built-in | 23 | 33 | 49 | 51 | 57 | 62 | +5 Testing & Assertion |
| Math Library (`abs`, `min`, `max`, `akar`, `pangkat`) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Pure, deterministic, strict validation |
| String Utilities (`ngemot`, `diwiwiti`, `dipungkasi`, `trim`, `pecah`) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | Pure, immutability terjaga |
| Date & Time Library (16 built-in) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | UTC model, pure, deterministic, immutable, kalender valid |
| JSON & Serialization (`jsonEncode`, `jsonDecode`) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | RFC 8259, deep validation, cycle detection, depth limit |
| File System Foundation (6 built-in) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Sandboxed, traversal proof, UTF-8, non-destructive |
| Testing & Assertion (`uji`, `ujiPadha`, `ujiBeda`, `ujiJinis`, `ujiError`) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | No global state, catchable error, first-class functions |
| First-Class Builtin Function | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Builtin dapat dioper sebagai nilai variabel/array |
| Higher-Order Compatibility (`terapkan`, `saring`, dll.) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | Builtin baru kompatibel penuh dengan HOF |
| LSP Completion & Hover Sync | ✅ (23) | ✅ (33) | ✅ (49) | ✅ (51) | ✅ (57) | ✅ (62) | Terintegrasi di LSP V1.3+ |
| LSP Signature Help Sync | ✅ (23) | ✅ (33) | ✅ (49) | ✅ (51) | ✅ (57) | ✅ (62) | Parameter tracker aktif |
| LSP Semantic Tokens (`defaultLibrary`) | ✅ (23) | ✅ (33) | ✅ (49) | ✅ (51) | ✅ (57) | ✅ (62) | Diberi highlight semantic library |
| Full Test Runner CLI (`jawa test`) / Mocks / Spies | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Sengaja dibatasi untuk fase rilis runner masa depan |

