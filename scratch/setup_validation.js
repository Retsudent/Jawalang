const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';
const EXT_DIR = path.join(ROOT, 'vscode-extension');
const SMOKE_DIR = path.join(ROOT, 'scratch', 'vscode-smoke');

// 1. .vscodeignore
const vscodeIgnoreContent = `.vscode/**
.vscode-test/**
tests/**
**/*.map
*.vsix
.git/**
.gitignore
`;
fs.writeFileSync(path.join(EXT_DIR, '.vscodeignore'), vscodeIgnoreContent, 'utf8');

// Ensure smoke directory exists
if (!fs.existsSync(SMOKE_DIR)) {
    fs.mkdirSync(SMOKE_DIR, { recursive: true });
}

// 2. hello.jawa
const helloContent = `gawe jeneng = "Jawalang"
tulis "Halo " + jeneng
`;
fs.writeFileSync(path.join(SMOKE_DIR, 'hello.jawa'), helloContent, 'utf8');

// 3. highlight.jawa (exhaustive syntax test for syntax highlighting)
const highlightContent = `// ==========================================
// JAWALANG V5 SYNTAX HIGHLIGHTING FIXTURE
// ==========================================

// 1. Variabel & Tipe Data
gawe angkaBulat = 42
gawe angkaDesimal = 3.14159
gawe teksString = "Halo Jagad saking Jawalang!\\nSugeng Rawuh."
gawe nilaiBener = bener
gawe nilaiSalah = salah
gawe nilaiKosong = null

// 2. Operator Aritmetika & Perbandingan & Logika
gawe tambah = 10 + 20 - 5 * 2 / 1
gawe cekLogika = (angkaBulat > 10) lan (nilaiBener utawa ora nilaiSalah)
gawe cekSama = (angkaBulat == 42) lan (angkaBulat != 0)

// 3. Array & Object
gawe daftarAngka = [1, 2, 3, 4, 5]
gawe user = {
    "jeneng": "Budi",
    "umur": 25,
    "aktif": bener
}
tulis user.jeneng
tulis daftarAngka[0]

// 4. Percabangan if - else
yen angkaBulat > 50 {
    tulis "Luwih gedhe saka 50"
} liyane {
    tulis "Kurang utawa padha karo 50"
}

// 5. Perulangan (while, for, foreach)
gawe counter = 0
nalika counter < 3 {
    counter = counter + 1
}

kanggo i = 0; i < 5; i = i + 1 {
    yen i == 2 {
        lanjut
    }
    yen i == 4 {
        mandheg
    }
}

saben item ing daftarAngka {
    tulis item
}

// 6. Fungsi (guna) & Return (bali)
guna petung(a, b) {
    bali a * b
}
gawe hasil = petung(6, 7)
tulis "Hasil petung: " + hasil

// 7. Struct, Konstruktor (wiwiti), Receiver (iki), & Instansiasi (anyar)
bentuk Makhluk {
    gawe jeneng = ""

    wiwiti(jeneng) {
        iki.jeneng = jeneng
    }

    guna obah() {
        bali iki.jeneng + " obah"
    }
}

// 8. Pewarisan Struct (ngembangake) & super
bentuk Wong ngembangake Makhluk {
    gawe umur = 0

    wiwiti(jeneng, umur) {
        super(jeneng)
        iki.umur = umur
    }

    guna obah() {
        bali super.obah() + " mlaku nganggo sikil"
    }
}

gawe tejo = anyar Wong("Tejo", 30)
tulis tejo.obah()

// 9. Exception Handling (coba, tangkep, lempar)
coba {
    yen tejo.umur < 0 {
        lempar "Umur ora valid"
    }
} tangkep err {
    tulis "Kena eksepsi: " + err
}

// 10. Modul (impor, ekspor, saka, minangka)
// impor "modul.jawa"
// impor { fungsiA } saka "modul.jawa"
// impor "modul.jawa" minangka ns
`;
fs.writeFileSync(path.join(SMOKE_DIR, 'highlight.jawa'), highlightContent, 'utf8');

// 4. Path with spaces: scratch/vscode-smoke/My Jawalang Project/hello world.jawa
const spaceDir = path.join(SMOKE_DIR, 'My Jawalang Project');
if (!fs.existsSync(spaceDir)) {
    fs.mkdirSync(spaceDir, { recursive: true });
}
const spaceContent = `tulis "PATH OK"
`;
fs.writeFileSync(path.join(spaceDir, 'hello world.jawa'), spaceContent, 'utf8');

// 5. error.jawa (valid runtime error)
const errorContent = `// Runtime error fixture
gawe x = 10
tulis y // Variabel "y" durung digawe
`;
fs.writeFileSync(path.join(SMOKE_DIR, 'error.jawa'), errorContent, 'utf8');

// 6. interactive.jawa (takon test)
const interactiveContent = `gawe jeneng = takon("Jenengmu: ")
tulis "Halo " + jeneng
`;
fs.writeFileSync(path.join(SMOKE_DIR, 'interactive.jawa'), interactiveContent, 'utf8');

console.log('Smoke test files and .vscodeignore generated successfully.');
