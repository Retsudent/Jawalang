# Sintaks & Tembung Kunci (Syntax & Keywords)

[← Sadurunge: Pandhuan Miwiti](getting-started.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Variabel & Tipe Data →](variables.md)

---

Jawalang nggunakake filosofi sintaksis basa Jawa kang cetha, ekspresif, lan gampang dimangerteni. Kode sumber Jawalang disimpen nganggo ekstensi `.jawa`.

---

## 1. Tembung Kunci (Keywords)

Ing ngisor iki dhaptar tembung kunci resmi (canonical keywords) sing kasedhiya ing Jawalang V1:

| Tembung Kunci | Padanan Basa Liyane | Katrangan | Tuladha (Contoh) |
| :--- | :--- | :--- | :--- |
| `tulis` | `print` / `console.log` | Nyithak teks utawa ekspresi menyang layar mawa baris anyar | `tulis "Halo Jagad!"` |
| `gawe` | `let` / `var` | Nggawe deklarasi variabel anyar ing ruang lingkup aktif | `gawe umur = 20` |
| `yen` | `if` | Percabangan kondisi (dieksekusi yen kondisi `bener`) | `yen umur >= 17 { ... }` |
| `liyane` | `else` | Blok alternatif nalika kabeh kondisi sadurunge `salah` | `liyane { ... }` |
| `liyane yen` | `else if` | Blok alternatif mawa kondisi tambahan | `liyane yen umur >= 12 { ... }` |
| `bener` | `true` | Nilai bebeneran boolean positif | `gawe aktif = bener` |
| `salah` | `false` | Nilai bebeneran boolean negatif | `gawe gagal = salah` |
| `null` | `null` | Nilai khusus sing makili kahanan *ora ana nilai* | `gawe data = null` |
| `lan` | `&&` / `and` | Operator logika konjungsi (AND) | `yen umur >= 17 lan nduweKTP { ... }` |
| `utawa` | `\|\|` / `or` | Operator logika disjungsi (OR) | `yen a utawa b { ... }` |
| `ora` | `!` / `not` | Operator logika negasi (NOT, unary) | `yen ora aktif { ... }` |
| `nalika` | `while` | Perulangan sajrone kondisi tetep `bener` | `nalika i <= 5 { ... }` |
| `kanggo` | `for` | Perulangan cacahe diitung adhedhasar rentang angka | `kanggo i = 1 nganti 10 { ... }` |
| `nganti` | `to` | Wates pungkasan ing perulangan `kanggo` | `kanggo i = 1 nganti 5 { ... }` |
| `langkah` | `step` | Ukuran owah-owahan nilai saben iterasi (opsional) | `kanggo i = 1 nganti 10 langkah 2 { ... }` |
| `saben` | `each` / `for-each` | Tandha mode perulangan elemen array | `kanggo saben x ing data { ... }` |
| `ing` | `in` / `of` | Tembung kunci penghubung koleksi ing foreach | `kanggo saben x ing data { ... }` |
| `mandheg` | `break` | Mandhegake lan metu saka perulangan saknalika | `yen i == 5 { mandheg }` |
| `lanjut` | `continue` | Nglompati sisa blok lan nerusake iterasi sabanjure | `yen i == 3 { lanjut }` |
| `guna` | `function` | Ndeklarasikake fungsi utawa metode anyar | `guna tambah(a, b) { ... }` |
| `bali` | `return` | Mbalekake nilai asil saka njero fungsi | `bali a + b` |
| `coba` | `try` | Blok panyoba kode sing bisa nuwuhake eksepsi | `coba { ... } tangkep err { ... }` |
| `tangkep` | `catch` | Blok panangkep eksepsi kanthi parameter error | `tangkep err { tulis err }` |
| `lempar` | `throw` | Mbuwang eksepsi utawa kasalahan runtime | `lempar "Data ora valid"` |
| `impor` | `import` | Ngimpor modul utawa simbol saka berkas liya | `impor "./math.jawa"` |
| `ekspor` | `export` | Ngekspor fungsi utawa variabel supaya bisa dienggo modul liya | `ekspor guna hitung() { ... }` |
| `saka` | `from` | Tembung kunci penunjuk path berkas ing selective import | `impor { tambah } saka "./math.jawa"` |
| `minangka` | `as` | Nyedhiyakake alias simbol utawa namespace modul | `impor "./math.jawa" minangka math` |
| `bentuk` | `class` / `struct` | Ndeklarasikake struktur data obyek (struct) | `bentuk Wong { ... }` |
| `wiwiti` | `constructor` | Konstruktor inisialisasi kanggo struct | `wiwiti(nama) { iki.nama = nama }` |
| `anyar` | `new` | Instansiasi objek anyar saka struct | `gawe w = anyar Wong("Budi")` |
| `iki` | `this` / `self` | Referensi marang instance aktif ing njero method | `iki.nama = nama` |
| `ngembangake` | `extends` | Pewarisan struct saka struct induk (single inheritance) | `bentuk Anak ngembangake Induk { ... }` |
| `super` | `super` | Referensi marang konstruktor utawa metode struct induk | `super(nama)` utawa `super.salam()` |

---

## 2. Aturan Dasar & Tata Nulis

### A. Case Sensitivity
Jawalang bersifat **case-sensitive**. Tembung kunci kudu ditulis nganggo aksara cilik (`gawe`, dudu `Gawe` utawa `GAWE`). Jeneng variabel, fungsi, lan struct uga mbedakake aksara gedhe lan cilik (`jeneng`, `Jeneng`, lan `JENENG` yaiku telung pengenal sing beda).

### B. Komentar (Comments)
Jawalang ndhukung komentar tunggal nggunakake tandha garis miring ganda `//`:
```jawa
// Iki komentar sak baris sing ora dieksekusi
gawe x = 10 // Komentar ing mburi baris kode
```
Komentar ing njero string literal (kayata `"// dudu komentar"`) ora dianggep komentar lan tetep dadi bagean teks string.

### C. Pemisah Baris & Titikkoma
Jawalang nggunakake pemisah baris (*newline*) kanggo mungkasi saben pranyatan (statement). Titikkoma (`;`) opsional lan umume ora prelu ditulis:
```jawa
gawe a = 10
gawe b = 20
tulis a + b
```

### D. Blok Kode Kurawal `{ ... }`
Kabeh blok kode (fungsi, percabangan `yen`, perulangan `nalika`/`kanggo`, blok `coba`/`tangkep`, lan struct `bentuk`) nggunakake pasangan kurung kurawal `{` lan `}`.

```jawa
yen bener {
    tulis "Iki ing njero blok"
}
```

---

[← Sadurunge: Pandhuan Miwiti](getting-started.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Variabel & Tipe Data →](variables.md)
