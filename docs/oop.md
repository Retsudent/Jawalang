# Pemrograman Berorientasi Objek (OOP & Structs)

[← Sadurunge: Higher-Order Functions](higher-order-functions.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Sistem Modul →](modules.md)

---

Jawalang nyengkuyung paradigma Pemrograman Berorientasi Objek (OOP) lengkap adhedhasar struktur data obyek mawa tembung kunci: `bentuk`, `anyar`, `iki`, `wiwiti`, `ngembangake`, lan `super`.

---

## 1. Deklarasi Struct & Metode

Struktur data obyek dideklarasikake ing tingkat ndhuwur (*top-level*) nggunakake tembung kunci `bentuk`:

```jawa
bentuk Wong {
    // 1. Deklarasi Field kanthi nilai default
    gawe jeneng = "Anonim"
    gawe umur = 0

    // 2. Konstruktor Inisialisasi (wiwiti)
    wiwiti(j, u) {
        iki.jeneng = j
        iki.umur = u
    }

    // 3. Deklarasi Metode
    guna salam() {
        bali "Halo, jenengku " + iki.jeneng
    }

    guna tambahUmur(n) {
        iki.umur = iki.umur + n
        bali iki.umur
    }
}
```

---

## 2. Instansiasi & Akses Anggota

Obyek anyar digawe nggunakake tembung kunci `anyar`:

```jawa
gawe w = anyar Wong("Budi", 25)

// Akses field liwat dot notation
tulis w.jeneng // Budi
tulis w.umur   // 25

// Nyeluk metode
tulis w.salam() // Halo, jenengku Budi

w.tambahUmur(5)
tulis w.umur   // 30
```

### Konsep `iki` (Current Instance)
- `iki` ngrujuk marang instance aktif ing njero eksekusi metode utawa konstruktor.
- `iki` mung sah digunakake ing njero metode struct. Panggunaan `iki` ing sanjabane method bakal langsung ngasilake kasalahan runtime.
- `iki` ora kena di-assign sak wutuh (`iki = ...` ditolak), nanging propertine bisa diowahi (`iki.jeneng = ...`).

### Bound Method
Nalika metode dijupuk minangka referensi (`gawe fn = w.salam`), sistem otomatis ngiket receiver `iki` marang instance asline. Fungsi kasebut bisa dikirim minangka callback menyang Higher-Order Functions:

```jawa
gawe fn = w.salam
tulis fn() // Halo, jenengku Budi
```

---

## 3. Pewarisan Struct (Inheritance & Super)

Jawalang ndhukung pewarisan tunggal (*single inheritance*) mawa tembung kunci `ngembangake`:

```jawa
bentuk Orang {
    gawe nama = ""

    wiwiti(nama) {
        iki.nama = nama
    }

    guna salam() {
        tulis "Halo " + iki.nama
    }
}

bentuk Mahasiswa ngembangake Orang {
    gawe nim = ""

    wiwiti(nama, nim) {
        // Nyeluk konstruktor induk
        super(nama)
        iki.nim = nim
    }

    guna salam() {
        // Nyeluk metode induk
        super.salam()
        tulis "NIM: " + iki.nim
    }
}

gawe m = anyar Mahasiswa("Budi", "12345")
m.salam()
```

Output:
```text
Halo Budi
NIM: 12345
```

---

## 4. Konsep & Aturan Utama Pewarisan

1. **Pewarisan Field & Method**:
   Struct anak kanthi otomatis marisi kabeh field lan metode saka struct induk. Yen anak nduweni jeneng metode utawa field sing padha, anak bakal ngalahake implementasi induk (*method/field override*).
2. **Konstruktor Induk `super(...)`**:
   `super(...)` mung sah diceluk ing njero konstruktor `wiwiti` kanggo nglakokake inisialisasi struct induk.
3. **Metode Induk `super.metode()`**:
   Anak bisa nyeluk metode induk liwat `super.metode()` utawa `super["metode"]()`. Pemanggilan iki nggunakake **static dispatch** adhedhasar struct pamilik, saengga ing hierarki pirang-pirang tingkat (`A -> B -> C`), `super` ing `B` mesthi ngrujuk menyang `A`.
4. **Hierarki Multi-Tingkat**:
   Jawalang ndhukung rantai pewarisan bertingkat (`A -> B -> C -> D`).
5. **Proteksi Siklik (Circular Inheritance Guard)**:
   Pewarisan siklik (kayata `A ngembangake A` utawa `A -> B -> A`) dideteksi lan ditolak mawa error.
6. **Watesan**:
   Jawalang mung ndhukung pewarisan tunggal (dudu multiple inheritance utawa mixins).

---

[← Sadurunge: Higher-Order Functions](higher-order-functions.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Sistem Modul →](modules.md)
