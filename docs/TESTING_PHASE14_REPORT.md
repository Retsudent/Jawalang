# Jawalang V1.4.0 — Testing & Assertion Foundation

## Status

PASS

---

## API Design

Desain API Testing & Assertion Foundation dirancang melalui audit komprehensif terhadap seluruh arsitektur Jawalang:
- **No Parser / Grammar Modification**: Testing diimplementasikan sebagai fungsi built-in standard library murni tanpa menambah kata kunci baru seperti `assert` ke grammar ataupun parser.
- **Authentic Javanese Naming & Collision Free**: Dilakukan audit benturan nama (*collision audit*) terhadap seluruh 57 built-in eksisting, kata kunci, dan struktur data. Nama-nama terpilih terbukti bebas benturan:
  - `uji`: Assertion boolean umum.
  - `ujiPadha`: Assertion kesetaraan (*equality*).
  - `ujiBeda`: Assertion ketidaksamaan (*inequality*).
  - `ujiJinis`: Assertion tipe data runtime.
  - `ujiError`: Assertion pelemparan error dari pemanggilan fungsi.
- **First-Class Functions**: Seluruh fungsi assertion dapat disimpan ke dalam variabel atau dioperkan sebagai argumen *higher-order function*.

---

## Builtins

Total built-in functions bertambah dari **57** menjadi **62** (23 built-in legacy + 39 built-in standard library):

1. **`uji(kondisi: boolean, [pesan: string]): boolean`**
   - Memeriksa apakah `kondisi` adalah boolean `bener`.
   - Melempar error validasi tipe jika diberikan nilai non-boolean (misal string atau number).
2. **`ujiPadha(aktual: any, expected: any, [pesan: string]): boolean`**
   - Memeriksa kesetaraan nilai (`aktual == expected`) menurut semantik Jawalang (strict type, tanpa pemaksaan tipe otomatis, perbandingan timestamp untuk `datetime`, referensi untuk array dan objek).
3. **`ujiBeda(aktual: any, expected: any, [pesan: string]): boolean`**
   - Memeriksa ketidaksamaan nilai (`aktual != expected`).
4. **`ujiJinis(nilai: any, tipe: string, [pesan: string]): boolean`**
   - Memeriksa kesesuaian tipe data runtime dengan nama tipe (`"number"`, `"string"`, `"boolean"`, `"array"`, `"object"`, `"function"`, `"null"`, `"datetime"`, `"struct"`, `"instance"`, `"namespace"`).
5. **`ujiError(fungsi: function, [pesan: string]): boolean`**
   - Memeriksa apakah pemanggilan `fungsi()` melempar runtime error. Lolos jika terjadi error; melempar error assertion jika fungsi selesai normal tanpa melempar error.

---

## Assertion Semantics

- **PASS**: Mengembalikan nilai `bener` (boolean `true`) secara senyap tanpa mencetak apapun ke konsol (tidak mencetak string `"PASS"` otomatis).
- **FAIL**: Melempar runtime error Jawalang yang informatif dan dapat ditangkap menggunakan blok `coba ... tangkep`.
- **Zero Global State**: Murni deterministik tanpa counter global (`passed++`, `failed++`), sehingga aman dari kontaminasi state pada rekursi, modul, REPL, maupun eksekusi paralel di masa depan.

---

## Error Model

Format pesan kesalahan dirancang informatif dan ramah pengguna tanpa membocorkan internal JavaScript stack trace:
- **Boolean**:
  `Assertion gagal: kondisi kudu bener` (atau dengan pesan kustom).
- **Equality**:
  `Assertion gagal:\nexpected: <expected>\nactual: <aktual>`
- **Inequality**:
  `Assertion gagal:\nnilai kudu beda, nanging padha-padha: <aktual>`
- **Type**:
  `Assertion gagal:\nexpected type "<tipe>"\nactual type "<aktualType>"`
- **Error Assertion**:
  `Assertion gagal: fungsi kudu ngasilake error (fungsi harus menghasilkan error)`

---

## Exception Integration

- Seluruh kegagalan assertion menghasilkan error standar Jawalang yang kompatibel penuh dengan mekanisme penanganan eksepsi `coba ... tangkep`.
- Assertion failure tidak mematikan interpreter atau proses Node.js jika dibungkus dalam blok penanganan eksepsi.
- `ujiError` secara cerdas mengisolasi sinyal alur kontrol (`bali` / `ReturnSignal`, `mandheg` / `BreakSignal`, `lanjut` / `ContinueSignal`) sehingga sinyal kontrol alur tidak disalahartikan sebagai error biasa.

---

## Module Integration

- Seluruh 5 built-in testing terdaftar pada scope global environment sehingga otomatis dapat diakses langsung di dalam modul manapun yang diimpor tanpa perlu impor tambahan.
- Terverifikasi pada fixture `examples/modules/test_testing_module.jawa`.

---

## REPL Integration

- Sesi interaktif REPL (`jawa`, `jawa repl`) dapat menjalankan fungsi assertion secara transparan.
- Assertion yang berhasil berjalan mulus.
- Assertion yang gagal mencetak pesan kesalahan yang jelas dan sesi REPL tetap hidup untuk menerima perintah berikutnya.

---

## LSP Integration

Telah disinkronkan ke katalog `BUILTINS` pada `language-server/src/utils.js`:
- **Completion**: Autocomplete untuk `uji`, `ujiPadha`, `ujiBeda`, `ujiJinis`, `ujiError`.
- **Hover**: Tooltips dokumentasi lengkap beserta contoh kode runnable.
- **Signature Help**: Parameter tracker aktif untuk setiap parameter wajib dan opsional (`[pesan]`).
- **Semantic Tokens**: Diberi token `function` dan modifier `defaultLibrary`.
- **Rename Protection**: Simbol dilindungi dari manipulasi rename symbol.

---

## Security Audit

Pemeriksaan keamanan kode terhadap `src/stdlib/testing.js`:
- `eval()`: TIDAK DIGUNAKAN (0 temuan).
- `Function()`: TIDAK DIGUNAKAN (0 temuan).
- `child_process`: TIDAK DIGUNAKAN (0 temuan).
- `exec()` / `spawn()`: TIDAK DIGUNAKAN (0 temuan).
- `process.exit()`: TIDAK DIGUNAKAN (0 temuan).
- `process.abort()`: TIDAK DIGUNAKAN (0 temuan).

---

## Portability

- Bebas path absolut hardcoded (`C:\Jawalang`, `D:\Jawalang`, dll).
- Seluruh penanganan path, pemformatan string, dan assertion sepenuhnya platform-independent (Windows, Linux, macOS).
- Terverifikasi via `scratch/test_portability.js` (11/11 PASS).

---

## Tests

1. **`scratch/test_testing_v140.js`**:
   - 88 test assertions di 23 kategori (A–W): **88/88 PASS (100%)**.
2. **`examples/test_testing.jawa`**:
   - Eksekusi program testing positif: **PASS (exit code 0)**.
3. **`examples/test_testing_error.jawa`**:
   - Eksekusi penanganan error assertion via `coba ... tangkep`: **PASS (exit code 0)**.

---

## Regression

Seluruh rangkaian regresi lulus 100%:
- `scratch/run_full_regression.js`: **80/80 PASS (100%)**
  - Positive Tests: 34/34 PASS
  - Negative Tests: 22/22 PASS
  - Scratch Test Suites: 24/24 PASS
- `npm test`: **PASS (100%)**
- `language-server/test/run_tests.js`: **12/12 Suites PASS (281 Unit Tests)**
- `scratch/test_vscode_smoke.js`: **21/21 PASS**
- `scratch/test_npm_package.js`: **PASS**
- `scratch/test_npm_api.js`: **PASS**
- `scratch/test_portability.js`: **11/11 PASS**

---

## Files Changed

- `src/stdlib/helpers.js` (Menambahkan `requireArgRange`, `isCallable`, `requireCallable`, `isEqual`, `formatValue`)
- `src/stdlib/index.js` (Mendaftarkan `testingBuiltins` dan `stdlibMetadata`)
- `src/interpreter.js` (Injeksi `createTestingBuiltins` dengan eksekutor callable, ekspor signal)
- `language-server/src/utils.js` (Mendaftarkan 5 built-in testing ke kamus `BUILTINS`)
- `scratch/run_full_regression.js` (Mendaftarkan `test_testing.jawa`, `test_testing_error.jawa`, dan `test_testing_v140.js`)
- `docs/STDLIB_INVENTORY_V1.4.0.md` (Pembaruan inventaris menjadi 62 fungsi dan tabel matriks)
- `docs/PROJECT_STATUS.md` (Pembaruan status milestone V1.4.0 Phase 14)
- `CHANGELOG.md` (Catatan rilis V1.4.0 Phase 14)
- `Readme.md` (Pembaruan ringkasan fitur Testing Foundation)

---

## Files Added

- `src/stdlib/testing.js` (Modul standar testing dan assertion)
- `examples/test_testing.jawa` (Contoh program pengujian positif Jawalang)
- `examples/test_testing_error.jawa` (Contoh penanganan error assertion via `coba ... tangkep`)
- `examples/modules/test_testing_module.jawa` (Fixture modul pengujian)
- `scratch/test_testing_v140.js` (Test suite komprehensif 88 assertions)
- `docs/TESTING_ARCHITECTURE.md` (Dokumen spesifikasi arsitektur pengujian)
- `docs/testing.md` (Panduan referensi resmi pengguna)
- `docs/TESTING_PHASE14_REPORT.md` (Laporan formal rilis Phase 14)

---

## Known Limitations

- Belum menyertakan test runner otomatis (`jawa test`).
- Belum menyertakan file discovery pattern matching.
- Belum menyertakan mocking, spies, atau snapshot testing (direncanakan untuk fase berikutnya).

---

## Release Recommendation

**READY**
