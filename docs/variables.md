# Variabel, Tipe Data & Input (Variables, Types & Input)

[← Sadurunge: Sintaks Dasar](syntax.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Operator & Precedence →](operators.md)

---

## 1. Deklarasi & Pangowahan Variabel

Variabel anyar ing Jawalang dideklarasikake nggunakake tembung kunci `gawe`:

```jawa
gawe jeneng = "Budi"
gawe umur = 25
gawe dhuwur = 172.5
gawe aktif = bener
```

Sawise dideklarasikake, nilai variabel bisa diowahi liwat operasi penugasan (*assignment*):

```jawa
gawe angka = 10
angka = 20
angka = angka + 5
tulis angka // 25
```

> [!IMPORTANT]
> Jawalang ora ngidinake penugasan variabel tanpa deklarasi `gawe` sadurunge. Nyoba ngisi nilai marang variabel sing durung nate digawe bakal ngasilake kasalahan runtime (*Undefined variable*).

---

## 2. Sistem Tipe Data Runtime (Type System)

Jawalang nduweni sistem tipe data runtime murni sing konsisten. Saben nilai nduweni jinis data tartamtu:

| Tipe Data | Katrangan | Tuladha Nilai | Asil `jinis()` |
| :--- | :--- | :--- | :--- |
| `number` | Bilangan bulat (*integer*) utawa pecahan (*decimal*) | `10`, `3.14`, `-5`, `0.25` | `"number"` |
| `string` | Rerangkatan karakter ing njero tanda petik | `"Halo"`, `"Jawalang"` | `"string"` |
| `boolean` | Nilai bebeneran basa Jawa | `bener`, `salah` | `"boolean"` |
| `null` | Nilai khusus makili kahanan *ora ana nilai* | `null` | `"null"` |
| `array` | Struktur data dhaptar elemen | `[1, 2, 3]`, `[]` | `"array"` |
| `object` | Pasangan kunci-nilai (dictionary/hash map) | `{"nama": "Budi"}`, `{}` | `"object"` |
| `function` | Fungsi sing wis dideklarasikake nganggo `guna` | `tambah` | `"function"` |
| `struct` | Definisi struktur data obyek | `Wong` | `"struct"` |
| `instance` | Obyek asil instansiasi struct liwat `anyar` | `anyar Wong()` | `"instance"` |

---

## 3. Fungsi Pamariksa Tipe: `jinis()`

Fungsi bawaan `jinis()` nampa **tepat 1 argument** lan mbalekake jeneng tipe data ing wujud string:

```jawa
tulis jinis(10)         // "number"
tulis jinis(3.14)       // "number"
tulis jinis("Halo")     // "string"
tulis jinis(bener)      // "boolean"
tulis jinis(null)       // "null"
tulis jinis([1, 2, 3])  // "array"
tulis jinis({})         // "object"

guna sapa() {}
tulis jinis(sapa)       // "function"

bentuk Wong {}
tulis jinis(Wong)       // "struct"

gawe w = anyar Wong()
tulis jinis(w)          // "instance"
```

---

## 4. Sifat & Semantik `null`

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

## 5. Input Interaktif: `takon()`

Jawalang nyedhiyakake fungsi bawaan `takon()` kanggo maca input saka pangguna liwat konsol:

| Fungsi | Parameter | Katrangan | Return Value |
| :--- | :--- | :--- | :--- |
| `takon()` | 0 argument | Maca sak baris input tanpa teks pituduh (*prompt*) | `string` |
| `takon(prompt)` | 1 argument (string) | Nampilake pituduh banjur maca sak baris input saka pangguna | `string` |

### Sifat & Ketentuan Input
- **Tansah String**: Nilai bali `takon()` tansah awujud `string`, sanajan pangguna ngetik angka.
- **Input Kosong**: Yen pangguna langsung mencet `ENTER` tanpa ngetik apa-apa, `takon()` ngasilake string kosong `""` (dudu `null`).
- **Validasi Argument**: Mung nampa 0 utawa 1 argument, lan argument kudu bertipe `string`.

### Tuladha Panggunaan:
```jawa
// 1. Input kanthi prompt
gawe jeneng = takon("Sapa jenengmu? ")
tulis "Sugeng rawuh, " + jeneng

// 2. Input ing percabangan kondisi
gawe pilihan = takon("Milih ya utawa ora? ")
yen pilihan == "ya" {
    tulis "Sampeyan milih ya"
} liyane {
    tulis "Sampeyan ora milih ya"
}
```

---

[← Sadurunge: Sintaks Dasar](syntax.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Operator & Precedence →](operators.md)
