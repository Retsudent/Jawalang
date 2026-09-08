# Struktur Kontrol (Control Flow)

[← Sadurunge: Operator & Precedence](operators.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Fungsi & Ruang Lingkup →](functions.md)

---

Jawalang nyedhiyakake struktur kontrol aliran eksekusi program awujud percabangan kondisi lan perulangan mawa tembung kunci basa Jawa.

---

## 1. Percabangan Kondisi (Conditionals)

### A. Pranyatan `yen` (if)
Blok kode ing njero `yen` mung dieksekusi nalika ekspresi kondisi ngasilake `bener`:

```jawa
gawe nilai = 85

yen nilai >= 75 {
    tulis "Sampeyan lulus!"
}
```

### B. Pranyatan `liyane` (else)
Blok `liyane` bakal lumaku yen kondisi `yen` sadurunge ngasilake `salah`:

```jawa
gawe umur = 15

yen umur >= 17 {
    tulis "Wis nduwe KTP"
} liyane {
    tulis "Durung nduwe KTP"
}
```

### C. Percabangan Bertingkat `liyane yen` (else if)
Kanggo nguji pirang-pirang kondisi kanthi urut:

```jawa
gawe skor = 82

yen skor >= 90 {
    tulis "Biji: A"
} liyane yen skor >= 80 {
    tulis "Biji: B"
} liyane yen skor >= 70 {
    tulis "Biji: C"
} liyane {
    tulis "Biji: D"
}
```

---

## 2. Perulangan (Loops)

### A. Perulangan `nalika` (While Loop)
Mbaleni blok kode sajrone kondisi evaluasi tetep `bener`:

```jawa
gawe i = 1

nalika i <= 5 {
    tulis "Iterasi kaping: " + i
    i = i + 1
}
```

### B. Perulangan `kanggo` (For Loop mawa Rentang Angka)
Perulangan kanthi variabel pencacah saka wates wiwitan nganti wates pungkasan:

```jawa
// Urut munggah standar (langkah 1 otomatis)
kanggo i = 1 nganti 5 {
    tulis i // 1, 2, 3, 4, 5
}

// Mawa langkah (step) tartamtu
kanggo i = 0 nganti 10 langkah 2 {
    tulis i // 0, 2, 4, 6, 8, 10
}
```

### C. Perulangan `kanggo saben ... ing` (Foreach Loop)
Perulangan khusus kanggo ngiterasi kabeh elemen ing jero struktur data **Array**:

```jawa
gawe woh = ["Pelem", "Jeruk", "Gedhang"]

kanggo saben x ing woh {
    tulis "Woh: " + x
}
```

> [!NOTE]
> Kanggo ngiterasi pasangan obyek (key/value), gunakake fungsi bawaan `kunci(obj)` utawa `nilai(obj)` bebarengan karo `kanggo saben`:
> ```jawa
> gawe data = {"nama": "Budi", "kutha": "Solo"}
> kanggo saben k ing kunci(data) {
>     tulis k + " -> " + data[k]
> }
> ```

---

## 3. Kontrol Perulangan (`mandheg` & `lanjut`)

- **`mandheg` (break)**: Langsung ngendhegake perulangan lan metu saka blok loop paling cedhak.
- **`lanjut` (continue)**: Nglompati sisa kode ing iterasi aktif lan langsung nerusake menyang iterasi sabanjure.

```jawa
kanggo i = 1 nganti 10 {
    yen i == 3 {
        lanjut // lompati angka 3
    }
    yen i == 7 {
        mandheg // mandheg nalika tekan angka 7
    }
    tulis i
}
// Output: 1, 2, 4, 5, 6
```

---

## 4. Aturan Keamanan & Ruang Lingkup

1. **Wates Maksimal Iterasi (Infinite Loop Guard)**:
   Kanggo nyegah komputer hang amarga *infinite loop*, Jawalang ngetrapake wates maksimal **100.000 iterasi** kanggo kabeh jinis perulangan. Yen ngluwihi, runtime bakal mbuwang error kanthi cetha.
2. **Ruang Lingkup Blok (Block Scoping Rule)**:
   Ing Jawalang, blok percabangan (`yen`) lan perulangan (`nalika`, `kanggo`) **ora nggawe ruang lingkup (scope) anyar**. Variabel sing digawe nganggo `gawe` ing njero blok bakal tetep kasedhiya ing lingkungan fungsi utawa global ing sakubenge.

---

[← Sadurunge: Operator & Precedence](operators.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Fungsi & Ruang Lingkup →](functions.md)
