# Sistem Modul (Module System)

[← Sadurunge: Pemrograman Berorientasi Objek (OOP)](oop.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Penanganan Kesalahan →](error-handling.md)

---

Jawalang nyedhiyakake sistem pamisahan kode dadi pirang-pirang berkas modul mandiri mawa tembung kunci `impor`, `ekspor`, `saka`, lan `minangka`.

---

## 1. Ngekspor Simbol saka Modul (`ekspor`)

Sawijining modul bisa ngekspor fungsi, variabel, utawa struct supaya bisa digunakake dening berkas liya:

```jawa
// matematika.jawa
ekspor guna tambah(a, b) {
    bali a + b
}

ekspor gawe pi = 3.14

// Simbol iki privat (ora diekspor)
gawe rahasia = 12345
```

> [!IMPORTANT]
> `ekspor` mung bisa ditulis ing **top-level berkas**. Simbol sing ora mawa `ekspor` bersifat privat lan ora bisa diakses saka njaba modul.

---

## 2. Jinis-Jinis Impor

Jawalang nyedhiyakake telung cara ngimpor modul:

### A. Selective Import (`impor { ... } saka "..."`)
Ngimpor simbol tartamtu langsung menyang ruang lingkup lokal:

```jawa
// main.jawa
impor { tambah, pi } saka "./matematika.jawa"

tulis tambah(10, 20) // 30
tulis pi             // 3.14
```

### B. Import Alias (`minangka` ing Selective Import)
Ngganti jeneng simbol sing diimpor supaya ora tabrakan karo jeneng lokal:

```jawa
impor { tambah minangka jumlahkan, pi minangka angkaPi } saka "./matematika.jawa"

tulis jumlahkan(5, 15) // 20
tulis angkaPi          // 3.14
```

### C. Module Namespace (`impor "..." minangka <ns>`)
Ngimpor kabeh simbol ekspor menyang siji obyek namespace tanpa nyampur ruang lingkup lokal:

```jawa
impor "./matematika.jawa" minangka math

// Akses liwat dot notation
tulis math.tambah(10, 20) // 30
tulis math.pi             // 3.14

// Utawa liwat bracket syntax
tulis math["tambah"](10, 20) // 30
```

> [!NOTE]
> Namespace obyek bersifat **Read-Only**. Nyoba ngowahi properti namespace (kayata `math.pi = 4`) bakal ditolak kanthi kasalahan runtime.

---

## 3. Semantik & Aturan Desain Modul

1. **Top-Level Import Constraint**:
   Pranyatan `impor` mung diidinake ing tingkat paling dhuwur (top-level) berkas kanggo njamin grafik dependensi sing deterministik.
2. **Resolusi Path Relatif & Kanonikal**:
   Path modul diitung kanthi relatif marang folder berkas pangimpor (`path.dirname(currentFile)`). Ekstensi `.jawa` bisa ditulis eksplisit utawa diabaikan (`impor "./matematika"` otomatis ngrujuk menyang `./matematika.jawa`).
3. **Module Cache (Singleton Execution)**:
   Saben berkas modul mung dieksekusi sepisan nalika pisanan dimuat. Impor sabanjure njupuk saka cache memori (`LOADED`).
4. **Deteksi Ketergantungan Bunder (Circular Dependency Guard)**:
   Siklus impor (kayata `A -> B -> A`) dideteksi otomatis liwat status `LOADING` lan ngasilake pesen error sing cetha tanpa nyebabake *infinite loop*.
5. **Copy Binding Semantics**:
   Variabel sing diekspor disalin nilaine menyang modul pangimpor nalika modul dimuat (*copy binding*). Fungsi modul sing diekspor tansah njaga *lexical closure* modul asale.
6. **Chained Error Context**:
   Yen modul sing diimpor ngasilake kasalahan, pesen error dibungkus mawa konteks rantai modul:
   ```text
   [Modul "service.jawa"]: [Modul "db.jawa"]: Koneksi gagal
   ```

---

[← Sadurunge: Pemrograman Berorientasi Objek (OOP)](oop.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Penanganan Kesalahan →](error-handling.md)
