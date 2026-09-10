# Testing Architecture & Design Specification

Spesifikasi arsitektur fondasi pengujian (*Testing & Assertion Foundation*) Jawalang V1.4.0 (Phase 14).

---

## 1. Arsitektur Built-in (Standard Library Driven)

Pengujian di Jawalang V1.4.0 dirancang dengan mematuhi prinsip inti:
- **Tanpa Perubahan Grammar / Sintaksis Parser**: Tidak ada kata kunci baru seperti `assert` atau sintaksis khusus pada lexer/parser. Pengujian diperlakukan sebagai fungsi biasa (*first-class citizens*).
- **Struktur Modular Standard Library**: Logika assertion terisolasi di dalam `src/stdlib/testing.js`, didaftarkan ke `stdlibMetadata` dan `stdlibBuiltins` di `src/stdlib/index.js`, dan dihubungkan ke interpreter secara bersih.
- **First-Class Functions**: Semua fungsi assertion dapat disimpan ke dalam variabel atau dioperkan sebagai argumen ke *higher-order functions*:
  ```jawa
  gawe periksa = ujiPadha
  periksa(10, 10)
  ```

---

## 2. Alur Eksekusi & Batas Error (Assertion Flow & Error Boundary)

Setiap fungsi assertion mengikuti alur deterministik:

```
[Evaluasi Argumen & Validasi Tipe/Arity]
                     │
                     ▼
         [Pengecekan Kondisi / Predikat]
           ├── Benar ──> Mengembalikan bener (true) tanpa output konsol
           └── Salah ──> Melempar Error Jawalang (JawascriptErrorSignal / Error)
                               │
                               ▼
        [Dapat ditangkap dengan coba ... tangkep ATAU menghentikan eksekusi script]
```

### Isolasi Sinyal Kontrol Alur
Pada `ujiError(fungsi)`:
- Eksekusi callable diisolasi sedemikian rupa sehingga hanya menangkap *runtime error* (`JawascriptErrorSignal`, `Error`, lempar pengguna).
- Sinyal kontrol alur Jawalang (`ReturnSignal` dari `bali`, `BreakSignal` dari `mandheg`, `ContinueSignal` dari `lanjut`) **TIDAK** ditangkap dan diteruskan kembali ke interpreter.

---

## 3. Desain Bebas State Global (*Zero Global State*)

Pengujian builtin Jawalang sama sekali tidak menyimpan state global:
- **Tidak ada counter global**: Tidak ada variabel seperti `passed++`, `failed++` di memori runtime.
- **Kemandirian Thread/Proses**: Aman digunakan dalam pemanggilan rekursif bertingkat tinggi, impor modul melingkar, REPL berkelanjutan, maupun potensi eksekusi asynchronous di masa mendatang.

---

## 4. Semantik Tipe dan Nilai

- **Strict Type Validation**: Seluruh validator menggunakan `src/stdlib/helpers.js` (`requireArgRange`, `requireBoolean`, `requireString`, `requireCallable`).
- **No Implicit Coercion**: Kesetaraan `ujiPadha` mematuhi aturan ketat runtime `==`:
  - Perbandingan number dan string (`10 == "10"`) selalu `salah`.
  - Objek `datetime` dibandingkan berdasarkan timestamp UTC.
  - Array dan Objek menggunakan kesetaraan referensi memori (*reference equality*).
- **Informative Error Messages**: Menghasilkan pesan kesalahan yang jelas:
  ```text
  Assertion gagal: [Pesan Kustom Opsional]
  expected: <nilai yang diharapkan>
  actual: <nilai aktual yang diperoleh>
  ```

---

## 5. Hubungan dengan Test Runner Masa Depan (Future Runner Architecture)

Phase 14 secara spesifik membatasi cakupan pada **Assertion Foundation**:
1. **Assertion Primitives**: Dasar fundamental pengujian yang stabil dan dapat diandalkan oleh program Jawalang.
2. **Phase Berikutnya (Test Runner CLI)**:
   - Command line `jawa test`
   - Mekanisme discovery otomatis berkas `*.test.jawa`
   - Aggregator reporting (summary PASS/FAIL, durasi eksekusi)
   - Mocking dan fixture isolation

Dengan mendasarkan runner masa depan di atas fondasi assertion Phase 14 ini, arsitektur runner akan tetap bersih dan terpisah dari interpreter inti.
