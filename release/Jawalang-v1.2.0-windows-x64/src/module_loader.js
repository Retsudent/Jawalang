const fs = require("fs");
const path = require("path");
const lexer = require("./lexer");
const parser = require("./parser");

class ModuleLoader {
    constructor() {
        // Cache: canonicalPath -> { status, canonicalPath, env, functions, exports, error }
        this.cache = new Map();
    }

    /**
     * Resolve module path relative to importer file
     * @param {string} importPath - path from impor statement
     * @param {string} currentFilePath - absolute path of current module
     * @returns {string} canonical absolute path
     */
    resolve(importPath, currentFilePath) {
        if (!importPath || typeof importPath !== "string" || importPath.trim() === "") {
            throw new Error('Path modul ora kena kosong (Path modul tidak boleh kosong)');
        }

        const trimmed = importPath.trim();

        // Cek ekstensi
        const ext = path.extname(trimmed);
        let targetFile = trimmed;
        if (ext) {
            if (ext !== ".jawa") {
                throw new Error(`Ekstensi file ora sah: "${trimmed}". Mung file ".jawa" sing diidinake (Hanya file .jawa yang diizinkan)`);
            }
        } else {
            targetFile = trimmed + ".jawa";
        }

        const baseDir = path.dirname(currentFilePath);
        let canonicalPath = path.normalize(path.resolve(baseDir, targetFile));

        if (!fs.existsSync(canonicalPath)) {
            throw new Error(`Modul ora ditemokake: "${importPath}" ing "${canonicalPath}" (Modul tidak ditemukan)`);
        }

        try {
            canonicalPath = fs.realpathSync.native ? fs.realpathSync.native(canonicalPath) : fs.realpathSync(canonicalPath);
        } catch (_) {
            // Fallback to normalized canonicalPath
        }

        return canonicalPath;
    }

    /**
     * Load, parse, and execute module
     * @param {string} canonicalPath - canonical absolute path
     * @param {Function} executeModuleCallback - (ast, canonicalPath, record) => void
     * @returns {Object} module record
     */
    load(canonicalPath, executeModuleCallback) {
        if (this.cache.has(canonicalPath)) {
            const cached = this.cache.get(canonicalPath);
            if (cached.status === "LOADING") {
                throw new Error(`Ketergantungan modul bunder ditemokake (Circular module dependency): "${path.basename(canonicalPath)}"`);
            }
            if (cached.status === "LOADED") {
                return cached;
            }
            if (cached.status === "FAILED") {
                if (cached.error) {
                    throw cached.error;
                }
                throw new Error(`Modul "${path.basename(canonicalPath)}" gagal dimuat sadurunge (Modul gagal dimuat)`);
            }
        }

        const record = {
            status: "LOADING",
            canonicalPath: canonicalPath,
            env: null,
            functions: {},
            structs: {},
            exports: {
                variables: {},
                functions: {},
                structs: {}
            },
            error: null
        };

        this.cache.set(canonicalPath, record);

        let source;
        try {
            source = fs.readFileSync(canonicalPath, "utf8");
        } catch (err) {
            record.status = "FAILED";
            record.error = new Error(`Ora bisa maca modul "${canonicalPath}": ${err.message}`);
            throw record.error;
        }

        let tokens, ast;
        try {
            tokens = lexer(source);
            ast = parser(tokens);
        } catch (err) {
            record.status = "FAILED";
            record.error = new Error(`Kasalahan sintaks ing modul "${path.basename(canonicalPath)}": ${err.message}`);
            throw record.error;
        }

        try {
            executeModuleCallback(ast, canonicalPath, record);
            record.status = "LOADED";
            return record;
        } catch (err) {
            record.status = "FAILED";
            const modName = path.basename(canonicalPath);
            if (err instanceof Error && !err.message.includes(modName)) {
                err.message = `[Modul "${modName}"]: ${err.message}`;
            }
            record.error = err;
            throw err;
        }
    }
}

module.exports = ModuleLoader;
