const fs = require('fs');
const path = require('path');

const PROJECT = 'D:\\Jawascript';

// 1. Positive test suite: examples/test_dot_notation_v4.jawa
const positiveCode = `// test_dot_notation_v4.jawa
// Positive test suite kanggo Jawascript Module/OOP V4
// Dot Notation (.) + OOP Enhancement

gawe lulus = 0
gawe gagal = 0

guna cek(deskripsi, aktual, ekspektasi) {
    yen aktual == ekspektasi {
        tulis "[PASS] " + deskripsi
        lulus = lulus + 1
    } liyane {
        tulis "[FAIL] " + deskripsi + " => dapat: " + aktual + ", ekspektasi: " + ekspektasi
        gagal = gagal + 1
    }
}

// ==========================================
// 1. DECIMAL NUMBERS (Lexer backward-compat)
// ==========================================
gawe des1 = 10.5
gawe des2 = 3.25
cek("1a. Decimal number assignment des1", des1, 10.5)
cek("1b. Decimal number addition", des1 + des2, 13.75)
cek("1c. Decimal with zero prefix", 0.75 + 0.25, 1)

// ==========================================
// 2. OBJECT DOT ACCESS & MUTATION
// ==========================================
gawe user = {
    "jeneng": "Budi",
    "umur": 20,
    "alamat": {
        "kutha": "Yogya",
        "kodePos": 55281
    }
}

// Read
cek("2a. Object dot read", user.jeneng, "Budi")
cek("2b. Object dot read number", user.umur, 20)
cek("2c. Object nested dot read", user.alamat.kutha, "Yogya")
cek("2d. Object nested dot read number", user.alamat.kodePos, 55281)

// Write
user.jeneng = "Siti"
user.umur = 25
user.alamat.kutha = "Solo"
cek("2e. Object dot write string", user.jeneng, "Siti")
cek("2f. Object dot write number", user.umur, 25)
cek("2g. Object nested dot write", user.alamat.kutha, "Solo")

// Dynamic property addition
user.pekerjaan = "Programmer"
cek("2h. Object dynamic prop add", user.pekerjaan, "Programmer")

// Bracket vs Dot equivalence
cek("2i. Bracket vs Dot equivalence", user["jeneng"] == user.jeneng, bener)

// ==========================================
// 3. STRUCT FIELD ACCESS & MUTATION
// ==========================================
bentuk Wong {
    gawe jeneng = ""
    gawe umur = 0

    guna wiwiti(n, u) {
        iki.jeneng = n
        iki.umur = u
    }

    guna salam() {
        bali "Halo " + iki.jeneng
    }

    guna tambahUmur(n) {
        iki.umur = iki.umur + n
        bali iki.umur
    }
}

gawe w1 = anyar Wong("Tejo", 30)
cek("3a. Struct field read jeneng", w1.jeneng, "Tejo")
cek("3b. Struct field read umur", w1.umur, 30)
cek("3c. Struct method invocation", w1.salam(), "Halo Tejo")

// Method invocation with mutation inside method
cek("3d. Struct method with internal mutation", w1.tambahUmur(5), 35)
cek("3e. Struct field after internal mutation", w1.umur, 35)

// External field mutation
w1.jeneng = "Slamet"
cek("3f. Struct external field mutation", w1.jeneng, "Slamet")
cek("3g. Struct method after external mutation", w1.salam(), "Halo Slamet")

// Instance isolation
gawe w2 = anyar Wong("Parto", 40)
cek("3h. Instance isolation w2", w2.jeneng, "Parto")
cek("3i. Instance isolation w1 unchanged", w1.jeneng, "Slamet")
cek("3j. w1 and w2 not equal", w1.jeneng == w2.jeneng, salah)

// ==========================================
// 4. BOUND METHOD FIRST-CLASS EXTRACTION
// ==========================================
gawe fnSalam = w1.salam
cek("4a. Extracted bound method", fnSalam(), "Halo Slamet")
gawe fnSalam2 = w2.salam
cek("4b. Extracted bound method w2", fnSalam2(), "Halo Parto")

// ==========================================
// 5. IKI INTERNAL METHOD CHAINING
// ==========================================
bentuk Petungan {
    gawe total = 0

    guna wiwiti(awal) {
        iki.total = awal
    }

    guna dobel() {
        bali iki.total * 2
    }

    guna dobelPlus(x) {
        bali iki.dobel() + x
    }
}

gawe calc = anyar Petungan(10)
cek("5a. iki.dobel() internal call", calc.dobel(), 20)
cek("5b. iki.dobelPlus(5) cross method call", calc.dobelPlus(5), 25)

// ==========================================
// 6. CHAINING & POSTFIX COMBINATIONS
// ==========================================
gawe wadah = {
    "angka": [10, 20, 30],
    "wong": anyar Wong("Subur", 50)
}
cek("6a. a.b[0] array in object", wadah.angka[1], 20)
wadah.angka[1] = 99
cek("6b. a.b[0] = val array update", wadah.angka[1], 99)

gawe dhaftarWong = [anyar Wong("A", 10), anyar Wong("B", 20)]
cek("6c. a[0].b dot on array element", dhaftarWong[0].jeneng, "A")
cek("6d. a[1].salam() method on array element", dhaftarWong[1].salam(), "Halo B")
dhaftarWong[0].jeneng = "Alpha"
cek("6e. a[0].b = val mutate array element field", dhaftarWong[0].jeneng, "Alpha")

gawe tim = {
    "anggota": [
        anyar Wong("Cahyo", 28)
    ]
}
cek("6f. a.b[0].c() complex chain", tim.anggota[0].salam(), "Halo Cahyo")

bentuk Gudang {
    gawe data = {}
    guna wiwiti() {
        iki.data = { "status": "aktif", "skor": 100 }
    }
    guna njupukData() {
        bali iki.data
    }
}
gawe g = anyar Gudang()
cek("6g. a.b().c method returns object dot read", g.njupukData().status, "aktif")
cek("6h. a.b().c method returns object dot read 2", g.njupukData().skor, 100)

// Parenthesized expression: (expr).member
cek("6i. (expr).member parenthesized target", (w1).salam(), "Halo Slamet")

// ==========================================
// 7. NAMESPACE IMPORT & DOT ACCESS
// ==========================================
impor "modules/mod_v3_namespace" minangka math

// Namespace property read
cek("7a. math.versi namespace property", math.versi, "3.0")
cek("7b. math.kuota namespace property", math.kuota, 100)

// Namespace function call
cek("7c. math.tambah(12, 8)", math.tambah(12, 8), 20)
cek("7d. math.kali(7, 6)", math.kali(7, 6), 42)

// anyar with dot notation target: anyar math.Wong(...)
gawe nsWong = anyar math.Wong("DotNamespace")
cek("7e. anyar math.Wong(\\"DotNamespace\\") salam()", nsWong.salam(), "Halo DotNamespace saka ns-001")
cek("7f. nsWong field read", nsWong.jeneng, "DotNamespace")

// First-class function from namespace
gawe fnTambah = math.tambah
cek("7g. First-class function from namespace", fnTambah(100, 200), 300)

// First-class struct from namespace
gawe StructWong = math.Wong
gawe nsWong2 = anyar StructWong("Second")
cek("7h. First-class struct from namespace", nsWong2.salam(), "Halo Second saka ns-001")

// Backward-compat bracket namespace access alongside dot
cek("7i. math[\\"tambah\\"] alongside math.tambah", math["tambah"](5, 5) == math.tambah(5, 5), bener)
gawe nsWong3 = anyar math["Wong"]("Bracket")
cek("7j. anyar math[\\"Wong\\"] alongside dot", nsWong3.salam(), "Halo Bracket saka ns-001")

// ==========================================
// RINGKASAN
// ==========================================
tulis "---------------------------------------------"
tulis "HASIL TEST V4 DOT NOTATION:"
tulis "Lulus: " + lulus
tulis "Gagal: " + gagal
tulis "---------------------------------------------"

yen gagal > 0 {
    lempar "Ana test sing gagal!"
}
`;

// 2. Negative test fixture: examples/test_dot_notation_v4_error.jawa
const negativeFixtureCode = `// test_dot_notation_v4_error.jawa
// Negative test fixture - kudu exit 1 (mutasi properti namespace nganggo dot)

impor "modules/mod_v3_namespace" minangka math

math.versi = "4.0"
`;

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_dot_notation_v4.jawa'), positiveCode, 'utf8');
console.log('Created examples/test_dot_notation_v4.jawa');

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_dot_notation_v4_error.jawa'), negativeFixtureCode, 'utf8');
console.log('Created examples/test_dot_notation_v4_error.jawa');
