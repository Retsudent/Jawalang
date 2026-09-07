const path = require('path');
const fs = require("fs");

const testHigherOrderContent = `// test_higher_order.jawa — Comprehensive Higher-Order Function & Functional Collection V1 Test
tulis "=== TEST HIGHER-ORDER FUNCTION & FUNCTIONAL COLLECTION V1 ==="

// 1. Function Reference & Invocation via Variable
fungsi kuadrat(x) {
    bali x * x
}

gawe f = kuadrat
tulis "1. Function Reference:"
tulis f(5)

// 2. Function as Argument
fungsi jalankan(g, nilai) {
    bali g(nilai)
}

tulis "2. Function as Argument:"
tulis jalankan(kuadrat, 6)

// 3. Function as Return Value (Top-level dispatcher)
fungsi tambah(a, b) {
    bali a + b
}

fungsi ping(a, b) {
    bali a * b
}

fungsi pilihOperasi(jns) {
    yen jns == "tambah" {
        bali tambah
    }
    bali ping
}

gawe op1 = pilihOperasi("tambah")
gawe op2 = pilihOperasi("ping")
tulis "3. Function as Return Value:"
tulis op1(10, 20)
tulis op2(10, 20)

// 4. Function Identity / Equality
tulis "4. Function Identity:"
tulis f == kuadrat
tulis op1 == tambah
tulis op1 == ping

// 5. Lexical Scoping with Function Reference
gawe basis = 100
fungsi tambahBasis(n) {
    bali basis + n
}

fungsi ujiScope(fn) {
    gawe basis = 9999
    bali fn(5)
}

tulis "5. Lexical Scoping:"
tulis ujiScope(tambahBasis)

// 6. Function Type via jinis()
tulis "6. Function Type:"
tulis jinis(kuadrat)
tulis jinis(f)
tulis jinis(terapkan)

// 7. Function in Array & Chained Call
gawe daftarFungsi = [tambah, ping]
tulis "7. Function in Array:"
tulis daftarFungsi[0](3, 4)
tulis daftarFungsi[1](3, 4)

// 8. Function in Object & Chained Call
fungsi halo() {
    bali "Sugeng Rawuh"
}

gawe wadah = {
    "salam": halo,
    "itung": kuadrat
}
tulis "8. Function in Object:"
tulis wadah["salam"]()
tulis wadah["itung"](7)

// 9. Built-in Function Value
gawe fGedhe = gedhe
tulis "9. Built-in as Function Value:"
tulis fGedhe("jawascript")

// 10. terapkan() Basic & Mixed Types
fungsi dobel(n) {
    bali n * 2
}

fungsi cekTipe(x) {
    bali jinis(x)
}

tulis "10. terapkan() Basic & Mixed:"
tulis terapkan(dobel, [1, 2, 3, 4])
tulis terapkan(cekTipe, [1, "Jawa", bener, null, [1]])

// 11. terapkan() Empty Array
tulis "11. terapkan() Empty Array:"
tulis terapkan(dobel, [])

// 12. saring() Basic
fungsi luwihGedhe(n) {
    bali n > 3
}

tulis "12. saring() Basic:"
tulis saring(luwihGedhe, [1, 2, 3, 4, 5, 6])

// 13. saring() Empty Array
tulis "13. saring() Empty Array:"
tulis saring(luwihGedhe, [])

// 14. itung() Basic
tulis "14. itung() Basic:"
tulis itung(luwihGedhe, [1, 2, 3, 4, 5, 6, 7, 8])

// 15. itung() Empty Array
tulis "15. itung() Empty Array:"
tulis itung(luwihGedhe, [])

// 16. Callback with Object Element
fungsi jupukNama(o) {
    bali o["nama"]
}

gawe murid = [
    {"nama": "Budi", "biji": 80},
    {"nama": "Siti", "biji": 90},
    {"nama": "Dewi", "biji": 85}
]

tulis "16. Callback with Objects:"
tulis terapkan(jupukNama, murid)

// 17. Reference Semantics
fungsi tandaiLulus(o) {
    yen o["biji"] >= 85 {
        o["lulus"] = bener
    } liyane {
        o["lulus"] = salah
    }
    bali o
}

gawe hasilKelulusan = terapkan(tandaiLulus, murid)
tulis "17. Reference Semantics:"
tulis murid[0]["lulus"]
tulis murid[1]["lulus"]
tulis hasilKelulusan[0]["lulus"]

// 18. Module Exported Function as Callback & Lexical Scoping
impor "modules/functional_mod"

gawe faktor = 9999
tulis "18. Module Export Function & Lexical:"
tulis kaliFaktor(5)
tulis terapkan(kaliFaktor, [1, 2, 3])

// 19. Functional Built-in inside Module
tulis "19. Functional Built-in inside Module:"
tulis transformasiData(kuadrat, [2, 3, 4])

// 20. Foreach with Function Array
gawe aksiList = [kuadrat, dobel]
tulis "20. Foreach with Function Array:"
kanggo saben akt ing aksiList {
    tulis akt(5)
}

// 21. Parenthesized Call Edge-Case
tulis "21. Parenthesized Call:"
tulis (kuadrat)(9)

tulis "=== SELESAI TEST HIGHER-ORDER FUNCTION ==="
`;

fs.writeFileSync(path.join(__dirname, '../examples', 'test_higher_order.jawa'), testHigherOrderContent, "utf8");
console.log("Updated examples/test_higher_order.jawa");
