# Jawalang Date & Time Standard Library Architecture

Dokumen ini memuat arsitektur teknis perancangan, representasi runtime, model zona waktu, pemformatan, penguraian (*parsing*), penanganan galat, serta strategi pengujian deterministik untuk pustaka standar **Date & Time** Jawalang V1.4.0 (Phase 11).

---

## 1. Design Goals (Tujuan Perancangan)

1. **Modular & Terpisah dari Core Engine**:
   Mengikuti pola arsitektur Phase 10, implementasi Date & Time ditempatkan sepenuhnya di dalam modul terisolasi `src/stdlib/datetime.js`, divalidasi oleh `src/stdlib/helpers.js`, dan didaftarkan melalui `src/stdlib/index.js` tanpa membebani logika inti interpreter.

2. **Tanpa Bocoran Objek Native JavaScript**:
   Pengguna Jawalang **tidak boleh** menerima objek `Date` JavaScript mentah. Objek runtime tanggal Jawalang dibungkus dalam representasi internal khusus bertipe `"datetime"`.

3. **Deterministik & Bebas Efek Samping (Pure & Immutable)**:
   Objek DateTime Jawalang bersifat *immutable* (`Object.freeze`). Semua manipulasi tanggal (aritmatika penambahan/pengurangan waktu) menghasilkan instansi DateTime baru tanpa memutasi objek sumber.

4. **Zona Waktu UTC sebagai Standar Utama**:
   Seluruh penghitungan komponen waktu, parsing, dan ekstraksi nilai menggunakan waktu universal terkoordinasi (UTC) untuk mencegah ambiguitas akibat perbedaan zona waktu mesin pengembang/pengguna, daylight saving time (DST), atau sistem operasi.

5. **Type Safety & Validasi Argumen Ketat**:
   Fungsi DateTime menolak tipe yang tidak sesuai (misal string atau number yang tidak diharapkan) dan menolak argumen yang kurang atau berlebih dengan pesan kesalahan khas Jawalang.

---

## 2. Runtime Representation (Representasi Runtime)

Objek DateTime direpresentasikan di tingkat internal sebagai objek JavaScript beku (*frozen*) dengan struktur berikut:

```javascript
const dateTimeInstance = Object.freeze({
    _isDateTime: true,
    timestamp: 1788652800000 // integer milidetik sejak Unix Epoch (UTC)
});
```

### Karakteristik Representasi:
- `_isDateTime: true`: Penanda tipe internal yang dikenali oleh `getType(val)` pada interpreter dan `helpers.js`.
- `timestamp`: Bilangan bulat (*integer*) milidetik UTC non-negatif/negatif yang valid.
- `jinis(w)`: Menghasilkan `"datetime"`.
- `formatValue(val)`: Jika dicetak secara langsung melalui `tulis w`, menghasilkan format deskriptif `<datetime 2026-09-06T00:00:00.000Z>`.
- `Object.freeze`: Mencegah manipulasi atau mutasi properti dari lingkungan runtime.

---

## 3. Timezone Model (Model Zona Waktu)

- **Default & Standar Tunggal: UTC**:
  Untuk rilis fondasi V1.4.0, seluruh komponen waktu (`taun`, `wulan`, `dina`, `jam`, `menit`, `detik`) diekstrak berdasarkan standar UTC (`getUTCFullYear()`, `getUTCMonth() + 1`, `getUTCDate()`, `getUTCHours()`, `getUTCMinutes()`, `getUTCSeconds()`).
- **Pencegahan Ketergantungan Mesin**:
  Dengan berpatokan pada UTC, pengujian dan kode Jawalang akan menghasilkan output yang 100% identik di server Linux, mesin Windows (WIB/WITA/WIT), macOS, maupun lingkungan CI/CD tanpa dipengaruhi konfigurasi timezone lokal mesin host.
- **Transparansi**:
  Dokumentasi resmi mencantumkan secara eksplisit bahwa penanggalan berbasis UTC.

---

## 4. Formatting Model (Model Pemformatan)

Fungsi `formatWektu(waktu, pola)` menerima objek DateTime dan pola format string.

Token pola format yang didukung secara deterministik:
| Token | Deskripsi | Rentang / Format Contoh |
|---|---|---|
| `YYYY` | 4-digit tahun | `2026`, `1995` |
| `MM` | 2-digit bulan (01–12) | `01`, `09`, `12` |
| `DD` | 2-digit hari (01–31) | `01`, `06`, `31` |
| `HH` | 2-digit jam 24-jam (00–23) | `00`, `14`, `23` |
| `mm` | 2-digit menit (00–59) | `00`, `30`, `59` |
| `ss` | 2-digit detik (00–59) | `00`, `45`, `59` |

Karakter pemisah bebas di luar token (misal `-`, `:`, `/`, spasi, teks biasa) dipertahankan secara persis.

---

## 5. Parsing Model (Model Penguraian)

Fungsi `parseWektu(teks)` mengurai string teks menjadi objek DateTime yang valid secara deterministik tanpa mengandalkan kebiasaan heuristik `new Date(string)` JavaScript yang ambigu.

Format yang didukung:
1. `YYYY-MM-DD` (contoh: `"2026-09-06"` $\to$ waktu diatur ke `00:00:00.000` UTC).
2. `YYYY-MM-DD HH:mm:ss` (contoh: `"2026-09-06 14:30:00"` $\to$ waktu UTC).
3. `YYYY-MM-DDTHH:mm:ss` (contoh: `"2026-09-06T14:30:00Z"` $\to$ waktu UTC).

### Aturan Kalender & Validasi:
- **Rentang Bulan**: Wajib $1 \le \text{wulan} \le 12$.
- **Kabisat (Leap Year)**:
  - Tahun kabisat: $(\text{taun} \pmod 4 = 0 \land \text{taun} \pmod{100} \neq 0) \lor (\text{taun} \pmod{400} = 0)$.
  - Februari memiliki 29 hari pada tahun kabisat (misal `2024-02-29` adalah valid).
  - Februari memiliki 28 hari pada tahun non-kabisat (misal `2025-02-29` melempar error).
- **Maksimum Hari per Bulan**:
  - 31 hari: Jan (1), Mar (3), Mei (5), Jul (7), Agu (8), Okt (10), Des (12).
  - 30 hari: Apr (4), Jun (6), Sep (9), Nov (11).
  - Penolakan tegas terhadap *rollover* otomatis (misal `"2026-02-30"` atau `"2026-04-31"` wajib melempar error).
- **Rentang Waktu**:
  - Jam: $0 \le \text{jam} \le 23$.
  - Menit: $0 \le \text{menit} \le 59$.
  - Detik: $0 \le \text{detik} \le 59$.

---

## 6. Error Model (Model Penanganan Galat)

Galat divalidasi dan dilempar secara konsisten menggunakan gaya bilingual Jawalang:
- **Jumlah Argumen Tidak Sesuai**:
  `Function built-in "taun" mbutuhake 1 argument, nanging diwenehi 0 (Function built-in "taun" membutuhkan 1 argument)`
- **Tipe Data Tidak Sesuai**:
  `timestamp() mung bisa digunakake kanggo datetime, nanging ditemu: "string" (timestamp() hanya bisa digunakan untuk datetime)`
- **Tanggal Tidak Valid / Format Salah**:
  `parseWektu() nemu format tanggal/wektu sing ora sah: "abc" (Format tanggal tidak valid, gunakake "YYYY-MM-DD" utawa "YYYY-MM-DD HH:mm:ss")`
- **Tanggal Di Luar Batas Kalender**:
  `Dina ora sah: 29 kanggo wulan 2 ing taun 2025 (Maksimal 28 dina)`
- Semua galat dapat ditangkap dengan aman menggunakan konstruksi blok native `coba { ... } tangkep (err) { ... }`.

---

## 7. Deterministic Testing (Strategi Pengujian Deterministik)

Fungsi `saiki()` yang mengembalikan waktu saat ini (*current time*) secara alami bersifat non-deterministik. Untuk menjamin stabilitas suite pengujian:
1. **Pengujian Nilai Deterministik**:
   Sebagian besar pengujian komponen, format, parsing, komparasi, aritmatika, kabisat, dan batas bulan menggunakan waktu tetap hasil `parseWektu(...)` atau `gaweWektu(...)` yang nilainya 100% deterministik.
2. **Pengujian Sifat `saiki()`**:
   - Memverifikasi bahwa `jinis(saiki()) === "datetime"`.
   - Memverifikasi bahwa `timestamp(saiki())` adalah integer angka wajar (> 1700000000000).
   - Memverifikasi bahwa dua pemanggilan berturut-turut `w1` dan `w2` menghasilkan `sadurunge(w1, w2) || padhaWektu(w1, w2)` (waktu tidak berjalan mundur).

---

## 8. Future Extension (Rencana Ekstensi Masa Depan)

Fitur-fitur tingkat lanjut berikut disimpan untuk fase pengembangan berikutnya setelah Phase 11:
- IANA Timezone Database (misal `"Asia/Jakarta"`, `"Europe/London"`).
- Formatting lokal berbasis budaya Jawa (penanggalan Pasaran: Pon, Wage, Kliwon, Legi, Pahing).
- Objek Durasi & Interval waktu.
- Penjadwalan berulang (*cron* atau timer).
