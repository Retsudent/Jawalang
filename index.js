const fs = require("fs");
const path = require("path");

const lexer = require("./src/lexer");
const parser = require("./src/parser");
const interpreter = require("./src/interpreter");
const { runFile, VERSION, HELP_TEXT } = require("./src/cli");
const repl = require("./src/repl");

/**
 * Execute Jawalang source code programmatically
 * @param {string} source - Jawalang source code string
 * @param {string} [filePath] - Optional virtual/physical file path for error reporting & module base
 * @returns {*} Result of interpreter execution
 */
function runSource(source, filePath = "<anonymous>") {
    const tokens = lexer(source);
    const ast = parser(tokens);
    return interpreter(ast, filePath);
}

// CLI entry point guard when executed directly: node index.js <file.jawa>
if (require.main === module) {
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
        const tokens = lexer(source);
        const ast = parser(tokens);
        interpreter(ast, filename);
    } catch (err) {
        console.error(`[Error Jawalang]: ${err.message}`);
        process.exit(1);
    }
}

module.exports = {
    lexer,
    parser,
    interpreter,
    runFile,
    runSource,
    repl,
    VERSION,
    HELP_TEXT
};
