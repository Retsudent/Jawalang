const fs = require('fs');
const path = require('path');

const targetDir = 'D:/Jawascript/examples';

const positiveTest = `// ============================================
// TEST FOREACH / ITERATION V1 - JAWASCRIPT
// ============================================

tulis "=== FOREACH TEST ==="

// 1. Basic array
gawe angka = [10, 20, 30]
kanggo saben x ing angka {
    tulis x
}

// 2. Empty array
gawe kosong = []
kanggo saben x ing kosong {
    tulis "ORA OLEH METU"
}
tulis "selesai kosong"

// 3. Mixed array & runtime types
gawe dataCampur = [
    10,
    "halo",
    bener,
    null,
    [1, 2],
    {"nama": "Budi"}
]

kanggo saben x ing dataCampur {
    tulis jinis(x)
}

// 4. Array of object
gawe siswa = [
    {
        "nama": "Budi",
        "umur": 20
    },
    {
        "nama": "Siti",
        "umur": 21
    }
]

kanggo saben s ing siswa {
    tulis s["nama"]
    tulis s["umur"]
}

// 5. Nested array
gawe dataMatriks = [
    [10, 20],
    [30, 40],
    [50, 60]
]

kanggo saben baris ing dataMatriks {
    tulis baris[0]
    tulis baris[1]
}

// 6. Nested foreach
gawe nestedForeach = [
    [10, 20],
    [30, 40]
]

kanggo saben baris ing nestedForeach {
    kanggo saben item ing baris {
        tulis item
    }
}

// 7. Outer iterator + inner iterator preservation
gawe dataPreserve = [
    ["A", "B"],
    ["C", "D"]
]

kanggo saben baris ing dataPreserve {
    tulis baris
    kanggo saben item ing baris {
        tulis item
    }
}

// 8. Iterator variable scope & last value
gawe valX = 100
gawe angkaList = [1, 2, 3]

kanggo saben valX ing angkaList {
    tulis valX
}

tulis valX

// 9. Reference semantics & in-place mutation
gawe siswaRef = [
    {
        "nama": "Budi"
    }
]

kanggo saben s ing siswaRef {
    s["nama"] = "Siti"
}

tulis siswaRef[0]["nama"]

gawe dataMutasi = [
    [1, 2],
    [3, 4]
]

kanggo saben baris ing dataMutasi {
    nambah(baris, 5)
}

tulis dataMutasi

// 10. Iteration + function & function call as iterable
fungsi tampilkan(data) {
    kanggo saben item ing data {
        tulis item
    }
}

gawe angkaFn = [10, 20, 30]
tampilkan(angkaFn)

fungsi dataGen() {
    bali [10, 20, 30]
}

kanggo saben x ing dataGen() {
    tulis x
}

// 11. Foreach + mandheg
gawe angkaBreak = [1, 2, 3, 4, 5]

kanggo saben x ing angkaBreak {
    yen x == 3 {
        mandheg
    }
    tulis x
}

// 12. Foreach + lanjut
gawe angkaContinue = [1, 2, 3, 4, 5]

kanggo saben x ing angkaContinue {
    yen x == 3 {
        lanjut
    }
    tulis x
}

// 13. Nested loop control with mandheg
gawe dataNestedBreak = [
    [1, 2, 3],
    [4, 5, 6]
]

kanggo saben baris ing dataNestedBreak {
    kanggo saben x ing baris {
        yen x == 2 {
            mandheg
        }
        tulis x
    }
    tulis "OUTER"
}

// 14. Mutating array during iteration (safe with snapshot)
gawe angkaMutate = [1, 2, 3]
kanggo saben x ing angkaMutate {
    nambah(angkaMutate, 4)
    tulis x
}

// 15. Foreach + Object built-in kunci() and nilai()
gawe userObj = {
    "nama": "Budi",
    "umur": 20
}

kanggo saben key ing kunci(userObj) {
    tulis key
}

kanggo saben val ing nilai(userObj) {
    tulis val
}

// 16. Foreach + dynamic object property
gawe dataDynamic = {
    "siswa": [
        {"nama": "Budi"},
        {"nama": "Siti"}
    ]
}

kanggo saben s ing dataDynamic["siswa"] {
    tulis s["nama"]
}

// 17. Foreach + conditional & logical
gawe angkaCond = [1, 2, 3, 4, 5]

kanggo saben x ing angkaCond {
    yen x > 1 lan x < 5 {
        tulis x
    }
}

// 18. Foreach + array built-in dawa()
gawe nestedDawa = [
    [1, 2],
    [3, 4]
]

kanggo saben row ing nestedDawa {
    tulis dawa(row)
}

// 19. Foreach + null element
gawe dataNullEl = [10, null, 20]

kanggo saben x ing dataNullEl {
    tulis jinis(x)
}

// 20. Foreach expression precedence
gawe dataPrec = [
    [10, 20],
    [30, 40]
]

kanggo saben row ing dataPrec {
    tulis row[0] + row[1]
}

// 21. Expected complex structure from prompt
gawe sekolahFinal = {
    "nama": "SMK Jawascript",
    "siswa": [
        {
            "nama": "Budi",
            "nilai": [80, 90, 95]
        },
        {
            "nama": "Siti",
            "nilai": [85, 92, 98]
        }
    ]
}

tulis sekolahFinal["nama"]

kanggo saben s ing sekolahFinal["siswa"] {
    tulis s["nama"]
    kanggo saben n ing s["nilai"] {
        tulis n
    }
}

tulis "=== SELESAI ==="
`;

const negativeTest = `// ============================================
// TEST FOREACH ERROR - JAWASCRIPT
// ============================================

gawe angka = 10

// Harap gagal: 10 bukan array
tulis "Coba foreach ing angka 10:"
kanggo saben x ing angka {
    tulis x
}
`;

fs.writeFileSync(path.join(targetDir, 'test_foreach.jawa'), positiveTest, 'utf8');
fs.writeFileSync(path.join(targetDir, 'test_foreach_error.jawa'), negativeTest, 'utf8');
console.log("Successfully created test_foreach.jawa and test_foreach_error.jawa");
