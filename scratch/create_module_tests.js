const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const modulesDir = path.join(PROJECT, 'examples', 'modules');

// recursion.jawa
fs.writeFileSync(path.join(modulesDir, 'recursion.jawa'), `// recursion.jawa
ekspor fungsi faktorial(n) {
    yen n <= 1 {
        bali 1
    }
    bali n * faktorial(n - 1)
}
`, 'utf8');

// complex_data.jawa
fs.writeFileSync(path.join(modulesDir, 'complex_data.jawa'), `// complex_data.jawa
ekspor gawe daftar = [10, 20, 30]
ekspor gawe kamus = {"nama": "Budi", "umur": 20}

ekspor fungsi hitungDawa(arr) {
    bali dawa(arr)
}

ekspor fungsi njupukKunci(obj) {
    bali kunci(obj)
}
`, 'utf8');

// err_func.jawa
fs.writeFileSync(path.join(modulesDir, 'err_func.jawa'), `// err_func.jawa
ekspor fungsi mbalangSalah() {
    lempar "kesalahan fungsi modul"
}
`, 'utf8');

// internal_helper.jawa
fs.writeFileSync(path.join(modulesDir, 'internal_helper.jawa'), `// internal_helper.jawa
fungsi rahasiaTambah(a, b) {
    bali a + b
}

ekspor fungsi publikTambah(a, b) {
    bali rahasiaTambah(a, b) + 100
}
`, 'utf8');

// Create examples/test_module.jawa
const testModuleContent = `// test_module.jawa — Comprehensive Positive Test Suite for Module/Import System V1
tulis "=== TEST MODULE / IMPORT SYSTEM V1 ==="

// 1. Basic Import & Exported Function & Exported Variable
impor "modules/matematika"
tulis "1. Basic Import:"
tulis tambah(10, 20)
tulis ping(5, 4)
tulis versi

// 2. Exported Constants
impor "modules/konstanta"
tulis "2. Exported Constants:"
tulis pi
tulis e

// 3. Private Variable Isolation & Accessor
impor "modules/private"
tulis "3. Private Isolation:"
tulis publik
tulis getRahasia()

// 4. Module-Relative Path & Chain of Dependencies (chain_a -> chain_b -> chain_c)
impor "modules/chain_a"
tulis "4. Dependency Chain:"
tulis nilaiA()

// 5. Nested Module Path
impor "modules/nested/helper"
tulis "5. Nested Module:"
tulis salam("Jawascript")

// 6. Multiple Imports in Same File
impor "modules/helper"
tulis "6. Multiple Imports:"
tulis gabung("Halo", "Dunia")

// 7. Duplicate Import (idempotent, no re-executing)
impor "modules/matematika"
tulis "7. Duplicate Import:"
tulis tambah(100, 200)

// 8. Shared Dependency & Module Cache (common imported via importer_a and importer_b)
impor "modules/importer_a"
impor "modules/importer_b"
tulis "8. Shared Dependency:"
tulis getStatusA()
tulis getStatusB()

// 9. Module State across Calls
impor "modules/counter"
tulis "9. Module State:"
tulis tambahHitungan()
tulis tambahHitungan()
tulis getHitungan()

// 10. Lexical Scope (internal function in module called by exported function)
impor "modules/internal_helper"
tulis "10. Internal Helper Lexical Scope:"
tulis publikTambah(5, 5)

// 11. Recursion in Module Function
impor "modules/recursion"
tulis "11. Recursion in Module:"
tulis faktorial(5)

// 12. Built-ins and Complex Data (Array & Object) from Module
impor "modules/complex_data"
tulis "12. Complex Data & Built-ins:"
tulis daftar
tulis kamus["nama"]
tulis hitungDawa(daftar)
tulis njupukKunci(kamus)

// 13. Exception inside Exported Function caught by Try/Catch
impor "modules/err_func"
tulis "13. Exception Handling with Module Function:"
coba {
    mbalangSalah()
} tangkep err {
    tulis "Kasil ditangkep: " + err
}

// 14. Extension .jawa explicit in import path
impor "modules/helper.jawa"
tulis "14. Explicit .jawa extension:"
tulis gabung("A", "B")

tulis "=== SELESAI TEST MODULE ==="
`;

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_module.jawa'), testModuleContent, 'utf8');
console.log('test_module.jawa created');
