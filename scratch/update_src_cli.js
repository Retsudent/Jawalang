const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';
const srcCliContent = `#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const lexer = require("./lexer");
const parser = require("./parser");
const interpreter = require("./interpreter");

const pkg = require("../package.json");
const VERSION = \`Jawalang v\${pkg.version}\`;

const HELP_TEXT = \`Jawalang

Usage:
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help

Commands:
  run       Run a Jawalang program
  --version Show Jawalang version
  --help    Show this help message
  --debug   Run with full error stack trace\`;

const USAGE_TEXT = \`Usage:
  jawa <file.jawa>
  jawa run <file.jawa>
  jawa --version
  jawa --help\`;

function printError(msg) {
    console.error(msg);
    process.exit(1);
}

function runFile(filePath, isDebug) {
    const resolvedPath = path.resolve(process.cwd(), filePath);

    if (fs.existsSync(resolvedPath)) {
        const stat = fs.statSync(resolvedPath);
        if (stat.isDirectory()) {
            printError(\`Error: Path "\${filePath}" is a directory, not a file.\`);
        }
    }

    if (path.extname(resolvedPath) !== ".jawa") {
        printError("Error: Jawalang source files must use the .jawa extension.");
    }

    if (!fs.existsSync(resolvedPath)) {
        printError(\`Error: File not found: \${filePath}\`);
    }

    try {
        const source = fs.readFileSync(resolvedPath, "utf8");
        const tokens = lexer(source);
        const ast = parser(tokens);
        interpreter(ast, resolvedPath);
    } catch (err) {
        if (isDebug) {
            console.error(err.stack || err.message);
        } else {
            console.error(\`[Error Jawalang]: \${err.message}\`);
        }
        process.exit(1);
    }
}

function main() {
    const rawArgs = process.argv.slice(2);

    if (rawArgs.length === 0) {
        console.error("Error: No input file specified.");
        console.error('Use "jawa --help" for usage.');
        console.error("");
        console.error(USAGE_TEXT);
        process.exit(1);
    }

    let isDebug = false;
    const args = [];
    for (const arg of rawArgs) {
        if (arg === "--debug") {
            isDebug = true;
        } else {
            args.push(arg);
        }
    }

    if (args.length === 0) {
        console.error("Error: No input file specified.");
        console.error('Use "jawa --help" for usage.');
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
        runFile(args[1], isDebug);
        return;
    }

    if (first.startsWith("-")) {
        printError(\`Error: Unknown option "\${first}". Use "jawa --help" for usage.\`);
    }

    const resolvedFirst = path.resolve(process.cwd(), first);

    if (fs.existsSync(resolvedFirst)) {
        const stat = fs.statSync(resolvedFirst);
        if (stat.isDirectory()) {
            printError(\`Error: Path "\${first}" is a directory, not a file.\`);
        }
        if (path.extname(resolvedFirst) !== ".jawa") {
            printError("Error: Jawalang source files must use the .jawa extension.");
        }
        runFile(first, isDebug);
        return;
    }

    if (path.extname(first) === ".jawa") {
        printError(\`Error: File not found: \${first}\`);
    }

    if (path.extname(first) !== "") {
        printError("Error: Jawalang source files must use the .jawa extension.");
    }

    // Otherwise unknown command or file
    printError(\`Error: File or command "\${first}" not found.\`);
}

if (require.main === module) {
    main();
}

module.exports = { main, runFile, VERSION, HELP_TEXT };
`;

fs.writeFileSync(path.join(ROOT, 'src', 'cli.js'), srcCliContent, 'utf8');
console.log('src/cli.js updated.');
