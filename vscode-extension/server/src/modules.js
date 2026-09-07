const fs = require('fs');
const path = require('path');
let lexer, parser;
try {
    lexer = require('../../src/lexer');
    parser = require('../../src/parser');
} catch (_) {
    lexer = require('../runtime/lexer');
    parser = require('../runtime/parser');
}
const { pathToUri } = require('./utils');

class ModuleManager {
    constructor() {
        // Cache: canonicalPath -> { canonicalPath, uri, mtime, exports: { variables, functions, structs }, ast, error }
        this.cache = new Map();
    }

    /**
     * Resolve module path relative to importer file
     * @param {string} importPath - string from impor statement
     * @param {string} currentFilePath - absolute path of current document
     * @returns {string} canonical absolute path
     */
    resolve(importPath, currentFilePath) {
        if (!importPath || typeof importPath !== 'string' || importPath.trim() === '') {
            throw new Error('Path modul ora kena kosong');
        }

        const trimmed = importPath.trim();
        const ext = path.extname(trimmed);
        let targetFile = trimmed;
        if (ext) {
            if (ext !== '.jawa') {
                throw new Error(`Ekstensi file ora sah: "${trimmed}". Mung file ".jawa" sing diidinake`);
            }
        } else {
            targetFile = trimmed + '.jawa';
        }

        const baseDir = currentFilePath ? path.dirname(currentFilePath) : process.cwd();
        let canonicalPath = path.normalize(path.resolve(baseDir, targetFile));

        if (!fs.existsSync(canonicalPath)) {
            throw new Error(`Modul ora ditemokake: "${importPath}" ing "${canonicalPath}"`);
        }

        try {
            canonicalPath = fs.realpathSync.native ? fs.realpathSync.native(canonicalPath) : fs.realpathSync(canonicalPath);
        } catch (_) {}

        return canonicalPath;
    }

    /**
     * Statically inspect target module and extract exported symbols without executing code
     * @param {string} canonicalPath 
     * @param {Set<string>} visited 
     * @returns {Object} Module record
     */
    getModuleExports(canonicalPath, visited = new Set()) {
        if (visited.has(canonicalPath)) {
            return {
                canonicalPath,
                uri: pathToUri(canonicalPath),
                isCycle: true,
                exports: { variables: {}, functions: {}, structs: {} }
            };
        }

        try {
            const stat = fs.statSync(canonicalPath);
            const cached = this.cache.get(canonicalPath);
            if (cached && cached.mtime === stat.mtimeMs && !cached.error) {
                return cached;
            }

            visited.add(canonicalPath);

            const source = fs.readFileSync(canonicalPath, 'utf8');
            const tokens = lexer(source);
            const ast = parser(tokens);

            const record = {
                canonicalPath,
                uri: pathToUri(canonicalPath),
                mtime: stat.mtimeMs,
                exports: {
                    variables: {},
                    functions: {},
                    structs: {}
                },
                error: null
            };

            // Extract exported symbols from top-level AST statements
            for (const stmt of ast) {
                if (stmt.type === 'ExportStatement' && stmt.declaration) {
                    const decl = stmt.declaration;
                    if (decl.type === 'VariableDeclaration') {
                        record.exports.variables[decl.name] = {
                            name: decl.name,
                            kind: 'variable',
                            loc: decl.loc,
                            nameLoc: decl.nameLoc || decl.loc,
                            uri: record.uri,
                            filePath: canonicalPath
                        };
                    } else if (decl.type === 'FunctionDeclaration') {
                        record.exports.functions[decl.name] = {
                            name: decl.name,
                            kind: 'function',
                            parameters: decl.parameters || [],
                            loc: decl.loc,
                            nameLoc: decl.nameLoc || decl.loc,
                            uri: record.uri,
                            filePath: canonicalPath
                        };
                    } else if (decl.type === 'StructDeclaration') {
                        record.exports.structs[decl.name] = {
                            name: decl.name,
                            kind: 'struct',
                            parent: decl.parent,
                            fields: (decl.fields || []).map(f => f.name),
                            methods: (decl.methods || []).map(m => ({
                                name: m.name,
                                parameters: m.parameters || [],
                                loc: m.loc
                            })),
                            loc: decl.loc,
                            nameLoc: decl.nameLoc || decl.loc,
                            uri: record.uri,
                            filePath: canonicalPath
                        };
                    }
                }
            }

            this.cache.set(canonicalPath, record);
            visited.delete(canonicalPath);
            return record;
        } catch (err) {
            const errorRecord = {
                canonicalPath,
                uri: pathToUri(canonicalPath),
                exports: { variables: {}, functions: {}, structs: {} },
                error: err
            };
            this.cache.set(canonicalPath, errorRecord);
            return errorRecord;
        }
    }

    invalidate(canonicalPath) {
        if (canonicalPath) {
            this.cache.delete(canonicalPath);
        } else {
            this.cache.clear();
        }
    }
}

module.exports = new ModuleManager();
