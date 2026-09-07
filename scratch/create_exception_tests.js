const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../examples');

const positiveTest = `// ============================================
// TEST ERROR HANDLING / EXCEPTION SYSTEM V1 - JAWASCRIPT
// ============================================

tulis "=== EXCEPTION TEST ==="

// 1. Basic throw / catch
coba {
    lempar "Data ora valid"
} tangkep err {
    tulis err
}

// 2. Runtime error catch
gawe arr = [10, 20]
coba {
    tulis arr[100]
} tangkep err {
    tulis "Runtime error ditangkap"
}

// 3. Throw string
coba {
    lempar "Pesen string"
} tangkep err {
    tulis err
    tulis jinis(err)
}

// 4. Throw number
coba {
    lempar 404
} tangkep err {
    tulis err
    tulis jinis(err)
}

// 5. Throw boolean
coba {
    lempar bener
} tangkep err {
    tulis err
    tulis jinis(err)
}

// 6. Throw null
coba {
    lempar null
} tangkep err {
    tulis err
    tulis jinis(err)
}

// 7. Throw array
coba {
    lempar [1, 2, 3]
} tangkep err {
    tulis err
    tulis jinis(err)
}

// 8. Throw object
coba {
    lempar {"pesan": "Server error", "kode": 500}
} tangkep err {
    tulis err["pesan"]
    tulis err["kode"]
    tulis jinis(err)
}

// 9. Nested try / catch
coba {
    coba {
        lempar "inner error"
    } tangkep err {
        tulis err
    }
} tangkep err {
    tulis "outer ora oleh mlaku"
}

// 10. Rethrow
coba {
    coba {
        lempar "error awal"
    } tangkep err {
        tulis err
        lempar err
    }
} tangkep err {
    tulis "outer nangkep rethrow:"
    tulis err
}

// 11. Function propagation
fungsi gagal() {
    lempar "fungsi gagal"
}

coba {
    gagal()
} tangkep err {
    tulis err
}

// 12. Function handler
fungsi tangani(e) {
    tulis "Ditangani dening fungsi:"
    tulis e
}

coba {
    lempar "error fungsi handler"
} tangkep err {
    tangani(err)
}

// 13. Return + try / catch
fungsi testBali() {
    coba {
        bali 99
    } tangkep err {
        tulis "ORA OLEH METU RETURN"
    }
}

tulis testBali()

// 14. Foreach + try / catch
gawe angkaList = [1, 2, 3]
kanggo saben x ing angkaList {
    coba {
        yen x == 2 {
            lempar "salah ing 2"
        }
        tulis x
    } tangkep err {
        tulis err
    }
}

// 15. Mandheg + try / catch
kanggo saben y ing [1, 2, 3, 4] {
    coba {
        yen y == 3 {
            mandheg
        }
        tulis y
    } tangkep err {
        tulis "ORA OLEH METU MANDHEG"
    }
}

// 16. Lanjut + try / catch
kanggo saben z ing [1, 2, 3] {
    coba {
        yen z == 2 {
            lanjut
        }
        tulis z
    } tangkep err {
        tulis "ORA OLEH METU LANJUT"
    }
}

// 17. Object error
gawe dataObj = {
    "nama": "Budi"
}

coba {
    tulis dataObj["umur"]["kota"]
} tangkep err {
    tulis "Object error ditangkap"
}

// 18. Array error
coba {
    gawe d = [1, 2]
    d[-1] = 99
} tangkep err {
    tulis "Array error ditangkap"
}

// 19. Built-in error
coba {
    dawa(null)
} tangkep err {
    tulis "Builtin error ditangkap"
}

// 20. Multiple handled errors
coba {
    lempar "error 1"
} tangkep err {
    tulis err
}

tulis "tengah"

coba {
    lempar "error 2"
} tangkep err {
    tulis err
}

// 21. Handler error (error ing jero tangkep)
coba {
    coba {
        lempar "error primer"
    } tangkep err {
        tulis err
        lempar "error sekunder"
    }
} tangkep err {
    tulis err
}

// 22. Conditional integration
coba {
    yen bener {
        lempar "error saka yen"
    }
} tangkep err {
    tulis err
}

// 23. Logical expression integration
gawe a = bener
gawe b = bener

coba {
    yen a lan b {
        lempar "error saka logika"
    }
} tangkep err {
    tulis err
}

// 24. Variable scope & lifetime verification
gawe varAwal = 100
coba {
    varAwal = 200
} tangkep err {
    tulis err
}
tulis varAwal

tulis "=== SELESAI ==="
`;

const negativeTest = `// ============================================
// TEST EXCEPTION ERROR - JAWASCRIPT
// ============================================

// Harap gagal: lempar tanpa ekspresi
tulis "Coba lempar tanpa ekspresi:"
lempar
`;

fs.writeFileSync(path.join(targetDir, 'test_exception.jawa'), positiveTest, 'utf8');
fs.writeFileSync(path.join(targetDir, 'test_exception_error.jawa'), negativeTest, 'utf8');
console.log("Successfully created test_exception.jawa and test_exception_error.jawa");
