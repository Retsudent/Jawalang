# Jawalang V1.4.0 — JSON & Serialization

## Status

PASS

Seluruh sasaran, kriteria penerimaan, dan *quality gates* untuk Phase 12 — JSON & Serialization Foundation telah diselesaikan dengan status 100% lolos (PASS).

---

## Architecture

Standard library JSON & Serialization diimplementasikan secara modular pada layer terpisah `src/stdlib/json.js` mengikuti arsitektur modular yang dirintis pada Phase 10 dan 11:
- **Pemisahan Modul**: Modul `src/stdlib/json.js` mengisolasi seluruh logika traversal rekursif, validasi tipe data mendalam (*deep validation*), penanganan siklus, pemformatan, dan penguraian string JSON.
- **Pendaftaran Terpusat**: `src/stdlib/index.js` mengimpor `jsonBuiltins` dan mengekspornya ke dalam kamus `stdlibBuiltins` dan `stdlibMetadata`. Builtin terintegrasi secara otomatis ke lingkungan runtime tanpa perlu memodifikasi kode inti `src/interpreter.js`.
- **Integrasi Helper**: Memanfaatkan helper validasi dari `src/stdlib/helpers.js` (`requireArgCount`, `requireString`, `getType`).

---

## Supported Types

JSON adalah format pertukaran data (*data interchange format*), bukan representasi eksekusi kode. Tipe runtime Jawalang yang didukung mencakup:
1. `nomer` (number): Bilangan bulat, pecahan desimal, notasi eksponensial. Dibatasi pada angka finite (menolak `NaN`, `Infinity`, `-Infinity`).
2. `tulisan` (string): String UTF-8 dengan dukungan penuh karakter escape (`\n`, `\t`, `\"`, `\\`) dan karakter Unicode (Aksara Jawa, diakritik, emoji).
3. `bener_luput` (boolean): Nilai logika `bener` (true) dan `salah` (false).
4. `null`: Nilai kosong `null`.
5. `larik` (array): Larik native Jawalang (elemen homogen maupun heterogen).
6. `obyek` (object): Pasangan kunci-nilai plain object Jawalang dengan kunci bertipe string.

---

## Encoding

Diimplementasikan melalui fungsi `jsonEncode(nilai)`:
- Melakukan penelusuran rekursif (*deep traversal*) ke seluruh tingkat struktur data.
- **Strict Data Rejection**: Menolak tipe non-data: `function`, `datetime`, `struct`, `instance`, dan `namespace` baik di tingkat teratas maupun tersarang di dalam array/objek.
- **Depth Limit Guard**: Menolak struktur data bersarang berlebih yang melebihi batas kedalaman aman 500 tingkat (`MAX_DEPTH = 500`).
- **Cycle Guard**: Melacak himpunan rantai leluhur (*ancestor set*) saat traversal untuk mendeteksi siklus referensi.
- **Immutability**: Objek atau larik sumber sama sekali tidak dimutasi selama proses encoding.

---

## Decoding

Diimplementasikan melalui fungsi `jsonDecode(teks)`:
- Menerima tepat 1 argumen bertipe string.
- Mengonversi teks JSON menjadi struktur data Jawalang asli (*native runtime representation*):
  - JSON `true` / `false` -> Jawalang `bener` / `salah`
  - JSON `null` -> Jawalang `null` (tipe `"null"`, bukan `undefined` atau 0)
  - JSON `number` -> Jawalang `number`
  - JSON `string` -> Jawalang `string`
  - JSON `array` -> Jawalang `array`
  - JSON `object` -> Jawalang `object`
- **Isolasi Heap**: Setiap eksekusi `jsonDecode` menghasilkan alokasi instans independen baru di memori heap. Memodifikasi hasil decode tidak mempengaruhi hasil decode sebelumnya.
- **Trailing Data Rejection**: Menolak string dengan token ganda/berlebih seperti `"10 20"` atau `"{}{}"`.
- **Duplicate Keys Semantics**: Kunci duplikat pada objek JSON diuraikan dengan semantik *last-key-wins* yang konsisten dengan objek Jawalang.

---

## Runtime Representation

- Nilai hasil decode adalah tipe primitif dan struktur koleksi native Jawalang (`Array` dan `Object`).
- Kompatibel penuh dengan seluruh built-in manipulasi koleksi dan introspeksi tipe:
  - `jinis(jsonDecode("123"))` -> `"number"`
  - `jinis(jsonDecode("[]"))` -> `"array"`
  - `jinis(jsonDecode("{}"))` -> `"object"`
  - `dawa(arr)`, `nambah(arr, val)`, `jupuk(arr, idx)`, `kunci(obj)`, `duwe(obj, key)`.

---

## Error Handling

- Seluruh kesalahan serialisasi dan deserialisasi ditangkap dan dibungkus dalam exception runtime Jawalang yang bersih.
- Menghasilkan pesan kesalahan dwibahasa (Jawa & Indonesia):
  - Argumen bukan string pada decode: `jsonDecode() mung bisa digunakake kanggo string, nanging ditemu: "..."`
  - Kesalahan jumlah argumen: `Function built-in "jsonEncode" mbutuhake 1 argument, nanging diwenehi ...`
  - Tipe tidak didukung: `Tipe "..." ora bisa diencode dadi JSON / Tipe "..." tidak bisa di-encode menjadi JSON`
  - Referensi sirkular: `Circular reference ora bisa diencode dadi JSON / Referensi sirkular tidak bisa di-encode menjadi JSON`
  - Kedalaman struktur berlebih: `Struktur data keliwat jero (maksimal 500 tingkat)`
  - Format sintaks JSON salah: `Format JSON ora sah: ... (Format JSON tidak valid: ...)`

---

## Circular Reference

- `jsonEncode` mendeteksi referensi sirkular menggunakan mekanisme pelacakan himpunan leluhur (*ancestor set tracking*).
- Siklus referensi pada array (`a[0] = a`) maupun objek (`obj["self"] = obj`) dicegat seketika sebelum memicu rekursi tak terhingga atau *call stack overflow*.
- Representasi grafik tanpa siklus (*Directed Acyclic Graph / DAG*), di mana obyek yang sama dirujuk di beberapa cabang independen yang berbeda, tetap diperbolehkan dan diencode dengan benar.

---

## Security

- **Zero Code Execution**: Tidak menggunakan `eval`, `new Function()`, atau compiler dinamis.
- **Zero Host Leakage**: Tidak menggunakan modul `child_process`, `fs`, maupun `network`.
- **DoS Protection**: Cycle guard dan recursion depth limit melindungi interpreter dari *stack overflow crashes*.
- Teks JSON yang memuat kode pemrograman didecode murni sebagai nilai string biasa tanpa dievaluasi.

---

## Portability

- Bebas dari hardcoded absolute path (tidak ada `C:\Jawalang` atau `D:\Jawalang` di dalam kode sumber).
- Hanya menggunakan API standar JavaScript ECMAScript (Node.js >= 16).
- Berjalan identik di Linux, macOS, dan Windows.

---

## LSP Integration

Kedua fungsi baru `jsonEncode` dan `jsonDecode` telah didaftarkan ke katalog master LSP (`language-server/src/utils.js`):
- **Completion**: Menampilkan autocompletion beserta detail signature, parameter, dan contoh kode.
- **Hover**: Menyajikan tooltip dokumentasi Markdown lengkap.
- **Signature Help**: Melacak parameter aktif (`activeParameter`) saat pengetikan pemanggilan fungsi.
- **Semantic Tokens**: Diberi klasifikasi token `function` dengan modifier `defaultLibrary`.
- **Rename Symbol**: Terproteksi secara otomatis dari upaya rename simbol built-in.

---

## Tests

### 1. Test Suite JSON (`scratch/test_json_v140.js`)
82/82 assertions PASS (100%) mencakup 26 kategori A–Z:
- **Category A**: Primitive encode (`number`, `string`, `boolean`, `null`)
- **Category B**: Primitive decode (`number`, `string`, `boolean`, `null`)
- **Category C**: Array encoding & decoding, array manipulation
- **Category D**: Object encoding & decoding, bracket/dot indexing, `kunci`, `duwe`
- **Category E**: Nested structures (deep nesting, empty structures, round-trip)
- **Category F**: String escaping (`\n`, `\t`, `\"`, `\\`, unicode escapes)
- **Category G**: Unicode (Aksara Jawa `ꦗꦮꦭꦁ`, diakritik, emoji)
- **Category H**: Null handling (tipe `"null"`, preservasi properti null)
- **Category I**: Boolean handling (`bener`, `salah`, integrasi `yen`)
- **Category J**: Number handling (negatif, desimal, eksponensial, penolakan `NaN` & `Infinity`)
- **Category K**: Round-trip preservation (kamus komprehensif, larik obyek)
- **Category L**: Type preservation (`jinis` array, object, string, number)
- **Category M**: Immutability (obyek & larik asal tidak dimutasi)
- **Category N**: Decode isolation (alokasi heap independen antar panggilan decode)
- **Category O**: First-class builtins (`gawe f = jsonEncode`, `gawe g = jsonDecode`)
- **Category P**: Higher-Order Function compatibility (`terapkan` dengan `jsonEncode` & `jsonDecode`)
- **Category Q**: Unsupported function rejection (toplevel, nested object, nested array)
- **Category R**: Unsupported datetime rejection (toplevel, nested object)
- **Category S**: Unsupported instance & struct rejection (`bentuk`, `anyar Struct()`)
- **Category T**: Circular reference detection (array cycles, object cycles)
- **Category U**: Invalid JSON handling (string kosong, whitespace, non-JSON text, unclosed brackets)
- **Category V**: Trailing data rejection (`"10 20"`, `"true false"`, `"{}{}"`)
- **Category W**: Duplicate keys semantics (*last key wins*)
- **Category X**: Deep nesting safety (rekursi aman vs penolakan kedalaman > 500)
- **Category Y**: Security (string kode tidak dieksekusi, validasi arity/tipe)
- **Category Z**: LSP catalog verification (BUILTINS, protection, signature)

### 2. Core Language Test Fixtures
- `examples/test_json.jawa`: Pengujian positif serialisasi dan deserialisasi terintegrasi.
- `examples/test_json_error.jawa`: Pengujian negatif penolakan fungsi dalam `jsonEncode`.

---

## Documentation

- [`docs/JSON_ARCHITECTURE.md`](file:///c:/Jawalang/docs/JSON_ARCHITECTURE.md): Dokumen arsitektur serialisasi data JSON.
- [`docs/json.md`](file:///c:/Jawalang/docs/json.md): Panduan referensi pengguna resmi untuk `jsonEncode` dan `jsonDecode`.
- [`docs/STDLIB_INVENTORY_V1.4.0.md`](file:///c:/Jawalang/docs/STDLIB_INVENTORY_V1.4.0.md): Pembaruan inventaris menjadi 51 built-in function.
- [`docs/PROJECT_STATUS.md`](file:///c:/Jawalang/docs/PROJECT_STATUS.md): Pembaruan status milestone dan ringkasan 938+ tes.
- [`Readme.md`](file:///c:/Jawalang/Readme.md): Pembaruan fitur, tautan dokumentasi, tabel roadmap, dan badge pengujian.
- [`CHANGELOG.md`](file:///c:/Jawalang/CHANGELOG.md): Catatan rilis Phase 12.

---

## Files Changed

- `src/stdlib/index.js`: Pendaftaran modul `jsonBuiltins` dan metadata standar.
- `language-server/src/utils.js`: Registrasi metadata `jsonEncode` dan `jsonDecode` pada kamus `BUILTINS`.
- `scratch/run_full_regression.js`: Integrasi test runner `test_json_v140.js` dan fixtures bahasa.
- `docs/STDLIB_INVENTORY_V1.4.0.md`: Pembaruan daftar inventori standard library (51 built-in).
- `docs/PROJECT_STATUS.md`: Pembaruan status milestone Phase 12 dan metrik tes (938+ tests).
- `Readme.md`: Penambahan dokumentasi JSON, roadmap status, dan badge tes.
- `CHANGELOG.md`: Dokumentasi penambahan modul JSON & Serialization V1.4.0 Phase 12.

---

## Files Added

- `src/stdlib/json.js`: Implementasi fungsi `jsonEncode` dan `jsonDecode`.
- `docs/JSON_ARCHITECTURE.md`: Dokumen arsitektur teknis JSON.
- `docs/json.md`: Panduan referensi pengguna resmi JSON.
- `scratch/test_json_v140.js`: Test suite master 82 assertions (kategori A–Z).
- `examples/test_json.jawa`: Fixture bahasa positif.
- `examples/test_json_error.jawa`: Fixture bahasa negatif.
- `docs/JSON_PHASE12_REPORT.md`: Laporan formal penutupan Phase 12.

---

## Regression

- **`npm test`**: 74/74 PASS (30 Positive Tests + 22 Negative Tests + 22 Scratch Runners).
- **`scratch/test_json_v140.js`**: 82/82 PASS (26 Categories A–Z).
- **`scratch/test_datetime_v140.js`**: 70/70 PASS (20 Categories A–T).
- **`scratch/test_stdlib_v140.js`**: 59/59 PASS (13 Categories A–M).
- **`language-server/test/run_tests.js`**: 12/12 test suites PASS (281 unit tests).
- **`scratch/test_language_server.js`**: 81/81 PASS (100%).
- **`scratch/test_vscode_smoke.js`**: 21/21 PASS (100%).
- **Total Tests Passing**: **938+ / 938+ PASS (100%)**.
- Tidak ada regresi pada fungsionalitas core, OOP, modul, math, string, datetime, maupun LSP.

---

## Known Limitations

1. **Serialisasi Objek Khusus**: Objek `datetime` dan instance OOP (`struct`) saat ini belum dapat diserialisasi secara otomatis; memerlukan konversi manual ke representasi angka atau string primitif sebelum di-encode.
2. **Pretty Printing**: `jsonEncode` saat ini menghasilkan JSON minified tanpa spasi/indentasi opsional. Dukungan indentasi (*pretty print*) ditangguhkan untuk fase penyempurnaan berikutnya.

---

## Release Recommendation

READY

Implementasi JSON & Serialization Standard Library V1.4.0 Phase 12 telah memenuhi seluruh kriteria penerimaan, lulus seluruh pengujian regresi tanpa kegagalan tersembunyi, dan siap untuk rilis V1.4.0.
