const fs = require('fs');
const path = require('path');

const PROJECT_DIR = 'D:\\Jawascript';

// 1. Create src/module_loader.js
const moduleLoaderCode = `const fs = require("fs");
const path = require("path");
const lexer = require("./lexer");
const parser = require("./parser");

class ModuleLoader {
    constructor() {
        // Cache: canonicalPath -> { status, canonicalPath, env, functions, exports }
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
                throw new Error(\`Ekstensi file ora sah: "\${trimmed}". Mung file ".jawa" sing diidinake (Hanya file .jawa yang diizinkan)\`);
            }
        } else {
            targetFile = trimmed + ".jawa";
        }

        const baseDir = path.dirname(currentFilePath);
        const canonicalPath = path.normalize(path.resolve(baseDir, targetFile));

        if (!fs.existsSync(canonicalPath)) {
            throw new Error(\`Modul ora ditemokake: "\${importPath}" ing "\${canonicalPath}" (Modul tidak ditemukan)\`);
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
                throw new Error(\`Ketergantungan modul bunder ditemokake (Circular module dependency): "\${path.basename(canonicalPath)}"\`);
            }
            if (cached.status === "LOADED") {
                return cached;
            }
            if (cached.status === "FAILED") {
                throw new Error(\`Modul "\${path.basename(canonicalPath)}" gagal dimuat sadurunge (Modul gagal dimuat)\`);
            }
        }

        const record = {
            status: "LOADING",
            canonicalPath: canonicalPath,
            env: null,
            functions: {},
            exports: {
                variables: {},
                functions: {}
            }
        };

        this.cache.set(canonicalPath, record);

        let source;
        try {
            source = fs.readFileSync(canonicalPath, "utf8");
        } catch (err) {
            record.status = "FAILED";
            throw new Error(\`Ora bisa maca modul "\${canonicalPath}": \${err.message}\`);
        }

        let tokens, ast;
        try {
            tokens = lexer(source);
            ast = parser(tokens);
        } catch (err) {
            record.status = "FAILED";
            throw new Error(\`Kasalahan sintaks ing modul "\${path.basename(canonicalPath)}": \${err.message}\`);
        }

        try {
            executeModuleCallback(ast, canonicalPath, record);
            record.status = "LOADED";
            return record;
        } catch (err) {
            record.status = "FAILED";
            throw err;
        }
    }
}

module.exports = ModuleLoader;
`;

fs.writeFileSync(path.join(PROJECT_DIR, 'src', 'module_loader.js'), moduleLoaderCode, 'utf8');
console.log('src/module_loader.js created');

// 2. Create examples/modules directory
const modulesDir = path.join(PROJECT_DIR, 'examples', 'modules');
if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
}
const nestedDir = path.join(modulesDir, 'nested');
if (!fs.existsSync(nestedDir)) {
    fs.mkdirSync(nestedDir, { recursive: true });
}

// 3. Create module fixtures
// matematika.jawa
fs.writeFileSync(path.join(modulesDir, 'matematika.jawa'), `// matematika.jawa
ekspor fungsi tambah(a, b) {
    bali a + b
}

ekspor fungsi ping(a, b) {
    bali a * b
}

ekspor gawe versi = "1.0.0"
`, 'utf8');

// konstanta.jawa
fs.writeFileSync(path.join(modulesDir, 'konstanta.jawa'), `// konstanta.jawa
ekspor gawe pi = 3.14
ekspor gawe e = 2.718
`, 'utf8');

// private.jawa
fs.writeFileSync(path.join(modulesDir, 'private.jawa'), `// private.jawa
gawe rahasia = "kunci_rahasia_123"

ekspor gawe publik = "data_publik"

ekspor fungsi getRahasia() {
    bali rahasia
}
`, 'utf8');

// counter.jawa
fs.writeFileSync(path.join(modulesDir, 'counter.jawa'), `// counter.jawa
ekspor gawe hitungan = 0

ekspor fungsi tambahHitungan() {
    hitungan = hitungan + 1
    bali hitungan
}

ekspor fungsi getHitungan() {
    bali hitungan
}
`, 'utf8');

// helper.jawa
fs.writeFileSync(path.join(modulesDir, 'helper.jawa'), `// helper.jawa
ekspor fungsi gabung(a, b) {
    bali a + " - " + b
}
`, 'utf8');

// chain_c.jawa
fs.writeFileSync(path.join(modulesDir, 'chain_c.jawa'), `// chain_c.jawa
ekspor fungsi nilaiC() {
    bali 300
}
`, 'utf8');

// chain_b.jawa
fs.writeFileSync(path.join(modulesDir, 'chain_b.jawa'), `// chain_b.jawa
impor "chain_c"

ekspor fungsi nilaiB() {
    bali nilaiC() + 20
}
`, 'utf8');

// chain_a.jawa
fs.writeFileSync(path.join(modulesDir, 'chain_a.jawa'), `// chain_a.jawa
impor "chain_b"

ekspor fungsi nilaiA() {
    bali nilaiB() + 1
}
`, 'utf8');

// common.jawa
fs.writeFileSync(path.join(modulesDir, 'common.jawa'), `// common.jawa
tulis "init common"

ekspor gawe status = "AKTIF"
`, 'utf8');

// importer_a.jawa
fs.writeFileSync(path.join(modulesDir, 'importer_a.jawa'), `// importer_a.jawa
impor "common"

ekspor fungsi getStatusA() {
    bali "A:" + status
}
`, 'utf8');

// importer_b.jawa
fs.writeFileSync(path.join(modulesDir, 'importer_b.jawa'), `// importer_b.jawa
impor "common"

ekspor fungsi getStatusB() {
    bali "B:" + status
}
`, 'utf8');

// circular_b.jawa
fs.writeFileSync(path.join(modulesDir, 'circular_b.jawa'), `// circular_b.jawa
impor "circular_a"

ekspor fungsi b() {
    bali "b"
}
`, 'utf8');

// circular_a.jawa
fs.writeFileSync(path.join(modulesDir, 'circular_a.jawa'), `// circular_a.jawa
impor "circular_b"

ekspor fungsi a() {
    bali "a"
}
`, 'utf8');

// runtime_error.jawa
fs.writeFileSync(path.join(modulesDir, 'runtime_error.jawa'), `// runtime_error.jawa
lempar "module gagal dieksekusi"
`, 'utf8');

// syntax_error.jawa
fs.writeFileSync(path.join(modulesDir, 'syntax_error.jawa'), `// syntax_error.jawa
gawe = 100
`, 'utf8');

// nested/helper.jawa
fs.writeFileSync(path.join(nestedDir, 'helper.jawa'), `// nested/helper.jawa
ekspor fungsi salam(nama) {
    bali "Halo " + nama
}
`, 'utf8');

console.log('All fixtures created successfully');
