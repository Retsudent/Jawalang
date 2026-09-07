const fs = require('fs');
const path = require('path');

const PROJECT = 'D:\\Jawascript';

// 1. Helper module: examples/modules/mod_v5_parent.jawa
const modParentCode = `// mod_v5_parent.jawa
// Parent struct module kanggo cross-module inheritance

ekspor bentuk Makhluk {
    gawe bernafas = bener
    gawe jeneng = "Makhluk"

    wiwiti(j) {
        iki["jeneng"] = j
    }

    guna status() {
        bali iki["jeneng"] + " bisa ambegan"
    }

    guna info() {
        bali "Info: " + iki["status"]()
    }
}

ekspor bentuk MakhlukPolos {
    gawe jinis = "Polos"
}
`;

// 2. Positive test suite: examples/test_inheritance_v5.jawa
const positiveCode = `// test_inheritance_v5.jawa
// Positive test suite kanggo Jawalang V5 — Inheritance & Super

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
// 1 & 2. BASIC INHERITANCE & INHERITED FIELD
// ==========================================
bentuk KucingInduk {
    gawe jeneng = "Kucing"
    gawe sikil = 4
}

bentuk Anggora ngembangake KucingInduk {
    gawe wulu = "dawa"
}

gawe a = anyar Anggora()
cek("1. Inherited field jeneng", a.jeneng, "Kucing")
cek("2. Inherited field sikil", a.sikil, 4)
cek("3. Child own field wulu", a.wulu, "dawa")

// ==========================================
// 3. INHERITED METHOD
// ==========================================
bentuk Kewan {
    gawe swara = "Unine kewan"

    guna ngomong() {
        bali iki.swara
    }
}

bentuk Asu ngembangake Kewan {
    gawe ras = "Bulldog"
}

gawe d = anyar Asu()
cek("4. Inherited method call", d.ngomong(), "Unine kewan")

// ==========================================
// 4. FIELD OVERRIDE
// ==========================================
bentuk Wong {
    gawe jinis = "Wong"
    gawe umur = 0
}

bentuk Mahasiswa ngembangake Wong {
    gawe jinis = "Mahasiswa"
    gawe nim = "12345"
}

gawe m = anyar Mahasiswa()
cek("5. Field override child wins", m.jinis, "Mahasiswa")
cek("6. Non-overridden field inherited", m.umur, 0)
cek("7. Child own field exists", m.nim, "12345")

// ==========================================
// 5. METHOD OVERRIDE
// ==========================================
bentuk Manuk {
    guna muni() {
        bali "Kicau umum"
    }
}

bentuk Beo ngembangake Manuk {
    guna muni() {
        bali "Halo bos!"
    }
}

gawe b = anyar Beo()
cek("8. Method override child wins", b.muni(), "Halo bos!")

// ==========================================
// 6 & 7 & 8. SUPER CONSTRUCTOR & SUPER METHOD (. & [])
// ==========================================
bentuk Kendharaan {
    gawe rodha = 0
    gawe merk = ""

    wiwiti(r, m) {
        iki.rodha = r
        iki.merk = m
    }

    guna deskripsi() {
        bali iki.merk + " duwe rodha " + iki.rodha
    }
}

bentuk Mobil ngembangake Kendharaan {
    gawe pintu = 4

    wiwiti(m, p) {
        super(4, m)
        iki.pintu = p
    }

    guna deskripsi() {
        bali super.deskripsi() + ", pintu " + iki.pintu
    }

    guna deskripsiBracket() {
        bali super["deskripsi"]() + ", pintu " + iki.pintu
    }
}

gawe mob = anyar Mobil("Toyota", 4)
cek("9. super() constructor chaining", mob.rodha, 4)
cek("10. super() set brand", mob.merk, "Toyota")
cek("11. child set doors", mob.pintu, 4)
cek("12. super.method() call", mob.deskripsi(), "Toyota duwe rodha 4, pintu 4")
cek("13. super['method']() bracket call", mob.deskripsiBracket(), "Toyota duwe rodha 4, pintu 4")

// ==========================================
// 9. IKI IN INHERITED METHOD REFERS TO CHILD
// ==========================================
bentuk WongJeneng {
    gawe jeneng = "Anonim"

    guna salam() {
        bali "Sugeng enjang, " + iki.jeneng
    }
}

bentuk Dosen ngembangake WongJeneng {
    gawe nidn = "001"
}

gawe dos = anyar Dosen()
dos.jeneng = "Pak Budi"
cek("14. iki in inherited method uses child property", dos.salam(), "Sugeng enjang, Pak Budi")

// ==========================================
// 10 & 11. MULTI-LEVEL INHERITANCE & MULTI-LEVEL SUPER
// ==========================================
bentuk LvA {
    guna identitas() {
        bali "A"
    }

    guna rute() {
        bali "A"
    }
}

bentuk LvB ngembangake LvA {
    guna identitas() {
        bali "B"
    }

    guna rute() {
        bali super.rute() + " -> B"
    }
}

bentuk LvC ngembangake LvB {
    guna identitas() {
        bali "C"
    }

    guna rute() {
        bali super.rute() + " -> C"
    }
}

gawe lvc = anyar LvC()
cek("15. Multi-level override", lvc.identitas(), "C")
cek("16. Multi-level super static dispatch", lvc.rute(), "A -> B -> C")

// ==========================================
// 12. CROSS-MODULE INHERITANCE
// ==========================================
impor { Makhluk, MakhlukPolos } saka "./modules/mod_v5_parent.jawa"

bentuk Manungsa ngembangake Makhluk {
    gawe akal = bener

    wiwiti(jeneng) {
        super(jeneng)
    }

    guna status() {
        bali super.status() + " lan duwe akal"
    }
}

gawe wong = anyar Manungsa("Joko")
cek("17. Cross-module inherited field", wong.bernafas, bener)
cek("18. Cross-module constructor chaining", wong.jeneng, "Joko")
cek("19. Cross-module child status override with super", wong.status(), "Joko bisa ambegan lan duwe akal")
cek("20. Cross-module inherited method calling overridden method", wong.info(), "Info: Joko bisa ambegan lan duwe akal")

// ==========================================
// 13. JINIS() ON CHILD AND MULTI-LEVEL INSTANCES
// ==========================================
cek("21. jinis(mob)", jinis(mob), "instance")
cek("22. jinis(lvc)", jinis(lvc), "instance")
cek("23. jinis(wong)", jinis(wong), "instance")

// ==========================================
// 14. SEPARATE INSTANCE STATE
// ==========================================
gawe m1 = anyar Mahasiswa()
gawe m2 = anyar Mahasiswa()
m1.nim = "111"
m2.nim = "222"
cek("24. Separate instance m1", m1.nim, "111")
cek("25. Separate instance m2", m2.nim, "222")

// ==========================================
// 15. MUTABLE DEFAULT ISOLATION
// ==========================================
bentuk SimpenanInduk {
    gawe daftar = []
    gawe info = {"aktif": bener}
}

bentuk SimpenanAnak ngembangake SimpenanInduk {
    gawe catatan = []
}

gawe s1 = anyar SimpenanAnak()
gawe s2 = anyar SimpenanAnak()

nambah(s1.daftar, 100)
nambah(s1.catatan, "catat1")
s1.info["aktif"] = salah

cek("26. Mutable default array length s1", dawa(s1.daftar), 1)
cek("27. Mutable default array length s2 isolated", dawa(s2.daftar), 0)
cek("28. Child mutable default array s1", dawa(s1.catatan), 1)
cek("29. Child mutable default array s2 isolated", dawa(s2.catatan), 0)
cek("30. Parent mutable object isolation s1", s1.info["aktif"], salah)
cek("31. Parent mutable object isolation s2", s2.info["aktif"], bener)

// ==========================================
// 16. BOUND INHERITED METHOD
// ==========================================
gawe salamFn = dos.salam
cek("32. Bound inherited method", salamFn(), "Sugeng enjang, Pak Budi")

// ==========================================
// 17 & 18. HOF WITH INHERITED AND OVERRIDDEN METHODS
// ==========================================
bentuk PengitungInduk {
    gawe faktor = 2

    guna tikel(x) {
        bali x * iki.faktor
    }
}

bentuk PengitungAnak ngembangake PengitungInduk {
    guna tikel(x) {
        bali x * iki.faktor * 10
    }
}

gawe pInduk = anyar PengitungInduk()
gawe pAnak = anyar PengitungAnak()

gawe angkaList = [1, 2, 3]
gawe hasilInduk = terapkan(pInduk.tikel, angkaList)
gawe hasilAnak = terapkan(pAnak.tikel, angkaList)

cek("33. HOF terapkan with parent method [0]", hasilInduk[0], 2)
cek("34. HOF terapkan with parent method [1]", hasilInduk[1], 4)
cek("35. HOF terapkan with parent method [2]", hasilInduk[2], 6)
cek("36. HOF terapkan with overridden method [0]", hasilAnak[0], 20)
cek("37. HOF terapkan with overridden method [1]", hasilAnak[1], 40)
cek("38. HOF terapkan with overridden method [2]", hasilAnak[2], 60)

// ==========================================
// 19 & 20. EXCEPTION IN PARENT & CHILD METHODS
// ==========================================
bentuk BahayaInduk {
    guna pemicuInduk() {
        lempar "error saka induk"
    }
}

bentuk BahayaAnak ngembangake BahayaInduk {
    guna pemicuAnak() {
        lempar "error saka anak"
    }

    guna pemicuSuper() {
        super.pemicuInduk()
    }
}

gawe bahaya = anyar BahayaAnak()
gawe tangkepInduk = ""
gawe tangkepAnak = ""
gawe tangkepSuper = ""

coba {
    bahaya.pemicuInduk()
} tangkep e {
    tangkepInduk = e
}

coba {
    bahaya.pemicuAnak()
} tangkep e {
    tangkepAnak = e
}

coba {
    bahaya.pemicuSuper()
} tangkep e {
    tangkepSuper = e
}

cek("39. Exception in inherited parent method", tangkepInduk, "error saka induk")
cek("40. Exception in child method", tangkepAnak, "error saka anak")
cek("41. Exception via super method call", tangkepSuper, "error saka induk")

// ==========================================
// 21 & 22. CONSTRUCTOR CHAINING 3 LEVELS & CHILD MUTATION
// ==========================================
bentuk ChainA {
    gawe aVal = 0
    wiwiti(v) {
        iki.aVal = v
    }
}

bentuk ChainB ngembangake ChainA {
    gawe bVal = 0
    wiwiti(v1, v2) {
        super(v1)
        iki.bVal = v2
    }
}

bentuk ChainC ngembangake ChainB {
    gawe cVal = 0
    wiwiti(v1, v2, v3) {
        super(v1, v2)
        iki.cVal = v3
    }
}

gawe chainObj = anyar ChainC(10, 20, 30)
cek("42. 3-level constructor chaining aVal", chainObj.aVal, 10)
cek("43. 3-level constructor chaining bVal", chainObj.bVal, 20)
cek("44. 3-level constructor chaining cVal", chainObj.cVal, 30)

// ==========================================
// 23. PARENT WITHOUT CONSTRUCTOR (super() is no-op)
// ==========================================
bentuk NoCtorParent {
    gawe pData = "induk"
}

bentuk WithCtorChild ngembangake NoCtorParent {
    gawe cData = ""
    wiwiti(txt) {
        super()
        iki.cData = txt
    }
}

gawe noCtor = anyar WithCtorChild("sukses")
cek("45. Parent without constructor pData", noCtor.pData, "induk")
cek("46. Parent without constructor cData", noCtor.cData, "sukses")

// ==========================================
// 24. CHILD WITHOUT CONSTRUCTOR (inherits parent constructor)
// ==========================================
bentuk ParentWithCtor {
    gawe pMsg = ""
    wiwiti(m) {
        iki.pMsg = m
    }
}

bentuk ChildNoCtor ngembangake ParentWithCtor {
    gawe extra = 999
}

gawe childNoCtor = anyar ChildNoCtor("warisan constructor")
cek("47. Child without constructor inherits parent wiwiti", childNoCtor.pMsg, "warisan constructor")
cek("48. Child own field default preserved", childNoCtor.extra, 999)

// ==========================================
// 25 & 26. NESTED INHERITED DATA & OBJECT/ARRAY FIELDS
// ==========================================
bentuk ProfilInduk {
    gawe kontak = {
        "email": "user@mail.com",
        "telepon": "0812"
    }
    gawe hobi = ["moco", "turu"]
}

bentuk ProfilAnak ngembangake ProfilInduk {
    gawe peran = "Admin"
}

gawe pa = anyar ProfilAnak()
cek("49. Inherited nested object email", pa.kontak["email"], "user@mail.com")
cek("50. Inherited nested array hobi [0]", pa.hobi[0], "moco")
cek("51. Child role field", pa.peran, "Admin")

// ==========================================
// 27. NAMESPACE INHERITANCE (impor ... minangka ns)
// ==========================================
impor "./modules/mod_v5_parent.jawa" minangka nsMod

bentuk Robot ngembangake nsMod.Makhluk {
    gawe baterai = 100

    wiwiti(j) {
        super(j)
    }
}

gawe rob = anyar Robot("Mecha")
cek("52. Namespace parent inheritance field", rob.bernafas, bener)
cek("53. Namespace parent constructor", rob.jeneng, "Mecha")
cek("54. Namespace parent own field", rob.baterai, 100)

// ==========================================
// HASIL AKHIR
// ==========================================
tulis "=========================================="
tulis "Lulus: " + lulus + " / " + (lulus + gagal)
yen gagal == 0 {
    tulis "KABEH TEST V5 PASS!"
} liyane {
    tulis "ANA TEST SING GAGAL!"
}
`;

// 3. Negative test fixture: examples/test_inheritance_v5_error.jawa
const negativeCode = `// test_inheritance_v5_error.jawa
// Negative test fixture - must fail with exit code 1
bentuk Anak ngembangake OraAna {
    gawe x = 1
}
`;

// Write files
fs.writeFileSync(path.join(PROJECT, 'examples', 'modules', 'mod_v5_parent.jawa'), modParentCode, 'utf8');
console.log('Created examples/modules/mod_v5_parent.jawa');

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_inheritance_v5.jawa'), positiveCode, 'utf8');
console.log('Created examples/test_inheritance_v5.jawa');

fs.writeFileSync(path.join(PROJECT, 'examples', 'test_inheritance_v5_error.jawa'), negativeCode, 'utf8');
console.log('Created examples/test_inheritance_v5_error.jawa');
