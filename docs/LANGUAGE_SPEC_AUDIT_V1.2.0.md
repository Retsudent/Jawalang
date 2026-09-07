# Jawalang V1.2.0 — Language Specification & Runtime Audit

Audit resmi spesifikasi basa lan kapabilitas runtime Jawalang v1.2.0.

---

## 1. Ringkesan Basa

* **Jeneng Basa**: Jawalang (ꦗꦮ)
* **Ekstensi Sumber**: `.jawa`
* **Arsitektur Eksekusi**:
  ```text
  .jawa Source ──► Lexer ──► Parser ──► AST ──► Interpreter (Tree-Walking)
  ```
* **Engine Lingkungan**: Node.js v14+ (disaranake v18+).

---

## 2. Inventori Sintaks & Kata Kunci (Keywords)

Jawalang v1.2.0 nduweni 33 kata kunci resmi:

1. `tulis` — Print output menyang stdout mawa baris anyar.
2. `gawe` — Deklarasi variabel anyar ing cakupan aktif.
3. `yen` — Percabangan kondisi (if).
4. `liyane` — Alternatif percabangan (else).
5. `nalika` — Perulangan kondisi (while loop).
6. `kanggo` — Perulangan terhitung (for range loop).
7. `nganti` — Wates pungkasan perulangan `kanggo`.
8. `langkah` — Step increment/decrement perulangan `kanggo`.
9. `saben` — Keyword pendukung perulangan elemen koleksi (`kanggo saben x ing data`).
10. `ing` — Keyword pendukung `kanggo saben`.
11. `mandheg` — Break saka loop aktif.
12. `lanjut` — Continue menyang iterasi loop sabanjure.
13. `guna` — Deklarasi fungsi anyar.
14. `bali` — Return statement saka fungsi aktif.
15. `bener` — Nilai boolean `true`.
16. `salah` — Nilai boolean `false`.
17. `null` — Nilai kosong / null.
18. `coba` — Blok penanganan kesalahan (try).
19. `tangkep` — Blok penangkap kesalahan (catch).
20. `lempar` — Throw eksepsi.
21. `impor` — Impor modul saka path file `.jawa`.
22. `ekspor` — Ekspor deklarasi variabel, fungsi, utawa struct menyang modul liya.
23. `saka` — Keyword pendukung impor selektif (`impor { x } saka "./modul.jawa"`).
24. `minangka` — Alias impor utawa namespace (`impor "./m.jawa" minangka math`).
25. `bentuk` — Deklarasi struct (class).
26. `wiwiti` — Konstruktor ing njero struct.
27. `anyar` — Instansiasi obyek struct anyar (`anyar StructName()`).
28. `iki` — Referensi marang instance aktif (`this`).
29. `ngembangake` — Pewarisan struct saka induk (`extends`).
30. `super` — Referensi marang konstruktor utawa metode struct induk.
31. `lan` — Operator logika AND.
32. `utawa` — Operator logika OR.
33. `ora` — Operator logika NOT.

---

## 3. Built-in Function Registry

Jawalang nduweni 23 fungsi bawaan resmi:
* **Tipe & Inspeksi**: `jinis(val)`
* **Koleksi & Teks**: `dawa(col)`, `jupuk(arr, i)`, `nambah(arr, el)`, `busak(arr, i)`
* **Manipulasi String**: `motong(str, s, e)`, `ngganti(str, old, new)`, `gedhe(str)`, `cilik(str)`
* **I/O Interaktif**: `takon(prompt?)`
* **Obyek**: `kunci(obj)`, `nilai(obj)`, `duwe(obj, key)`
* **Higher-Order Functions (HOF)**:
  * `terapkan(fn, arr)` — Map
  * `saring(fn, arr)` — Filter
  * `itung(fn, arr)` — Count
  * `ana(fn, arr)` — Some
  * `kabeh(fn, arr)` — Every
  * `golek(fn, arr)` — Find
  * `indeks(fn, arr)` — FindIndex
  * `gabung(arr, sep)` — Join
  * `balik(arr)` — Reverse
  * `urut(arr, comp?)` — Sort

---

## 4. REPL Specification v1.2.0

* **Command Entry**: `jawa` (ing interactive TTY), `jawa repl`, utawa `jawalang`.
* **Prompt**:
  * Primary: `jawa> `
  * Secondary (multiline): `...> `
* **Banner**:
  ```text
  Jawalang REPL v1.2.0
  Ketik .bantu untuk bantuan.
  ```
* **Meta Commands**:
  * `.help` / `.bantu`: Nampilake bantuan printah REPL.
  * `.exit` / `.metu`: Metu saka REPL kanthi status code 0.
  * `.clear` / `.resik`: Ngresiki layar terminal.
* **Persistent Session**:
  Saben input ing session sing padha nuduhake `Environment`, tabel fungsi, tabel struct, lan cache modul sing tetep urip lan ora di-reset ing antarane baris input.
* **Bare Expression**:
  Ekspresi tanpa statement (kayata `10 + 20`, `x`, `[1, 2]`, `{"a": 1}`) langsung dievaluasi lan dicithak nggunakake `formatValue(val, true)`.
