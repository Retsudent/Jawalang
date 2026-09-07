# Jawalang Language Specification Audit V1.2.0

**Document Version:** 1.2.0-audit  
**Date:** 7 September 2026  
**Auditor:** Antigravity Autonomous Pair Programmer  
**Target Repository:** `C:\Jawalang`  
**Status:** COMPLETE (Source of Truth established for V1.2.0 REPL)  

---

## 1. Audit Scope
Dokumen ini merupakan audit spesifikasi bahasa menyeluruh terhadap repositori **Jawalang** per September 2026 (baseline rilis V1.1.0 menuju persiapan V1.2.0 REPL). Audit ini dilakukan secara non-destruktif (*audit only*) tanpa mengubah implementasi runtime maupun semantik bahasa.

Lingkup audit mencakup:
- Seluruh kode sumber runtime: `src/lexer.js`, `src/parser.js`, `src/interpreter.js`, `src/module_loader.js`, `src/cli.js`.
- Seluruh rangkaian pengujian (49 berkas `examples/*.jawa`, 16 suite `scratch/*.js`, 6 suite LSP, 8 suite ekstensi VS Code).
- Ekosistem tooling: Language Server Protocol (`language-server/`) dan Visual Studio Code Extension (`vscode-extension/`).
- Dokumentasi resmi: `Readme.md`, `CHANGELOG.md`, dan dokumen pendukung pada `docs/`.

---

## 2. Evidence Hierarchy
Ketika terjadi perbedaan antara dokumentasi, test, dan implementasi, urutan bukti (*hierarchy of evidence*) yang ditetapkan adalah:
1. **Primary Ground Truth**: Implementasi runtime (`src/lexer.js`, `src/parser.js`, `src/interpreter.js`).
2. **Secondary Ground Truth**: Hasil pengujian regresi passing (`npm test`, `examples/*.jawa`, `scratch/*.js`).
3. **Module Architecture**: Implementasi `src/module_loader.js`.
4. **Tooling Consistency**: Implementasi `language-server/` (LSP) & `vscode-extension/`.
5. **Tertiary Evidence**: Dokumentasi tekstual (`Readme.md`, `docs/`).

Dokumentasi yang tidak sesuai dengan kode sumber diklasifikasikan sebagai temuan perbedaan (*discrepancy*), dan kode sumber runtime tetap menjadi acuan mutlak.

---

## 3. Lexical Specification
- **Encoding & Whitespace**: UTF-8. Karakter spasi, tabulasi (`\t`), carriage return (`\r`), dan baris baru (`\n`) diabaikan di luar string literal.
- **Position Tracking**: Zero-based `{ line, character, offset }` dihitung secara presisi menggunakan `lineOffsets` binary search pada `src/lexer.js`.
- **Comments**: Single-line komentar diawali `//` hingga akhir baris. Komentar multi-line (`/* ... */`) **tidak didukung**.
- **Identifiers**: Format regex `[a-zA-Z_][a-zA-Z0-9_]*`. Case-sensitive.
- **Numbers**:
  - Integer desimal: `[0-9]+`
  - Floating point desimal: `[0-9]+\.[0-9]+`
  - Angka negatif tidak memiliki token tersendiri; tanda minus diuraikan sebagai operator unary `MINUS` (`-`).
  - Bilangan heksadesimal, biner, atau notasi ilmiah (`1e5`) **tidak didukung**.
- **Strings**: Dibatasi tanda petik ganda (`"..."`). Karakter escape yang didukung: `\n` (newline), `\t` (tab), `\"` (quote), dan `\\` (backslash). Karakter escape lain akan mempertahankan karakter aslinya. String tanpa petik penutup menghasilkan error leksikal: `String ora ditutup nganggo tanda "`.
- **Karakter Tidak Dikenal**: Karakter di luar set yang didukung langsung melempar exception: `Karakter ora dikenal (Karakter tidak dikenal): '<char>' ing posisi <offset>`.

---

## 4. Keywords
Terdapat tepat **33 kata kunci** yang dikenali oleh `src/lexer.js`:

| No | Keyword | Token Type | Kategori | Peran Semantik |
| -: | :--- | :--- | :--- | :--- |
| 1 | `tulis` | `TULIS` | Statement | Menampilkan nilai ekspresi ke stdout |
| 2 | `gawe` | `GAWE` | Statement / Declaration | Deklarasi variabel atau field struct |
| 3 | `yen` | `YEN` | Control Flow | Percabangan kondisional (if) |
| 4 | `liyane` | `LIYANE` | Control Flow | Klausa alternatif (else / else if) |
| 5 | `bener` | `BOOLEAN` | Literal | Nilai boolean `true` |
| 6 | `salah` | `BOOLEAN` | Literal | Nilai boolean `false` |
| 7 | `lan` | `LAN` | Operator | Logika biner AND |
| 8 | `utawa` | `UTAWA` | Operator | Logika biner OR |
| 9 | `ora` | `ORA` | Operator | Logika unary NOT |
| 10 | `nalika` | `NALIKA` | Control Flow | Perulangan while |
| 11 | `kanggo` | `KANGGO` | Control Flow | Perulangan for (rentang atau koleksi) |
| 12 | `saben` | `SABEN` | Clause | Klausa foreach (`kanggo saben ... ing`) |
| 13 | `ing` | `ING` | Clause | Klausa sumber koleksi foreach |
| 14 | `nganti` | `NGANTI` | Clause | Batas atas/bawah rentang for |
| 15 | `langkah` | `LANGKAH` | Clause | Nilai kenaikan rentang for |
| 16 | `mandheg` | `MANDHEG` | Statement | Menghentikan loop (break) |
| 17 | `lanjut` | `LANJUT` | Statement | Melanjutkan ke iterasi berikutnya (continue) |
| 18 | `guna` | `GUNA` | Declaration | Deklarasi fungsi atau metode struct |
| 19 | `bali` | `BALI` | Statement | Mengembalikan nilai dari fungsi (return) |
| 20 | `coba` | `COBA` | Statement | Blok penanganan eksepsi (try) |
| 21 | `tangkep` | `TANGKEP` | Clause | Penangkap eksepsi (catch) |
| 22 | `lempar` | `LEMPAR` | Statement | Melempar eksepsi (throw) |
| 23 | `impor` | `IMPOR` | Statement | Mengimpor modul |
| 24 | `ekspor` | `EKSPOR` | Modifier | Mengekspor simbol ke modul lain |
| 25 | `bentuk` | `BENTUK` | Declaration | Deklarasi cetak biru struct/kelas |
| 26 | `anyar` | `ANYAR` | Expression | Instansiasi objek struct (new) |
| 27 | `iki` | `IKI` | Expression | Referensi instance aktif dalam metode (this) |
| 28 | `wiwiti` | `WIWITI` | Identifier / Keyword | Nama metode konstruktor struct |
| 29 | `null` | `NULL` | Literal | Nilai kosong / null |
| 30 | `saka` | `SAKA` | Clause | Klausa sumber impor selektif |
| 31 | `minangka` | `MINANGKA` | Clause | Klausa alias / namespace modul |
| 32 | `ngembangake` | `NGEMBANGAKE` | Clause | Klausa pewarisan struct induk (extends) |
| 33 | `super` | `SUPER` | Expression / Statement | Pemanggilan konstruktor/metode induk |

### Catatan Khusus Kata Kunci Historis:
- `fungsi`: Sudah tidak menjadi keyword. Tokenizer membaca sebagai `IDENTIFIER`. Menggunakannya untuk deklarasi fungsi menghasilkan error `Statement ora dikenal: "fungsi"`.
- `warisan`: Bukan keyword. Sintaks pewarisan yang valid adalah `ngembangake`.
- `kosong`: Bukan keyword. Literal null resmi adalah `null`.

---

## 5. Tokens
Daftar seluruh 55 token type yang dihasilkan oleh `src/lexer.js`:
1. **Literals & Identifiers (5)**: `STRING`, `NUMBER`, `BOOLEAN`, `NULL`, `IDENTIFIER`.
2. **Dedicated Keywords (30)**: `TULIS`, `GAWE`, `YEN`, `LIYANE`, `LAN`, `UTAWA`, `ORA`, `NALIKA`, `KANGGO`, `SABEN`, `ING`, `NGANTI`, `LANGKAH`, `MANDHEG`, `LANJUT`, `GUNA`, `BALI`, `COBA`, `TANGKEP`, `LEMPAR`, `IMPOR`, `EKSPOR`, `BENTUK`, `ANYAR`, `IKI`, `WIWITI`, `SAKA`, `MINANGKA`, `NGEMBANGAKE`, `SUPER`.
3. **Operators & Delimiters (20)**: `GREATER_EQUAL` (`>=`), `LESS_EQUAL` (`<=`), `EQUAL_EQUAL` (`==`), `NOT_EQUAL` (`!=`), `PLUS` (`+`), `MINUS` (`-`), `MULTIPLY` (`*`), `DIVIDE` (`/`), `EQUALS` (`=`), `GREATER` (`>`), `LESS` (`<`), `COMMA` (`,`), `COLON` (`:`), `DOT` (`.`), `LEFT_BRACE` (`{`), `RIGHT_BRACE` (`}`), `LEFT_PAREN` (`(`), `RIGHT_PAREN` (`)`), `LEFT_BRACKET` (`[`), `RIGHT_BRACKET` (`]`).

---

## 6. Literals
- **Number**: `42`, `3.14`, `0`.
- **String**: `"halo"`, `"baris 1\nbaris 2"`, `""` (string kosong).
- **Boolean**: `bener` (true), `salah` (false).
- **Null**: `null`.
- **Array**: `[]`, `[1, 2, 3]`, `["a", bener, null]`. Elemen heterogen didukung.
- **Object**: `{}`, `{ "kunci": "nilai", angka: 100 }`.

---

## 7. Operators
- **Aritmatika**: `+` (penjumlahan / penggabungan string), `-` (pengurangan), `*` (perkalian), `/` (pembagian).
  *(Catatan: Operator modulo `%` TIDAK ADA).*
- **Perbandingan**: `==` (kesetaraan nilai), `!=` (ketidaksamaan), `<`, `>`, `<=`, `>=`.
- **Logika**: `lan` (AND), `utawa` (OR), `ora` (NOT).
- **Akses Anggota / Indeks**: `.` (dot notation), `[...]` (bracket indexing).
- **Pemanggilan**: `(...)` (function / method call).
- **Penugasan**: `=` (statement penugasan).

---

## 8. Precedence
Hierarki tingkatan presedensi dari yang tertinggi ke terendah:

| Level | Operator | Deskripsi | Asosiativitas |
| :---: | :--- | :--- | :---: |
| 1 (Tertinggi) | `(...)`, `[...]`, `{...}`, Literals, `anyar`, `iki`, `super` | Primary expressions & grouping | - |
| 2 | `.`, `[index]`, `(args)` | Member access, computed index, call | Kiri ke kanan |
| 3 | `+` (unary), `-` (unary), `ora` (unary NOT) | Prefix unary operators | Kanan ke kiri |
| 4 | `*`, `/` | Perkalian, pembagian | Kiri ke kanan |
| 5 | `+`, `-` | Penjumlahan, pengurangan | Kiri ke kanan |
| 6 | `==`, `!=`, `<`, `>`, `<=`, `>=` | Perbandingan nilai | Kiri ke kanan |
| 7 | `lan` | Logika AND | Kiri ke kanan |
| 8 | `utawa` | Logika OR | Kiri ke kanan |
| 9 (Terendah) | `=` (Assignment) | Penugasan variabel / properti *(statement only)* | Kanan ke kiri |

---

## 9. Expressions
Node ekspresi AST yang didukung:
- `LiteralExpression`: `NUMBER`, `STRING`, `BOOLEAN`, `NULL`
- `IdentifierExpression`: `IDENTIFIER`
- `ArrayExpression`: Daftar elemen berurutan
- `ObjectExpression`: Pasangan kunci-nilai
- `UnaryExpression`: `operator` (`+`, `-`, `ora`), `argument`
- `BinaryExpression`: `operator`, `left`, `right`
- `IndexExpression`: Digunakan untuk `obj.properti` maupun `obj[ekspresi]`
- `CallExpression`: Pemanggilan fungsi/metode dengan daftar argumen
- `NewExpression`: Instansiasi struct (`anyar Struct(args)` atau `anyar ns.Struct(args)`)
- `SuperExpression`: Pemanggilan `super.metode()` atau konstruktor induk
- `IkiExpression`: Referensi `iki`

**Kombinasi Chaining Postfix yang Didukung**:
- `obj.nama` ✅
- `obj["nama"]` ✅
- `array[0]` ✅
- `array[0][1]` ✅
- `fn()` ✅
- `fn()(arg)` ✅
- `obj.fn()` (menghasilkan Bound Method) ✅
- `obj["fn"]()` ✅
- `(fn)(arg)` ✅

---

## 10. Variables & Assignment
- **Deklarasi**: `gawe nama = ekspresi`. Wajib menyertakan nilai awal. Deklarasi ulang pada scope yang sama diperbolehkan (re-declaration/overwrite).
- **Penugasan Ulang**: `nama = ekspresi`. Mencari variabel terdekat di rantai `Environment`. Jika variabel belum pernah dideklarasikan, runtime melempar: `Variabel "x" durung digawe! Gunakake "gawe x = ..." dhisik.`
- **Lexical Scoping**: Variabel lokal dalam blok fungsi dan loop terisolasi. Closure mengikat lexical environment asalnya.
- **Mutasi Array & Object**:
  - `arr[index] = nilai`: Valid untuk indeks yang sudah ada (`0 <= index < arr.length`). Menugaskan di luar ukuran melempar error.
  - `obj.prop = nilai` / `obj["prop"] = nilai`: Mengubah atau menambahkan properti baru.
  - `instance.field = nilai`: Mengubah field yang sudah dideklarasikan. Mengisi field yang tidak ada melempar error: `Property "x" ora ana ing struct "Y"`.
  - `iki = nilai`: Ditolak oleh parser (`"iki" ora bisa di-assign langsung`).
  - `super = nilai`: Ditolak oleh parser (`"super" ora bisa di-assign langsung`).
  - `namespace.prop = nilai`: Ditolak oleh runtime (`Modul namespace "ns" asipat read-only`).

---

## 11. Data Types
Sistem tipe Jawalang V1.1.0/V1.2.0 terdiri dari 10 jenis tipe runtime yang diidentifikasi oleh `getType()` dan `jinis()`:

| Tipe | Literal / Sintaks | Hasil `jinis()` | Mutable | Semantik Penyalinan |
| :--- | :--- | :--- | :---: | :---: |
| **null** | `null` | `"null"` | Tidak | Value |
| **number** | `123`, `3.14` | `"number"` | Tidak | Value |
| **string** | `"teks"` | `"string"` | Tidak | Value |
| **boolean** | `bener`, `salah` | `"boolean"` | Tidak | Value |
| **array** | `[1, 2, 3]` | `"array"` | Ya | Reference |
| **object** | `{"k": "v"}` | `"object"` | Ya | Reference |
| **function** | `guna f() {}` | `"function"` | Tidak | Reference |
| **struct** | `bentuk S {}` | `"struct"` | Tidak | Reference |
| **instance** | `anyar S()` | `"instance"` | Ya | Reference |
| **namespace**| `impor ... minangka ns` | `"namespace"` | Tidak (Read-only) | Reference |

---

## 12. Control Flow
1. **Percabangan**:
   ```jawa
   yen kondisi1 {
       // blok then
   } liyane yen kondisi2 {
       // blok else if
   } liyane {
       // blok else
   }
   ```
2. **Perulangan While**:
   ```jawa
   nalika kondisi {
       // blok while
   }
   ```
   *Batas Keamanan Loop*: Maksimal 100.000 iterasi (`MAX_LOOP_ITERATIONS`) untuk mencegah infinite loop.
3. **Perulangan Rentang (For-Range)**:
   ```jawa
   kanggo i = 1 nganti 10 langkah 2 {
       // blok range loop
   }
   ```
   Klausa `langkah` bersifat opsional.
4. **Perulangan Koleksi (Foreach)**:
   ```jawa
   kanggo saben item ing daftar {
       // blok foreach
   }
   ```
   Variabel `item` bersifat lokal per iterasi.
5. **Kontrol Loop**:
   - `mandheg`: Keluar dari loop terdekat.
   - `lanjut`: Lompat ke iterasi loop terdekat berikutnya.
   Keduanya divalidasi parser; digunakan di luar loop menghasilkan syntax error.

---

## 13. Functions
- **Sintaks**:
  ```jawa
  guna jenengFungsi(param1, param2) {
      bali nilai
  }
  ```
- **Lingkup**: Hanya dapat dideklarasikan di **top-level**. Deklarasi fungsi di dalam blok (`if`, loop, fungsi lain) ditolak oleh parser.
- **Return**: Menggunakan kata kunci `bali`. Jika tidak ada `bali` atau `bali` tanpa ekspresi, fungsi mengembalikan `null`.
- **Validasi Argumen**: Pemanggilan fungsi dengan jumlah argumen yang salah melempar error: `Fungsi "f" mbutuhake X parameter, nanging diwenehi Y`.
- **Rekursi**: Didukung penuh dengan pengaman kedalaman stack: maksimal 500 pemanggilan rekursif (`MAX_CALL_STACK`).
- **First-Class Value**: Fungsi dapat disimpan di variabel, dikirim sebagai callback, disimpan dalam array atau object.

---

## 14. Higher-Order Functions (HOF)
Jawalang menyediakan 8 fungsi tingkat tinggi resmi untuk manipulasi koleksi array:
1. `terapkan(fn, arr)`: Mengubah (map) setiap elemen menggunakan callback `fn(item)`. Mengembalikan array baru. *(Catatan: Namanya adalah `terapkan`, BUKAN `peta`)*.
2. `saring(fn, arr)`: Menyaring elemen array. Callback wajib menghasilkan boolean. Mengembalikan array baru.
3. `itung(fn, arr)`: Menghitung jumlah elemen yang memenuhi predikat callback. Mengembalikan integer.
4. `ana(fn, arr)`: Memeriksa apakah minimal satu elemen memenuhi predikat (some). Mengembalikan boolean.
5. `kabeh(fn, arr)`: Memeriksa apakah seluruh elemen memenuhi predikat (every). Mengembalikan boolean.
6. `golek(fn, arr)`: Mencari elemen pertama yang memenuhi predikat (find). Mengembalikan elemen atau `null`.
7. `indeks(fn, arr)`: Mencari indeks elemen pertama yang memenuhi predikat. Mengembalikan integer (0-based) atau `-1`.
8. `gabung(arr, pemisah)`: Menggabungkan elemen array menjadi string dengan pemisah tertentu.

---

## 15. Arrays API
- **Akses Indeks**: `arr[0]` (0-based). Indeks di luar batas (`< 0` atau `>= arr.length`) atau bukan bilangan bulat melempar runtime error.
- **Fungsi Bawaan Array**:
  - `dawa(arr)`: Mengembalikan panjang array.
  - `jupuk(arr, idx)`: Mengambil elemen pada indeks (identik dengan `arr[idx]`).
  - `nambah(arr, el)`: Menambahkan elemen di akhir array. **Memutasi array asli** dan mengembalikan array tersebut.
  - `busak(arr, idx)`: Menghapus elemen pada indeks. **Memutasi array asli** dan mengembalikan elemen yang dihapus.
  - `balik(arr)`: Mengembalikan array baru dengan urutan terbalik (**non-mutating**).
  - `urut(arr)`: Mengembalikan array baru dengan elemen angka terurut menaik (**non-mutating**). Elemen harus angka.

---

## 16. Strings API
String di Jawalang bersifat **immutable**.
- `dawa(str)`: Mengembalikan jumlah karakter string.
- `motong(str, mulai, akhir)`: Mengambil substring dari indeks `mulai` hingga `akhir` (end-exclusive). Indeks divalidasi ketat.
- `ngganti(str, lama, anyar)`: Mengganti semua kemunculan `lama` dengan `anyar`.
- `gedhe(str)`: Mengubah seluruh huruf menjadi kapital (uppercase).
- `cilik(str)`: Mengubah seluruh huruf menjadi huruf kecil (lowercase).

---

## 17. Objects / Dictionaries
- **Literal**: `{ "kunci": "nilai", angka: 123 }`.
- **Akses Properti**: `obj.kunci` atau `obj["kunci"]`. Jika properti tidak ditemukan, mengembalikan **`null`** (bukan undefined/error).
- **Penugasan**: `obj.kunci = baru` atau `obj["kunci"] = baru`. Bersifat mutasi in-place dengan reference semantics.
- **Fungsi Bawaan Object**:
  - `kunci(obj)`: Mengembalikan array string berisi seluruh nama properti obyek.
  - `nilai(obj)`: Mengembalikan array berisi seluruh nilai properti obyek.
  - `duwe(obj, kunci)`: Mengembalikan boolean apakah properti ada di dalam obyek.

---

## 18. Input / Output
- **Output**: `tulis <ekspresi>`
  - Merupakan **Statement Keyword**, bukan fungsi built-in.
  - Mencetak representasi string format nilai ke stdout diakhiri baris baru.
  - Format output: string dicetak tanpa tanda petik; array dicetak `[...]`; obyek dicetak `{...}`; boolean dicetak `bener`/`salah`; null dicetak `null`.
- **Input**: `takon()` atau `takon("Prompt: ")`
  - Merupakan **Built-in Function**.
  - Membaca satu baris dari stdin secara sinkron hingga karakter `\n`.
  - Selalu mengembalikan tipe data `string`. Jika input kosong/EOF, mengembalikan `""`.

---

## 19. Type System
Fungsi bawaan `jinis(nilai)` menerima tepat 1 argumen dan mengembalikan salah satu dari 10 string nama tipe:
`"null"`, `"number"`, `"string"`, `"boolean"`, `"array"`, `"object"`, `"function"`, `"struct"`, `"instance"`, `"namespace"`.
- Kesetaraan nilai (`==`) dan (`!=`) melakukan pembandingan bertipe ketat.
- `null == null` bernilai `bener`.
- `null == 0` bernilai `salah`.
- `null == ""` bernilai `salah`.

---

## 20. Exceptions
- **Sintaks**:
  ```jawa
  coba {
      lempar "Terjadi masalah!"
  } tangkep err {
      tulis "Galat: " + err
  }
  ```
- Nilai yang dilempar oleh `lempar` dapat bertipe data apa pun (string, number, boolean, array, object).
- Runtime error internal (pembagian dengan nol, indeks array out of range, pemanggilan fungsi tidak dikenal) dapat ditangkap oleh blok `coba ... tangkep`.
- Alur kontrol `bali`, `mandheg`, dan `lanjut` di dalam blok `coba` tidak akan ditelan oleh `tangkep` dan dieksekusi dengan benar.

---

## 21. Structs
- **Deklarasi**:
  ```jawa
  bentuk JenengStruct {
      gawe properti = "default"

      guna wiwiti(p) {
          iki.properti = p
      }

      guna metode() {
          bali iki.properti
      }
  }
  ```
- Hanya diperbolehkan pada **top-level berkas**.
- Field dideklarasikan dengan `gawe jeneng = defaultExpr`. Default array/object di-deep clone untuk setiap instance baru.
- Konstruktor adalah metode bernama khusus `wiwiti`.
- Instansiasi dilakukan dengan ekspresi `anyar JenengStruct(argumen...)`.

---

## 22. Methods & `iki`
- Metode dideklarasikan di dalam `bentuk` menggunakan kata kunci `guna`.
- Kata kunci `iki` merepresentasikan receiver / instance yang sedang aktif.
- Menggunakan `iki` di luar metode struct menghasilkan error: `Keyword "iki" mung bisa digunakake ing njero method struct`.
- Mengakses metode dari instance (`inst.metode`) menghasilkan **Bound Method** yang tetap mengingat instance pemanggilnya dan dapat dikirim sebagai argumen ke Higher-Order Function.

---

## 23. Inheritance (`ngembangake`)
- **Sintaks**:
  ```jawa
  bentuk Mahasiswa ngembangake Wong {
      gawe nim = 0
      
      guna wiwiti(jeneng, nim) {
          super(jeneng)
          iki.nim = nim
      }
  }
  ```
- Kata kunci pewarisan resmi adalah **`ngembangake`** (bukan warisan).
- Pewarisan mewarisi semua field dan metode dari struct induk.
- Child struct dapat melakukan override metode induk.

---

## 24. `super`
- Hanya valid di dalam struct turunan (yang memiliki klausul `ngembangake`).
- Di dalam konstruktor `wiwiti`: `super(argumen...)` memanggil konstruktor induk.
- Di dalam metode: `super.namaMetode(argumen...)` memanggil implementasi metode struct induk dengan `iki` sebagai receiver aktif.
- Menggunakan `super` di luar konteks turunan melempar error: `Invalid "super" outside inheritance`.

---

## 25. Modules
- Ekspor simbol di top-level berkas:
  ```jawa
  ekspor gawe PI = 3.14
  ekspor guna tambah(a, b) { bali a + b }
  ekspor bentuk Vektor { ... }
  ```
- Impor modul:
  - Bare import: `impor "./modul.jawa"`
  - Namespace import: `impor "./modul.jawa" minangka math`
  - Selective import: `impor { tambah, PI } saka "./modul.jawa"`
  - Selective import dengan alias: `impor { tambah minangka jumlah } saka "./modul.jawa"`
- Path modul diselesaikan relatif terhadap berkas pemanggil (*caller-relative*). Ekstensi `.jawa` bersifat opsional pada string impor.
- Deteksi siklis (*cycle detection*): Impor rekursif yang melingkar dideteksi dan melempar error: `Circular module dependency`.

---

## 26. Namespaces
- Hasil dari `impor "...berkas.jawa" minangka ns` menghasilkan objek runtime dengan tipe `"namespace"`.
- Objek namespace bersifat **read-only**; mencoba mengubah properti namespace melempar runtime error.
- Simbol diakses melalui dot atau bracket notation: `ns.fungsi()`, `ns.variabel`, `anyar ns.NamaStruct()`.

---

## 27. Master List Built-in Functions
Tepat terdapat **23 fungsi bawaan** pada registry runtime:

| No | Nama | Argumen | Return | Kategori | Mutates? | Deskripsi |
| -: | :--- | :---: | :--- | :--- | :---: | :--- |
| 1 | `jinis` | 1 | `string` | Tipe | Tidak | Mengembalikan nama tipe data runtime |
| 2 | `dawa` | 1 | `number` | Array/String | Tidak | Mengembalikan panjang array atau string |
| 3 | `jupuk` | 2 | `any` | Array | Tidak | Mengambil elemen pada indeks array |
| 4 | `nambah` | 2 | `array` | Array | **Ya** | Menambahkan elemen di akhir array (in-place) |
| 5 | `busak` | 2 | `any` | Array | **Ya** | Menghapus elemen pada indeks array (in-place) |
| 6 | `motong` | 3 | `string` | String | Tidak | Mengambil potongan string (start, end) |
| 7 | `ngganti` | 3 | `string` | String | Tidak | Mengganti kemunculan teks pada string |
| 8 | `gedhe` | 1 | `string` | String | Tidak | Mengubah string menjadi huruf kapital |
| 9 | `cilik` | 1 | `string` | String | Tidak | Mengubah string menjadi huruf kecil |
| 10 | `takon` | 0 - 1 | `string` | I/O | Tidak | Membaca input baris dari stdin |
| 11 | `kunci` | 1 | `array` | Obyek | Tidak | Mengembalikan daftar nama kunci obyek |
| 12 | `nilai` | 1 | `array` | Obyek | Tidak | Mengembalikan daftar nilai obyek |
| 13 | `duwe` | 2 | `boolean` | Obyek | Tidak | Memeriksa apakah properti ada di obyek |
| 14 | `terapkan` | 2 | `array` | Functional | Tidak | Mentransformasikan array dengan pemetaan (map) |
| 15 | `saring` | 2 | `array` | Functional | Tidak | Menyaring elemen array berdasarkan predikat |
| 16 | `itung` | 2 | `number` | Functional | Tidak | Menghitung jumlah elemen yang lolos predikat |
| 17 | `gabung` | 2 | `string` | Array | Tidak | Menggabungkan elemen array menjadi string |
| 18 | `balik` | 1 | `array` | Array | Tidak | Mengembalikan salinan array terbalik |
| 19 | `urut` | 1 | `array` | Array | Tidak | Mengembalikan salinan array angka terurut |
| 20 | `ana` | 2 | `boolean` | Functional | Tidak | Memeriksa minimal satu elemen lolos predikat |
| 21 | `kabeh` | 2 | `boolean` | Functional | Tidak | Memeriksa seluruh elemen lolos predikat |
| 22 | `golek` | 2 | `any` | Functional | Tidak | Mencari elemen pertama yang lolos predikat |
| 23 | `indeks` | 2 | `number` | Functional | Tidak | Mencari indeks elemen yang lolos predikat |

*(Catatan: Operasi I/O output `tulis` adalah Statement Keyword, bukan bagian dari dictionary builtins di runtime).*

---

## 28. Language Server Consistency Audit
- **Status:** **MATCHING WITH NOTED DIFFERENCE**
- LSP mengenali 24 built-in di mana `tulis` didaftarkan ke dalam `BUILTINS` pada `language-server/src/utils.js` agar mendukung hover signature dan dokumentasi di IDE.
- LSP mengenali 32 keyword di `KEYWORDS` dictionary (mengecualikan `tulis` yang dimasukkan ke builtins).
- LSP mendukung diagnosis semantik akurat untuk: deteksi undefined variable/function, validasi jumlah parameter, deteksi `iki` di luar metode, deteksi `super` di luar inheritance, dan resolusi modul cross-file.

---

## 29. VS Code Extension Consistency Audit
- **Status:** **MATCHING**
- File `vscode-extension/syntaxes/jawalang.tmLanguage.json` mendefinisikan grammar TextMate lengkap untuk seluruh 33 keyword, 24 built-ins, operator perbandingan, penugasan, dan string escaping.
- Snippets pada `snippets/jawalang.json` konsisten menggunakan kata kunci modern: `guna`, `bentuk`, `wiwiti`, `ngembangake`, `coba`, `tangkep`, `kanggo`, `nalika`.

---

## 30. Documentation Consistency Audit
- **Status:** **FINDINGS DOCUMENTED**
- **Match**: Sintaks utama, struktur kontrol, tipe data, dan sistem modul pada `Readme.md` selaras dengan runtime.
- **Inkonsistensi / Outdated**:
  1. Istilah lama "Jawascript" masih tertulis pada 4 baris di `Readme.md` (baris 641, 654, 796, 870) sisa peninggalan sebelum nama bahasa diubah resmi menjadi Jawalang.
  2. Istilah "warisan" sering digunakan dalam narasi penjelasan konsep OOP, padahal keyword kode sumber resminya adalah `ngembangake`.
  3. Istilah "peta" pernah diusulkan di catatan diskusi lama, namun kode sumber mengimplementasikan `terapkan`. `Readme.md` baris 855 sudah benar mencatat `terapkan`.

---

## 31. Test Evidence
Seluruh fitur yang diaudit memiliki bukti kelulusan (*passing tests*) yang aktif:

| Fitur Bahasa | Berkas Bukti Pengujian | Status |
| :--- | :--- | :---: |
| Basic I/O & Variables | `examples/oi.jawa`, `examples/hello_cli.jawa` | PASS |
| Conditional Control Flow | `examples/tes_percabangan.jawa` | PASS |
| While & For-Range Loops | `examples/test_loop.jawa` | PASS |
| Foreach Collection Iteration | `examples/test_foreach.jawa` | PASS |
| Functions & Lexical Scope | `examples/test_function.jawa`, `examples/test_function_scope.jawa` | PASS |
| First-Class Functions & HOF | `examples/test_higher_order.jawa`, `examples/test_collection_v2.jawa` | PASS |
| Array Operations & Mutation | `examples/test_array.jawa` | PASS |
| Object & Property Access | `examples/test_object.jawa`, `examples/test_object_builtin.jawa` | PASS |
| String Utilities | `examples/test_string.jawa` | PASS |
| Exception Handling (`coba`/`tangkep`) | `examples/test_exception.jawa` | PASS |
| Struct & OOP (`bentuk`, `wiwiti`) | `examples/test_struct.jawa` | PASS |
| Inheritance (`ngembangake`, `super`) | `examples/test_inheritance_v5.jawa` | PASS |
| Chained Dot & Bracket Access | `examples/test_dot_notation_v4.jawa` | PASS |
| Module Import & Export (V1–V3) | `examples/test_module.jawa`, `test_module_v2.jawa`, `test_module_v3.jawa` | PASS |
| Negative Semantic Validations | 19 berkas `examples/*_error.jawa` + 16 runner `scratch/*.js` | PASS |
| LSP & Extension Suites | `language-server/test/run_tests.js`, `vscode-extension/tests/test_extension.js` | PASS |

---

## 32. REPL Considerations (Preparation for V1.2.0)
Analisis karakteristik runtime Jawalang terhadap kebutuhan pengembangan REPL interaktif pada fase berikutnya:
1. **Scope Persistence (REQUIRES SPECIAL HANDLING)**:
   - Pada eksekusi file saat ini, `interpreter(ast, options)` menginisialisasi `globalEnv` baru.
   - REPL harus mempertahankan instance `Environment`, `activeFunctions`, dan `activeStructs` yang sama antar baris input pengguna.
2. **Bare Expression Evaluation (REQUIRES SPECIAL HANDLING)**:
   - Parser saat ini mewajibkan ekspresi top-level diawali `(`, `[`, pemanggilan fungsi, atau penugasan.
   - Mengetikkan ekspresi murni seperti `10 + 20` atau pemanggilan variabel `x` di REPL harus menghasilkan nilai terformat (`formatValue(val)`), bukan error syntax statement.
3. **Multiline Continuation (REQUIRES SPECIAL HANDLING)**:
   - Input blok yang belum lengkap (misal kurung kurawal `{` belum ditutup atau string multiline) harus mendeteksi status belum lengkap dan menampilkan prompt lanjutan (`... `).
4. **Declarations (`gawe`, `guna`, `bentuk`) (SAFE FOR REPL)**:
   - Evaluasi deklarasi variabel, fungsi, dan struct langsung mendaftarkan simbol ke environment persisten sesi aktif.
5. **Module Loading di REPL (SAFE FOR REPL)**:
   - Perintah `impor` membutuhkan path acuan. Dalam sesi REPL, basis path direktori saat ini (`process.cwd()`) dapat digunakan sebagai basis resolusi impor.
6. **Command REPL Khusus (SAFE FOR REPL)**:
   - REPL membutuhkan perintah utilitas khusus seperti `.metu` / `.exit`, `.bantu` / `.help`, dan `.resik` / `.clear`.

---

## 33. Discrepancies
Daftar seluruh diskrepansi yang ditemukan selama audit:

| ID | Komponen | Dokumentasi / Ekspektasi | Realita Implementasi Kode | Klasifikasi |
| :---: | :--- | :--- | :--- | :--- |
| **D-01** | Keyword Pewarisan OOP | Sebagian ringkasan menyebut `warisan` | Keyword resmi adalah `ngembangake`. `warisan` tidak ada di lexer. | INCORRECT DOCS |
| **D-02** | Klasifikasi `tulis` | LSP & VS Code mengelompokkan `tulis` sebagai built-in | Di runtime, `tulis` adalah Statement Keyword (`PrintStatement`), bukan fungsi | CLASSIFICATION |
| **D-03** | Nama Proyek Warisan | `Readme.md` baris 641, 654, 796, 870 menyebut "Jawascript" | Nama resmi bahasa adalah Jawalang | OUTDATED DOCS |
| **D-04** | Operator Modulo | Diasumsikan ada operator `%` | Tidak ada operator `%` di lexer maupun parser | UNSUPPORTED |
| **D-05** | Literal Null | Beberapa catatan menyebut `kosong` | Literal resmi adalah `null`. `kosong` bukan keyword | NAMING |

---

## 34. Unknowns
- Tidak ditemukan aspek semantik yang berstatus *unknown*. Seluruh aturan sintaksis, presedensi operator, sistem modul, dan penanganan runtime telah terverifikasi langsung dari kode sumber penggerak (`src/`) dan pengujian terkait.

---

## 35. Final Language Inventory Summary
- **Total Keywords:** 33
- **Total Unique Tokens:** 55
- **Total Operators:** 19
- **Total Runtime Types:** 10
- **Total Built-in Functions:** 23 (ditambah 1 Statement I/O `tulis`)
- **Total Control Flow Constructs:** 8 (`yen`, `nalika`, `kanggo-range`, `kanggo-foreach`, `mandheg`, `lanjut`, `coba-tangkep`, `lempar`)
- **Total Function Features:** 4 (top-level declaration, explicit/implicit return, recursion guard 500, first-class values)
- **Total OOP Features:** 7 (struct declaration, fields, constructor `wiwiti`, methods, instantiation `anyar`, self-reference `iki`, inheritance & `super`)
- **Total Module Features:** 7 (bare import, namespace import, selective import, selective alias, export variable, export function, export struct)
- **Total Identified Discrepancies:** 5
- **Total Unknowns:** 0
- **Runtime Integrity:** 100% UNCHANGED
