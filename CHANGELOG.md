# Changelog

All notable changes to the Jawalang project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - V1.3.0

### Language Server Protocol — Document Formatting (Phase 6)

#### Added
- **Document Formatting Engine (`language-server/src/formatter.js`)**:
  - Implemented deterministic, purely static code formatter for Jawalang (`.jawa`) files responding to LSP `textDocument/formatting`.
  - **4-Space Default Indentation**: Strictly uses 4 spaces per nesting level (no tabs).
  - **Binary & Unary Operator Spacing**: Binary operators (`+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `=`, `lan`, `utawa`) formatted with surrounding single spaces; unary operators (`-`, `+`, `ora`) cleanly attached to operand without trailing space (`-10`, `-(a + b)`).
  - **Block & Cuddled Keyword Formatting**:
    - Opening brace `{` opens block with preceding space.
    - Closing brace `}` drops indentation before emission.
    - Cuddled block continuations formatted cleanly: `} liyane {`, `} liyane yen ... {`, `} tangkep err {`, and `} saka ...`.
  - **Struct & Object Literal Formatting**:
    - Top-level and nested struct definitions (`bentuk`) with property and method indentation.
    - Constructors (`wiwiti`) and inheritance (`ngembangake`) formatted with standard spacing.
    - Object literals formatted multiline on assignment; inline object literals preserved in expressions (`tulis { "nama": "Barch" }`).
    - Inline arrays (`[1, 2, 3]`) and nested arrays (`[[1, 2], [3, 4]]`) preserved inline without forced wrapping.
  - **Comment & String Safety**:
    - Preserves single-line comments (`// ...`) verbatim without treating comment content as code.
    - Standalone comments aligned to current indentation level; trailing comments spaced after code.
    - Strings and escape sequences preserved 100% verbatim.
  - **Line Endings & Idempotency**:
    - Preserves CRLF (`\r\n`) vs LF (`\n`) automatically based on document content.
    - Guarantees strict idempotency: `format(format(code)) === format(code)`.
    - Returns `[]` (no-op) when source is already formatted.
    - Malformed code safety: returns `[]` on fatal syntax errors (e.g. unclosed string) without crashing language server.
- **Server Capability (`language-server/src/server.js`)**:
  - Advertises `formattingProvider: true` in server capabilities.
  - Registered `connection.onDocumentFormatting` returning `TextEdit[]` with safe try-catch error boundary.
- **Test Suites**:
  - `language-server/test/formatter.test.js`: 44 comprehensive unit test scenarios covering all required formatting rules.
  - `scratch/test_formatter_v130.js`: 16 protocol-level JSON-RPC stdio integration scenarios.
  - `scratch/audit_formatter_v130.js`: 18 deep audit scenarios.
  - `language-server/test/run_tests.js`: Expanded LSP unit suites to 10/10 suites.
  - `scratch/test_language_server.js`: Added 6 master formatting tests, expanding master suite to 65/65 passed.
  - `scratch/test_vscode_smoke.js`: Added formatting smoke test (19/19 passed).

### Language Server Protocol — Context-Aware Completion V2 (Phase 5)

#### Added
- **Context-Aware Semantic Completion Engine (`language-server/src/completion.js`)**:
  - Upgraded completion from static listings to full context-aware semantic completion (`textDocument/completion`).
  - **Scope-Aware Completion**: Resolves symbols according to cursor position with strict lexical hierarchy (global, local block, nested scopes, function parameters) and local variable shadowing.
  - **Member Completion (`object.`)**:
    - Instance struct member access (`w.`): Completes fields (`CompletionItemKind.Field`) and methods (`CompletionItemKind.Method`) based on static type inference (`anyar StructName()`).
    - Active instance member access (`iki.`): Resolves fields and methods of the enclosing struct when typing inside methods or constructors.
    - Base struct member access (`super.`): Directly resolves parent struct fields and methods, bypassing child overrides to access parent implementations.
    - Inheritance resolution: Traverses inheritance hierarchy (`ngembangake`) to include all ancestor members with child overrides taking precedence and deduplicated.
  - **Module Namespace Completion (`namespace.`)**:
    - Resolves exported variables, functions, and structs for namespace imports (`impor ... minangka math`), strictly filtering out unexported private symbols.
  - **Selective Imports and Aliases**:
    - Exposes imported symbols in local scope (`impor { tambah } saka ...`).
    - Respects import aliases (`impor { tambah minangka jumlah }`), ensuring only `jumlah` is visible and completed.
  - **Constructor Context (`anyar `)**:
    - Dedicated filter (`getStructOnlyCompletions`) after `anyar ` keyword offering exclusively valid struct symbols (`CompletionItemKind.Class`).
  - **Syntax & Safety Protections**:
    - Zero completions (`[]`) returned when cursor is inside strings (`"..."`) or single-line comments (`// ...`).
    - Suppressed member completion inside array indexing (`data[...]`).
    - Standard `textEdit` replacement ranges for precise word and member prefix replacements (`range.start` and `range.end`).
    - Complete deduplication across inherited members, shadowing, and module exports.
  - **Rich Symbol Metadata**:
    - Function and method completions include parameter signatures in `detail` (e.g. `guna salam(pesan)`).
    - Structs include constructor parameter signatures or property counts in `detail`.
    - 24 built-in functions and all 34 Jawalang keywords with accurate kind classification and documentation.
- **Resilient Parse Recovery (`language-server/src/analyzer.js`)**:
  - Enhanced error recovery during typing: recovers incomplete struct properties (`gawe prop`), incomplete variable assignments (`gawe x =`), trailing dots (`obj.`), incomplete `anyar` instantiations, unclosed brackets (`[...]`), unclosed parentheses, and standalone identifiers being typed on a line (`nam` -> `tulis nam`).
- **Server Capability (`language-server/src/server.js`)**:
  - Configured `completionProvider` with `triggerCharacters: ['.', ' ', '"', '{']`.
- **Test Suites**:
  - `language-server/test/completion.test.js`: 40 comprehensive unit test scenarios covering all required behaviors.
  - `scratch/test_completion_v130.js`: 15 protocol-level JSON-RPC stdio integration tests verifying live server interactions.
  - `scratch/test_language_server.js`: Expanded Completion component to 11 master tests, bringing master suite to 59/59 tests.
  - `scratch/test_vscode_smoke.js`: Added LSP CLI startup and dot completion smoke tests (18/18 tests).

### Language Server Protocol — Signature Help (Phase 4)

#### Added
- **Signature Help Provider (`language-server/src/signatureHelp.js`)**:
  - Implemented `getSignatureHelp(analysisResult, position)` returning standard LSP `SignatureHelp` objects with `signatures`, `activeSignature`, and `activeParameter`.
  - Structured Token Call Parser (`parseCalls`): Traverses source tokens using a bracket stack (`()`, `[]`, `{}`) to determine call sites and calculate active parameter indices without fragile global regex.
  - Active Parameter Precision: Nested call parentheses, array literals `[...]`, object literals `{...}`, strings, and comments are fully isolated so inner commas never corrupt outer call argument counts.
  - Comprehensive Callable Resolution:
    - User functions (`guna fn(a, b)` -> `fn(a, b)`)
    - Struct constructors (`anyar StructName(...)` -> `StructName(...)`)
    - Base struct constructors via `super(...)` inside subclass `wiwiti`
    - Instance methods (`instance.method(...)`, `iki.method(...)`)
    - Base methods via `super.method(...)` inside subclasses
    - Inherited and overridden methods (respecting inheritance hierarchy)
    - Exported module functions via namespace (`math.tambah(...)`)
    - Selective module imports with and without local aliases (`impor { f minangka g }`)
    - Built-in functions (`dawa`, `terapkan`, `takon`, `nambah`, etc.) with documentation and parameter signatures
  - Robust Error Recovery: Incomplete calls (`tambah(`, `tambah(10,`) and malformed states return clean signatures or `null` without crashing the language server.
  - Variable Shadowing Protection: Resolves to `null` when a non-callable local variable shadows an outer function name.
- **Server Capability Advertisement (`language-server/src/server.js`)**:
  - Advertised `signatureHelpProvider: { triggerCharacters: ['(', ','], retriggerCharacters: [','] }` in server initialize capabilities.
  - Registered `connection.onSignatureHelp` handler returning null safely on exceptions.
- **Analyzer Incomplete Call Recovery (`language-server/src/analyzer.js`)**:
  - Added trailing comma and unclosed opening parenthesis recovery to `analyze()` to preserve full symbol and AST definitions when typing unfinished calls.
  - Fixed selective import alias lookup to correctly map `spec.imported` from module exports to `spec.local` in importer scopes.
- **Test Suites**:
  - `language-server/test/signatureHelp.test.js`: 30 unit test scenarios covering all callable variants, nesting, activeParameter tracking, string/comment/bracket safety, shadowing, and error isolation.
  - `scratch/test_signature_help_v130.js`: 13 protocol-level JSON-RPC stdio integration tests directly querying the running language server binary.
  - `scratch/test_language_server.js`: Added Section 12 (5 Signature Help tests), bringing master LSP suite to 53/53 tests.

### Language Server Protocol — Rename Symbol (Phase 3)

#### Added
- **Rename Symbol Provider (`language-server/src/rename.js`)**:
  - Implemented `renameSymbol(analysisResult, position, newName)` returning compliant LSP `WorkspaceEdit`.
  - Semantic Symbol Resolution: Identifies target symbols and collects declaration location together with all valid reference occurrences.
  - Identifier Validation (`isValidIdentifier`): Enforces Jawalang lexer identifier rules (`^[a-zA-Z_][a-zA-Z0-9_]*$`), rejecting whitespace, hyphens, numbers as initial characters, empty strings, and reserved keywords/built-ins.
  - Semantic Collision Detection (`checkCollision`): Guards against naming collisions across local scopes, parameters, global declarations, struct methods, and struct fields, returning safe null responses.
  - Safety Rejections: Explicit rejection of constructor `wiwiti`, language keywords (`gawe`, `guna`, `bali`, etc.), built-in functions (`tulis`, `dawa`, etc.), string literals, and comment text.
  - Range Ordering: Sorted all edits within `WorkspaceEdit.changes` in descending order (`line` descending, then `character` descending) to ensure non-destructive application by LSP clients.
- **Server Capability Advertisement (`language-server/src/server.js`)**:
  - Advertised `renameProvider: true` in `capabilities` during `connection.onInitialize`.
  - Registered `connection.onRenameRequest` handler with isolated try/catch returning `null` gracefully on invalid positions, malformed files, or invalid requests.
- **Token Location Refinements in Semantic Analyzer (`language-server/src/analyzer.js`)**:
  - Refined AST nameLoc tracking for `FunctionDeclaration` parameters, `ForStatement` loop variables, `ForEachStatement` iterators, `TryCatchStatement` catch parameters, and `ImportStatement` selective specifiers to pinpoint exact token bounds rather than whole statement spans.
- **Test Suites**:
  - `language-server/test/rename.test.js`: 30 unit test scenarios covering global/local variables, shadowing, parameters, functions, multiple calls, structs, fields, methods, constructor protection, inheritance, overridden methods, super references, namespace, selective import, string & comment protection, keyword/builtin rejections, identifier validation, collision detection, cursor bounds, and array/object property safety.
  - `scratch/test_rename_v130.js`: 13 protocol-level JSON-RPC stdio integration tests against the live language server process.
  - `scratch/test_language_server.js`: Added Section 11 (5 Rename Symbol tests), bringing master suite to 48/48 tests.

### Language Server Protocol — Find References (Phase 2)

#### Added
- **Find References Provider (`language-server/src/references.js`)**:
  - Implemented `getReferences(analysisResult, position, context)` resolving references across variables, parameters, functions, structs, instance methods, inherited methods, and modules.
  - Implemented `isSameSymbol(a, b)` ensuring strict separation of identically named symbols across different scopes and structs.
  - Added support for `context.includeDeclaration` flag with location deduplication.
  - Built-in functions and keywords protected from returning false references.
- **Server Capability Advertisement (`language-server/src/server.js`)**:
  - Registered `referencesProvider: true` in `connection.onInitialize` response.
  - Added `connection.onReferences` handler with isolated try/catch returning `[]` on invalid cursor positions or undefined symbols without server crash.
- **Semantic Analyzer Member & Cross-Module Enhancements (`language-server/src/analyzer.js`)**:
  - Token-level location tracking for struct fields, methods, constructors (`wiwiti`), instance property reads/assignments, and `anyar` instantiations.
  - Inheritance reference resolution via `super.method()` mapping accurately to base struct method declarations.
  - Selective import specifier tracking and namespace member resolution.
- **Test Suites**:
  - `language-server/test/references.test.js`: 22 unit test scenarios validating scope resolution, shadowing, calls, structs, methods, inheritance, modules, bounds, builtins, and malformed files.
  - `scratch/test_references_v130.js`: 12 protocol-level integration tests communicating via JSON-RPC stdio directly to the server binary.

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
