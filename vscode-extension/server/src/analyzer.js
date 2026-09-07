let lexer, parser;
try {
    lexer = require('../../src/lexer');
    parser = require('../../src/parser');
} catch (_) {
    lexer = require('../runtime/lexer');
    parser = require('../runtime/parser');
}
const moduleManager = require('./modules');
const { BUILTINS, KEYWORDS, uriToPath, inferExpressionType, isPositionInRange } = require('./utils');

class Scope {
    constructor(parent = null, kind = 'block') {
        this.parent = parent;
        this.kind = kind; // 'global', 'function', 'struct', 'method', 'block'
        this.symbols = new Map();
        this.children = [];
        this.range = null; // { start, end }
        this.enclosingStruct = null;
        this.enclosingMethod = null;
        if (parent) {
            parent.children.push(this);
            this.enclosingStruct = parent.enclosingStruct;
            this.enclosingMethod = parent.enclosingMethod;
        }
    }

    define(name, symbol) {
        this.symbols.set(name, symbol);
    }

    lookup(name) {
        if (this.symbols.has(name)) {
            return this.symbols.get(name);
        }
        if (this.parent) {
            return this.parent.lookup(name);
        }
        return null;
    }

    lookupLocal(name) {
        return this.symbols.get(name) || null;
    }

    getAllVisibleSymbols() {
        const map = new Map();
        let curr = this;
        while (curr) {
            for (const [name, sym] of curr.symbols.entries()) {
                if (!map.has(name)) {
                    map.set(name, sym);
                }
            }
            curr = curr.parent;
        }
        return Array.from(map.values());
    }
}

class Analyzer {
    analyze(text, uri) {
        const filePath = uriToPath(uri);
        const diagnostics = [];
        let tokens = [];
        let ast = [];

        // 1. Lexing phase
        try {
            tokens = lexer(text);
        } catch (err) {
            const line = err.line !== undefined ? err.line : 0;
            const character = err.character !== undefined ? err.character : 0;
            diagnostics.push({
                severity: 1, // Error
                range: {
                    start: { line, character },
                    end: { line, character: character + 1 }
                },
                message: `[Jawalang] Kasalahan leksikal: ${err.message}`,
                source: 'Jawalang'
            });
            return {
                uri,
                filePath,
                text,
                tokens: [],
                ast: [],
                globalScope: new Scope(null, 'global'),
                scopes: [],
                symbols: [],
                references: [],
                diagnostics,
                structs: new Map()
            };
        }

        // 2. Parsing phase
        try {
            ast = parser(tokens);
        } catch (err) {
            const line = err.line !== undefined ? err.line : 0;
            const character = err.character !== undefined ? err.character : 0;
            const endChar = (err.loc && err.loc.end) ? err.loc.end.character : character + 1;
            diagnostics.push({
                severity: 1, // Error
                range: {
                    start: { line, character },
                    end: { line, character: Math.max(character + 1, endChar) }
                },
                message: `[Jawalang] Syntax error: ${err.message}`,
                source: 'Jawalang'
            });

            // Parse recovery: if trailing dot prevented complete AST construction, attempt recovery for IDE features
            let recovered = false;
            if (text.includes('.')) {
                try {
                    const recoveredText = text.replace(/\.([ \t]*)([\r\n}]|$)/g, '.__lsp_prop__$1$2');
                    const recTokens = lexer(recoveredText);
                    ast = parser(recTokens);
                    recovered = true;
                } catch (_) {}
            }

            if (!recovered) {
                return {
                    uri,
                    filePath,
                    text,
                    tokens,
                    ast: [],
                    globalScope: new Scope(null, 'global'),
                    scopes: [],
                    symbols: [],
                    references: [],
                    diagnostics,
                    structs: new Map()
                };
            }
        }

        // 3. Semantic Analysis Phase
        const globalScope = new Scope(null, 'global');
        const scopes = [globalScope];
        const allSymbols = [];
        const references = [];
        const structs = new Map();

        // Register built-ins in global scope
        for (const [bName, bInfo] of Object.entries(BUILTINS)) {
            const sym = {
                name: bName,
                kind: 'builtin',
                signature: bInfo.signature,
                description: bInfo.description,
                params: bInfo.params,
                returnType: bInfo.returnType,
                example: bInfo.example,
                uri: null,
                loc: null
            };
            globalScope.define(bName, sym);
        }

        // Pass 1: Hoist functions, structs, and imports into global scope
        for (const stmt of ast) {
            this.hoistStatement(stmt, globalScope, filePath, uri, allSymbols, structs, diagnostics);
        }

        // Pass 2: Analyze all statement bodies and expressions in full scope hierarchy
        for (const stmt of ast) {
            this.analyzeStatement(stmt, globalScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
        }

        return {
            uri,
            filePath,
            text,
            tokens,
            ast,
            globalScope,
            scopes,
            symbols: allSymbols,
            references,
            diagnostics,
            structs
        };
    }

    hoistStatement(stmt, scope, filePath, uri, allSymbols, structs, diagnostics) {
        if (!stmt) return;

        // Handle ExportStatement wrapper
        let actual = stmt;
        if (stmt.type === 'ExportStatement' && stmt.declaration) {
            actual = stmt.declaration;
        }

        if (actual.type === 'FunctionDeclaration') {
            const sym = {
                name: actual.name,
                kind: 'function',
                node: actual,
                loc: actual.loc,
                nameLoc: actual.nameLoc || actual.loc,
                uri,
                filePath,
                parameters: actual.parameters || [],
                returnType: 'unknown'
            };
            scope.define(actual.name, sym);
            allSymbols.push(sym);
        } else if (actual.type === 'StructDeclaration') {
            const structFields = (actual.fields || []).map(f => f.name);
            const structMethods = new Map();
            let constructor = null;

            for (const m of actual.methods || []) {
                const mSym = {
                    name: m.name,
                    kind: m.name === 'wiwiti' ? 'constructor' : 'method',
                    node: m,
                    parameters: m.parameters || [],
                    loc: m.loc,
                    nameLoc: m.nameLoc || m.loc
                };
                structMethods.set(m.name, mSym);
                if (m.name === 'wiwiti') constructor = mSym;
            }

            const sym = {
                name: actual.name,
                kind: 'struct',
                node: actual,
                loc: actual.loc,
                nameLoc: actual.nameLoc || actual.loc,
                uri,
                filePath,
                parent: actual.parent,
                fields: structFields,
                methods: structMethods,
                constructor
            };
            scope.define(actual.name, sym);
            allSymbols.push(sym);
            structs.set(actual.name, sym);
        } else if (actual.type === 'ImportStatement') {
            const importSource = actual.path || actual.source?.value || (typeof actual.source === 'string' ? actual.source : null);
            if (!importSource) return;

            try {
                const canonicalTarget = moduleManager.resolve(importSource, filePath);
                const mod = moduleManager.getModuleExports(canonicalTarget);

                if (mod.error) {
                    diagnostics.push({
                        severity: 1,
                        range: actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                        message: `Kasalahan ing modul "${importSource}": ${mod.error.message}`,
                        source: 'Jawalang'
                    });
                    return;
                }

                // Namespace import: impor "..." minangka ns
                const nsName = actual.namespace || actual.alias?.value || (typeof actual.alias === 'string' ? actual.alias : null);
                if (actual.mode === 'namespace' || nsName) {
                    const nsSym = {
                        name: nsName,
                        kind: 'namespace',
                        moduleRecord: mod,
                        loc: actual.loc,
                        nameLoc: actual.loc,
                        uri,
                        filePath
                    };
                    scope.define(nsName, nsSym);
                    allSymbols.push(nsSym);
                } else if ((actual.mode === 'selective' || actual.specifiers) && Array.isArray(actual.specifiers) && actual.specifiers.length > 0) {
                    // Selective import: impor { a, b } saka "..."
                    for (const spec of actual.specifiers) {
                        const sName = spec.local || spec.imported || (typeof spec === 'string' ? spec : spec.value);
                        const sLoc = (typeof spec === 'object' && spec.loc) ? spec.loc : actual.loc;

                        const expVar = mod.exports.variables[sName];
                        const expFn = mod.exports.functions[sName];
                        const expStruct = mod.exports.structs[sName];

                        if (!expVar && !expFn && !expStruct) {
                            diagnostics.push({
                                severity: 1,
                                range: sLoc || actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                                message: `Export "${sName}" ora ditemokake ing modul "${importSource}".`,
                                source: 'Jawalang'
                            });
                        } else {
                            const found = expVar || expFn || expStruct;
                            const sym = {
                                ...found,
                                nameLoc: sLoc || found.nameLoc || found.loc,
                                importedFrom: canonicalTarget
                            };
                            scope.define(sName, sym);
                            allSymbols.push(sym);
                        }
                    }
                } else {
                    // Whole module import: import all exports into scope
                    for (const v of Object.values(mod.exports.variables)) {
                        scope.define(v.name, v);
                        allSymbols.push(v);
                    }
                    for (const f of Object.values(mod.exports.functions)) {
                        scope.define(f.name, f);
                        allSymbols.push(f);
                    }
                    for (const s of Object.values(mod.exports.structs)) {
                        scope.define(s.name, s);
                        allSymbols.push(s);
                        structs.set(s.name, s);
                    }
                }
            } catch (err) {
                diagnostics.push({
                    severity: 1,
                    range: actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                    message: `Modul ora ditemokake: "${importSource}".`,
                    source: 'Jawalang'
                });
            }
        }
    }

    analyzeStatement(stmt, scope, filePath, uri, scopes, allSymbols, references, structs, diagnostics) {
        if (!stmt) return;

        let actual = stmt;
        if (stmt.type === 'ExportStatement' && stmt.declaration) {
            actual = stmt.declaration;
        }

        switch (actual.type) {
            case 'VariableDeclaration': {
                const inferredType = inferExpressionType(actual.value, scope);
                const sym = {
                    name: actual.name,
                    kind: 'variable',
                    node: actual,
                    loc: actual.loc,
                    nameLoc: actual.nameLoc || actual.loc,
                    uri,
                    filePath,
                    inferredType
                };
                scope.define(actual.name, sym);
                allSymbols.push(sym);
                this.analyzeExpression(actual.value, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'AssignmentStatement': {
                // Check if variable being assigned is declared
                const sym = scope.lookup(actual.name);
                if (!sym) {
                    diagnostics.push({
                        severity: 1,
                        range: actual.nameLoc || actual.loc,
                        message: `Variabel "${actual.name}" ora ditemokake sadurunge di-assign.`,
                        source: 'Jawalang'
                    });
                } else {
                    references.push({
                        name: actual.name,
                        loc: actual.nameLoc || actual.loc,
                        symbol: sym
                    });
                }
                this.analyzeExpression(actual.value, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'IndexAssignmentStatement': {
                this.analyzeExpression(actual.object, scope, filePath, uri, references, structs, diagnostics);
                this.analyzeExpression(actual.index, scope, filePath, uri, references, structs, diagnostics);
                this.analyzeExpression(actual.value, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'FunctionDeclaration': {
                const fnScope = new Scope(scope, 'function');
                fnScope.range = actual.loc;
                scopes.push(fnScope);

                // Register parameters in function scope
                if (actual.parameters) {
                    for (const param of actual.parameters) {
                        const paramName = typeof param === 'string' ? param : param.value;
                        const paramLoc = (typeof param === 'object' && param.loc) ? param.loc : actual.loc;
                        const pSym = {
                            name: paramName,
                            kind: 'parameter',
                            loc: paramLoc,
                            nameLoc: paramLoc,
                            uri,
                            filePath,
                            enclosingFunction: actual.name,
                            inferredType: 'any'
                        };
                        fnScope.define(paramName, pSym);
                        allSymbols.push(pSym);
                    }
                }

                // Analyze function body statements
                if (actual.body) {
                    const bodyList = Array.isArray(actual.body) ? actual.body : [actual.body];
                    for (const s of bodyList) {
                        this.analyzeStatement(s, fnScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                    }
                }
                break;
            }

            case 'StructDeclaration': {
                const structScope = new Scope(scope, 'struct');
                structScope.range = actual.loc;
                structScope.enclosingStruct = structs.get(actual.name);
                scopes.push(structScope);

                // Validate parent struct if inheriting
                if (actual.parent) {
                    const parentName = typeof actual.parent === 'string' ? actual.parent : actual.parent.value;
                    const parentSym = scope.lookup(parentName);
                    if (!parentSym || parentSym.kind !== 'struct') {
                        diagnostics.push({
                            severity: 1,
                            range: actual.parentLoc || actual.loc,
                            message: `Struct induk "${parentName}" ora ditemokake.`,
                            source: 'Jawalang'
                        });
                    } else {
                        references.push({
                            name: parentName,
                            loc: actual.parentLoc || actual.loc,
                            symbol: parentSym
                        });
                    }
                }

                // Register fields
                if (actual.fields) {
                    for (const f of actual.fields) {
                        const fSym = {
                            name: f.name,
                            kind: 'field',
                            loc: f.loc,
                            nameLoc: f.nameLoc || f.loc,
                            uri,
                            filePath,
                            enclosingStruct: actual.name
                        };
                        structScope.define(f.name, fSym);
                        allSymbols.push(fSym);
                        if (f.defaultValue) {
                            this.analyzeExpression(f.defaultValue, structScope, filePath, uri, references, structs, diagnostics);
                        }
                    }
                }

                // Register and analyze methods
                if (actual.methods) {
                    for (const m of actual.methods) {
                        const isCtor = m.name === 'wiwiti';
                        const mScope = new Scope(structScope, 'method');
                        mScope.range = m.loc;
                        mScope.enclosingStruct = structs.get(actual.name);
                        mScope.enclosingMethod = m;
                        scopes.push(mScope);

                        // Define 'iki' in method scope
                        mScope.define('iki', {
                            name: 'iki',
                            kind: 'receiver',
                            enclosingStruct: actual.name,
                            inferredType: `instance of ${actual.name}`,
                            loc: m.loc
                        });

                        // Define 'super' if subclass
                        if (actual.parent) {
                            const pName = typeof actual.parent === 'string' ? actual.parent : actual.parent.value;
                            mScope.define('super', {
                                name: 'super',
                                kind: 'super',
                                parentStruct: pName,
                                loc: m.loc
                            });
                        }

                        // Register method parameters
                        if (m.parameters) {
                            for (const param of m.parameters) {
                                const pName = typeof param === 'string' ? param : param.value;
                                const pLoc = (typeof param === 'object' && param.loc) ? param.loc : m.loc;
                                const pSym = {
                                    name: pName,
                                    kind: 'parameter',
                                    loc: pLoc,
                                    nameLoc: pLoc,
                                    uri,
                                    filePath,
                                    enclosingMethod: m.name,
                                    inferredType: 'any'
                                };
                                mScope.define(pName, pSym);
                                allSymbols.push(pSym);
                            }
                        }

                        // Analyze method body
                        if (m.body) {
                            const bodyList = Array.isArray(m.body) ? m.body : [m.body];
                            for (const s of bodyList) {
                                this.analyzeStatement(s, mScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                            }
                        }
                    }
                }
                break;
            }

            case 'IfStatement': {
                this.analyzeExpression(actual.condition, scope, filePath, uri, references, structs, diagnostics);
                const thenScope = new Scope(scope, 'block');
                scopes.push(thenScope);
                const thenList = Array.isArray(actual.consequent) ? actual.consequent : [actual.consequent];
                for (const s of thenList) {
                    this.analyzeStatement(s, thenScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }
                if (actual.alternate) {
                    const elseScope = new Scope(scope, 'block');
                    scopes.push(elseScope);
                    const elseList = Array.isArray(actual.alternate) ? actual.alternate : [actual.alternate];
                    for (const s of elseList) {
                        this.analyzeStatement(s, elseScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                    }
                }
                break;
            }

            case 'WhileStatement': {
                this.analyzeExpression(actual.condition, scope, filePath, uri, references, structs, diagnostics);
                const whileScope = new Scope(scope, 'block');
                scopes.push(whileScope);
                const bodyList = Array.isArray(actual.body) ? actual.body : [actual.body];
                for (const s of bodyList) {
                    this.analyzeStatement(s, whileScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }
                break;
            }

            case 'ForStatement': {
                const forScope = new Scope(scope, 'block');
                scopes.push(forScope);
                if (actual.variable) {
                    const vName = typeof actual.variable === 'string' ? actual.variable : actual.variable.value;
                    const vLoc = (typeof actual.variable === 'object' && actual.variable.loc) ? actual.variable.loc : actual.loc;
                    const vSym = {
                        name: vName,
                        kind: 'variable',
                        loc: vLoc,
                        nameLoc: vLoc,
                        uri,
                        filePath,
                        inferredType: 'number'
                    };
                    forScope.define(vName, vSym);
                    allSymbols.push(vSym);
                }
                if (actual.start) this.analyzeExpression(actual.start, forScope, filePath, uri, references, structs, diagnostics);
                if (actual.end) this.analyzeExpression(actual.end, forScope, filePath, uri, references, structs, diagnostics);
                if (actual.step) this.analyzeExpression(actual.step, forScope, filePath, uri, references, structs, diagnostics);
                const bodyList = Array.isArray(actual.body) ? actual.body : [actual.body];
                for (const s of bodyList) {
                    this.analyzeStatement(s, forScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }
                break;
            }

            case 'ForEachStatement': {
                const forEachScope = new Scope(scope, 'block');
                scopes.push(forEachScope);
                if (actual.iterator) {
                    const itName = typeof actual.iterator === 'string' ? actual.iterator : actual.iterator.value;
                    const itLoc = (typeof actual.iterator === 'object' && actual.iterator.loc) ? actual.iterator.loc : actual.loc;
                    const itSym = {
                        name: itName,
                        kind: 'variable',
                        loc: itLoc,
                        nameLoc: itLoc,
                        uri,
                        filePath,
                        inferredType: 'any'
                    };
                    forEachScope.define(itName, itSym);
                    allSymbols.push(itSym);
                }
                if (actual.collection) {
                    this.analyzeExpression(actual.collection, scope, filePath, uri, references, structs, diagnostics);
                }
                const bodyList = Array.isArray(actual.body) ? actual.body : [actual.body];
                for (const s of bodyList) {
                    this.analyzeStatement(s, forEachScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }
                break;
            }

            case 'TryCatchStatement': {
                const tryScope = new Scope(scope, 'block');
                scopes.push(tryScope);
                const tryList = Array.isArray(actual.tryBlock) ? actual.tryBlock : [actual.tryBlock];
                for (const s of tryList) {
                    this.analyzeStatement(s, tryScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }

                const catchScope = new Scope(scope, 'block');
                scopes.push(catchScope);
                if (actual.catchParam) {
                    const cName = typeof actual.catchParam === 'string' ? actual.catchParam : actual.catchParam.value;
                    const cLoc = (typeof actual.catchParam === 'object' && actual.catchParam.loc) ? actual.catchParam.loc : actual.loc;
                    const cSym = {
                        name: cName,
                        kind: 'variable',
                        loc: cLoc,
                        nameLoc: cLoc,
                        uri,
                        filePath,
                        inferredType: 'string'
                    };
                    catchScope.define(cName, cSym);
                    allSymbols.push(cSym);
                }
                const catchList = Array.isArray(actual.catchBlock) ? actual.catchBlock : [actual.catchBlock];
                for (const s of catchList) {
                    this.analyzeStatement(s, catchScope, filePath, uri, scopes, allSymbols, references, structs, diagnostics);
                }
                break;
            }

            case 'PrintStatement':
            case 'ThrowStatement':
            case 'ReturnStatement': {
                const expr = actual.expression || actual.argument || actual.value;
                if (expr) {
                    this.analyzeExpression(expr, scope, filePath, uri, references, structs, diagnostics);
                }
                break;
            }

            case 'ExpressionStatement': {
                if (actual.expression) {
                    this.analyzeExpression(actual.expression, scope, filePath, uri, references, structs, diagnostics);
                }
                break;
            }

            case 'SuperCall': {
                if (scope.kind !== 'method' || !scope.enclosingMethod || scope.enclosingMethod.name !== 'wiwiti') {
                    diagnostics.push({
                        severity: 1,
                        range: actual.loc,
                        message: '"super()" mung bisa digunakake ing njero constructor "wiwiti".',
                        source: 'Jawalang'
                    });
                }
                if (actual.arguments) {
                    for (const arg of actual.arguments) {
                        this.analyzeExpression(arg, scope, filePath, uri, references, structs, diagnostics);
                    }
                }
                break;
            }

            default:
                break;
        }
    }

    analyzeExpression(expr, scope, filePath, uri, references, structs, diagnostics) {
        if (!expr) return;

        switch (expr.type) {
            case 'IDENTIFIER': {
                const name = expr.value;
                const sym = scope.lookup(name);
                if (!sym) {
                    diagnostics.push({
                        severity: 1,
                        range: expr.loc,
                        message: `Variabel "${name}" ora ditemokake.`,
                        source: 'Jawalang'
                    });
                } else {
                    references.push({
                        name,
                        loc: expr.loc,
                        symbol: sym
                    });
                }
                break;
            }

            case 'IkiExpression': {
                if (scope.kind !== 'method' && !scope.enclosingStruct) {
                    diagnostics.push({
                        severity: 1,
                        range: expr.loc,
                        message: '"iki" mung bisa digunakake ing njero method utawa constructor.',
                        source: 'Jawalang'
                    });
                }
                break;
            }

            case 'SuperExpression': {
                if (scope.kind !== 'method' || !scope.enclosingStruct || !scope.enclosingStruct.parent) {
                    diagnostics.push({
                        severity: 1,
                        range: expr.loc,
                        message: '"super" mung bisa digunakake ing njero struct turunan (ngembangake).',
                        source: 'Jawalang'
                    });
                }
                break;
            }

            case 'CallExpression': {
                // Callee analysis
                if (expr.callee && expr.callee.type === 'IDENTIFIER') {
                    const fnName = expr.callee.value;
                    const sym = scope.lookup(fnName);
                    if (!sym) {
                        diagnostics.push({
                            severity: 1,
                            range: expr.callee.loc,
                            message: `Fungsi "${fnName}" ora ditemokake.`,
                            source: 'Jawalang'
                        });
                    } else {
                        references.push({
                            name: fnName,
                            loc: expr.callee.loc,
                            symbol: sym
                        });

                        // Check argument count if user function has fixed parameters
                        if (sym.kind === 'function' && Array.isArray(sym.parameters) && expr.arguments) {
                            if (expr.arguments.length !== sym.parameters.length) {
                                diagnostics.push({
                                    severity: 2, // Warning
                                    range: expr.loc || expr.callee?.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
                                    message: `Fungsi "${fnName}" mbutuhake ${sym.parameters.length} parameter, nanging diwenehi ${expr.arguments.length}.`,
                                    source: 'Jawalang'
                                });
                            }
                        }
                    }
                } else if (expr.callee) {
                    this.analyzeExpression(expr.callee, scope, filePath, uri, references, structs, diagnostics);
                }

                // Analyze arguments
                if (expr.arguments) {
                    for (const arg of expr.arguments) {
                        this.analyzeExpression(arg, scope, filePath, uri, references, structs, diagnostics);
                    }
                }
                break;
            }

            case 'NewExpression': {
                const structName = expr.callee?.value;
                if (structName) {
                    const sym = scope.lookup(structName);
                    if (!sym || sym.kind !== 'struct') {
                        diagnostics.push({
                            severity: 1,
                            range: expr.callee.loc || expr.loc,
                            message: `Struct "${structName}" ora ditemokake.`,
                            source: 'Jawalang'
                        });
                    } else {
                        references.push({
                            name: structName,
                            loc: expr.callee.loc || expr.loc,
                            symbol: sym
                        });
                    }
                }
                if (expr.arguments) {
                    for (const arg of expr.arguments) {
                        this.analyzeExpression(arg, scope, filePath, uri, references, structs, diagnostics);
                    }
                }
                break;
            }

            case 'IndexExpression': {
                // If object is an identifier and is a namespace (e.g. math.kurang)
                if (expr.object && expr.object.type === 'IDENTIFIER' && expr.index && expr.index.type === 'STRING') {
                    const objName = expr.object.value;
                    const propName = expr.index.value;
                    const sym = scope.lookup(objName);
                    if (sym && sym.kind === 'namespace' && sym.moduleRecord) {
                        references.push({
                            name: objName,
                            loc: expr.object.loc,
                            symbol: sym
                        });

                        const expVar = sym.moduleRecord.exports.variables[propName];
                        const expFn = sym.moduleRecord.exports.functions[propName];
                        const expStruct = sym.moduleRecord.exports.structs[propName];
                        const foundExp = expVar || expFn || expStruct;

                        if (!foundExp) {
                            diagnostics.push({
                                severity: 1,
                                range: expr.index.loc || expr.loc,
                                message: `Symbol "${propName}" ora diekspor saka modul.`,
                                source: 'Jawalang'
                            });
                        } else {
                            references.push({
                                name: propName,
                                loc: expr.index.loc,
                                symbol: foundExp
                            });
                        }
                        break;
                    }
                }
                this.analyzeExpression(expr.object, scope, filePath, uri, references, structs, diagnostics);
                this.analyzeExpression(expr.index, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'BinaryExpression': {
                this.analyzeExpression(expr.left, scope, filePath, uri, references, structs, diagnostics);
                this.analyzeExpression(expr.right, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'UnaryExpression': {
                this.analyzeExpression(expr.argument, scope, filePath, uri, references, structs, diagnostics);
                break;
            }

            case 'ArrayExpression': {
                if (expr.elements) {
                    for (const el of expr.elements) {
                        this.analyzeExpression(el, scope, filePath, uri, references, structs, diagnostics);
                    }
                }
                break;
            }

            case 'ObjectExpression': {
                if (expr.properties) {
                    for (const prop of expr.properties) {
                        if (prop.value) {
                            this.analyzeExpression(prop.value, scope, filePath, uri, references, structs, diagnostics);
                        }
                    }
                }
                break;
            }

            default:
                break;
        }
    }
}

module.exports = new Analyzer();
