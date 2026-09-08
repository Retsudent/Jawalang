# Pananganan Kasalahan (Error Handling & Exceptions)

[← Sadurunge: Sistem Modul](modules.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Interactive REPL →](repl.md)

---

Jawalang nyedhiyakake sistem pananganan kasalahan (*exception handling*) lengkap mawa tembung kunci basa Jawa: `coba`, `tangkep`, lan `lempar`.

---

## 1. Konstruksi `coba` lan `tangkep`

Blok `coba` ngawasi kemungkinan anane kasalahan nalika eksekusi kode. Nalika kasalahan dumadi utawa eksepsi dibuwang, eksekusi langsung mlumpat menyang blok `tangkep`:

```jawa
coba {
    gawe data = 10 / 0 // Nuwuhake kasalahan pembagian nol
    tulis "Baris iki ora bakal dieksekusi"
} tangkep err {
    tulis "Kasalahan ditangkep: " + err
}
```

---

## 2. Mbuwang Eksepsi: `lempar`

Tembung kunci `lempar` digunakake kanggo mbuwang eksepsi sacara manual. Jawalang ngidinake mbuwang nilai saka sembarang jinis tipe data:

```jawa
guna verifikasiUmur(u) {
    yen u < 0 {
        lempar "Umur ora kena negatif"
    }
    yen u > 150 {
        lempar {"pesan": "Umur ora lumrah", "kode": 400}
    }
    bali bener
}

coba {
    verifikasiUmur(-5)
} tangkep e {
    tulis "Gagal: " + e
}
```

Jinis data sing bisa dibuwang nganggo `lempar`:
- **String**: `lempar "Pesen kesalahan"`
- **Number**: `lempar 404`
- **Boolean**: `lempar salah`
- **Null**: `lempar null`
- **Array**: `lempar [1, 2, 3]`
- **Object**: `lempar {"status": 500, "info": "Server error"}`

---

## 3. Propagasi Eksepsi (Call Stack Propagation)

Yen eksepsi dumadi ing njero fungsi lan ora ditangkep ing njero fungsi kasebut, eksepsi bakal otomatis mumbul (*propagate*) menyang pemanggil fungsi nganti nemu blok `coba ... tangkep`:

```jawa
guna tingkatJero() {
    lempar "Kasalahan saka jero"
}

guna tingkatTengah() {
    tingkatJero()
}

coba {
    tingkatTengah()
} tangkep err {
    tulis "Ditangkep ing tingkat ndhuwur: " + err
}
```

---

## 4. Rethrow (Mbuwang Maneh Eksepsi)

Eksepsi bisa ditangkep, diteliti utawa dicathet, banjur dibuwang maneh nggunakake `lempar`:

```jawa
coba {
    coba {
        lempar "Gagal database"
    } tangkep err1 {
        tulis "Log lokal: " + err1
        lempar err1 // mbuwang maneh menyang panangkep njaba
    }
} tangkep err2 {
    tulis "Panangkep global: " + err2
}
```

---

## 5. Isolasi Control Flow

Struktur kontrol liyane lumaku kanthi aman ing njero blok `coba`:
- **Nilai Bali (`bali`)**: Pranyatan `bali` ing njero `coba` bakal langsung mbalekake nilai saka fungsi kasebut tanpa kleru mlebu menyang blok `tangkep`.
- **Kontrol Perulangan (`mandheg` & `lanjut`)**: Pranyatan `mandheg` lan `lanjut` ing njero `coba` tetep ngontrol perulangan ing sakubenge kanthi bener.

---

[← Sadurunge: Sistem Modul](modules.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Interactive REPL →](repl.md)
