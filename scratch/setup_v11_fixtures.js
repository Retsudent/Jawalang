const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');
const modulesDir = path.join(PROJECT, 'examples', 'modules');

// 1. all_builtins.jawa
fs.writeFileSync(path.join(modulesDir, 'all_builtins.jawa'), `// all_builtins.jawa
ekspor fungsi tesBuiltin() {
    gawe arr = [10, 20, 30]
    gawe lenArr = dawa(arr)
    gawe item0 = jupuk(arr, 0)
    nambah(arr, 40)
    busak(arr, 1)

    gawe teks = "Jawascript"
    gawe lenStr = dawa(teks)
    gawe potong = motong(teks, 0, 4)
    gawe ganti = ngganti(teks, "Jawa", "Basa")
    gawe kapital = gedhe(teks)
    gawe cilikTeks = cilik(teks)

    gawe obj = {"k": 100}
    gawe jns = jinis(obj)
    gawe k = kunci(obj)
    gawe v = nilai(obj)
    gawe adaK = duwe(obj, "k")

    bali {
        "lenArr": lenArr,
        "item0": item0,
        "arrAkhir": arr,
        "lenStr": lenStr,
        "potong": potong,
        "ganti": ganti,
        "kapital": kapital,
        "cilik": cilikTeks,
        "jinisObj": jns,
        "kunci": k,
        "nilai": v,
        "adaK": adaK
    }
}
`, 'utf8');

// 2. lexical_deep.jawa
fs.writeFileSync(path.join(modulesDir, 'lexical_deep.jawa'), `// lexical_deep.jawa
gawe varA = 10
gawe varB = 20

fungsi innerPrivate() {
    bali varA + varB
}

ekspor fungsi hitungTotal() {
    bali innerPrivate() * 2
}

ekspor fungsi setA(anyar) {
    varA = anyar
}

ekspor fungsi getA() {
    bali varA
}
`, 'utf8');

// 3. export_var_semantics.jawa
fs.writeFileSync(path.join(modulesDir, 'export_var_semantics.jawa'), `// export_var_semantics.jawa
ekspor gawe angkaAsli = 100

ekspor fungsi bacaAsli() {
    bali angkaAsli
}
`, 'utf8');

// 4. chain_err_leaf.jawa & chain_err_mid.jawa
fs.writeFileSync(path.join(modulesDir, 'chain_err_leaf.jawa'), `// chain_err_leaf.jawa
lempar "kesalahan saka chain_err_leaf"
`, 'utf8');

fs.writeFileSync(path.join(modulesDir, 'chain_err_mid.jawa'), `// chain_err_mid.jawa
impor "chain_err_leaf"
`, 'utf8');

// 5. examples/test_module_v11.jawa
const testV11Content = `// test_module_v11.jawa — Comprehensive V1.1 Hardening & Polish Test
tulis "=== TEST MODULE V1.1 HARDENING ==="

// 1. Export Variable Semantics (Value Copy Binding in Importer)
impor "modules/export_var_semantics"
tulis "1. Export Variable Semantics:"
tulis angkaAsli
angkaAsli = 999
tulis angkaAsli
tulis bacaAsli()

// 2. Lexical Closure Hardening (Deep Nested Private Helper + State Mutation)
impor "modules/lexical_deep"
tulis "2. Lexical Closure Hardening:"
tulis hitungTotal()
setA(50)
tulis hitungTotal()
tulis getA()

// 3. Lexical Shadowing (Importer variable does not shadow module variable)
gawe varA = 9999
gawe varB = 8888
tulis "3. Lexical Shadowing Isolation:"
tulis hitungTotal()

// 4. Canonical Path Hardening (Equivalent Import Paths)
impor "modules/counter"
tulis "4. Canonical Path Hardening:"
tulis tambahHitungan()
impor "./modules/counter"
tulis tambahHitungan()
impor "modules/counter.jawa"
tulis tambahHitungan()
impor "./modules/counter.jawa"
tulis getHitungan()

// 5. Diamond / Shared Dependency State Consistency
impor "modules/importer_a"
impor "modules/importer_b"
tulis "5. Shared Dependency:"
tulis getStatusA()
tulis getStatusB()

// 6. Built-in Availability in Module
impor "modules/all_builtins"
tulis "6. Built-in Functions in Module:"
gawe asilBuiltin = tesBuiltin()
tulis asilBuiltin["lenArr"]
tulis asilBuiltin["item0"]
tulis asilBuiltin["arrAkhir"]
tulis asilBuiltin["potong"]
tulis asilBuiltin["kapital"]
tulis asilBuiltin["adaK"]

// 7. Recursive Function in Module
impor "modules/recursion"
tulis "7. Module Recursion:"
tulis faktorial(6)

// 8. Dependency Chain (Relative Path: chain_a -> chain_b -> chain_c)
impor "modules/chain_a"
tulis "8. Module Dependency Chain:"
tulis nilaiA()

// 9. Nested Relative Module Path (modules/nested/helper)
impor "modules/nested/helper"
tulis "9. Nested Relative Module:"
tulis salam("V1.1")

tulis "=== SELESAI TEST MODULE V1.1 ==="
`;

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_module_v11.jawa'), testV11Content, 'utf8');
console.log('test_module_v11.jawa created');

// 6. examples/test_module_v11_error.jawa (Chain Error context testing)
const testV11ErrorContent = `// test_module_v11_error.jawa
// Nguji propagasi error chain ngliwati importer (main -> mid -> leaf)
impor "modules/chain_err_mid"
`;

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_module_v11_error.jawa'), testV11ErrorContent, 'utf8');
console.log('test_module_v11_error.jawa created');
