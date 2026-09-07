const path = require('path');
const PROJECT = path.resolve(__dirname, '..');
const lexer = require(path.join(PROJECT, 'src', 'lexer'));
const parser = require(path.join(PROJECT, 'src', 'parser'));
const interpreter = require(path.join(PROJECT, 'src', 'interpreter'));

const code = `
gawe obj = { "nama": "Budi", "umur": 20 }
tulis obj.nama
obj.umur = 25
tulis obj.umur

bentuk Wong {
    gawe jeneng = ""
    gawe umur = 0
    guna wiwiti(n, u) {
        iki.jeneng = n
        iki.umur = u
    }
    guna salam() {
        bali "Halo " + iki.jeneng
    }
}

gawe w = anyar Wong("Siti", 22)
tulis w.jeneng
tulis w.umur
tulis w.salam()
w.jeneng = "Dewi"
tulis w.salam()
`;

try {
    const tokens = lexer(code);
    console.log("Tokens count:", tokens.length);
    const ast = parser(tokens);
    console.log("AST count:", ast.length);
    interpreter(ast, null);
    console.log("SUCCESS!");
} catch (e) {
    console.error("ERROR:", e.message);
}
