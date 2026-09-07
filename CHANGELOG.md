# Changelog

All notable changes to the Jawalang project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-07

### Interactive REPL & CLI Enhancement

#### Added
- **Interactive REPL Engine (`src/repl.js`)**:
  - `ReplSession`: Persistent session state maintaining `Environment`, `globalFunctions`, `globalStructs`, `rootExports`, and `ModuleLoader` across multiple inputs.
  - Bare expression evaluation: Seamless evaluation and formatting of standalone expressions (`10 + 20`, `"halo"`, `10 > 5`, `[1, 2, 3]`, `{"nama": "Budi"}`) without requiring explicit `tulis(...)`.
  - Multiline input detection (`isCompleteInput`): Smart detection of incomplete blocks (unclosed `()`, `[]`, `{}`, unclosed strings, trailing operators) prompting secondary `...> `.
  - Error recovery: Runtime exceptions and syntax errors are cleanly reported without terminating the interactive session.
  - Meta-commands: Built-in `.help` / `.bantu`, `.exit` / `.metu`, and `.clear` / `.resik`.
  - Signal and I/O handling: Safe `SIGINT` (Ctrl+C) recovery, graceful EOF handling, and safe `takon()` synchronous input support.
- **CLI Subcommand & TTY Integration (`src/cli.js`)**:
  - Added `jawa repl` explicit command.
  - Running `jawa` with no arguments in interactive terminal (TTY) automatically launches the REPL.
  - Updated CLI `--help` with REPL usage and command description.
- **REPL Test Suite (`scratch/test_repl.js`)**: Added 32 comprehensive tests validating basic expressions, variable/function/struct persistence, inheritance, HOF, error recovery, module imports, namespaces, multiline input, meta commands, input validation, and process piping.
- **Language Specification Audit (`docs/LANGUAGE_SPEC_AUDIT_V1.2.0.md` & `docs/language-inventory-v1.2.0.json`)**: Comprehensive 35-section specification and machine-readable inventory.

#### Changed
- **Parser Expression Fallback (`src/parser.js`)**: Added optional `options.expressionOnly` parameter for non-destructive bare expression parsing.
- **Interpreter Session Options (`src/interpreter.js`)**: Supported pre-existing environment options (`globalEnv`, `globalFunctions`, `globalStructs`, `loader`, `isRepl`, `onReplResult`) and exported `Environment` and `formatValue`.
- **Package Distribution (`package.json`)**: Added `src/repl.js` to `files` whitelist and exported `repl` in `index.js`.

---

## [1.1.0] - 2026-09-07

### NPM Package Distribution

#### Added
- **NPM Binary Alias**: Added `"jawalang": "bin/jawa.js"` alongside `"jawa": "bin/jawa.js"` in `package.json` to enable both `jawa` and `jawalang` CLI commands and seamless `npx jawalang` execution.
- **Strict Package Whitelist**: Added `"files"` whitelist in `package.json` covering only 10 essential runtime files, shrinking the distribution tarball by 96.2% (from 1.2 MB to 45.7 kB, 1026 files to 10 files).
- **Programmatic Module Export**: Hardened `index.js` with `require.main === module` guard and official exports (`lexer`, `parser`, `interpreter`, `runFile`, `runSource`, `VERSION`, `HELP_TEXT`).
- **NPM Package Verification Suites**: Added `scratch/test_npm_api.js` and `scratch/test_npm_package.js` validating 15 packaging checks.
- **NPM Documentation**: Added `docs/NPM_PACKAGE_V1.1.0.md` detailing the distribution architecture, payload analysis, and verification results.

#### Changed
- **LF Line Endings**: Converted `bin/jawa.js` to LF (`\n`) line endings to ensure compatibility with Unix/Linux/macOS shells.
- **Engines Declaration**: Added `"engines": { "node": ">=16.0.0" }` in `package.json`.
- **Repository Metadata**: Added Git repository, homepage, and bug tracker metadata to `package.json`.

---

## [1.0.1] - 2026-09-07

### Portability & Test Infrastructure Cleanup

#### Changed
- **Dynamic Project Root Discovery**: Refactored `scripts/build-launcher.ps1`, `scratch/run_full_regression.js`, and all scratch test runners to resolve the project root dynamically via `path.resolve(__dirname, '..')`, `$PSScriptRoot`, and `$env:SystemRoot` / `$env:windir`.
- **Zero Hardcoded Developer Paths**: Purged all hardcoded developer paths (`D:\Jawascript`, `C:\Users\MyBook SAGA 10\...`) across 43+ test scripts and utilities.
- **Spaces in File Paths Support**: Standardized double-quoted paths (`"${process.execPath}" "${filePath}"`) across all child process executions, enabling execution from folders with spaces.
- **Drive Letter Normalization**: Resolved Windows drive-letter casing discrepancy (`c:\` vs `C:\`) in `language-server/test/modules.test.js` using `fs.realpathSync.native`.

#### Added
- **Automated Portability Scanner**: Added `scratch/test_portability.js` implementing 11 automated portability checks (Hardcoded path audit, dynamic root, scratch runners, npm test, LSP tests, CLI portability, module resolution, VS Code tests, installer portability, release packaging script, clean clone simulation).
- **Portability Guide**: Added `docs/PORTABILITY.md` documenting system requirements, dynamic path resolution mechanics, testing, CLI execution, portable installer modes, and troubleshooting.
- **Project Status & Architecture Documentation**: Added `docs/PROJECT_STATUS.md` recording system architecture, test suite inventory (86+ passing checks), and known limitations.

---

## [1.0.0] - 2026-09-06

### Initial Stable Release — Feature Complete

#### Added
- **Core Interpreter & Compiler**:
  - Lexer (`src/lexer.js`) supporting Javanese keywords and UTF-8 source code.
  - Recursive descent parser (`src/parser.js`) generating structured AST with syntax error reporting.
  - Tree-walking interpreter (`src/interpreter.js`) with lexical environment and scope management.
- **Language Features**:
  - Variable declarations (`gawe`, immutable `tetep`).
  - Control flow: conditional branching (`yen`, `liyane yen`, `liyane`) and loops (`nalika`, `saben ... ing ...`).
  - First-class functions: `guna`, lexical closures, higher-order functions, callbacks.
  - Data structures: Dynamic arrays, associative key-value objects, dot notation member access.
  - Exception handling: `coba`, `tangkep`, `pungkasan`, `uncalake`.
  - Object-Oriented Programming: `struktur`, constructors via `anyar`, methods, instance self-reference `iki`, single inheritance `turunan_saka`, and method chaining `super`.
  - Standard collection library: `dawa()`, `isi()`, `tambah()`, `jupuk()`, `paling_gedhe()`, `paling_cilik()`, `urutake()`, `walik()`.
  - Module System V1–V3: `ekspor`, `impor ... minangka ...`, canonical path caching, and cross-module symbol imports.
- **Developer Tooling & Platform Integration**:
  - CLI Engine: `src/cli.js`, `bin/jawa.js`, and `bin/jawa.cmd` with `--version`, `--help`, and `--debug` flags.
  - Native Windows Launcher: `bin/jawa.exe` compiled via C#/Roslyn with custom multi-resolution icon (`assets/jawalang.ico`).
  - Windows Explorer Integration: Automated PowerShell installer (`scripts/install.ps1`) for per-user `.jawa` file association, ProgID registration, and "Run with Jawalang" context menu in HKCU without requiring administrator privileges.
  - Language Server Protocol (LSP): Full language server in `language-server/` providing diagnostics, go-to-definition, autocomplete, hover tooltips, and document symbols.
  - VS Code Extension: Official extension in `vscode-extension/` with syntax highlighting (`syntaxes/jawalang.tmLanguage.json`), bracket configuration, snippets, and LSP client integration.
  - Release Packaging: Standalone distribution builder (`scripts/package-release.ps1`) creating packaged release zips.
