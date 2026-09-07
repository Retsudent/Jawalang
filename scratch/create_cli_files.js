const fs = require('fs');
const path = require('path');

const PROJECT = path.resolve(__dirname, '..');

// 1. bin/cli.js
const cliContent = `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const lexer = require("../src/lexer");
const parser = require("../src/parser");
const interpreter = require("../src/interpreter");

const pkg = require("../package.json");
const VERSION = \`Jawalang \${pkg.version}\`;

const HELP_TEXT = \`Jawalang - Javanese Programming Language

Usage:
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help

Commands:
  run       Run a Jawalang program
  --version Show Jawalang version
  --help    Show this help message\`;

const USAGE_TEXT = \`Jawalang - Javanese Programming Language

Usage:
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help\`;

function printError(msg) {
    console.error(msg);
    process.exit(1);
}

function runFile(filePath) {
    const resolvedPath = path.resolve(process.cwd(), filePath);

    if (!fs.existsSync(resolvedPath)) {
        printError(\`Error: File not found: \${filePath}\`);
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.isDirectory()) {
        printError(\`Error: Path "\${filePath}" is a directory, not a file.\`);
    }

    if (path.extname(resolvedPath) !== ".jawa") {
        printError("Error: Jawalang source files must use the .jawa extension.");
    }

    try {
        const source = fs.readFileSync(resolvedPath, "utf8");
        const tokens = lexer(source);
        const ast = parser(tokens);
        interpreter(ast, resolvedPath);
    } catch (err) {
        console.error(\`[Error Jawalang]: \${err.message}\`);
        process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(USAGE_TEXT);
        process.exit(1);
    }

    const first = args[0];

    if (first === "--version" || first === "-v") {
        console.log(VERSION);
        process.exit(0);
    }

    if (first === "--help" || first === "-h") {
        console.log(HELP_TEXT);
        process.exit(0);
    }

    if (first === "run") {
        if (args.length < 2) {
            printError('Error: Missing source file after "run".');
        }
        runFile(args[1]);
        return;
    }

    if (first.startsWith("-")) {
        printError(\`Error: Unknown option "\${first}". Use "jawa --help" for usage information.\`);
    }

    // Check if first argument is a file with .jawa extension or an existing file
    if (path.extname(first) === ".jawa") {
        runFile(first);
        return;
    }

    // If file exists but wrong extension, runFile will report wrong extension
    if (fs.existsSync(path.resolve(process.cwd(), first))) {
        runFile(first);
        return;
    }

    // Otherwise unknown command or file
    printError(\`Error: File or command "\${first}" not found.\`);
}

main();
`;

// 2. bin/jawa.cmd
const cmdContent = `@echo off
node "%~dp0cli.js" %*
`;

// 3. examples/hello_cli.jawa
const helloContent = `// hello_cli.jawa
// Contoh program Jawalang kanggo tes CLI & Windows Integration

gawe jeneng = "Jawalang"
gawe versi = "1.0.0"

tulis "Halo saka " + jeneng + " versi " + versi + "!"
`;

fs.writeFileSync(path.join(PROJECT, 'bin', 'cli.js'), cliContent, 'utf8');
console.log('Created bin/cli.js');

fs.writeFileSync(path.join(PROJECT, 'bin', 'jawa.cmd'), cmdContent, 'utf8');
console.log('Created bin/jawa.cmd');

fs.writeFileSync(path.join(PROJECT, 'examples', 'hello_cli.jawa'), helloContent, 'utf8');
console.log('Created examples/hello_cli.jawa');
