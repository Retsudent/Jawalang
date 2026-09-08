const path = require('path');
const { URL, fileURLToPath, pathToFileURL } = require('url');

/**
 * Built-in functions dictionary with signatures, documentation, and return types
 */
const BUILTINS = {
    tulis: {
        signature: 'tulis <ekspresi>',
        description: 'Nyithak nilai ekspresi menyang konsol (stdout) kanthi baris anyar.',
        params: ['ekspresi'],
        returnType: 'null',
        example: 'tulis "Halo Jagad!"'
    },
    takon: {
        signature: 'takon(prompt?: string): string',
        description: 'Nampa input teks interaktif saka pangguna liwat terminal (stdin).',
        params: ['prompt'],
        returnType: 'string',
        example: 'gawe jeneng = takon("Jenengmu: ")'
    },
    dawa: {
        signature: 'dawa(koleksi: array | string): number',
        description: 'Mbalekake dawane array utawa cacahe karakter ing string.',
        params: ['koleksi'],
        returnType: 'number',
        example: 'dawa([1, 2, 3]) // => 3'
    },
    jupuk: {
        signature: 'jupuk(array: any[], indeks: number): any',
        description: 'Njupuk elemen array ing indeks tartamtu kanthi aman.',
        params: ['array', 'indeks'],
        returnType: 'any',
        example: 'jupuk([10, 20, 30], 1) // => 20'
    },
    nambah: {
        signature: 'nambah(array: any[], elemen: any): null',
        description: 'Nambah elemen anyar ing mburi array (mutating).',
        params: ['array', 'elemen'],
        returnType: 'null',
        example: 'nambah(data, "anyar")'
    },
    busak: {
        signature: 'busak(array: any[], indeks: number): any',
        description: 'Mbusak elemen ing indeks tartamtu saka array.',
        params: ['array', 'indeks'],
        returnType: 'any',
        example: 'busak(data, 0)'
    },
    motong: {
        signature: 'motong(teks: string, mulai: number, pungkasan: number): string',
        description: 'Motong bagean string adhedhasar indeks wiwitan lan pungkasan.',
        params: ['teks', 'mulai', 'pungkasan'],
        returnType: 'string',
        example: 'motong("Jawalang", 0, 4) // => "Jawa"'
    },
    ngganti: {
        signature: 'ngganti(teks: string, target: string, pangganti: string): string',
        description: 'Ngganti tembung ing njero teks nganggo teks pangganti.',
        params: ['teks', 'target', 'pangganti'],
        returnType: 'string',
        example: 'ngganti("Halo Budi", "Budi", "Siti")'
    },
    gedhe: {
        signature: 'gedhe(teks: string): string',
        description: 'Ngowahi kabeh huruf string dadi huruf kapital (uppercase).',
        params: ['teks'],
        returnType: 'string',
        example: 'gedhe("jawa") // => "JAWA"'
    },
    cilik: {
        signature: 'cilik(teks: string): string',
        description: 'Ngowahi kabeh huruf string dadi huruf cilik (lowercase).',
        params: ['teks'],
        returnType: 'string',
        example: 'cilik("JAWA") // => "jawa"'
    },
    jinis: {
        signature: 'jinis(nilai: any): string',
        description: 'Mbalekake jeneng tipe data nilai ("string", "number", "boolean", "array", "object", "function", "instance", "struct", "null").',
        params: ['nilai'],
        returnType: 'string',
        example: 'jinis(10) // => "number"'
    },
    kunci: {
        signature: 'kunci(obyek: object): string[]',
        description: 'Mbalekake kabeh jeneng properti (keys) saka sawijining obyek.',
        params: ['obyek'],
        returnType: 'array',
        example: 'kunci({ "a": 1, "b": 2 }) // => ["a", "b"]'
    },
    nilai: {
        signature: 'nilai(obyek: object): any[]',
        description: 'Mbalekake kabeh nilai (values) saka sawijining obyek.',
        params: ['obyek'],
        returnType: 'array',
        example: 'nilai({ "a": 1, "b": 2 }) // => [1, 2]'
    },
    duwe: {
        signature: 'duwe(obyek: object, kunci: string): boolean',
        description: 'Priksa apa sawijining kunci ana ing jero obyek.',
        params: ['obyek', 'kunci'],
        returnType: 'boolean',
        example: 'duwe(user, "jeneng") // => bener'
    },
    terapkan: {
        signature: 'terapkan(fungsi: (item) => any, array: any[]): any[]',
        description: 'Fungsi HOF map: ngowahi saben elemen array nganggo fungsi transformasi.',
        params: ['fungsi', 'array'],
        returnType: 'array',
        example: 'terapkan(kuadrat, [1, 2, 3]) // => [1, 4, 9]'
    },
    saring: {
        signature: 'saring(predikat: (item) => boolean, array: any[]): any[]',
        description: 'Fungsi HOF filter: nyaring elemen array sing ngasilake bener.',
        params: ['predikat', 'array'],
        returnType: 'array',
        example: 'saring(genap, [1, 2, 3, 4]) // => [2, 4]'
    },
    itung: {
        signature: 'itung(predikat: (item) => boolean, array: any[]): number',
        description: 'Fungsi HOF count: ngetung cacahe elemen sing nyukupi predikat.',
        params: ['predikat', 'array'],
        returnType: 'number',
        example: 'itung(genap, [1, 2, 3, 4]) // => 2'
    },
    gabung: {
        signature: 'gabung(array: any[], pamisah: string): string',
        description: 'Nggabungake elemen-elemen array dadi sak string kanthi pamisah.',
        params: ['array', 'pamisah'],
        returnType: 'string',
        example: 'gabung(["a", "b", "c"], "-") // => "a-b-c"'
    },
    balik: {
        signature: 'balik(array: any[]): any[]',
        description: 'Mbalekake array anyar mawa urutan kewalik (non-mutating).',
        params: ['array'],
        returnType: 'array',
        example: 'balik([1, 2, 3]) // => [3, 2, 1]'
    },
    urut: {
        signature: 'urut(array: number[]): number[]',
        description: 'Mbalekake array anyar kanthi urutan angka munggah (non-mutating).',
        params: ['array'],
        returnType: 'array',
        example: 'urut([3, 1, 2]) // => [1, 2, 3]'
    },
    ana: {
        signature: 'ana(predikat: (item) => boolean, array: any[]): boolean',
        description: 'Priksa apa minimal ana siji elemen sing nyukupi predikat (some).',
        params: ['predikat', 'array'],
        returnType: 'boolean',
        example: 'ana(genap, [1, 2, 3]) // => bener'
    },
    kabeh: {
        signature: 'kabeh(predikat: (item) => boolean, array: any[]): boolean',
        description: 'Priksa apa kabeh elemen nyukupi predikat (every).',
        params: ['predikat', 'array'],
        returnType: 'boolean',
        example: 'kabeh(genap, [2, 4, 6]) // => bener'
    },
    golek: {
        signature: 'golek(predikat: (item) => boolean, array: any[]): any',
        description: 'Nggoleki elemen pisanan sing nyukupi predikat.',
        params: ['predikat', 'array'],
        returnType: 'any',
        example: 'golek(genap, [1, 4, 5]) // => 4'
    },
    indeks: {
        signature: 'indeks(array: any[], target: any): number',
        description: 'Mbalekake posisi indeks pisanan saka target ing array (utawa -1).',
        params: ['array', 'target'],
        returnType: 'number',
        example: 'indeks(["a", "b"], "b") // => 1'
    }
};

/**
 * Keywords documentation dictionary
 */
const KEYWORDS = {
    gawe: { detail: 'Deklarasi variabel anyar', doc: 'gawe jeneng = nilai' },
    guna: { detail: 'Deklarasi fungsi utawa metode', doc: 'guna jeneng(param1, param2) { bali ... }' },
    bali: { detail: 'Mbalekake nilai saka fungsi (return)', doc: 'bali nilai' },
    yen: { detail: 'Percabangan kondisional (if)', doc: 'yen kondisi { ... }' },
    liyane: { detail: 'Percabangan alternatif (else)', doc: 'yen kondisi { ... } liyane { ... }' },
    nalika: { detail: 'Perulangan adhedhasar kondisi (while)', doc: 'nalika kondisi { ... }' },
    kanggo: { detail: 'Perulangan rentang utawa iterasi koleksi (for / foreach)', doc: 'kanggo i = 1 nganti 10 { ... }\nkanggo saben item ing koleksi { ... }' },
    saben: { detail: 'Klausa iterasi foreach', doc: 'kanggo saben item ing koleksi { ... }' },
    ing: { detail: 'Operator klausa koleksi ing foreach', doc: 'kanggo saben x ing data' },
    nganti: { detail: 'Watesan pungkasan rentang perulangan', doc: 'kanggo i = 1 nganti 10' },
    langkah: { detail: 'Jangkah kenaikan perulangan rentang (step)', doc: 'kanggo i = 1 nganti 10 langkah 2' },
    mandheg: { detail: 'Mungkasi perulangan sanalika (break)', doc: 'mandheg' },
    lanjut: { detail: 'Nglompati menyang iterasi sabanjure (continue)', doc: 'lanjut' },
    bener: { detail: 'Nilai boolean leres (true)', doc: 'bener' },
    salah: { detail: 'Nilai boolean lepat (false)', doc: 'salah' },
    null: { detail: 'Nilai kosong / tanpa data (null)', doc: 'null' },
    lan: { detail: 'Operator logika AND (lan)', doc: 'kondisi1 lan kondisi2' },
    utawa: { detail: 'Operator logika OR (utawa)', doc: 'kondisi1 utawa kondisi2' },
    ora: { detail: 'Operator logika NOT (ora / negasi)', doc: 'ora kondisi' },
    coba: { detail: 'Blok pananganan kasalahan (try)', doc: 'coba { ... } tangkep err { ... }' },
    tangkep: { detail: 'Panangkep kasalahan eksepsi (catch)', doc: 'coba { ... } tangkep err { ... }' },
    lempar: { detail: 'Mbuwang eksepsi kasalahan (throw)', doc: 'lempar "Pesen kasalahan"' },
    impor: { detail: 'Ngimpor modul berkas liya', doc: 'impor "modul.jawa"\nimpor { simbol } saka "modul.jawa"\nimpor "modul.jawa" minangka ns' },
    ekspor: { detail: 'Ngekspor simbol supaya bisa diimpor modul liya', doc: 'ekspor gawe x = 10\nekspor guna f() { ... }\nekspor bentuk B { ... }' },
    saka: { detail: 'Klausa sumber berkas impor selektif (from)', doc: 'impor { a, b } saka "modul.jawa"' },
    minangka: { detail: 'Alias / namespace kanggo modul (as)', doc: 'impor "modul.jawa" minangka ns' },
    bentuk: { detail: 'Deklarasi cetak biru struct', doc: 'bentuk Makhluk { ... }' },
    anyar: { detail: 'Instansiasi obyek anyar saka struct (new)', doc: 'gawe obj = anyar StructName(args)' },
    iki: { detail: 'Referensi menyang instance aktif ing njero method (this)', doc: 'iki.jeneng = val' },
    wiwiti: { detail: 'Konstruktor inisialisasi struct', doc: 'wiwiti(param1, param2) { iki.prop = param1 }' },
    ngembangake: { detail: 'Pewarisan struct saka induk (extends / inheritance)', doc: 'bentuk Anak ngembangake Induk { ... }' },
    super: { detail: 'Referensi menyang konstruktor utawa method parent struct', doc: 'super(args)\nsuper.metode()' }
};

/**
 * Convert file:// URI to normalized native Windows path
 */
function uriToPath(uri) {
    if (!uri) return '';
    try {
        if (uri.startsWith('file:')) {
            return path.normalize(fileURLToPath(uri));
        }
    } catch (_) {}
    return path.normalize(uri);
}

/**
 * Convert native path to file:// URI
 */
function pathToUri(filePath) {
    if (!filePath) return '';
    try {
        return pathToFileURL(path.resolve(filePath)).toString();
    } catch (_) {
        return 'file:///' + filePath.replace(/\\/g, '/');
    }
}

/**
 * Check if a zero-based position falls within a range
 */
function isPositionInRange(position, range) {
    if (!position || !range || !range.start || !range.end) return false;
    const { line, character } = position;
    const { start, end } = range;

    if (line < start.line || line > end.line) return false;
    if (line === start.line && character < start.character) return false;
    if (line === end.line && character > end.character) return false;
    return true;
}

/**
 * Find token covering or immediately before position
 */
function findTokenAt(tokens, position) {
    if (!tokens || tokens.length === 0) return null;
    const { line, character } = position;

    const isWordToken = (t) => t && (t.type === 'IDENTIFIER' || t.type === 'STRING' || t.type === 'NUMBER' || (t.value && (KEYWORDS[t.value] || BUILTINS[t.value])));

    let candidate = null;

    // 1. First preference: cursor is strictly within token [start, end)
    for (let idx = 0; idx < tokens.length; idx++) {
        const tok = tokens[idx];
        if (tok.loc) {
            const { start, end } = tok.loc;
            if (line >= start.line && line <= end.line) {
                const afterStart = line > start.line || character >= start.character;
                const beforeEnd = line < end.line || character < end.character;
                if (afterStart && beforeEnd) {
                    if (isWordToken(tok)) {
                        return tok;
                    }
                    if (!candidate) candidate = tok;
                }
            }
        }
    }

    // 2. Secondary check: token ending right at cursor (prefer word tokens over delimiters)
    for (let idx = 0; idx < tokens.length; idx++) {
        const tok = tokens[idx];
        if (tok.loc && tok.loc.end.line === line && tok.loc.end.character === character) {
            if (isWordToken(tok)) {
                return tok;
            }
            if (!candidate) candidate = tok;
        }
    }

    return candidate;
}

/**
 * Simple type inference for expressions in AST
 */
function inferExpressionType(expr, scope) {
    if (!expr) return 'unknown';

    switch (expr.type) {
        case 'NUMBER':
            return 'number';
        case 'STRING':
            return 'string';
        case 'BOOLEAN':
            return 'boolean';
        case 'NULL':
            return 'null';
        case 'ArrayExpression':
            return 'array';
        case 'ObjectExpression':
            return 'object';
        case 'NewExpression': {
            const calleeName = expr.target?.name || expr.target?.value || (typeof expr.target === 'string' ? expr.target : null) || expr.callee?.name || expr.callee?.value || (typeof expr.callee === 'string' ? expr.callee : null) || 'struct';
            return `instance of ${calleeName}`;
        }
        case 'UnaryExpression':
            if (expr.operator === 'ora') return 'boolean';
            if (expr.operator === '-' || expr.operator === '+') return 'number';
            return 'unknown';
        case 'BinaryExpression': {
            const op = expr.operator;
            if (['+', '-', '*', '/'].includes(op)) return 'number';
            if (['==', '!=', '<', '>', '<=', '>='].includes(op)) return 'boolean';
            if (['lan', 'utawa'].includes(op)) return 'boolean';
            return 'unknown';
        }
        case 'CallExpression': {
            const fnName = typeof expr.callee === 'string' ? expr.callee : (expr.callee?.name || expr.callee?.value || (typeof expr.name === 'string' ? expr.name : expr.name?.value));
            if (fnName && BUILTINS[fnName]) {
                return BUILTINS[fnName].returnType;
            }
            if (scope && fnName) {
                const sym = scope.lookup(fnName);
                if (sym && sym.kind === 'function' && sym.returnType) {
                    return sym.returnType;
                }
            }
            return 'unknown';
        }
        case 'IDENTIFIER': {
            if (scope) {
                const sym = scope.lookup(expr.value);
                if (sym && sym.inferredType) {
                    return sym.inferredType;
                }
            }
            return 'unknown';
        }
        default:
            return 'unknown';
    }
}

module.exports = {
    BUILTINS,
    KEYWORDS,
    uriToPath,
    pathToUri,
    isPositionInRange,
    findTokenAt,
    inferExpressionType
};
