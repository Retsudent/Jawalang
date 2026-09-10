# Date & Time

Modul Date & Time di Jawalang V1.4.0 menyediakan fungsi-fungsi standar untuk manajemen tanggal, waktu, formatting, parsing, perbandingan, dan manipulasi aritmatika waktu. Seluruh operasi bersifat murni (*pure*), deterministik, dan mengedepankan keamanan tipe yang ketat (*strict typing*).

---

## DateTime Type

Jawalang merepresentasikan waktu menggunakan tipe data runtime khusus `datetime`. Objek `datetime` dienkapsulasi dan dibekukan secara internal (`Object.freeze`) sehingga tidak membocorkan objek JavaScript runtime (`Date`) ke lingkup program pengguna Jawalang.

### Karakteristik Tipe:
- **Tipe Runtime (`jinis`)**: Mengembalikan string `"datetime"`.
- **Representasi Internal**: `{ _isDateTime: true, timestamp: <Unix ms integer> }`.
- **Display Output**: Ketika dicetak (`tulis`) atau diinspeksi di REPL, diformat sebagai `<datetime YYYY-MM-DD HH:mm:ssZ>`.
- **First-Class Value**: Objek `datetime` dapat disimpan dalam variabel, array, object/dictionary, dioper sebagai argumen fungsi, maupun dikembalikan (*returned*) dari fungsi.
- **Value Equality**: Operator perbandingan kesetaraan (`==` dan `!=`) membandingkan nilai timestamp milidetik UTC yang dikandungnya.

Contoh:
```jawa
gawe saikiWektu = saiki()
tulis jinis(saikiWektu) // Output: datetime
```

---

## saiki()

Mengembalikan objek `datetime` baru yang merepresentasikan waktu sistem saat ini.

- **Signature**: `saiki() -> datetime`
- **Argumen**: 0 argumen. Memberikan argumen apapun akan memicu error validasi jumlah argumen.
- **Nilai Kembalian**: Objek `datetime` saat ini.

```jawa
gawe w = saiki()
tulis jinis(w) // datetime
```

---

## timestamp()

Mengambil nilai Unix timestamp (dalam milidetik) dari sebuah objek `datetime`.

- **Signature**: `timestamp(waktu: datetime) -> number`
- **Argumen**:
  - `waktu`: Objek bertipe `datetime`.
- **Nilai Kembalian**: Integer bertipe `number` yang merepresentasikan milidetik sejak *Unix Epoch* (1970-01-01 00:00:00 UTC).
- **Error**: Melempar error jika argumen bukan `datetime` atau jumlah argumen tidak tepat 1.

```jawa
gawe w = saiki()
gawe ms = timestamp(w)
tulis jinis(ms) // nomer
```

---

## gaweWektu()

Membuat objek `datetime` baru secara eksplisit. Mendukung dua mode pemanggilan: dari Unix timestamp (milidetik) atau dari komponen kalender UTC.

- **Signature**:
  - `gaweWektu(timestamp: number) -> datetime`
  - `gaweWektu(tahun: number, wulan: number, dina: number) -> datetime`
  - `gaweWektu(tahun: number, wulan: number, dina: number, jam: number, menit: number, detik: number) -> datetime`
- **Aturan Argumen Kalender**:
  - `tahun`: Integer tahun (misal `2026`).
  - `wulan`: Integer bulan 1-based (`1` = Januari, `12` = Desember).
  - `dina`: Integer hari dalam bulan (`1` sampai `28/29/30/31` sesuai kalender dan aturan tahun kabisat).
  - `jam`: Integer jam (`0` sampai `23`, opsional default `0`).
  - `menit`: Integer menit (`0` sampai `59`, opsional default `0`).
  - `detik`: Integer detik (`0` sampai `59`, opsional default `0`).
- **Validasi Ketat**:
  - Jika tanggal tidak valid di kalender (seperti `2026-02-30` atau `2025-02-29`), fungsi **seketika melempar runtime error**. Tidak ada perilaku *rollover* otomatis.

```jawa
// Dari timestamp ms
gawe w1 = gaweWektu(1700000000000)

// Dari komponen tanggal (UTC)
gawe w2 = gaweWektu(2026, 9, 6)

// Dari komponen tanggal dan jam lengkap
gawe w3 = gaweWektu(2026, 9, 6, 14, 30, 0)
```

---

## taun()

Mengambil komponen tahun dari objek `datetime` dalam zona waktu UTC.

- **Signature**: `taun(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai tahun integer 4 digit (misal `2026`).

```jawa
gawe w = parseWektu("2026-09-06")
tulis taun(w) // 2026
```

---

## wulan()

Mengambil komponen bulan dari objek `datetime` dalam zona waktu UTC (1-based).

- **Signature**: `wulan(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai bulan integer 1–12 (1 = Januari, 12 = Desember).

```jawa
gawe w = parseWektu("2026-09-06")
tulis wulan(w) // 9
```

---

## dina()

Mengambil komponen hari/tanggal dalam bulan dari objek `datetime` dalam zona waktu UTC.

- **Signature**: `dina(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai tanggal integer 1–31.

```jawa
gawe w = parseWektu("2026-09-06")
tulis dina(w) // 6
```

---

## jam()

Mengambil komponen jam dari objek `datetime` dalam zona waktu UTC.

- **Signature**: `jam(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai jam integer 0–23.

```jawa
gawe w = gaweWektu(2026, 9, 6, 14, 30, 0)
tulis jam(w) // 14
```

---

## menit()

Mengambil komponen menit dari objek `datetime` dalam zona waktu UTC.

- **Signature**: `menit(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai menit integer 0–59.

```jawa
gawe w = gaweWektu(2026, 9, 6, 14, 30, 0)
tulis menit(w) // 30
```

---

## detik()

Mengambil komponen detik dari objek `datetime` dalam zona waktu UTC.

- **Signature**: `detik(waktu: datetime) -> number`
- **Argumen**: `waktu` bertipe `datetime`.
- **Nilai Kembalian**: Nilai detik integer 0–59.

```jawa
gawe w = gaweWektu(2026, 9, 6, 14, 30, 45)
tulis detik(w) // 45
```

---

## formatWektu()

Memformat objek `datetime` menjadi representasi string berdasarkan pola token yang ditentukan.

- **Signature**: `formatWektu(waktu: datetime, pola: string) -> string`
- **Argumen**:
  - `waktu`: Objek bertipe `datetime`.
  - `pola`: String format yang berisi kombinasi token kalender.
- **Token yang Didukung**:
  - `YYYY`: Tahun 4 digit (misal `2026`)
  - `MM`: Bulan 2 digit berpading nol (`01`–`12`)
  - `DD`: Tanggal 2 digit berpading nol (`01`–`31`)
  - `HH`: Jam 2 digit 24-jam berpading nol (`00`–`23`)
  - `mm`: Menit 2 digit berpading nol (`00`–`59`)
  - `ss`: Detik 2 digit berpading nol (`00`–`59`)
- Karakter lain di luar token format akan dipertahankan apa adanya (misal `-`, `:`, spasi, `/`).

```jawa
gawe w = gaweWektu(2026, 9, 6, 8, 5, 9)
tulis formatWektu(w, "YYYY-MM-DD")          // 2026-09-06
tulis formatWektu(w, "YYYY-MM-DD HH:mm:ss") // 2026-09-06 08:05:09
tulis formatWektu(w, "DD/MM/YYYY")          // 06/09/2026
```

---

## parseWektu()

Melakukan parsing deterministik dari teks string menjadi objek `datetime`.

- **Signature**: `parseWektu(teks: string) -> datetime`
- **Argumen**: `teks` bertipe `string`.
- **Format yang Diterima**:
  - `"YYYY-MM-DD"` (waktu diatur ke `00:00:00` UTC)
  - `"YYYY-MM-DD HH:mm:ss"` (waktu sesuai jam, menit, detik UTC)
- **Validasi Deterministik**:
  - Tidak mengandalkan heuristik `new Date(string)` bawaan JavaScript.
  - Memeriksa batas kalender riil: bulan (1–12), hari (1–28/29/30/31), jam (0–23), menit (0–59), detik (0–59).
  - Melindungi aturan tahun kabisat (misal `2024-02-29` valid, sedangkan `2025-02-29` langsung memicu error).
  - Teks sembarang non-format seperti `"abc"` atau format invalid seperti `"2026-99-99"` memicu runtime error.

```jawa
gawe tgl = parseWektu("2026-09-06")
tulis taun(tgl) // 2026
tulis wulan(tgl) // 9
tulis dina(tgl) // 6
```

---

## sadurunge()

Memeriksa apakah waktu `a` terjadi sebelum waktu `b`.

- **Signature**: `sadurunge(a: datetime, b: datetime) -> boolean`
- **Nilai Kembalian**: `bener` jika timestamp `a` < timestamp `b`, selainnya `luput`.
- **Strict Typing**: Melempar runtime error jika salah satu argumen bukan `datetime`.

```jawa
gawe t1 = parseWektu("2026-09-06")
gawe t2 = parseWektu("2026-09-07")
tulis sadurunge(t1, t2) // bener
```

---

## sawise()

Memeriksa apakah waktu `a` terjadi sesudah waktu `b`.

- **Signature**: `sawise(a: datetime, b: datetime) -> boolean`
- **Nilai Kembalian**: `bener` jika timestamp `a` > timestamp `b`, selainnya `luput`.
- **Strict Typing**: Melempar runtime error jika salah satu argumen bukan `datetime`.

```jawa
gawe t1 = parseWektu("2026-09-06")
gawe t2 = parseWektu("2026-09-07")
tulis sawise(t2, t1) // bener
```

---

## padhaWektu()

Memeriksa apakah waktu `a` dan `b` memiliki timestamp yang sama persis.

- **Signature**: `padhaWektu(a: datetime, b: datetime) -> boolean`
- **Nilai Kembalian**: `bener` jika timestamp `a` == timestamp `b`, selainnya `luput`.
- **Strict Typing**: Melempar runtime error jika salah satu argumen bukan `datetime`.

```jawa
gawe t1 = parseWektu("2026-09-06")
gawe t2 = gaweWektu(2026, 9, 6)
tulis padhaWektu(t1, t2) // bener
```

---

## tambahWektu()

Menambahkan sejumlah detik ke sebuah objek `datetime`, menghasilkan objek `datetime` baru.

- **Signature**: `tambahWektu(waktu: datetime, jumlahDetik: number) -> datetime`
- **Argumen**:
  - `waktu`: Objek `datetime`.
  - `jumlahDetik`: Bilangan `number` (positif atau negatif).
- **Immutability**: Objek `waktu` asal tidak berubah.
- **Kalkulasi**: Berbasis milidetik (`timestamp + (jumlahDetik * 1000)`), sehingga transisi batas bulan dan tahun kabisat tertangani secara otomatis dan akurat.

```jawa
gawe w1 = parseWektu("2026-01-31")
gawe w2 = tambahWektu(w1, 86400) // Tambah 1 hari (86400 detik)
tulis formatWektu(w2, "YYYY-MM-DD") // 2026-02-01
```

---

## kurangWektu()

Mengurangkan sejumlah detik dari sebuah objek `datetime`, menghasilkan objek `datetime` baru.

- **Signature**: `kurangWektu(waktu: datetime, jumlahDetik: number) -> datetime`
- **Argumen**:
  - `waktu`: Objek `datetime`.
  - `jumlahDetik`: Bilangan `number` (positif atau negatif).
- **Immutability**: Objek `waktu` asal tidak berubah.

```jawa
gawe w1 = parseWektu("2026-09-07")
gawe w2 = kurangWektu(w1, 86400)
tulis formatWektu(w2, "YYYY-MM-DD") // 2026-09-06
```

---

## Timezone

Jawalang V1.4.0 menerapkan model zona waktu **UTC (Coordinated Universal Time)** penuh:
1. Semua fungsi ekstraksi komponen (`taun`, `wulan`, `dina`, `jam`, `menit`, `detik`) membaca komponen waktu UTC.
2. `formatWektu` memformat komponen berdasarkan waktu UTC.
3. `parseWektu` menginterpretasikan input teks kalender sebagai waktu UTC.
4. Nilai `timestamp()` menghasilkan Unix timestamp integer murni (milidetik sejak 1970-01-01T00:00:00Z).
5. Tidak ada ketergantungan pada pengaturan timezone host mesin pengguna maupun fluktuasi *Daylight Saving Time* (DST), menjamin seluruh eksekusi program bersifat 100% deterministik dan portabel lintas platform.

---

## Immutability

Seluruh objek `datetime` di Jawalang bersifat **immutable** (tidak dapat dimutasi):
- Objek runtime dibekukan dengan `Object.freeze`.
- Operasi manipulasi seperti `tambahWektu` dan `kurangWektu` selalu mengembalikan instans `datetime` baru.
- Tidak ada operasi mutasi in-place pada `datetime`.

```jawa
gawe awal = parseWektu("2026-09-06")
gawe lanjut = tambahWektu(awal, 86400)

tulis formatWektu(awal, "YYYY-MM-DD")   // 2026-09-06 (tetap tidak berubah)
tulis formatWektu(lanjut, "YYYY-MM-DD") // 2026-09-07
```

---

## Error Handling

Jawalang menegakkan *strict type safety* dan validasi argumen yang ketat:
- **Tipe Argumen Salah**: Melempar runtime error jelas dengan pesan dwibahasa (Jawa/Indonesia).
  - Contoh: `taun("2026")` -> `Kudu datetime / Harus bertipe datetime, nanging nampa tulisan`.
- **Jumlah Argumen Salah**: Melempar runtime error bila argumen kurang atau berlebih.
  - Contoh: `saiki(1)` -> `Fungsi 'saiki' butuh 0 argumen, nanging nampa 1`.
- **Kalender Tidak Valid**: Melempar runtime error bila tanggal berada di luar batas kalender atau melanggar aturan tahun kabisat.
  - Contoh: `gaweWektu(2025, 2, 29)` -> `Dina ora sah ing tanggal kalender / Hari tidak valid dalam kalender`.
- **Format Parse Tidak Valid**: Melempar runtime error bila string tidak sesuai pola `YYYY-MM-DD` atau `YYYY-MM-DD HH:mm:ss`.
  - Contoh: `parseWektu("bukan-tanggal")` -> `Format tanggal ora sah / Format tanggal tidak valid`.

---

## Examples

### 1. Menghitung Selisih Hari Antara Dua Tanggal
```jawa
gawe t1 = parseWektu("2026-09-01")
gawe t2 = parseWektu("2026-09-10")

gawe selisihDetik = (timestamp(t2) - timestamp(t1)) / 1000
gawe selisihDina = selisihDetik / 86400

tulis "Selisih dina:"
tulis selisihDina // 9
```

### 2. Memeriksa Urutan Waktu
```jawa
gawe t1 = parseWektu("2026-09-06 08:00:00")
gawe t2 = parseWektu("2026-09-06 12:00:00")

yen sadurunge(t1, t2) {
    tulis "t1 luwih dhisik tinimbang t2"
}
```

### 3. Mengintegrasikan DateTime dengan Objek dan Array
```jawa
gawe rekaman = {
    "judul": "Rapat Tim",
    "dibuat": saiki(),
    "jadwal": parseWektu("2026-09-15 10:00:00")
}

tulis rekaman["judul"]
tulis jinis(rekaman["dibuat"]) // datetime
tulis formatWektu(rekaman["jadwal"], "YYYY-MM-DD HH:mm:ss") // 2026-09-15 10:00:00
```
