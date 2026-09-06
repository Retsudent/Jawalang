# Jawalang ꦗꦮ

Basa pamrograman prasaja mawa sintaks basa Jawa (A simple programming language using Javanese syntax) sing lumaku ing dhuwur Node.js.

---

## 📋 Sintaks & Tembung Kunci (Keywords)

| Tembung Kunci | Katrangan | Tuladha (Contoh) |
| :--- | :--- | :--- |
| `tulis` | Nyithak teks utawa angka menyang layar (`console.log`) | `tulis "Halo kabeh!"` |
| `gawe` | Nggawe variabel anyar (`let` / `var`) | `gawe jeneng = "Barch"` |
| `yen` | Percabangan kondisi (`if`) | `yen umur >= 17 { ... }` |
| `liyane` | Blok alternatif percabangan (`else`) | `liyane { ... }` |
| `liyane yen` | Blok alternatif mawa kondisi (`else if`) | `liyane yen umur >= 12 { ... }` |
| `bener` / `salah` | Nilai boolean (`true` / `false`) | `gawe aktif = bener` |
| `lan` | Operator logika AND | `yen umur >= 17 lan punya_ktp { ... }` |
| `utawa` | Operator logika OR | `yen a utawa b { ... }` |
| `ora` | Operator logika NOT (unary) | `yen ora aktif { ... }` |
| `nalika` | Perulangan kondisi (`while`) | `nalika i <= 5 { ... }` |
| `kanggo` | Perulangan cacahe diitung (`for`) | `kanggo i = 1 nganti 5 { ... }` |
| `nganti` | Wates pungkasan ing perulangan `kanggo` | `kanggo i = 1 nganti 10 { ... }` |
| `langkah` | Tambahan/pengurangan nilai saben iterasi (`step`) | `kanggo i = 1 nganti 10 langkah 2 { ... }` |
| `kanggo saben ... ing` | Perulangan elemen array (`foreach`) | `kanggo saben x ing data { ... }` |
| `mandheg` | Mandhegake perulangan saknalika (`break`) | `yen i == 5 { mandheg }` |
| `lanjut` | Nglompati menyang iterasi sabanjure (`continue`) | `yen i == 3 { lanjut }` |
| `fungsi` | Deklarasi fungsi anyar (`function`) | `fungsi tambah(a, b) { ... }` |
| `bali` | Mbalekake nilai saka fungsi (`return`) | `bali a + b` |
| `coba` | Blok pananganan kesalahan (`try`) | `coba { ... } tangkep err { ... }` |
| `tangkep` | Blok penangkep kesalahan (`catch`) | `coba { ... } tangkep err { ... }` |
| `lempar` | Mbuwang kesalahan / eksepsi (`throw`) | `lempar "Data ora valid"` |
| `impor` | Nglumpukake / ngimpor modul liya (`import`) | `impor "matematika"` |
| `ekspor` | Ngecakake / ngekspor fungsi utawa variabel menyang modul liya (`export`) | `ekspor fungsi tambah(a, b) { ... }` |
| `[ ]` | Kurung kothak array & indeks | `gawe data = [10, 20]; data[0] = 5` |
| `+`, `-`, `*`, `/` | Operator matématika (tambah, kurang, ping, bagi) | `tulis 2 + 3 * 4` |
| `==`, `!=`, `>`, `<`, `>=`, `<=` | Operator perbandingan | `yen nilai == 100 { ... }` |
| `( )` | Tanda kurung kanggo prioritas & fungsi | `tambah(10, 20)` |
| `,` | Pamisah elemen array & argument fungsi | `[1, 2, 3]` utawa `fungsi tes(a, b)` |
| `-` (unary) | Negasi angka (minus) | `gawe negatif = -10` |
| `//` | Komentar (ora dieksekusi) | `// Iki komentar` |

---

## 🧮 Tingkatan Operator (Operator Precedence)

Expression Engine ing Jawalang nggunakake *Recursive Descent Parser* kanthi hierarki precedence lengkap:

| Tingkat (Prioritas) | Operator | Katrangan |
| :---: | :---: | :--- |
| **1 (Paling dhuwur)** | `( )`, `fn()`, `arr[i]` | Tanda kurung, panggilan fungsi, & akses indeks array |
| **2** | `ora`, `-`, `+` (unary) | Negasi logika (`ora`), minus angka (`-`) |
| **3** | `*`, `/` | Perkalian lan pembagian |
| **4** | `+`, `-` | Penjumlahan lan pengurangan |
| **5** | `>`, `<`, `>=`, `<=`, `==`, `!=` | Perbandingan nilai |
| **6** | `lan` | Logika AND (luwih dhuwur tinimbang `utawa`) |
| **7 (Paling endhek)** | `utawa` | Logika OR |

---

## ⚙️ Sistem Fungsi (Function Engine)

Jawalang ndhukung deklarasi lan pamanggilan fungsi mawa tembung kunci `fungsi` lan `bali`:

### Deklarasi & Pamanggilan
```jawa
fungsi tambah(a, b) {
    bali a + b
}

gawe hasil = tambah(10, 20)
tulis hasil // 30
```

- Return tanpa nilai (`bali`) kanthi konsisten bakal ngasilake nilai `null`.
- **Recursion Safety Limit**: Wates maksimal **500 tumpukan panggilan (call stack)** kanggo nyegah crash infinite recursion.

---

## 🔒 Ruang Lingkup Fungsi (Function Scope)

Sistem scope ing Jawalang nggunakake aturan **Lexical Scoping** kanthi chain environment:

1. **Global Scope**: Variabel sing digawe nganggo `gawe` ing njaba fungsi kasedhiya ing global scope lan bisa diwaca saka njero fungsi yen ora ana variabel lokal sing padha jenenge.
2. **Local Scope**: Saben pamanggilan fungsi bakal nggawe environment lokal anyar. Parameter lan variabel `gawe` ing njero fungsi duwe ruang lingkup lokal lan ora bakal bocor metu.
3. **Variable Shadowing**: Yen variabel lokal digawe nganggo `gawe` kanthi jeneng sing padha karo variabel global, variabel lokal sing bakal menang ing njero fungsi kasebut tanpa ngowahi variabel global.
4. **Variable Lookup**: Panelusuran variabel lumaku saka scope lokal (`Current`) $\to$ `Parent` $\to$ `Global`.
5. **Assignment Terdekat**: Perintah pangowahan variabel (`x = 20`) bakal nggoleki variabel sing wis ana ing scope paling cedhak (lokal dhisik, banjur global). Yen variabel durung nate digawe nganggo `gawe`, bakal ngasilake error (ora nggawe implicit global).
6. **Recursion Scope**: Saben panggilan rekursif nduweni environment lokal anyar sing independen.
7. **Lexical Scoping (Dudu Dynamic Scoping)**: Fungsi nggoleki variabel adhedhasar panggonan fungsi dideklarasikake (global), dudu adhedhasar sapa sing nyeluk fungsi kasebut.
8. **Blok Loop & Kondisi**: Blok `nalika`, `kanggo`, lan `yen` ora nggawe scope anyar (tetep nganggo scope aktif).
9. **Nested Function**: Deklarasi fungsi ing njero fungsi liya durung didhukung lan bakal ngasilake error.

### Tuladha Scope Shadowing:
```jawa
gawe x = 10

fungsi test() {
    gawe x = 20
    tulis x
}

test()
tulis x
```
**Output:**
```text
20
10
```

---

## 🔄 Perulangan (Loop Engine)

Jawalang nyengkuyung rong jinis perulangan:
- `nalika <kondisi> { ... }` (*while loop*)
- `kanggo <var> = <start> nganti <end> [langkah <step>] { ... }` (*for loop*)
- `mandheg` (*break*) lan `lanjut` (*continue*) mung bisa digunakake ing njero blok loop.
- **Safety Limit**: Wates maksimal **100.000 iterasi**.

---

## 📦 Sistem Array (Array Engine)

Jawalang nyedhiyakake struktur data **Array** kanggo nyimpen urutan nilai mawa sintaks kurung kothak `[ ... ]`:

### 1. Deklarasi & Akses
```jawa
gawe angka = [10, 20, 30]
gawe campuran = [10, "halo", bener]
gawe kosong = []

tulis angka[0]      // 10 (indeks diwiwiti saka 0)
tulis angka[1 + 1]  // 30 (indeks mawa ekspresi)
```

### 2. Pangowahan Elemen (Mutation)
```jawa
angka[1] = 99
tulis angka         // [1, 99, 30]
```

### 3. Nested Array (Array ing Njero Array)
```jawa
gawe matriks = [[1, 2], [3, 4]]
tulis matriks[0][1]     // 2
matriks[1][0] = 99      // Mutasi elemen jero
tulis matriks[1]        // [99, 4]
```

### 4. Reference Semantics
Kaya dene ing JavaScript, array ing Jawalang lumaku adhedhasar referensi (ora nyalin sak kabehe):
```jawa
gawe a = [1, 2, 3]
gawe b = a
b[0] = 999
tulis a[0] // 999
```

### 5. Integrasi karo Fungsi & Loop
- **Fungsi**: Array bisa dikirim minangka parameter lan dibalekake nganggo `bali`. Panggilan fungsi uga bisa langsung diakses indekse: `gawe x = buatArray()[0]`.
- **Loop**: Array bisa diiterasi nggunakake `nalika` utawa `kanggo`.
- **Kondisi**: Elemen array bisa digunakake ing ekspresi percabangan `yen`.
- **Validasi Ketat**: Akses indeks ngluwihi ukuran (*out of bounds*), indeks negatif, utawa indeks dudu bilangan bulat bakal ngasilake error rong basa kanthi cetha.

---

## Built-in Function

Jawalang nyedhiyakake fungsi bawaan runtime (*Built-in Function Engine*) resmi mawa kosakata basa Jawa:

| Built-in | Arti | Katrangan & Validasi Argument | Tuladha (Contoh) |
| :--- | :--- | :--- | :--- |
| `dawa(x)` | panjang | Mbutuhake 1 argument (array utawa string). Mbalekake gunggunge elemen / dawa karakter. | `dawa([10, 20, 30])` $\to$ `3`<br>`dawa("Jawa")` $\to$ `4` |
| `jupuk(array, index)` | mengambil | Mbutuhake 2 argument (array lan integer index non-negatif). Mbalekake nilai elemen tanpa mutasi. | `jupuk(data, 0)` $\to$ `10` |
| `nambah(array, value)` | menambah | Mbutuhake 2 argument (array lan nilai anyar). Nambahake elemen ing mburi array (*mutation*) lan mbalekake `null`. | `nambah(data, 40)` |
| `busak(array, index)` | menghapus | Mbutuhake 2 argument (array lan integer index valid). Mbusak elemen array (*mutation*) lan mbalekake `null`. | `busak(data, 1)` |

### Tuladha Panggunaan Resmi
```jawa
gawe data = [10, 20, 30]

// 1. Ngetung dawa array lan string
tulis dawa(data)   // 3
tulis dawa("Jawa") // 4

// 2. Njupuk elemen adhedhasar indeks
tulis jupuk(data, 0) // 10

// 3. Nambah elemen anyar (mutasi langsung)
nambah(data, 40)
tulis data // [10, 20, 30, 40]

// 4. Mbusak elemen adhedhasar indeks (mutasi langsung)
busak(data, 1)
tulis data // [10, 30, 40]

// 5. Digunakake ing njero ekspresi & perulangan
gawe i = 0
nalika i < dawa(data) {
    tulis jupuk(data, i)
    i = i + 1
}
```

> [!NOTE]
> - `nambah()` lan `busak()` langsung ngowahi array asli (*reference semantics*) lan mbalekake nilai `null`.
> - **Prioritas**: Yen ana fungsi gawean panganggo (`fungsi`) kanthi jeneng sing padha, fungsi gawean kasebut bakal ngalahake (*override*) fungsi built-in.

---

## String Utility

Jawalang nyedhiyakake fungsi manipulasi teks (String Utility Engine V1) resmi mawa sifat *immutable* (ora ngowahi teks asli):

| Fungsi | Parameter & Validasi | Katrangan | Return Value | Tuladha (Contoh) |
| :--- | :--- | :--- | :--- | :--- |
| `dawa(teks)` | 1 argument (string) | Ngetung dawa karakter string | `number` | `dawa("Jawa")` $\to$ `4` |
| `motong(teks, mulai, akhir)` | 3 argument (string, integer $\ge 0$, integer $\ge 0$) | Njupuk bagean string saka indeks `mulai` nganti sadurunge `akhir` | `string` anyar | `motong("Jawascript", 0, 4)` $\to$ `"Jawa"` |
| `ngganti(teks, lama, anyar)` | 3 argument (kabeh kudu string) | Ngganti bagean string `lama` dadi `anyar` | `string` anyar | `ngganti("Halo Jawa", "Jawa", "Dunia")` $\to$ `"Halo Dunia"` |
| `gedhe(teks)` | 1 argument (string) | Ngowahi kabeh aksara dadi huruf gedhe (kapital) | `string` anyar | `gedhe("jawa")` $\to$ `"JAWA"` |
| `cilik(teks)` | 1 argument (string) | Ngowahi kabeh aksara dadi huruf cilik | `string` anyar | `cilik("JAWA")` $\to$ `"jawa"` |

### Tuladha Panggunaan String Utility
```jawa
gawe teks = "Aku seneng Jawa"

tulis dawa(teks)                          // 15
tulis motong(teks, 0, 3)                  // "Aku"
tulis ngganti(teks, "Jawa", "Jawascript") // "Aku seneng Jawascript"
tulis gedhe(teks)                         // "AKU SENENG JAWA"
tulis cilik(teks)                         // "aku seneng jawa"

// String tetep ora owah (immutable):
tulis teks // "Aku seneng Jawa"
```

---

## Input

Jawalang nyedhiyakake fungsi bawaan `takon()` kanggo maca input interaktif saka pangguna (Input Engine V1):

| Fungsi | Parameter & Validasi | Katrangan | Return Value |
| :--- | :--- | :--- | :--- |
| `takon()` | 0 argument | Maca sak baris input saka pangguna tanpa teks pituduh (*prompt*) | `string` |
| `takon(prompt)` | 1 argument (kudu `string`) | Nampilake pituduh (*prompt*) banjur maca sak baris input saka pangguna | `string` |

### Sifat & Ketentuan Input
- **Tansah String**: Asil pamanggilan `takon()` tansah ngasilake nilai kanthi tipe data `string`, kalebu yen pangguna ngetik angka (kayata `"123"`).
- **Input Kosong**: Yen pangguna langsung mencet `ENTER` tanpa ngetik karakter, `takon()` bakal ngasilake string kosong `""` (dudu `null`).
- **Validasi Argument**: Mung nampa 0 utawa 1 argument, lan argument prompt kudu awujud string.

### Tuladha Panggunaan Input
```jawa
// 1. Input kanthi prompt
gawe jeneng = takon("Sapa jenengmu? ")
tulis jeneng

// 2. Input ing percabangan kondisi
gawe pilihan = takon("Milih ya utawa ora? ")
yen pilihan == "ya" {
    tulis "Sampeyan milih ya"
} liyane {
    tulis "Sampeyan ora milih ya"
}

// 3. Input ing njero fungsi
fungsi jupukUmur() {
    bali takon("Pira umurmu? ")
}
gawe umur = jupukUmur()
tulis umur
```

---

## Type System

Jawalang nduweni sistem tipe data runtime (*Runtime Type System V1*) sing konsisten kanthi nilai khusus `null`:

| Tipe Data | Katrangan | Tuladha Nilai (Contoh) | Asil `jinis()` |
| :--- | :--- | :--- | :--- |
| `null` | Makna: *ora ana nilai* (ora padha karo string `"null"` utawa `0` utawa `salah`) | `null` | `"null"` |
| `number` | Bilangan bulat (*integer*) utawa pecahan (*decimal*) | `10`, `3.14`, `-5` | `"number"` |
| `string` | Rerangkatan karakter ing njero tanda petik | `"Halo"`, `"Jawalang"` | `"string"` |
| `boolean` | Nilai bebeneran basa Jawa | `bener`, `salah` | `"boolean"` |
| `array` | Struktur data dhaptar elemen | `[1, 2, 3]`, `[]` | `"array"` |
| `function` | Fungsi sing wis dideklarasikake nganggo `fungsi` | `halo` | `"function"` |

> [!NOTE]
> - Angka desimal (pecahan) tetep digolongake menyang tipe `number`. Contone `jinis(10)` lan `jinis(3.14)` kalorone ngasilake `"number"`.
> - `null` iku nilai runtime murni, dudu string `"null"`.

### Fungsi Built-in `jinis(nilai)`

Fungsi bawaan `jinis()` nampa **tepat 1 argument** lan mbalekake jeneng tipe data ing wujud string:

```jawa
tulis jinis(null)       // "null"
tulis jinis(10)         // "number"
tulis jinis(3.14)       // "number"
tulis jinis("Halo")     // "string"
tulis jinis(bener)      // "boolean"
tulis jinis(salah)      // "boolean"
tulis jinis([1, 2, 3])  // "array"
```

### Sifat & Semantics `null`

1. **Deklarasi & Re-assignment**:
   ```jawa
   gawe data = null
   tulis data // null

   data = 100
   tulis data // 100

   data = null
   tulis data // null
   ```

2. **Perbandingan (Equality)**:
   - `null == null` $\to$ `bener`
   - `null != null` $\to$ `salah`
   - `null == salah` $\to$ `salah` (ora dianggep padha karo boolean salah)
   - `null == bener` $\to$ `salah`
   - `null == ""` $\to$ `salah` (ora dianggep padha karo string kosong)
   - `null == 0` $\to$ `salah`

   Tuladha ing percabangan `yen`:
   ```jawa
   gawe data = null

   yen data == null {
       tulis "Data kosong"
   }
   ```

3. **Tanpa Implicit Coercion (Validasi Ketat)**:
   - Operasi aritmatika karo `null` (kayata `null + 10`, `null * 2`, `-null`) bakal **ditolak kanthi runtime error**.
   - Utilitas string (`motong`, `ngganti`, `gedhe`, `cilik`) utawa array (`dawa`, `jupuk`, `nambah`, `busak`) ora nampa `null` lan bakal ngasilake pesen error sing cetha.

4. **Return Value Fungsi & Built-in**:
   - Fungsi tanpa `bali` utawa nggunakake `bali` tanpa nilai kanthi otomatis ngasilake `null`.
   - Built-in mutasi kayata `nambah()` lan `busak()` mbalekake nilai `null`.

---

## 🗂️ Object / Dictionary

Jawascript ndhukung struktur data **object** sing nyimpen pasangan **key → value**.

### Literal Object

```jawa
gawe wong = {
    "jeneng": "Budi",
    "umur": 20,
    "aktif": bener,
    "alamat": null
}
```

- Key **kudu** string literal (diubengi tanda petik).
- Value bisa apa wae: number, string, boolean, null, array, object, utawa hasil ekspresi.
- Object kosong diijinake: `{}`.
- Yen kunci ganda, **kunci pungkasan sing menang** (*last key wins*).

### Ngakses Property

```jawa
tulis wong["jeneng"]   // Budi
tulis wong["umur"]     // 20
```

- Property sing ora ana → ngasilake `null` (ora error).

```jawa
tulis wong["ora_ana"]  // null
```

### Ngowahi / Nambah Property

```jawa
wong["umur"] = 21
wong["kutha"] = "Madiun"   // property anyar
```

### Kunci Dinamis

```jawa
gawe field = "jeneng"
tulis wong[field]      // Budi
```

### Object Bersarang

```jawa
gawe data = {
    "profil": {
        "jeneng": "Siti",
        "umur": 25
    }
}
tulis data["profil"]["jeneng"]   // Siti
```

### Reference Semantics

Object nggunakake **reference semantics** — mutasi ing jero fungsi katon ing njaban.

```jawa
fungsi ubah(o) {
    o["jeneng"] = "Ayu"
}
ubah(wong)
tulis wong["jeneng"]   // Ayu
```

### Jinis

```jawa
tulis jinis(wong)      // object
tulis jinis({})        // object
```

### Catatan V1

- Mung sintaks `obj["key"]` sing diijinake. Dot-notation (`obj.key`) **durung dhewe**.
- Key kudu bertipe string; index integer **ora kanggo** object.
- Object **ora** bisa diindeks karo number (error runtime).

---

## 🧰 Object Standard Library

Jawascript nyedhiyakake fungsi bawaan (*built-in*) resmi kanggo ngolah struktur data object:

| Built-in | Parameter | Return Type | Katrangan |
| :--- | :--- | :--- | :--- |
| `kunci(obj)` | `(object)` | `array` | Mbalekake kabeh key (string) ing jero array anyar adhedhasar urutan panulisan (*insertion order*). |
| `nilai(obj)` | `(object)` | `array` | Mbalekake kabeh value ing jero array anyar nututi urutan key. |
| `duwe(obj, key)` | `(object, string)` | `boolean` | Priksa apa key ana ing jero object (`bener` utawa `salah`). |

### `kunci()`

Mbalekake kabeh jeneng kunci ing jero object:

```jawa
gawe user = {
    "nama": "Budi",
    "umur": 20
}

tulis kunci(user)   // ["nama", "umur"]
```

- Object kosong `{}` ngasilake `[]` (panjang `0`).
- Wadah array sing dibalekake yaiku array anyar, mula ngowahi array kasebut (kayata nganggo `busak()`) ora ngrusak properti asli object.

### `nilai()`

Mbalekake kabeh nilai properti ing jero object:

```jawa
tulis nilai(user)   // ["Budi", 20]
```

- Urutan nilai tansah padha karo urutan `kunci()`.
- Nilai bisa arupa tipe data apa wae (number, string, boolean, null, array, object).
- **Reference Semantics**: Wadah array sing diasilake anyar, nanging referensi nilai bertipe object utawa array ing jerone tetep nuduhake referensi asli (ora di-deep clone). Mutasi marang elemen bersarang bakal langsung ngowahi object sumbere.

### `duwe()`

Ngecek anane sawijining key:

```jawa
tulis duwe(user, "nama")    // bener
tulis duwe(user, "alamat")  // salah
```

- **Nilai `null` Tetep Dianggep Ana**: Yen properti duwe nilai `null` (tuladhane `{"alamat": null}`), `duwe(user, "alamat")` tetep ngasilake `bener` amarga kuncine pancen kadhaptar ing object.
- Kunci dinamis bisa digunakake nganggo variabel bertipe string: `duwe(user, key)`.

---

## 📦 Array + Object Integration

Jawascript nyengkuyung integrasi jero antarane struktur data **Array** lan **Object**.

### Struktur Bersarang (Nested)

- **Array ngemot Object**:
  ```jawa
  gawe siswa = [
      {"nama": "Budi", "umur": 20},
      {"nama": "Siti", "umur": 21}
  ]
  tulis siswa[0]["nama"]   // Budi
  ```

- **Object ngemot Array**:
  ```jawa
  gawe sekolah = {
      "nama": "SMK Jawascript",
      "siswa": ["Budi", "Siti", "Joko"]
  }
  tulis sekolah["siswa"][0]  // Budi
  ```

- **Array of Array & Object of Object**:
  Struktur kompleks multi-dimensi (kayata matriks object `data[0][1]["nama"]` utawa nested object `data["alamat"]["kota"]`) didhukung kanthi fleksibel.

### Chained Indexing & Deep Assignment

Akses lan modifikasi bisa ditindakake kanthi chaining tanpa watesan level:

```jawa
gawe data = {
    "sekolah": {
        "siswa": [
            {
                "nama": "Budi",
                "nilai": [80, 90, 100]
            }
        ]
    }
}

// Deep indexing
tulis data["sekolah"]["siswa"][0]["nilai"][1]   // 90

// Deep assignment
data["sekolah"]["siswa"][0]["nama"] = "Dewi"
data["sekolah"]["siswa"][0]["nilai"][1] = 95
```

### Reference Semantics

Kabeh struktur array lan object nggunakake **reference semantics**:
- Nyimpen referensi menyang variabel liya utawa ngirim menyang fungsi ora nggawe salinan (copy), mula owah-owahan ing siji panggonan bakal langsung katon ing panggonan liyane.
- Utilitas `nilai(obj)` mbalekake referensi asli kanggo elemen bertipe array utawa object.

### Integrasi Built-in, Function, Loop, & Conditional

- **Built-in Array ing Object Property**: `dawa(user["hobi"])`, `jupuk(user["hobi"], 0)`, `nambah(user["hobi"], "olahraga")`.
- **Built-in Object ing Array Element**: `kunci(siswa[0])`, `nilai(siswa[0])`, `duwe(siswa[0], "nama")`.
- **Function**: Fungsi bisa nampa, mbalekake, lan ngowahi struktur nested.
- **Loop**: Iterasi array of objects liwat `nalika` utawa `kanggo`.
- **Conditional**: Struktur nested bisa diuji nganggo `yen`, operator logika `lan`/`utawa`, lan `duwe()`.
- **Null & Type**: Nilai `null` ing struktur nested tetep sah (`jinis(data["user"]["alamat"])` -> `"null"`).

---

## 🔁 Foreach / Iteration

Jawascript nyedhiyakake sintaks **foreach** kanggo ngiterasi elemen array kanthi gampang:

```jawa
kanggo saben <variable> ing <array> {
    ...
}
```

### Katrangan Sintaks

- `kanggo`: Tembung kunci wiwitan perulangan.
- `saben`: Tandha mode iterasi foreach.
- `<variable>`: Jeneng variabel iterator sing nampa saben elemen array.
- `ing`: Tembung kunci penghubung sadurunge ekspresi sumber.
- `<array>`: Ekspresi sumber sing kudu ngasilake array (bisa awujud variabel, array literal, panggilan fungsi kayata `kunci()` utawa `nilai()`, utawa akses nested properti).

### Tuladha Panggunaan

```jawa
gawe angka = [10, 20, 30]

kanggo saben x ing angka {
    tulis x
}
```

### Iterasi Object liwat Built-in

Object ora diiterasi kanthi langsung, nanging bisa nggunakake `kunci()` utawa `nilai()`:

```jawa
gawe user = {
    "nama": "Budi",
    "umur": 20
}

kanggo saben key ing kunci(user) {
    tulis key
}

kanggo saben val ing nilai(user) {
    tulis val
}
```

### Fitur & Aturan V1

- **Mung Array**: Sumber iterasi kudu awujud array. Nilai non-array (`number`, `string`, `boolean`, `null`, `object`) bakal ngasilake error runtime.
- **Empty Array**: Array kosong `[]` bakal langsung nglewati blok loop tanpa error.
- **Reference Semantics**: Elemen array sing awujud object utawa array njaga referensi asline, mula mutasi marang iterator langsung ngowahi data sumbere.
- **Loop Control**: `mandheg` (*break*) lan `lanjut` (*continue*) lumaku kanthi bener lan mung mengaruhi loop paling cedhak.
- **Scope Behavior**: Selaras karo aturan loop Jawascript, perulangan ora nggawe scope anyar. Variabel iterator dianyari ing scope lingkungan loop kasebut.

---

## ⚠️ Pananganan Kasalahan (Error Handling / Exception System)

Jawascript ndhukung sistem penanganan kesalahan (*exception handling*) lengkap mawa tembung kunci basa Jawa: `coba`, `tangkep`, lan `lempar`:

```jawa
coba {
    // blok kode sing bisa ngasilake kesalahan
    lempar "Data ora valid"
} tangkep err {
    // blok penanganan kesalahan
    tulis err
}
```

### Katrangan Sintaks & Konstruksi

1. **`coba { ... }`**:
   Blok kode sing diawasi saka kemungkinan kesalahan runtime utawa lemparan eksepsi.
2. **`tangkep <identifier> { ... }`**:
   Blok penangkep sing langsung nyambung sawise `coba { ... }`. Parameter `<identifier>` bakal nampa nilai eksepsi sing dilempar.
3. **`lempar <ekspresi>`**:
   Mbuwang eksepsi kanthi nilai sembarang tipe data Jawascript (`string`, `number`, `boolean`, `null`, `array`, `object`).

### Fitur Utama

- **Tipe Data Bebas**: `lempar` bisa mbuwang kabeh jinis tipe data:
  ```jawa
  lempar "Pesen string"
  lempar 404
  lempar bener
  lempar null
  lempar [1, 2, 3]
  lempar {"pesan": "Server error", "kode": 500}
  ```
- **Nangkep Error Runtime Bawaan**: `coba ... tangkep` bisa nangkep kesalahan eksekusi runtime internal Jawascript (kayata pembagian nol, indeks array out-of-bounds, operasi tipe null, lsp).
- **Rethrow**: Eksepsi bisa dilempar maneh saka njero blok `tangkep` nggunakake `lempar`:
  ```jawa
  coba {
      coba {
          lempar "error jero"
      } tangkep e {
          tulis "ditangkep ing jero: " + e
          lempar e // rethrow
      }
  } tangkep e2 {
      tulis "ditangkep ing njaba: " + e2
  }
  ```
- **Propagasi Fungsi (Call Stack)**: Eksepsi sing ora ditangkep ing njero fungsi bakal mumbul (*propagate*) menyang pemanggil fungsi nganti nemu blok `coba ... tangkep`.
- **Isolasi Control Flow**:
  - `bali` ing njero `coba` tetep mbalekake nilai fungsi kanthi bener tanpa kleru ditangkep dening `tangkep`.
  - `mandheg` (*break*) lan `lanjut` (*continue*) ing njero `coba` tetep ngontrol loop tanpa dicegat dening `tangkep`.
- **Scope**: Selaras karo aturan Jawascript, blok `coba` lan `tangkep` ora nggawe scope anyar. Variabel sing diowahi ing njero blok bakal tetep owah ing scope aktif. Parameter error mung kasedhiya sajrone eksekusi blok `tangkep`.

---

## 📦 Sistem Modul (Module / Import System V1)

Jawascript nyedhiyakake sistem pemisahan kode dadi pirang-pirang berkas modul mawa tembung kunci `impor` lan `ekspor`:

### 1. Ngekspor Simbol saka Modul (`ekspor`)

Sawijining modul bisa ngekspor fungsi utawa variabel menyang modul liya:

```jawa
// matematika.jawa
ekspor fungsi tambah(a, b) {
    bali a + b
}

ekspor gawe pi = 3.14
gawe rahasia = 123 // Variabel privat (ora diekspor)
```

> [!IMPORTANT]
> - `ekspor` mung bisa digunakake ing **top-level berkas**. Dilarang nulis `ekspor` ing njero fungsi, loop, percabangan, utawa try/catch.
> - Simbol privat (sing ora mawa `ekspor`) ora bakal katon saka modul sing ngimpor.

### 2. Ngimpor Modul (`impor`)

Modul liya bisa ngimpor simbol sing diekspor nggunakake path string literal:

```jawa
// main.jawa
impor "matematika"

tulis tambah(10, 20) // 30
tulis pi             // 3.14
// tulis rahasia     // Error: Variabel "rahasia" durung digawe!
```

### 3. Fitur & Aturan Desain V1

- **Strictly Top-Level Import**: `impor` mung diidinake ing top-level berkas supaya struktur *dependency graph* tansah deterministik lan resik.
- **Resolusi Path Relatif**: Path modul diitung kanthi relatif marang berkas sing nindakake impor (`path.dirname(currentFile)`), dudu adhedhasar folder eksekusi (cwd).
- **Ekstensi `.jawa`**: Ekstensi `.jawa` otomatis ditambahake yen ora ditulis (`impor "matematika"` $\to$ `matematika.jawa`). Mung berkas mawa ekstensi `.jawa` sing diidinake.
- **Lexical Scoping Function**: Fungsi sing diekspor tetep ngiket *lexical environment* modul asale. Nalika fungsi diundang saka modul liya, fungsi kasebut tetep bisa ngakses variabel lokal utawa fungsi internal modul asale tanpa kena pengaruh variabel pengimpor.
- **Module Cache (Singleton Execution)**: Saben modul mung dieksekusi sepisan nalika pisanan diimpor. Panggilan impor sabanjure utawa saka pirang-pirang modul liya bakal njupuk saka cache memori (`LOADED`).
- **Deteksi Ketergantungan Bunder (Circular Dependency)**: Siklus impor (kayata `A -> B -> A`) dideteksi kanthi otomatis liwat status `LOADING` lan ngasilake pesen kesalahan sing cetha tanpa nyebabake *infinite recursion* utawa *stack overflow*.
- **Pangaturan Kesalahan (Error Propagation)**: Yen modul sing diimpor ngasilake kesalahan sintaks utawa kesalahan runtime nalika dieksekusi, kesalahan kasebut bakal dipropagasikake langsung menyang penangan kesalahan kanthi rincian pesen sing cetha.

---

## 🔒 Module / Import System V1.1 — Hardening & Polish

V1.1 nambah ketegasan semantics modul tanpa ngganti syntax utawa desain dasar.

### Variable Export Semantics (Copy Binding)

Variabel sing diekspor nggunakake **copy binding** — nilai disalin menyang scope pengimpor nalika modul dimuat. Iki **dudu** live binding.

```jawa
// modul.jawa
ekspor gawe angka = 100
ekspor fungsi baca() { bali angka }
```

```jawa
// main.jawa
impor "modul"
tulis angka       // 100  (nilai asli)
angka = 999       // Ngganti binding lokal pengimpor
tulis angka       // 999  (binding lokal pengimpor)
tulis baca()      // 100  (fungsi modul tansah ndeleng scope modul asale)
```

> [!IMPORTANT]
> Fungsi sing diekspor tansah nggunakake *lexical closure* modul asale. Yen pengimpor ngganti variabel sing diimpor, fungsi modul **ora** kena pengaruhe.

### Cache Semantics (LOADING → LOADED / FAILED)

Saben modul duwe status cache sing jelas:

| Status | Katrangan |
| :--- | :--- |
| `LOADING` | Modul lagi dieksekusi. Import modul sing wis `LOADING` = circular dependency → error |
| `LOADED` | Modul wis kasil dimuat. Import sabanjure njupuk langsung saka cache (singleton) |
| `FAILED` | Modul gagal dimuat (syntax error / runtime error). Import sabanjure langsung mbalekake error sing padha |

### Path Semantics (Canonical Path)

Path modul dikanonikalisasi mawa `fs.realpathSync.native` sawise `path.resolve`. Papat cara nulis iki ngacu menyang berkas lan cache key sing **padha**:

```jawa
impor "counter"
impor "./counter"
impor "counter.jawa"
impor "./counter.jawa"
```

### Error Semantics (Chained Error Context)

Yen modul sing diimpor ngasilake kesalahan runtime, pesen kesalahan dibungkus mawa konteks modul:

```text
[Modul "chain_err_mid.jawa"]: [Modul "chain_err_leaf.jawa"]: kesalahan saka chain_err_leaf
```

Iki menehi *stack trace* rantai modul sing cetha kanggo debugging.

### Kasedhiyan Built-in ing Modul

Kabeh built-in Jawascript tansah kasedhiya ing jero modul tanpa konfigurasi tambahan:

```text
tulis   dawa    jupuk   nambah  busak   motong
ngganti gedhe   cilik   takon   jinis   kunci
nilai   duwe
```

Built-in iki ora disimpen ing `Environment` chain — diproses langsung ing interpreter, mula ora terpengaruh karo isolasi scope modul.

---

## 🧩 Higher-Order Function & Functional Collection V1

Jawascript ndhukung fungsi minangka **first-class runtime value** sarta nyedhiyakake fungsi functional dhasar kanggo Array.

### 1. Fungsi minangka First-Class Value & Referensi

Fungsi bisa disimpen ing variabel, diwenehake minangka argumen, lan diceluk liwat variabel:

```jawa
fungsi kuadrat(x) {
    bali x * x
}

gawe f = kuadrat
tulis f(5) // 25
tulis jinis(f) // "function"
```

### 2. Fungsi minangka Argumen & Return Value

```jawa
fungsi jalankan(fn, nilai) {
    bali fn(nilai)
}

tulis jalankan(kuadrat, 6) // 36

fungsi tambah(a, b) { bali a + b }
fungsi ping(a, b) { bali a * b }

fungsi pilihOperasi(jns) {
    yen jns == "tambah" { bali tambah }
    bali ping
}

gawe op = pilihOperasi("tambah")
tulis op(10, 20) // 30
```

> [!NOTE]
> Deklarasi fungsi ing njero fungsi (*nested function declaration*) tetep **ora didhukung** ing V1. Pengembalian fungsi nggunakake referensi fungsi tingkat ndhuwur (*top-level function reference*).

### 3. Fungsi ing Array lan Object (Chained Invocations)

Fungsi bisa disimpen ing jero Array utawa Object, lan bisa langsung diceluk liwat ekspresi berantai (*chained postfix*):

```jawa
gawe operasi = [tambah, ping]
tulis operasi[0](3, 4) // 7
tulis operasi[1](3, 4) // 12

gawe wadah = {
    "itung": kuadrat
}
tulis wadah["itung"](7) // 49
```

### 4. Standard Library Functional: `terapkan()`, `saring()`, `itung()`

| Fungsi | Katrangan | Tuladha |
| :--- | :--- | :--- |
| `terapkan(fungsi, array)` | Ngowahi (*map*) saben elemen array kanthi fungsi transformasi, ngasilake array anyar | `terapkan(kuadrat, [1, 2, 3])` $\to$ `[1, 4, 9]` |
| `saring(fungsi, array)` | Nyaring (*filter*) elemen array sing ngasilake `bener` saka predikat callback | `saring(luwihGedhe, [1, 2, 3, 4])` $\to$ `[4]` |
| `itung(fungsi, array)` | Ngetung (*count*) cacahe elemen sing nyukupi predikat callback | `itung(luwihGedhe, [1, 2, 3, 4])` $\to$ `1` |

#### Aturan & Semantik:
- **Strict Boolean**: Callback kanggo `saring()` lan `itung()` **wajib** ngasilake boolean (`bener` utawa `salah`). Nilai `null`, angka `1`/`0`, string, lsp bakal langsung ditolak mawa error runtime (ora ana implicit truthy conversion).
- **Empty Array**: Array kosong `[]` langsung ngasilake `[]` (utawa `0` kanggo `itung()`) tanpa ngundang callback.
- **Reference Semantics**: Mutasi object utawa array ing jero callback tetep njaga referensi data asline tanpa deep clone.
- **Error Propagation**: Yen callback ngalami runtime error utawa mbuwang eksepsi nganggo `lempar`, kesalahan kasebut bakal dipropagasikake langsung menyang penangan eksepsi (`coba ... tangkep`).
- **Module Compatibility**: Fungsi sing diekspor saka modul tetep njaga lexical closure (`fn.env`, `fn.functions`, `fn.filePath`) nalika diceluk liwat referensi utawa callback.

---

## 🧺 Collection & Functional Standard Library V2

Jawascript nyedhiyakake fungsi bawaan (*built-in*) tambahan kanggo manipulasi lan analisis Array kanthi pendekatan functional lan non-mutating:

| Fungsi | Parameter & Validasi | Katrangan | Return Value | Tuladha (Contoh) |
| :--- | :--- | :--- | :--- | :--- |
| `gabung(array, pemisah)` | 2 argument: (array, string) | Nggabungake kabeh elemen array dadi sawijining string kanthi pamisah (*delimiter*) | `string` | `gabung(["a", "b", "c"], "-")` $\to$ `"a-b-c"` |
| `balik(array)` | 1 argument: (array) | Mbalekake array anyar kanthi urutan elemen kewalik tanpa ngowahi (*non-mutating*) array asline | `array` anyar | `balik([1, 2, 3])` $\to$ `[3, 2, 1]` |
| `urut(array)` | 1 argument: (array angka) | Mbalekake array anyar kanthi elemen angka diurutake kanthi urut munggah (*ascending*, `a - b`) tanpa ngowahi array asline | `array` anyar | `urut([30, 5, 20])` $\to$ `[5, 20, 30]` |
| `ana(predikat, array)` | 2 argument: (function, array) | Priksa apa ana minimal sak elemen sing nyukupi predikat (*some* / *exists*). Ngandhut short-circuit evaluation | `boolean` (`bener`/`salah`) | `ana(genap, [1, 2, 3])` $\to$ `bener` |
| `kabeh(predikat, array)` | 2 argument: (function, array) | Priksa apa kabeh elemen nyukupi predikat (*every* / *all*). Ngandhut short-circuit evaluation | `boolean` (`bener`/`salah`) | `kabeh(genap, [2, 4, 6])` $\to$ `bener` |
| `golek(predikat, array)` | 2 argument: (function, array) | Nggoleki lan mbalekake elemen pisanan sing nyukupi predikat (*find*). Ngandhut short-circuit evaluation | Elemen utawa `null` | `golek(genap, [1, 4, 6])` $\to$ `4` |
| `indeks(array, nilai)` | 2 argument: (array, any) | Nggoleki indeks pisanan saka nilai sing cocog kanthi strict equality (`===`) (*indexOf*) | `number` (indeks utawa `-1`) | `indeks(["a", "b", "c"], "b")` $\to$ `1` |

### Sifat & Semantics V2
- **Non-Mutating Array**: `balik()` lan `urut()` tansah ngasilake salinan array anyar tanpa ngowahi array sumber.
- **Reference Semantics Elemen**: Nilai referensi (object utawa array bersarang) ing jero array anyar tetep nuduhake referensi asline (ora di-deep clone).
- **Strict Boolean Predicate**: Fungsi callback predikat kanggo `ana()`, `kabeh()`, lan `golek()` **wajib** ngasilake boolean (`bener` utawa `salah`). Nilai dudu boolean langsung ngasilake runtime error.
- **Short-Circuit Evaluation**:
  - `ana()` langsung mandheg lan mbalekake `bener` nalika nemu asil pisanan `bener`.
  - `kabeh()` langsung mandheg lan mbalekake `salah` nalika nemu asil pisanan `salah`.
  - `golek()` langsung mandheg lan mbalekake elemen kasebut nalika nemu asil pisanan `bener`.
- **Empty Array Handling**:
  - `gabung([], sep)` $\to$ `""`
  - `balik([])` $\to$ `[]`
  - `urut([])` $\to$ `[]`
  - `ana(fn, [])` $\to$ `salah`
  - `kabeh(fn, [])` $\to$ `bener`
  - `golek(fn, [])` $\to$ `null`
  - `indeks([], val)` $\to$ `-1`
- **Error & Module Compatibility**: Kabeh callback predikat ndhukung fungsi reguler, referensi fungsi, lan fungsi sing diimpor saka modul kanthi lexical closure lan deteksi exception (`coba ... tangkep`) sing utuh.

---

## 🚀 Cara Migunakake (Cara Menjalankan)

Priksa manawa **Node.js** wis diinstal ing komputer.

Jalukna perintah iki ing terminal:

```bash
node index.js examples/oi.jawa
```

Tes fitur percabangan:

```bash
node index.js examples/tes_percabangan.jawa
```

Tes Expression Engine:

```bash
node index.js examples/test_expression.jawa
```

Tes Operator Logika:

```bash
node index.js examples/test_logical.jawa
```

Tes Loop Engine:

```bash
node index.js examples/test_loop.jawa
```

Tes Function Engine:

```bash
node index.js examples/test_function.jawa
```

Tes Penguncian Function Scope:

```bash
node index.js examples/test_function_scope.jawa
```

Tes Array Engine:

```bash
node index.js examples/test_array.jawa
node index.js examples/test_array_error.jawa
```

Tes Built-in Functions:

```bash
node index.js examples/test_builtin.jawa
node index.js examples/test_builtin_error.jawa
```

Tes String Utility Engine:

```bash
node index.js examples/test_string.jawa
node index.js examples/test_string_error.jawa
```

Tes Input Engine:

```bash
node index.js examples/test_input.jawa
node index.js examples/test_input_error.jawa
```

Tes Type System & Null:

```bash
node index.js examples/test_type.jawa
node index.js examples/test_type_error.jawa
```

Tes Object / Dictionary Engine:

```bash
node index.js examples/test_object.jawa
node index.js examples/test_object_error.jawa
```

Tes Object Standard Library:

```bash
node index.js examples/test_object_builtin.jawa
node index.js examples/test_object_builtin_error.jawa
```

Tes Array + Object Integration:

```bash
node index.js examples/test_array_object.jawa
node index.js examples/test_array_object_error.jawa
```

Tes Foreach / Iteration:

```bash
node index.js examples/test_foreach.jawa
node index.js examples/test_foreach_error.jawa
```

Tes Pananganan Kasalahan (Exception System):

```bash
node index.js examples/test_exception.jawa
node index.js examples/test_exception_error.jawa
```

Tes Sistem Modul (Module / Import System V1):

```bash
node index.js examples/test_module.jawa
node index.js examples/test_module_error.jawa
```

Tes Module / Import System V1.1 (Hardening & Polish):

```bash
node index.js examples/test_module_v11.jawa
node index.js examples/test_module_v11_error.jawa
```

Tes Higher-Order Function & Functional Collection V1:

```bash
node index.js examples/test_higher_order.jawa
node index.js examples/test_higher_order_error.jawa
```

Tes Collection & Functional Standard Library V2:

```bash
node index.js examples/test_collection_v2.jawa
node index.js examples/test_collection_v2_error.jawa
```

---

## 🏗️ Struktur Proyèk

- `index.js` — *Entry point* aplikasi (maca file `.jawa`, nyambungake Lexer -> Parser -> Interpreter).
- `src/lexer.js` — **Tokenizer**: Ngowahi kode mentah dadi deretan token.
- `src/parser.js` — **Recursive Descent Parser**: Ngolah token dadi struktur wit sintaksis (*Abstract Syntax Tree* / AST).
- `src/module_loader.js` — **Module Loader**: Resolusi path modul kanonikal, manajemen cache modul, lan deteksi circular dependency.
- `src/interpreter.js` — **Interpreter**: Ngevaluasi AST mawa `Environment` lexical scope chain, penanganan sinyal control-flow, lan eksekusi program.
- `examples/` — Lemari conto file kode `.jawa`.
- `examples/modules/` — Lemari berkas modul conto kang diekspor lan diimpor.
