const fs = require("fs");

// 1. examples/modules/functional_v2.jawa
const modContent = `// functional_v2.jawa — Module fixture kanggo test Collection & Functional Library V2
fungsi genapInternal(x) {
    bali x == 2 utawa x == 4 utawa x == 6 utawa x == 8
}

ekspor fungsi genap(x) {
    bali genapInternal(x)
}

ekspor fungsi luwihSakaLima(x) {
    bali x > 5
}
`;
fs.writeFileSync("D:\\Jawascript\\examples\\modules\\functional_v2.jawa", modContent, "utf8");
console.log("Created D:\\Jawascript\\examples\\modules\\functional_v2.jawa");

// 2. examples/test_collection_v2.jawa
const testPositiveContent = `// test_collection_v2.jawa — Comprehensive Collection & Functional Standard Library V2 Test
tulis "=== TEST COLLECTION & FUNCTIONAL STANDARD LIBRARY V2 ==="

// 1. gabung() Basic
gawe angka = [1, 2, 3]
tulis "1. gabung() Basic:"
tulis gabung(angka, ",")

gawe nama = ["Joko", "Budi", "Sari"]
tulis gabung(nama, " - ")

// 2. gabung() Empty Array
tulis "2. gabung() Empty:"
tulis gabung([], ",") == ""

// 3. gabung() Mixed & Nested Types
gawe campur = [1, "Jawa", bener, null, [10, 20]]
tulis "3. gabung() Mixed:"
tulis gabung(campur, " | ")

// 4. balik() Basic
gawe urutan = [1, 2, 3, 4]
gawe hasilBalik = balik(urutan)
tulis "4. balik() Basic:"
tulis hasilBalik
tulis urutan

// 5. balik() Reference Semantics & Mutation Check
gawe objA = {"nama": "Joko"}
gawe arrObj = [objA]
gawe balikObj = balik(arrObj)
balikObj[0]["nama"] = "Budi"
tulis "5. balik() Reference Semantics:"
tulis arrObj[0]["nama"]

// 6. balik() Empty Array
tulis "6. balik() Empty:"
tulis balik([])

// 7. urut() Basic Numeric Ascending
gawe angkaAcak = [5, 2, 8, 1, 3]
gawe hasilUrut = urut(angkaAcak)
tulis "7. urut() Basic:"
tulis hasilUrut
tulis angkaAcak

// 8. urut() Empty Array
tulis "8. urut() Empty:"
tulis urut([])

// 9. ana() True & False
fungsi luwihSakaLima(x) {
    bali x > 5
}

tulis "9. ana() Basic:"
tulis ana(luwihSakaLima, [1, 3, 5, 6])
tulis ana(luwihSakaLima, [1, 3, 5])

// 10. ana() Empty Array (salah)
tulis "10. ana() Empty:"
tulis ana(luwihSakaLima, [])

// 11. kabeh() True & False
fungsi positif(x) {
    bali x > 0
}

tulis "11. kabeh() Basic:"
tulis kabeh(positif, [1, 2, 3])
tulis kabeh(positif, [1, -2, 3])

// 12. kabeh() Empty Array (bener)
tulis "12. kabeh() Empty:"
tulis kabeh(positif, [])

// 13. golek() Found & Not Found
fungsi padhaTelu(x) {
    bali x == 3
}

tulis "13. golek() Basic:"
tulis golek(padhaTelu, [1, 2, 3, 4])
tulis golek(padhaTelu, [1, 2, 4]) == null

// 14. golek() Empty Array (null)
tulis "14. golek() Empty:"
tulis golek(padhaTelu, []) == null

// 15. golek() Reference Semantics
gawe users = [
    {"nama": "Joko", "aktif": salah},
    {"nama": "Budi", "aktif": bener}
]

fungsi cekAktif(u) {
    bali u["aktif"]
}

gawe userAktif = golek(cekAktif, users)
tulis "15. golek() Reference:"
tulis userAktif["nama"]
userAktif["aktif"] = salah
tulis users[1]["aktif"]

// 16. indeks() Found, Duplicate (First Match), Not Found
gawe dhaptarAngka = [10, 20, 30, 20]
tulis "16. indeks() Basic:"
tulis indeks(dhaptarAngka, 20)
tulis indeks(dhaptarAngka, 30)
tulis indeks(dhaptarAngka, 99)

// 17. indeks() with Object, String, Null, Empty
gawe dataObj = [users[0], users[1]]
tulis "17. indeks() Types:"
tulis indeks(dataObj, users[1])
tulis indeks(["a", "b", "c"], "b")
tulis indeks([1, null, 2], null)
tulis indeks([], 10)

// 18. Built-in Function as Callback
gawe teksList = ["jawa", "script"]
gawe fGedhe = gedhe
tulis "18. Built-in as Callback:"
tulis terapkan(fGedhe, teksList)

// 19. Function Returned from Function as Callback
fungsi gawaPredikat() {
    bali positif
}

tulis "19. Returned Function as Callback:"
tulis kabeh(gawaPredikat(), [10, 20, 30])

// 20. Module Integration
impor "modules/functional_v2"
tulis "20. Module Integration:"
tulis ana(genap, [1, 3, 5, 8])
tulis kabeh(genap, [2, 4, 6])
tulis golek(luwihSakaLima, [1, 3, 7, 9])

// 21. Foreach Integration
gawe kumpulan = [1, 2, 3, 4, 5, 6]
gawe disaring = saring(luwihSakaLima, kumpulan)
tulis "21. Foreach Integration:"
kanggo saben el ing disaring {
    tulis el
}

// 22. Functional Chaining (Composability)
gawe dataMentah = [9, 1, 4, 7, 3, 8]
gawe diurut = urut(dataMentah)
gawe dibalik = balik(diurut)
tulis "22. Functional Chaining:"
tulis dibalik
tulis gabung(dibalik, " > ")

tulis "=== SELESAI TEST COLLECTION V2 ==="
`;
fs.writeFileSync("D:\\Jawascript\\examples\\test_collection_v2.jawa", testPositiveContent, "utf8");
console.log("Created D:\\Jawascript\\examples\\test_collection_v2.jawa");

// 3. examples/test_collection_v2_error.jawa
const testNegativeContent = `// test_collection_v2_error.jawa — Test standalone error for collection v2 (urut mixed type)
gawe campur = [1, "dua", 3]
tulis urut(campur)
`;
fs.writeFileSync("D:\\Jawascript\\examples\\test_collection_v2_error.jawa", testNegativeContent, "utf8");
console.log("Created D:\\Jawascript\\examples\\test_collection_v2_error.jawa");
