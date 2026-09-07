const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';

// 1. src/cli.js
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

    // Check if first argument is a file with .jawa extension or an existing file
    if (path.extname(first) === ".jawa") {
        runFile(first, isDebug);
        return;
    }

    // If file exists but wrong extension, runFile will report wrong extension
    if (fs.existsSync(path.resolve(process.cwd(), first))) {
        runFile(first, isDebug);
        return;
    }

    // Otherwise unknown command or file
    printError(\`Error: File or command "\${first}" not found.\`);
}

if (require.main === module) {
    main();
}

module.exports = { main, runFile, VERSION, HELP_TEXT };
`;

// 2. bin/jawa.js
const binJawaContent = `#!/usr/bin/env node
require("../src/cli").main();
`;

// 3. bin/cli.js (backwards compatibility forwarder)
const binCliContent = `#!/usr/bin/env node
require("../src/cli").main();
`;

// 4. bin/jawa.cmd
const binJawaCmdContent = `@echo off
node "%~dp0jawa.js" %*
`;

// 5. package.json
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.bin = {
    jawa: "./bin/jawa.js"
};

// 6. examples/cli/helper.jawa & examples/cli/main.jawa
const cliHelperContent = `// Helper module for Jawalang CLI tests
ekspor guna sapa(jeneng) {
    bali "Halo " + jeneng + ", sugeng rawuh ing Jawalang CLI!"
}

ekspor guna petung(a, b) {
    bali a * b
}
`;

const cliMainContent = `// Main entry point testing relative module import via CLI
impor "./helper.jawa" minangka helper

gawe pesen = helper.sapa("Panganggo")
cetak pesen

gawe asil = helper.petung(6, 7)
cetak "Asil: " + asil
`;

// Write files
fs.writeFileSync(path.join(ROOT, 'src', 'cli.js'), srcCliContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'bin', 'jawa.js'), binJawaContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'bin', 'cli.js'), binCliContent, 'utf8');
fs.writeFileSync(path.join(ROOT, 'bin', 'jawa.cmd'), binJawaCmdContent, 'utf8');
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

const cliExDir = path.join(ROOT, 'examples', 'cli');
if (!fs.existsSync(cliExDir)) {
    fs.mkdirSync(cliExDir, { recursive: true });
}
fs.writeFileSync(path.join(cliExDir, 'helper.jawa'), cliHelperContent, 'utf8');
fs.writeFileSync(path.join(cliExDir, 'main.jawa'), cliMainContent, 'utf8');

console.log('Project files successfully written.');
