# Higher-Order Functions & Utilitas Koleksi

[← Sadurunge: Struktur Data](data-structures.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Pemrograman Berorientasi Objek (OOP) →](oop.md)

---

Jawalang nyedhiyakake pustaka fungsi bawaan lengkap kanggo ngolah Array kanthi gaya fungsional (*Higher-Order Functions*) sarta utilitas manipulasi teks (*String Utilities*).

---

## 1. Pustaka Koleksi Fungsional (Functional Collection Library)

Kabeh fungsi iki nampa fungsi callback utawa predikat minangka argumen kanggo manipulasi array tanpa ngowahi (*non-mutating*) array asline:

| Fungsi | Parameter & Tipe | Katrangan | Return Value | Tuladha Panggunaan |
| :--- | :--- | :--- | :--- | :--- |
| `terapkan(fn, array)` | `(function, array)` | Ngowahi (*map*) saben elemen array kanthi fungsi transformasi | `array` anyar | `terapkan(kuadrat, [1, 2, 3])` $\to$ `[1, 4, 9]` |
| `saring(predikat, array)` | `(function, array)` | Nyaring (*filter*) elemen array sing nyukupi predikat boolean | `array` anyar | `saring(genap, [1, 2, 3, 4])` $\to$ `[2, 4]` |
| `itung(predikat, array)` | `(function, array)` | Ngetung (*count*) cacahe elemen sing nyukupi predikat | `number` | `itung(genap, [1, 2, 3, 4])` $\to$ `2` |
| `ana(predikat, array)` | `(function, array)` | Priksa apa ana minimal sak elemen sing nyukupi predikat (*some*) | `boolean` | `ana(genap, [1, 3, 4])` $\to$ `bener` |
| `kabeh(predikat, array)` | `(function, array)` | Priksa apa kabeh elemen nyukupi predikat (*every*) | `boolean` | `kabeh(genap, [2, 4, 6])` $\to$ `bener` |
| `golek(predikat, array)` | `(function, array)` | Nggoleki elemen pisanan sing nyukupi predikat (*find*) | Nilai utawa `null` | `golek(genap, [1, 4, 6])` $\to$ `4` |
| `indeks(array, nilai)` | `(array, any)` | Nggoleki indeks pisanan saka nilai sing cocog (`===`) (*indexOf*) | `number` (utawa `-1`) | `indeks(["a", "b"], "b")` $\to$ `1` |
| `gabung(array, pemisah)` | `(array, string)` | Nggabungake kabeh elemen dadi siji string mawa pamisah | `string` | `gabung(["a", "b"], "-")` $\to$ `"a-b"` |
| `balik(array)` | `(array)` | Mbalekake array anyar kanthi urutan kuwalik (*reverse*) | `array` anyar | `balik([1, 2, 3])` $\to$ `[3, 2, 1]` |
| `urut(array)` | `(array angka)` | Mbalekake array anyar kanthi urutan munggah (*ascending sort*) | `array` anyar | `urut([30, 10, 20])` $\to$ `[10, 20, 30]` |

---

## 2. Aturan & Semantik Koleksi Fungsional

1. **Strict Boolean Predicate**:
   Fungsi callback predikat kanggo `saring()`, `itung()`, `ana()`, `kabeh()`, lan `golek()` **wajib** mbalekake nilai boolean murni (`bener` utawa `salah`). Nilai `null`, angka `1`/`0`, utawa string bakal langsung ditolak kanthi kasalahan runtime (ora ana konversi truthy implisit).
2. **Short-Circuit Evaluation**:
   - `ana()` langsung mandheg lan mbalekake `bener` nalika nemu elemen pisanan sing ngasilake `bener`.
   - `kabeh()` langsung mandheg lan mbalekake `salah` nalika nemu elemen pisanan sing ngasilake `salah`.
   - `golek()` langsung mandheg lan mbalekake nilai kasebut nalika nemu asil pisanan `bener`.
3. **Non-Mutating Array**:
   Fungsi `terapkan()`, `saring()`, `balik()`, lan `urut()` tansah mbalekake wadah array anyar tanpa ngrusak array sumbere.
4. **Semantik Array Kosong (`[]`)**:
   - `gabung([], sep)` $\to$ `""`
   - `balik([])` $\to$ `[]`
   - `urut([])` $\to$ `[]`
   - `ana(fn, [])` $\to$ `salah`
   - `kabeh(fn, [])` $\to$ `bener`
   - `golek(fn, [])` $\to$ `null`
   - `indeks([], val)` $\to$ `-1`

---

## 3. Utilitas Manipulasi String (String Utilities)

String ing Jawalang bersifat **immutable** (ora bisa diowahi langsung ing panggonan). Kabeh fungsi utilitas string ngasilake string anyar:

| Fungsi | Parameter & Tipe | Katrangan | Return Value | Tuladha Panggunaan |
| :--- | :--- | :--- | :--- | :--- |
| `dawa(teks)` | `(string)` | Ngetung dawa karakter string | `number` | `dawa("Jawa")` $\to$ `4` |
| `motong(teks, mulai, akhir)` | `(string, int >= 0, int >= 0)` | Njupuk bagean string saka indeks `mulai` nganti sadurunge `akhir` | `string` anyar | `motong("Jawalang", 0, 4)` $\to$ `"Jawa"` |
| `ngganti(teks, lama, anyar)` | `(string, string, string)` | Ngganti bagean teks `lama` dadi `anyar` | `string` anyar | `ngganti("Halo Donya", "Donya", "Jawa")` $\to$ `"Halo Jawa"` |
| `gedhe(teks)` | `(string)` | Ngowahi kabeh aksara dadi huruf gedhe (kapital) | `string` anyar | `gedhe("jawa")` $\to$ `"JAWA"` |
| `cilik(teks)` | `(string)` | Ngowahi kabeh aksara dadi huruf cilik | `string` anyar | `cilik("JAWA")` $\to$ `"jawa"` |
| `ngemot(teks, bagian)` | `(string, string)` | Priksa anane substring ing jero teks (Standard Library V1.4) | `boolean` | `ngemot("Jawalang", "lang")` $\to$ `bener` |
| `diwiwiti(teks, awalan)` | `(string, string)` | Priksa apa teks diwiwiti awalan kasebut (V1.4) | `boolean` | `diwiwiti("Jawa", "Ja")` $\to$ `bener` |
| `dipungkasi(teks, akhiran)` | `(string, string)` | Priksa apa teks dipungkasi akhiran kasebut (V1.4) | `boolean` | `dipungkasi("Jawa", "wa")` $\to$ `bener` |
| `trim(teks)` | `(string)` | Mbusak spasi ing wiwitan lan pungkasan teks (V1.4) | `string` anyar | `trim("  halo  ")` $\to$ `"halo"` |
| `pecah(teks, pemisah)` | `(string, string)` | Memecah teks dadi array elemen adhedhasar pemisah (V1.4) | `array` anyar | `pecah("a,b", ",")` $\to$ `["a", "b"]` |

### Tuladha Panggunaan String Utilities:
```jawa
gawe teks = "Aku seneng Jawalang"

tulis dawa(teks)                        // 19
tulis motong(teks, 0, 3)                // "Aku"
tulis ngganti(teks, "seneng", "tresna") // "Aku tresna Jawalang"
tulis gedhe(teks)                       // "AKU SENENG JAWALANG"
tulis cilik(teks)                       // "aku seneng jawalang"
tulis ngemot(teks, "Jawa")              // bener
tulis diwiwiti(teks, "Aku")             // bener
tulis dipungkasi(teks, "Jawalang")      // bener

// Teks asli tetep ora owah:
tulis teks // "Aku seneng Jawalang"
```

---

## 4. Integrasi Built-in minangka First-Class & Higher-Order Functions

Kabeh fungsi bawaan sarta pustaka standar Jawalang V1.4.0 (`abs`, `trim`, lsp.) ndhukung first-class citizen lan kompatibel langsung karo `terapkan`, `saring`, lsp:

```jawa
// Nerapake abs menyang koleksi nomer negatif
gawe nomer = [-10, 25, -5, 0]
gawe hasilAbs = terapkan(abs, nomer)
tulis hasilAbs // [10, 25, 5, 0]

// Nerapake trim menyang koleksi string mawa spasi
gawe teksSpasi = ["  siji ", " loro  ", " telu "]
gawe hasilTrim = terapkan(trim, teksSpasi)
tulis hasilTrim // ["siji", "loro", "telu"]
```

---

[← Sadurunge: Struktur Data](data-structures.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Pemrograman Berorientasi Objek (OOP) →](oop.md)
