const path = require('path');
const baseDir = 'D:/Jawascript';
const lexer = require(path.join(baseDir, 'src/lexer'));
const parser = require(path.join(baseDir, 'src/parser'));
const interpreter = require(path.join(baseDir, 'src/interpreter'));

const code = `
bentuk Wong {
    gawe jeneng = "Budi"
    gawe umur = 20

    fungsi wiwiti(j, u) {
        iki["jeneng"] = j
        iki["umur"] = u
    }

    fungsi salam() {
        tulis "Halo, jenengku " + iki["jeneng"]
    }

    fungsi tambahUmur(n) {
        iki["umur"] = iki["umur"] + n
    }
}

gawe w = anyar Wong("Siti", 25)
tulis w
w["salam"]()
w["tambahUmur"](5)
tulis w["umur"]
tulis jinis(w)
tulis jinis(Wong)
`;

try {
    const tokens = lexer(code);
    const ast = parser(tokens);
    interpreter(ast);
    console.log("QUICK TEST SUCCESS!");
} catch (e) {
    console.error("TEST FAILED:", e);
    process.exit(1);
}
