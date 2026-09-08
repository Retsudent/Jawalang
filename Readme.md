# Jawalang ꦗꦮ

> **A modern, elegant programming language inspired by Javanese syntax, running on Node.js.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org)
[![Version](https://img.shields.io/badge/Version-v1.2.0-orange.svg)](package.json)
[![Tests](https://img.shields.io/badge/Tests-670%2B%20Passing%20(100%25)-brightgreen.svg)](docs/PROJECT_STATUS.md)

---

## 📖 Overview

**Jawalang** is an educational and practical programming language that adopts Javanese vocabulary and linguistic harmony as its core programming syntax. It is engineered from the ground up with a custom lexical scanner, a recursive-descent AST parser, a tree-walking interpreter with lexical scoping, an interactive multiline REPL, a native Windows launcher, and a full Language Server Protocol (LSP) implementation for VS Code.

### Why Jawalang?
- **Cultural & Linguistic Expression**: Makes coding intuitive and expressive using authentic Javanese terms (`gawe`, `guna`, `yen`, `liyane`, `bentuk`, `wiwiti`, `iki`, `ngembangake`, `super`).
- **Complete Feature Set**: Not just a toy transpiler—Jawalang provides true runtime execution, structured error handling, first-class functions, higher-order collections, single inheritance OOP, and a robust module system with circular dependency protection.
- **Modern Developer Tooling**: First-class developer experience with an official VS Code extension and a dedicated Language Server supporting diagnostics, autocompletion, formatting, quick fixes, and semantic syntax highlighting.

### Technologies
- **Runtime**: Node.js (pure JavaScript AST interpreter, zero heavy dependencies)
- **Tooling**: LSP (JSON-RPC stdio protocol), VS Code Extension, Native C# Windows Launcher (`jawa.exe`)
- **Project Status**: **Production-Ready (v1.2.0)** with **670+ automated tests passing (100%)**.

---

## ✨ Features

- **Javanese-Inspired Syntax**: Expressive keywords reflecting authentic Javanese grammar.
- **Lexer & Recursive-Descent Parser**: Position-aware tokenization with accurate line/column tracking.
- **Lexical Scoping & Closures**: Scoped variable environments with clean shadowing resolution.
- **First-Class Functions**: Store functions in variables, pass callbacks, and chain invocations.
- **Object-Oriented Programming (OOP)**: Struct declarations (`bentuk`), constructors (`wiwiti`), instance references (`iki`), single inheritance (`ngembangake`), and `super` calls.
- **Rich Data Structures**: Dynamic arrays and key-value objects with deep indexing and assignment.
- **Functional Collection Library**: Built-in higher-order functions (`terapkan`, `saring`, `itung`, `ana`, `kabeh`, `golek`, `urut`, `balik`, `gabung`).
- **Robust Module System**: Top-level exports (`ekspor`), whole module imports (`impor`), selective imports (`saka`), aliases (`minangka`), and namespaces with singleton caching.
- **Structured Error Handling**: Try-catch-throw constructs (`coba`, `tangkep`, `lempar`) with call stack propagation.
- **Interactive REPL**: Persistent interactive shell with automatic multiline buffer detection and meta-commands (`.bantu`, `.metu`, `.resik`).
- **CLI & Windows Integration**: Portable `jawa` executable, `.jawa` Windows file association, custom icons, and Explorer context menu.
- **Language Server Protocol (LSP)**: Real-time diagnostics, go to definition, find references, rename symbols, signature help, context-aware autocomplete, code formatting, organize imports, quick fixes, and semantic tokens highlighting.
- **Official VS Code Extension**: Ready-to-use VSIX package with syntax grammar, snippets, and editor run buttons.

---

## 🧪 Example

Here is a complete, idiomatic Jawalang program demonstrating struct declaration, constructor, inheritance, method invocation, and functional collection operations:

```jawa
// Program Petungan Siswa
bentuk Wong {
    gawe jeneng = ""

    wiwiti(nama) {
        iki.jeneng = nama
    }

    guna sapa() {
        bali "Sugeng rawuh, " + iki.jeneng
    }
}

bentuk Siswa ngembangake Wong {
    gawe biji = []

    wiwiti(nama, dhaptarBiji) {
        super(nama)
        iki.biji = dhaptarBiji
    }

    guna rataRata() {
        gawe total = itung(guna(b) { bali b >= 75 }, iki.biji)
        bali total
    }
}

// Instansiasi obyek
gawe s = anyar Siswa("Budi", [70, 85, 90, 65, 80])

tulis s.sapa()
tulis "Cacahe wulangan sing lulus (>= 75): " + s.rataRata()

// Iterasi nganggo foreach
tulis "Rincian biji:"
kanggo saben b ing s.biji {
    tulis "- Biji: " + b
}
```

Output:
```text
Sugeng rawuh, Budi
Cacahe wulangan sing lulus (>= 75): 3
Rincian biji:
- Biji: 70
- Biji: 85
- Biji: 90
- Biji: 65
- Biji: 80
```

---

## 🚀 Quick Start

### 1. Installation

Install Jawalang globally via NPM:

```bash
npm install -g jawalang
```

Or run directly using `npx`:

```bash
npx jawalang hello.jawa
```

On Windows, you can also run the native installer script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

Verify your installation:

```bash
jawa --version
```

### 2. Running a Program

Create a file named `hello.jawa`:

```jawa
tulis "Halo Jagad Jawalang!"
```

Execute the program with `jawa`:

```bash
jawa hello.jawa
```

### 3. Interactive REPL

Start the interactive shell simply by typing `jawa` or `jawa repl`:

```bash
jawa
```

```text
Jawalang REPL v1.2.0
Ketik .bantu untuk bantuan.

jawa> gawe a = 15
jawa> gawe b = 25
jawa> a + b
40
jawa> .metu
```

### 4. VS Code Extension

Install the official Visual Studio Code extension:

```powershell
code --install-extension vscode-extension/jawalang-vscode-1.0.0.vsix
```

---

## 📚 Documentation

Comprehensive, topic-by-topic documentation is available in the [`docs/`](docs/README.md) directory:

| Topic | Description | Link |
| :--- | :--- | :--- |
| **Getting Started** | Installation, environment setup, and running your first program | [docs/getting-started.md](docs/getting-started.md) |
| **Syntax & Keywords** | Syntax rules, delimiters, and canonical keywords inventory | [docs/syntax.md](docs/syntax.md) |
| **Variables, Types & Input** | Variables (`gawe`), types (`jinis`), `null` semantics, and input (`takon`) | [docs/variables.md](docs/variables.md) |
| **Operators & Precedence** | Arithmetic, relational, logical operators, and precedence hierarchy | [docs/operators.md](docs/operators.md) |
| **Control Flow** | Conditionals (`yen`, `liyane`), loops (`nalika`, `kanggo`, `saben`), and loop control | [docs/control-flow.md](docs/control-flow.md) |
| **Functions & Scope** | Function declaration (`guna`, `bali`), closures, and first-class functions | [docs/functions.md](docs/functions.md) |
| **Data Structures** | Arrays, objects/dictionaries, dot notation, and nested mutations | [docs/data-structures.md](docs/data-structures.md) |
| **Higher-Order Functions** | Functional collection library (`terapkan`, `saring`, `itung`, `urut`, etc.) and string utilities | [docs/higher-order-functions.md](docs/higher-order-functions.md) |
| **OOP & Structs** | Structs (`bentuk`), constructors (`wiwiti`), `iki`, inheritance (`ngembangake`), and `super` | [docs/oop.md](docs/oop.md) |
| **Module System** | Exports (`ekspor`), imports (`impor`), selective imports, aliases, and namespaces | [docs/modules.md](docs/modules.md) |
| **Error Handling** | Exception handling (`coba`, `tangkep`, `lempar`) and stack propagation | [docs/error-handling.md](docs/error-handling.md) |
| **Interactive REPL** | REPL commands, multiline evaluation, state persistence, and debugging | [docs/repl.md](docs/repl.md) |
| **CLI & Windows Tooling** | Command-line options, native `jawa.exe`, file associations, and release scripts | [docs/cli.md](docs/cli.md) |
| **Language Server Protocol** | IDE features: diagnostics, definition, references, rename, format, code actions, and semantic tokens | [docs/lsp.md](docs/lsp.md) |
| **Architecture** | Lexer, parser, interpreter pipeline, and internal project structure | [docs/architecture.md](docs/architecture.md) |
| **Documentation Index** | Complete documentation index and technical audit reports | [docs/README.md](docs/README.md) |

---

## 🗺️ Roadmap & Current Status

| Milestone / Component | Status | Notes |
| :--- | :---: | :--- |
| **Core Lexer & Parser** | ✅ | Position-aware AST parser with detailed diagnostics |
| **Core Interpreter** | ✅ | Scoped runtime execution with recursion and loop guards |
| **Data Structures & Collections** | ✅ | Array, plain object, deep indexing, and 14+ built-in methods |
| **Object-Oriented Programming** | ✅ | Structs, constructors, instance references, single inheritance |
| **Module & Namespace System** | ✅ | Relative imports, selective specifiers, aliases, namespaces |
| **Error Handling & Exceptions** | ✅ | Full `coba ... tangkep ... lempar` construct |
| **CLI & Windows Launcher** | ✅ | Multiplatform CLI and native Windows executable (`jawa.exe`) |
| **Interactive Multiline REPL** | ✅ | REPL with persistent session, multiline detection, and meta-commands |
| **VS Code Extension** | ✅ | Syntax grammar, snippets, and integrated terminal run commands |
| **LSP Diagnostics & Navigation** | ✅ | Real-time diagnostics, Go to Definition, Find References |
| **LSP Refactoring & Help** | ✅ | Rename Symbol (with WorkspaceEdit) and Signature Help |
| **LSP Completion V2** | ✅ | Context-aware autocomplete for scopes, members, namespaces, and structs |
| **LSP Formatting** | ✅ | Deterministic 4-space code formatter with operator spacing rules |
| **LSP Code Actions** | ✅ | Organize imports, duplicate removal, unused cleanup, and typo quick fixes |
| **LSP Semantic Tokens** | ✅ | 13 token types, 2 modifiers, relative delta-encoding highlighting |
| **LSP Polish & Release (Phase 9)** | ⏳ | Final packaging, performance benchmarks, and release distribution |

---

## 🤝 Contributing

Contributions, feedback, and suggestions are warmly welcome!

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/Retsudent/Jawalang.git
   ```
3. **Run the full test suite** to ensure existing functionality passes:
   ```bash
   node scratch/run_full_regression.js
   node language-server/test/run_tests.js
   ```
4. **Create a feature branch** (`git checkout -b feature/my-feature`).
5. **Commit your changes** (`git commit -m 'Add new feature'`).
6. **Push to the branch** (`git push origin feature/my-feature`).
7. **Open a Pull Request** describing your changes and test results.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Copyright (c) 2026 Restu
