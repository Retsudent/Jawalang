# Fungsi & Ruang Lingkup (Functions & Scope)

[← Sadurunge: Struktur Kontrol](control-flow.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Struktur Data (Array & Object) →](data-structures.md)

---

Fungsi ing Jawalang yaiku warga kelas siji (*first-class citizens*). Panjenengan bisa ndeklarasikake fungsi, ngirim fungsi minangka parameter, mbalekake fungsi, sarta nyimpen fungsi ing njero variabel utawa struktur data.

---

## 1. Deklarasi & Pamanggilan Fungsi

Fungsi anyar dideklarasikake nggunakake tembung kunci `guna`:

```jawa
guna tambah(a, b) {
    bali a + b
}

gawe asil = tambah(10, 20)
tulis asil // 30
```

### Nilai Bali (`bali`)
- Gunakake `bali <ekspresi>` kanggo mbalekake nilai asil pametungan fungsi.
- Yen fungsi ora ngemot pranyatan `bali`, utawa nggunakake `bali` tanpa ekspresi, fungsi kasebut bakal kanthi otomatis mbalekake nilai `null`.

```jawa
guna salam(jeneng) {
    tulis "Sugeng rawuh, " + jeneng
    // tanpa bali -> otomatis ngasilake null
}

gawe res = salam("Budi")
tulis res // null
```

---

## 2. Ruang Lingkup Leksikal (Lexical Scoping)

Sistem ruang lingkup ing Jawalang netepi aturan **Lexical Scoping**:

1. **Global Scope**: Variabel sing digawe ing njaba fungsi kasedhiya ing saindenging program lan bisa diwaca saka njero fungsi yen ora ana variabel lokal sing padha jenenge.
2. **Local Scope**: Saben pemanggilan fungsi nggawe lingkungan lokal anyar. Parameter lan variabel `gawe` ing njero fungsi mung kasedhiya ing njero fungsi kasebut lan ora bakal bocor menyang njaba.
3. **Variable Shadowing**: Yen variabel lokal dideklarasikake nganggo jeneng sing padha karo variabel global, variabel lokal sing bakal dianggo ing njero fungsi kasebut tanpa ngowahi variabel global.
4. **Variable Lookup**: Panelusuran variabel lumaku kanthi urut saka ruang lingkup lokal (`Current`) $\to$ `Parent` $\to$ `Global`.
5. **Assignment Terdekat**: Perintah pangowahan variabel (`x = 20`) bakal nggoleki deklarasi variabel paling cedhak. Yen durung nate dideklarasikake nganggo `gawe`, sistem bakal mbuwang kasalahan runtime (ora nggawe variabel global implisit).
6. **Recursion Scope**: Saben panggilan rekursif nduweni lingkungan lokal anyar sing mandiri.
7. **Batas Rekursi (Stack Overflow Guard)**: Kanggo nyegah memori crash, Jawalang mbatesi jero panggilan rekursi maksimal **500 tumpukan (call stack)**.

### Tuladha Variable Shadowing:
```jawa
gawe x = 10 // Global

guna coba() {
    gawe x = 20 // Lokal (shadowing)
    tulis x     // 20
}

coba()
tulis x         // 10 (tetep aman)
```

---

## 3. First-Class Functions

Ing Jawalang, fungsi bisa diperlakokake kaya dene nilai data liyane:

### A. Nyimpen Fungsi ing Variabel
```jawa
guna ping(a, b) {
    bali a * b
}

gawe operasi = ping
tulis operasi(4, 5)   // 20
tulis jinis(operasi)  // "function"
```

### B. Fungsi minangka Parameter (Callback)
```jawa
guna jalanake(fn, nilai) {
    bali fn(nilai)
}

guna kuadrat(n) {
    bali n * n
}

tulis jalanake(kuadrat, 6) // 36
```

### C. Mbalekake Fungsi saka Fungsi
```jawa
guna pilihOperasi(jinisOperasi) {
    yen jinisOperasi == "tambah" {
        bali tambah
    } liyane {
        bali ping
    }
}

gawe op = pilihOperasi("tambah")
tulis op(10, 5) // 15
```

### D. Fungsi ing Struktur Data (Chained Invocations)
Fungsi bisa disimpen ing njero Array utawa Object banjur langsung diceluk:

```jawa
gawe dhaptarFungsi = [tambah, ping]
tulis dhaptarFungsi[0](10, 20) // 30
tulis dhaptarFungsi[1](10, 20) // 200

gawe kamus = {
    "hitung": kuadrat
}
tulis kamus["hitung"](8)       // 64
tulis kamus.hitung(8)          // 64 (mawa dot notation)
```

---

[← Sadurunge: Struktur Kontrol](control-flow.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Struktur Data (Array & Object) →](data-structures.md)
