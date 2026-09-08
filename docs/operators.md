# Operator & Tingkatan Evaluasi (Operators & Precedence)

[← Sadurunge: Variabel & Tipe Data](variables.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Struktur Kontrol →](control-flow.md)

---

Jawalang nggunakake *Recursive Descent Expression Parser* kanthi hierarki precedence lengkap lan aturan evaluasi sing cetha.

---

## 1. Jinis-Jinis Operator

### A. Operator Aritmatika
| Operator | Makna | Tuladha | Asil |
| :---: | :--- | :--- | :--- |
| `+` | Penjumlahan angka utawa penggabungan string | `10 + 20`<br>`"Halo " + "Donya"` | `30`<br>`"Halo Donya"` |
| `-` | Pengurangan angka | `50 - 15` | `35` |
| `*` | Perkalian angka | `6 * 7` | `42` |
| `/` | Pembagian angka | `20 / 4` | `5` |

> [!NOTE]
> Pembagian karo angka nol (`x / 0`) bakal ditolak kanthi kasalahan runtime (*Division by zero*).

---

### B. Operator Unary
| Operator | Makna | Tuladha | Asil |
| :---: | :--- | :--- | :--- |
| `-` | Negasi angka (minus) | `-10` | `-10` |
| `+` | Unary positif | `+5` | `5` |
| `ora` | Negasi logika boolean (NOT) | `ora bener`<br>`ora salah` | `salah`<br>`bener` |

---

### C. Operator Perbandingan (Relational)
Kabeh operator perbandingan mbalekake nilai boolean (`bener` utawa `salah`):

| Operator | Makna | Tuladha | Asil |
| :---: | :--- | :--- | :---: |
| `==` | Padha karo (*equality*) | `10 == 10`<br>`"a" == "b"` | `bener`<br>`salah` |
| `!=` | Ora padha karo (*inequality*) | `10 != 20` | `bener` |
| `>` | Luwih gedhe tinimbang | `15 > 10` | `bener` |
| `<` | Luwih cilik tinimbang | `5 < 10` | `bener` |
| `>=` | Luwih gedhe utawa padha | `10 >= 10` | `bener` |
| `<=` | Luwih cilik utawa padha | `7 <= 10` | `bener` |

---

### D. Operator Logika
| Operator | Makna | Tuladha | Asil |
| :---: | :--- | :--- | :---: |
| `lan` | Konjungsi logika (AND) | `bener lan bener`<br>`bener lan salah` | `bener`<br>`salah` |
| `utawa` | Disjungsi logika (OR) | `bener utawa salah`<br>`salah utawa salah` | `bener`<br>`salah` |
| `ora` | Negasi logika (NOT) | `ora bener` | `salah` |

#### Short-Circuit Evaluation
- Ing ekspresi `A lan B`, yen `A` ngasilake `salah`, nilai `B` ora bakal dievaluasi amarga asil akhire mesthi `salah`.
- Ing ekspresi `A utawa B`, yen `A` ngasilake `bener`, nilai `B` ora bakal dievaluasi amarga asil akhire mesthi `bener`.

---

## 2. Tingkatan Operator (Operator Precedence)

Nalika sawijining ekspresi ngemot pirang-pirang operator tanpa tanda kurung, Jawalang bakal ngevaluasi adhedhasar tingkatan prioritas ing ngisor iki:

| Tingkat (Prioritas) | Operator | Katrangan |
| :---: | :--- | :--- |
| **1 (Paling dhuwur)** | `( )`, `fn()`, `arr[i]`, `obj.prop` | Tanda kurung prioritas, panggilan fungsi/metode, indeks array/bracket, lan dot notation |
| **2** | `ora`, `-`, `+` (unary) | Negasi logika (`ora`), minus angka unary (`-`) |
| **3** | `*`, `/` | Perkalian lan pembagian |
| **4** | `+`, `-` | Penjumlahan lan pengurangan |
| **5** | `>`, `<`, `>=`, `<=`, `==`, `!=` | Perbandingan nilai |
| **6** | `lan` | Logika AND (luwih dhuwur tinimbang `utawa`) |
| **7 (Paling endhek)** | `utawa` | Logika OR |

---

## 3. Tuladha Evaluasi Precedence

```jawa
// Perkalian (*) luwih dhuwur tinimbang penjumlahan (+)
gawe a = 2 + 3 * 4
tulis a // 14 (dudu 20)

// Tanda kurung ngalahake prioritas standar
gawe b = (2 + 3) * 4
tulis b // 20

// 'lan' luwih dhuwur tinimbang 'utawa'
gawe c = salah lan salah utawa bener
tulis c // bener, amarga (salah lan salah) -> salah, banjur (salah utawa bener) -> bener
```

---

[← Sadurunge: Variabel & Tipe Data](variables.md) | [Indeks Dokumentasi](README.md) | [Sabanjure: Struktur Kontrol →](control-flow.md)
