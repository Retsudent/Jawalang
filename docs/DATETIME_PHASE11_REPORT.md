# Jawalang V1.4.0 — Date & Time Standard Library

## Status

PASS

Seluruh sasaran, kriteria penerimaan, dan *quality gates* untuk Phase 11 — Date & Time Standard Library telah diselesaikan dengan status 100% lolos (PASS).

---

## Architecture

Standard library Date & Time diimplementasikan secara modular pada layer terpisah `src/stdlib/datetime.js`, mengikuti pola arsitektur standard library foundation Phase 10:
- **Pemisahan Modul**: Logika datetime tidak ditumpuk langsung di `src/interpreter.js`. Modul `datetime.js` mengisolasi pembuatan, validasi, pemformatan, dan perhitungan waktu.
- **Pendaftaran Terpusat**: `src/stdlib/index.js` mengimpor `datetimeBuiltins` dan mengekspornya dalam satu `stdlibBuiltins` dictionary yang didaftarkan ke interpreter saat inisialisasi lingkungan (*environment*).
- **Validasi Reusable**: `src/stdlib/helpers.js` diekstensi dengan fungsi pembantu `requireDateTime`, `isLeapYear`, `getDaysInMonth`, dan integrasi tipe `_isDateTime` pada `getType`.
- **Ekstensi Interpreter**: Interpreter diperbarui hanya pada 3 titik strategis:
  1. Pengenalan tipe internal `_isDateTime` dalam `getType()` yang mengembalikan string `"datetime"`.
  2. Format pencetakan nilai `formatValue()` yang mencetak `<datetime YYYY-MM-DD HH:mm:ssZ>`.
  3. Operator kesetaraan `==` dan `!=` yang membandingkan timestamp milidetik UTC untuk objek `_isDateTime`.

---

## Runtime Representation

- Objek waktu direpresentasikan sebagai struktur objek internal:
  ```javascript
  {
      _isDateTime: true,
      timestamp: <integer ms sejak Unix Epoch>
  }
  ```
- **Tanpa Kebocoran (Zero Leakage)**: Objek asli JavaScript `Date` tidak pernah dibocorkan atau diekspos ke lingkungan program Jawalang.
- **Immutability Mutlak**: Setiap instans objek dibekukan dengan `Object.freeze()`.
- **Tipe Runtime**: `jinis(waktu)` mengembalikan `"datetime"`.

---

## New Builtins

Total 16 built-in function baru ditambahkan pada Phase 11:

1. `saiki() -> datetime`: Mengembalikan waktu sistem saat ini.
2. `timestamp(waktu) -> number`: Mengembalikan integer Unix timestamp dalam milidetik.
3. `gaweWektu(...) -> datetime`: Konstruktor waktu dari timestamp `(ms)` atau komponen kalender `(thn, bln, tgl[, jam, mnt, dtk])` dengan bulan 1-based (1–12) dan validasi kabisat ketat.
4. `taun(waktu) -> number`: Komponen tahun UTC.
5. `wulan(waktu) -> number`: Komponen bulan UTC (1-based, 1–12).
6. `dina(waktu) -> number`: Komponen tanggal UTC (1–31).
7. `jam(waktu) -> number`: Komponen jam UTC (0–23).
8. `menit(waktu) -> number`: Komponen menit UTC (0–59).
9. `detik(waktu) -> number`: Komponen detik UTC (0–59).
10. `formatWektu(waktu, pola) -> string`: Format string berdasarkan token `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss` dalam UTC.
11. `parseWektu(teks) -> datetime`: Parsing string deterministik format `YYYY-MM-DD` atau `YYYY-MM-DD HH:mm:ss` dengan validasi kalender dan tahun kabisat.
12. `sadurunge(a, b) -> boolean`: Evaluasi kronologis apakah `a < b`.
13. `sawise(a, b) -> boolean`: Evaluasi kronologis apakah `a > b`.
14. `padhaWektu(a, b) -> boolean`: Evaluasi kesamaan waktu persis apakah `timestamp(a) == timestamp(b)`.
15. `tambahWektu(waktu, jumlahDetik) -> datetime`: Menghasilkan `datetime` baru dengan penambahan detik.
16. `kurangWektu(waktu, jumlahDetik) -> datetime`: Menghasilkan `datetime` baru dengan pengurangan detik.

---

## Timezone Model

- **UTC Konsisten**: Jawalang V1.4.0 mengadopsi model zona waktu UTC (Coordinated Universal Time) secara menyeluruh.
- Komponen ekstraksi (`taun`, `wulan`, `dina`, `jam`, `menit`, `detik`) membaca komponen UTC (`getUTCFullYear()`, `getUTCMonth() + 1`, `getUTCDate()`, `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`).
- Parsing dan pemformatan beroperasi pada basis waktu UTC.
- Kebal terhadap perbedaan timezone lokal mesin host dan fluktuasi *Daylight Saving Time* (DST), menjamin eksekusi yang 100% deterministik dan portabel.

---

## Formatting

- Diimplementasikan oleh fungsi `formatWektu(waktu, pola)`.
- Menggantikan token kalender:
  - `YYYY`: Tahun 4 digit (misal `2026`).
  - `MM`: Bulan 2 digit berpading nol (`01`–`12`).
  - `DD`: Hari 2 digit berpading nol (`01`–`31`).
  - `HH`: Jam 24-jam 2 digit berpading nol (`00`–`23`).
  - `mm`: Menit 2 digit berpading nol (`00`–`59`).
  - `ss`: Detik 2 digit berpading nol (`00`–`59`).
- Karakter pemisah di luar token dipertahankan verbatim.

---

## Parsing

- Diimplementasikan oleh fungsi `parseWektu(teks)`.
- Hanya menerima format deterministik:
  - `YYYY-MM-DD`
  - `YYYY-MM-DD HH:mm:ss`
- **Tidak Menggunakan Heuristik String JS Date**: Menggunakan regex deterministik dan validasi rentang kalender langsung:
  - Bulan: 1–12
  - Hari: 1–jumlah hari aktual bulan tersebut (termasuk validasi tahun kabisat).
  - Jam: 0–23
  - Menit: 0–59
  - Detik: 0–59
- Input teks invalid (misal `"abc"` atau `"2026-99-99"`) memicu runtime error eksplisit Jawalang.

---

## Error Handling

- **Pesan Dwibahasa (Jawa & Indonesia)**:
  - Tipe tidak sesuai: `Kudu datetime / Harus bertipe datetime, nanging nampa tulisan`.
  - Jumlah argumen tidak tepat: `Fungsi '...' butuh N argumen, nanging nampa M`.
  - Kalender invalid: `Dina ora sah ing tanggal kalender / Hari tidak valid dalam kalender`.
  - Pola parse invalid: `Format tanggal ora sah / Format tanggal tidak valid`.
- Tidak ada silent coercion atau silent fallback.

---

## Tests

### 1. Test Suite Date & Time (`scratch/test_datetime_v140.js`)
70/70 assertions PASS (100%) meliputi:
- **Category A**: Current Time `saiki()` (tipe `datetime`, timestamp integer, non-decreasing)
- **Category B**: Timestamp `timestamp()` (integer Unix ms)
- **Category C**: Construction `gaweWektu()` (dari ms, 3 argumen, 6 argumen)
- **Category D**: Component Accessors (`taun`, `wulan`, `dina`, `jam`, `menit`, `detik`)
- **Category E**: Formatting `formatWektu()` (`YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`, custom separator)
- **Category F**: Deterministic Parsing `parseWektu()` (`YYYY-MM-DD`, `YYYY-MM-DD HH:mm:ss`)
- **Category G**: Comparison `sadurunge()`, `sawise()`, `padhaWektu()`
- **Category H**: Arithmetic `tambahWektu()`, `kurangWektu()`
- **Category I**: Immutability Verification (objek asal tidak berubah, `Object.isFrozen`)
- **Category J**: Invalid Date Rejection (`2026-02-30`, `2026-13-01`, `2026-00-10`)
- **Category K**: Leap Year Rules (`2024-02-29` valid, `2025-02-29` error, `2000` vs `1900`)
- **Category L**: Argument Count Validation (`saiki(1)`, `timestamp()`, `timestamp(a, b)`, dll.)
- **Category M**: Strict Type Validation (`timestamp("abc")`, `taun(10)`, `formatWektu(1, 2)`)
- **Category N**: Null Safety (`timestamp(null)`, `taun(null)`)
- **Category O**: First-Class Builtin Assignment (`gawe f = timestamp; f(w)`)
- **Category P**: Array & Object Integration (penyimpanan datetime dalam struktur data Jawalang)
- **Category Q**: Higher-Order Compatibility (`terapkan` dengan `timestamp`, `saring` dengan `sadurunge`)
- **Category R**: Module Import Compatibility (`impor` datetime functions lintas modul)
- **Category S**: REPL State Persistence & Formatting (`<datetime ...>`)
- **Category T**: LSP Catalog Synchronization (16 builtins terdaftar dengan signature lengkap)

### 2. Core Language Test Fixtures
- `examples/test_datetime.jawa`: Skenario positif integrasi kalender, komparasi, dan aritmatika.
- `examples/test_datetime_error.jawa`: Skenario negatif penolakan tanggal kalender tidak valid (`gaweWektu(2026, 2, 30)`).

---

## LSP Integration

Semua 16 built-in Date & Time telah didaftarkan pada katalog utama LSP (`language-server/src/utils.js`):
- **Completion**: Menyediakan autocompletion dengan dokumentasi dan contoh kode.
- **Hover**: Menampilkan signature Markdown detail dan deskripsi parameter.
- **Signature Help**: Melacak parameter aktif (`activeParameter`) saat mengetik pemanggilan fungsi.
- **Semantic Tokens**: Diberi token type `function` dengan modifier `defaultLibrary`.
- **Rename Protection**: Dilindungi dari upaya rename ilegal (*protected built-in symbol*).

---

## Security

- **Zero Arbitrary Execution**: Tidak menggunakan `eval` atau `Function()` constructor.
- **Zero OS Leakage**: Tidak menggunakan `child_process`, filesystem, maupun modul network.
- **Zero Environment Leakage**: Tidak mengakses `process.env` atau variabel sistem.
- **Strict Immutability**: Objek `datetime` dibekukan dengan `Object.freeze()`.

---

## Portability

- Bebas dari hardcoded absolute path (tidak ada `C:\Jawalang` atau `D:\Jawalang`).
- Hanya menggunakan API standar JavaScript runtime ECMAScript (Node.js >= 16).
- Determinisme kalender UTC murni, tidak terpengaruh perbedaan zona waktu atau locale sistem operasi.

---

## Files Changed

- `src/stdlib/helpers.js`: Integrasi tipe `_isDateTime`, validator `requireDateTime`, serta fungsi `isLeapYear` dan `getDaysInMonth`.
- `src/stdlib/index.js`: Pendaftaran modul `datetimeBuiltins` dan metadata standar.
- `src/interpreter.js`: Penanganan `jinis()` untuk `datetime`, display format `<datetime ...>`, dan kesetaraan `==` / `!=`.
- `language-server/src/utils.js`: Registrasi metadata 16 built-in datetime pada master catalog LSP.
- `scratch/run_full_regression.js`: Penambahan test runner `test_datetime_v140.js` dan fixture language.
- `docs/PROJECT_STATUS.md`: Pembaruan status milestone dan penambahan metrik tes (854+ tests).
- `Readme.md`: Penambahan dokumentasi Date & Time, pembaruan roadmap, dan badge pengujian.
- `CHANGELOG.md`: Dokumentasi rilis modul Date & Time Standard Library V1.4.0 Phase 11.
- `docs/STDLIB_INVENTORY_V1.4.0.md`: Pembaruan daftar inventori standard library menjadi 49 built-in functions.

---

## Files Added

- `src/stdlib/datetime.js`: Implementasi 16 fungsi Date & Time Jawalang V1.4.0.
- `docs/DATETIME_ARCHITECTURE.md`: Dokumen spesifikasi arsitektur Date & Time.
- `docs/date-time.md`: Panduan referensi pengguna resmi Date & Time.
- `scratch/test_datetime_v140.js`: Master test suite komprehensif 70 assertions (A–T).
- `examples/test_datetime.jawa`: Test fixture bahasa positif.
- `examples/test_datetime_error.jawa`: Test fixture bahasa negatif.
- `docs/DATETIME_PHASE11_REPORT.md`: Laporan penutupan formal Phase 11.

---

## Regression

- **`npm test`**: 71/71 PASS (29 Positive Tests + 21 Negative Tests + 21 Scratch Runners).
- **`scratch/test_datetime_v140.js`**: 70/70 PASS (20 Categories A–T).
- **`language-server/test/run_tests.js`**: 12/12 test suites PASS (281 unit tests).
- **`scratch/test_language_server.js`**: 81/81 PASS (100%).
- **`scratch/test_vscode_smoke.js`**: 21/21 PASS (100%).
- **`scratch/test_lsp_phase9.js`**: 55/55 PASS (100%).
- **`scratch/test_portability.js`**: 11/11 PASS (100%).
- **Total Tests Passing**: **854+ / 854+ PASS (100%)**.
- Tidak ada regresi pada fungsionalitas core, OOP, modul, math, string, maupun LSP.

---

## Known Limitations

1. **Model Zona Waktu**: V1.4.0 secara eksklusif menggunakan UTC. Zona waktu lokal terkonfigurasi (misalnya `Asia/Jakarta` / WIB / WITA / WIT) atau konversi zona waktu offset IANA sengaja ditangguhkan untuk fase pengembangan berikutnya (*No premature features*).
2. **Format Token**: Pemformatan saat ini mendukung token esensial `YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`. Nama bulan terlokalisasi (misal `"Januari"`, `"Rejeb"`), nama hari (misal `"Senen"`, `"Pon"`), dan milidetik belum diikutsertakan pada fase ini.
3. **Parsing**: Hanya menerima format deterministik `YYYY-MM-DD` dan `YYYY-MM-DD HH:mm:ss`.

---

## Release Recommendation

READY

Implementasi Date & Time Standard Library V1.4.0 Phase 11 telah memenuhi seluruh kriteria kualitas, keamanan, immutability, sinkronisasi tooling LSP, dokumentasi, dan lulus seluruh pengujian regresi tanpa kegagalan tersembunyi.
