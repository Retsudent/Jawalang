const analyzer = require('../language-server/src/analyzer');
const path = require('path');
const { pathToUri } = require('../language-server/src/utils');

const uri = pathToUri(path.resolve(__dirname, 'test.jawa'));

function inspect(title, code) {
    console.log(`\n=== ${title} ===`);
    const res = analyzer.analyze(code, uri);
    console.log(`Symbols count: ${res.symbols.length}`);
    res.symbols.forEach(s => console.log(`  SYM: [${s.kind}] ${s.name} at line ${s.nameLoc?.start?.line}`));
    console.log(`References count: ${res.references.length}`);
    res.references.forEach(r => console.log(`  REF: ${r.name} at line ${r.loc?.start?.line} (sym: [${r.symbol?.kind}] ${r.symbol?.name}, declared line ${r.symbol?.nameLoc?.start?.line})`));
}

// 1. Variable & shadowing
inspect('Variable & Shadowing', `
gawe x = 10
tulis x
guna f() {
    gawe x = 20
    tulis x
}
tulis x
`);

// 2. Parameter
inspect('Parameter', `
guna tambah(a, b) {
    bali a + b
}
`);

// 3. Function
inspect('Function Calls', `
guna salam() {
    tulis "halo"
}
salam()
salam()
`);

// 4. Struct & Instantiation
inspect('Struct & Instantiation', `
bentuk Titik {
    gawe x = 0
}
gawe t1 = anyar Titik()
gawe t2 = anyar Titik()
`);

// 5. Methods & Iki
inspect('Struct Methods & Iki', `
bentuk Wong {
    gawe jeneng = ""
    guna salam() {
        tulis iki.jeneng
    }
}
gawe w = anyar Wong()
w.salam()
`);

// 6. Inheritance & Super
inspect('Inheritance & Super', `
bentuk Induk {
    guna sapa() { tulis "induk" }
}
bentuk Anak ngembangake Induk {
    guna sapa() {
        super.sapa()
    }
}
`);
