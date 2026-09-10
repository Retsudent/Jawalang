# JSON

Modul JSON pada Jawalang V1.4.0 menyediakan fungsi serialisasi dan deserialisasi data standar berbasis RFC 8259. Seluruh operasi bersifat murni (*pure*), deterministik, dan mengedepankan keamanan serta validasi tipe yang ketat (*strict typing*).

---

## jsonEncode()

Melakukan serialisasi struktur data Jawalang menjadi teks string berformat JSON.

- **Signature**: `jsonEncode(nilai: any) -> string`
- **Argumen**: Tepat 1 argumen berupa nilai data yang valid.
- **Nilai Kembalian**: Teks string berformat JSON standar.
- **Validasi Rekursif (*Deep Validation*)**:
  - Memeriksa seluruh elemen dan properti secara mendalam.
  - Melempar runtime error bila menemukan tipe yang tidak didukung (seperti fungsi, objek `datetime`, struct, atau instance OOP).
  - Melacak referensi sirkular dan membatasi kedalaman traversal hingga 500 tingkat.
- **Kekebalan Mutasi (*Immutability*)**: Tidak mengubah atau memutasi struktur data asal.

Contoh:
```jawa
gawe data = {
    "nama": "Jawalang",
    "versi": 1.4,
    "aktif": bener
}

gawe teks = jsonEncode(data)
tulis teks // {"nama":"Jawalang","versi":1.4,"aktif":true}
```

---

## jsonDecode()

Melakukan deserialisasi teks string JSON menjadi struktur data Jawalang asli (*native runtime representations*).

- **Signature**: `jsonDecode(teks: string) -> any`
- **Argumen**: Tepat 1 argumen bertipe `string`.
- **Nilai Kembalian**: Nilai Jawalang native (`number`, `string`, `boolean`, `null`, `array`, atau `object`).
- **Isolasi Deserialisasi (*Decode Isolation*)**: Setiap panggilan menghasilkan instans baru independen di memori. Memodifikasi hasil decode tidak mempengaruhi instans decode lainnya.
- **Penolakan Sintaks & Data Tambahan**:
  - Menolak string kosong atau hanya berisi spasi.
  - Menolak sintaks JSON malformed (misal `"{a:"`).
  - Menolak data tambahan (*trailing data*) seperti `"10 20"` atau `"{}{}"`.

Contoh:
```jawa
gawe teks = "{\"angka\": [10, 20], \"status\": true}"
gawe hasil = jsonDecode(teks)

tulis hasil["angka"][0] // 10
tulis hasil["status"]   // bener
```

---

## Supported Types

JSON adalah format pertukaran data (*data interchange format*), bukan representasi kode eksekusi. Tipe data Jawalang yang didukung untuk serialisasi dan deserialisasi adalah:

1. **Number (`number`)**: Bilangan bulat, pecahan desimal, maupun notasi eksponensial (misal `42`, `-10`, `3.14`, `1e3`). Nilai `NaN`, `Infinity`, dan `-Infinity` dilarang dan ditolak.
2. **String (`string`)**: String teks dengan dukungan penuh escape sequences (`\n`, `\t`, `\"`, `\\`) dan aksara Unicode (termasuk Aksara Jawa `ꦗꦮꦭꦁ` dan emoji).
3. **Boolean (`boolean`)**: Nilai boolean `bener` (dipetakan ke `true`) dan `salah` (dipetakan ke `false`).
4. **Null (`null`)**: Nilai kosong `null` (dipetakan ke `null`).
5. **Array (`array`)**: Larik Jawalang (dipetakan ke `[...]`).
6. **Object (`object`)**: Pasangan kunci-nilai Jawalang dengan kunci bertipe string (dipetakan ke `{...}`).

---

## Unsupported Types

Tipe data berikut **secara tegas ditolak** dan memicu runtime error Jawalang saat encoding:

1. **Function (`function`)**:
   - Fungsi mewakili instruksi logika, bukan data.
   - Penolakan berlaku baik di tingkat teratas maupun tersarang di dalam array/objek.
   - Error: `Tipe "function" ora bisa diencode dadi JSON`.
2. **DateTime (`datetime`)**:
   - Objek `datetime` dienkapsulasi khusus. Untuk Phase 12, serialisasi otomatis belum diaktifkan demi menjaga konsistensi format pertukaran data waktu terstandarisasi.
   - Error: `Tipe "datetime" ora bisa diencode dadi JSON`.
3. **Struct & Instance (`struct`, `instance`)**:
   - Obyek berstate OOP dengan metode dan pewarisan tidak otomatis dikonversi menjadi plain object.
   - Error: `Tipe "instance" ora bisa diencode dadi JSON` atau `Tipe "struct" ora bisa diencode dadi JSON`.
4. **Namespace (`namespace`)**:
   - Namespace modul tidak boleh diekspos sebagai data JSON.
   - Error: `Tipe "namespace" ora bisa diencode dadi JSON`.

---

## Null

- `jsonEncode(null)` menghasilkan teks `"null"`.
- `jsonDecode("null")` menghasilkan nilai `null` Jawalang (bukan `undefined`, bukan `0`, bukan `"null"`).
- Pemeriksaan tipe dengan `jinis(jsonDecode("null"))` mengembalikan string `"null"`.
- Nilai `null` di dalam elemen array maupun properti objek dipertahankan secara utuh.

---

## Arrays

- Array Jawalang dipetakan 1-ke-1 dengan JSON array.
- Elemen array dapat berupa nilai heterogen (kombinasi angka, string, boolean, null, sub-array, sub-objek).
- Array hasil `jsonDecode` dapat langsung diakses dengan pengindeksan bracket `arr[0]` serta dimanipulasi dengan fungsi bawaan array seperti `dawa`, `jupuk`, `nambah`, `terapkan`, dan `saring`.

---

## Objects

- Objek Jawalang dipetakan 1-ke-1 dengan JSON object.
- Semua kunci objek JSON berwujud string.
- Pengaksesan properti didukung lewat bracket `obj["kunci"]` maupun dot notation `obj.kunci`.
- **Semantik Kunci Duplikat (*Duplicate Keys*)**:
  - Jika teks JSON memuat kunci berulang pada tingkat yang sama (misal `{"k": 1, "k": 2}`), berlaku semantik standar *last-key-wins* di mana nilai terakhir (`2`) menggantikan nilai sebelumnya.

---

## Circular References

Struktur data Jawalang menggunakan semantik referensi (*reference semantics*). Format JSON tidak mendukung referensi siklis (sirkular).

Jika `jsonEncode` mendeteksi bahwa sebuah objek atau array merujuk kembali pada salah satu leluhurnya dalam rantai traversal aktif (`a -> b -> a`), proses segera dibatalkan dengan melempar error:
```text
Circular reference ora bisa diencode dadi JSON / Referensi sirkular tidak bisa di-encode menjadi JSON
```
Deteksi siklis ini mencegah *infinite loop*, *stack overflow*, maupun kegagalan proses.

---

## Error Handling

Semua kesalahan serialisasi dan deserialisasi dibungkus rapi dalam exception runtime Jawalang yang dapat ditangkap menggunakan blok `coba ... tangkep`:

```jawa
coba {
    gawe data = jsonDecode("{bukan json}")
} tangkep err {
    tulis "Gagal ngurai JSON: " + err
}
```

Format pesan kesalahan disajikan secara konsisten dalam format dwibahasa (Jawa & Indonesia):
- Jumlah argumen salah: `Function built-in "jsonEncode" mbutuhake 1 argument, nanging diwenehi ...`
- Tipe argumen `jsonDecode` bukan string: `jsonDecode() mung bisa digunakake kanggo string, nanging ditemu: ...`
- Format sintaks JSON salah: `Format JSON ora sah: ... (Format JSON tidak valid: ...)`
- Tipe tidak didukung: `Tipe "..." ora bisa diencode dadi JSON`

---

## Round Trip

Operasi bolak-balik data:
```text
Nilai Jawalang  ──>  jsonEncode()  ──>  Teks JSON  ──>  jsonDecode()  ──>  Nilai Jawalang
```
Menjamin pelestarian tipe dan struktur data secara 100% identik (*type preservation* dan *value preservation*) untuk seluruh tipe primitif, array, dan objek bersarang.

---

## Security

1. **Bebas Eksekusi Kode (*Zero Code Execution*)**:
   - `jsonDecode` memproses data murni menggunakan parser internal V8 tanpa melibatkan `eval` atau `new Function()`.
   - String JSON yang memuat sintaks kode pemrograman tidak akan pernah dieksekusi sebagai kode Jawalang.
2. **Tanpa Akses Sistem Operasi**:
   - Modul ini tidak menggunakan modul `child_process`, `fs`, maupun `network`.
3. **Batas Kedalaman (*Depth Limit*)**:
   - Traversal rekursif dibatasi maksimal 500 tingkat untuk melindungi runtime dari serangan struktur data bersarang berlebih (*Deep Nesting DoS*).

---

## Examples

### 1. Serialisasi Objek Konfigurasi
```jawa
gawe setelan = {
    "tema": "peteng",
    "ukuranFont": 14,
    "fiturAktif": [
        "autocomplete",
        "linting",
        "formatting"
    ]
}

gawe jsonStr = jsonEncode(setelan)
tulis jsonStr
```

### 2. Deserialisasi Data Respon
```jawa
gawe responTeks = "{\"status\": 200, \"pesan\": \"Sukses\", \"data\": {\"total\": 5}}"
gawe respon = jsonDecode(responTeks)

tulis "Status: " + respon["status"]
tulis "Pesan: " + respon["pesan"]
tulis "Total: " + respon["data"]["total"]
```

### 3. Pemrosesan Data Koleksi dengan Higher-Order Function
```jawa
gawe dhaptarData = [
    {"id": 1, "nama": "A"},
    {"id": 2, "nama": "B"}
]

// Encode setiap elemen dalam array menggunakan terapkan (map)
gawe dhaptarJson = terapkan(jsonEncode, dhaptarData)

kanggo saben j ing dhaptarJson {
    tulis j
}
```
