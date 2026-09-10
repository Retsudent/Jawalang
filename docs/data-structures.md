# Struktur Data: Array & Object (Data Structures)

[← Sadurunge: Fungsi & Ruang Lingkup](functions.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Higher-Order Functions →](higher-order-functions.md)

---

Jawalang nyedhiyakake rong struktur data utama kang fleksibel lan ekspresif: **Array** kanggo urutan nilai, sarta **Object** kanggo pasangan kunci-nilai (*dictionary*).

---

## 1. Sistem Array (Arrays)

Array ing Jawalang nggunakake kurung kothak `[ ... ]` lan ndhukung macem-macem jinis data ing jerone.

### A. Deklarasi & Akses Elemen
```jawa
gawe angka = [10, 20, 30]
gawe campuran = [10, "halo", bener, null]
gawe kosong = []

tulis angka[0]      // 10 (indeks diwiwiti saka 0)
tulis angka[1 + 1]  // 30 (indeks mawa ekspresi)
```

### B. Mutasi Elemen
```jawa
angka[1] = 99
tulis angka // [10, 99, 30]
```

### C. Array Bersarang (Multi-Dimensi)
```jawa
gawe matriks = [[1, 2], [3, 4]]
tulis matriks[0][1] // 2
matriks[1][0] = 99
tulis matriks[1]    // [99, 4]
```

### D. Fungsi Bawaan Array (Array Built-ins)
| Fungsi | Katrangan | Return Value | Mutasi Array Asli? |
| :--- | :--- | :--- | :---: |
| `dawa(array)` | Ngetung gunggunge elemen ing jero array | `number` | Ora |
| `jupuk(array, index)` | Njupuk nilai elemen adhedhasar indeks valid | Elemen | Ora |
| `nambah(array, value)` | Nambahake elemen anyar ing mburi array | `null` | **Ya** |
| `busak(array, index)` | Mbusak elemen adhedhasar indeks valid | `null` | **Ya** |
| `gabung(array, pemisah)` | Nggabungake elemen array dadi string teks | `string` | Ora |
| `pecah(teks, pemisah)` | Memecah teks string dadi array elemen (Standard Library) | `array` | Ora |

Tuladha panggunaan:
```jawa
gawe data = [10, 20, 30]

tulis dawa(data)      // 3
tulis jupuk(data, 1)  // 20

nambah(data, 40)
tulis data            // [10, 20, 30, 40]

busak(data, 0)
tulis data            // [20, 30, 40]

// Pecah teks dadi array (V1.4.0)
gawe daftar = pecah("apel,mangga,jeruk", ",")
tulis daftar          // ["apel", "mangga", "jeruk"]
tulis dawa(daftar)    // 3
```

---

## 2. Sistem Obyek / Kamus (Objects / Dictionaries)

Obyek nyimpen data ing wujud pasangan **kunci (string) $\to$ nilai (apa wae)** mawa kurung kurawal `{ ... }`.

### A. Literal Obyek
```jawa
gawe wong = {
    "jeneng": "Budi",
    "umur": 20,
    "aktif": bener,
    "alamat": null
}
```
- Kunci kudu arupa string literal.
- Yen ana kunci ganda, kunci pungkasan sing bakal menang (*last key wins*).

### B. Akses Properti (Dot Notation & Bracket)
Properti bisa diakses nganggo **Bracket Syntax** utawa **Dot Notation**:
```jawa
// Bracket syntax
tulis wong["jeneng"] // Budi

// Dot notation
tulis wong.jeneng     // Budi
tulis wong.umur       // 20

// Properti sing ora ana ngasilake null (ora error):
tulis wong.ora_ana    // null
```

### C. Modifikasi & Penambahan Properti
```jawa
wong.umur = 21           // ngowahi properti
wong.kutha = "Madiun"    // nambah properti anyar
```

### D. Kunci Dinamis
Gunakake bracket syntax kanggo ngakses properti liwat variabel string:
```jawa
gawe field = "jeneng"
tulis wong[field] // Budi
```

### E. Fungsi Bawaan Obyek (Object Built-ins)
| Fungsi | Katrangan | Return Value |
| :--- | :--- | :--- |
| `kunci(obj)` | Njupuk kabeh jeneng kunci ing jero obyek minangka array string | `array` anyar |
| `nilai(obj)` | Njupuk kabeh nilai properti minangka array | `array` anyar |
| `duwe(obj, key)` | Priksa anane kunci tartamtu ing jero obyek | `boolean` (`bener`/`salah`) |

Tuladha panggunaan:
```jawa
gawe user = {"nama": "Budi", "umur": 20}

tulis kunci(user)        // ["nama", "umur"]
tulis nilai(user)        // ["Budi", 20]
tulis duwe(user, "nama") // bener
tulis duwe(user, "gaji") // salah
```

---

## 3. Integrasi Array & Obyek (Nested & Deep Assignment)

Jawalang ndhukung struktur data campuran tanpa watesan level:

### A. Array of Objects & Object of Arrays
```jawa
gawe sekolah = {
    "nama": "SMK Jawalang",
    "siswa": [
        {"nama": "Budi", "biji": [85, 90]},
        {"nama": "Siti", "biji": [95, 98]}
    ]
}

// Deep indexing
tulis sekolah.siswa[0].nama     // Budi
tulis sekolah.siswa[1].biji[0]  // 95

// Deep assignment
sekolah.siswa[0].nama = "Dewi"
sekolah.siswa[0].biji[1] = 100
tulis sekolah.siswa[0].biji[1]  // 100
```

### B. Semantik Referensi (Reference Semantics)
Kabeh Array lan Obyek ing Jawalang nggunakake **semantik referensi**:
- Ngirim array utawa obyek menyang fungsi utawa variabel anyar ora nggawe salinan data mentah.
- Mutasi marang elemen jero bakal langsung mengaruhi struktur asline.

```jawa
gawe a = {"angka": [1, 2, 3]}
gawe b = a

b.angka[0] = 999
tulis a.angka[0] // 999
```

---

[← Sadurunge: Fungsi & Ruang Lingkup](functions.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Higher-Order Functions →](higher-order-functions.md)
