# Interactive REPL (Read-Eval-Print Loop)

[← Sadurunge: Pananganan Kasalahan](error-handling.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: CLI & Windows Tooling →](cli.md)

---

Jawalang nyedhiyakake antarmuka cangkang interaktif (*interactive shell / REPL*) kanggo nyoba kode, ekspresi, fungsi, lan struct kanthi cepet tanpa kudu nggawe berkas `.jawa`.

---

## 1. Miwiti REPL

Ketik salah siji printah ing ngisor iki ing terminal (PowerShell, CMD, Bash, utawa Zsh):

```bash
jawa
# utawa
jawa repl
# utawa liwat npx
npx jawa repl
```

Nalika mbukak, REPL bakal nampilake banner sambutan:
```text
Jawalang REPL v1.2.0
Ketik .bantu untuk bantuan.

jawa> 
```

---

## 2. Evaluasi Ekspresi & Preservasi Nilai

Ing njero REPL, ekspresi apa wae bisa langsung diketik lan dievaluasi tanpa prelu nulis tembung kunci `tulis`:

```text
jawa> 10 + 20
30

jawa> "Halo " + "Donya"
Halo Donya

jawa> [1, 2, 3]
[1, 2, 3]

jawa> {"nama": "Budi"}
{"nama": "Budi"}
```

Variabel, fungsi, lan struct sing dideklarasikake bakal tetep disimpen ing memori sajrone sesi REPL aktif:

```text
jawa> gawe x = 100
jawa> x + 25
125
jawa> x = x * 2
jawa> x
200
```

---

## 3. Input Pirang-pirang Baris (Multiline Input)

REPL kanthi otomatis ndeteksi blok kurawal `{`, kurung `(`, kurung kothak `[`, utawa tanda petik sing durung ditutup, banjur nampilake prompt sekunder `...> `:

### Deklarasi Fungsi Multiline:
```text
jawa> guna tambah(a, b) {
...>     bali a + b
...> }
jawa> tambah(15, 25)
40
```

### Deklarasi Struct Multiline:
```text
jawa> bentuk Titik {
...>     gawe x = 0
...>     gawe y = 0
...>     wiwiti(x, y) {
...>         iki.x = x
...>         iki.y = y
...>     }
...> }
jawa> gawe t = anyar Titik(10, 20)
jawa> t.x
10
```

---

## 4. Perintah Meta REPL

REPL ndhukung printah meta kanthi awalan titik (`.`):

| Perintah | Alternatif | Katrangan |
| :--- | :--- | :--- |
| `.bantu` | `.help` | Nampilake pitulung lan dhaptar printah meta |
| `.metu` | `.exit` | Metu saka sesi REPL kanthi resik |
| `.resik` | `.clear` | Ngresiki layar terminal konsol |

---

## 5. Pemulihan Kasalahan (Error Recovery)

Yen panjenengan ngetik sintaks sing salah utawa nuwuhake kasalahan runtime, sesi REPL **ora bakal mandheg utawa metu**. Sistem bakal nampilake pesen kesalahan mawa format Jawalang sing rapi lan langsung siyap nampa perintah sabanjure:

```text
jawa> 10 / 0
[Error Jawalang]: Pembagian karo angka nol ora diidinake.

jawa> gawe a = 
[Error Jawalang]: Syntax error: Sawise "gawe" kudu ana jeneng variabel

jawa> // Sesi tetep urip lan siyap:
jawa> 5 + 5
10
```

---

## 6. Mode Debug (`--debug`)

Kanggo ndeleng rincian *stack trace* internal Node.js nalika ana kasalahan, jalanake REPL mawa flag `--debug`:

```bash
jawa repl --debug
```

---

[← Sadurunge: Pananganan Kasalahan](error-handling.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: CLI & Windows Tooling →](cli.md)
