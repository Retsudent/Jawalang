const fs = require("fs");

const lexer = require("./src/lexer");
const parser = require("./src/parser");
const interpreter = require("./src/interpreter");

const filename = process.argv[2];

if (!filename) {
    console.log("Cara migunakake: node index.js <file.jawa>");
    process.exit(1);
}

if (!fs.existsSync(filename)) {
    console.error(`Error: File "${filename}" ora ditemokake!`);
    process.exit(1);
}

try {
    const source = fs.readFileSync(filename, "utf8");

    // 1. Lexer: Mengubah teks sumber menjadi deretan token
    const tokens = lexer(source);

    // 2. Parser: Mengubah token menjadi Abstract Syntax Tree (AST)
    const ast = parser(tokens);

    // 3. Interpreter: Menjalankan AST
    interpreter(ast);
} catch (err) {
    console.error(`[Error Jawascript]: ${err.message}`);
    process.exit(1);
}