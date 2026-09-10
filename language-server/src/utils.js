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
    },
    abs: {
        signature: 'abs(angka: number): number',
        description: 'Mbalekake nilai mutlak (absolut) saka sawijining angka.',
        params: ['angka'],
        returnType: 'number',
        example: 'abs(-10) // => 10'
    },
    min: {
        signature: 'min(a: number, b: number): number',
        description: 'Mbalekake angka paling cilik ing antarane rong angka.',
        params: ['a', 'b'],
        returnType: 'number',
        example: 'min(10, 20) // => 10'
    },
    max: {
        signature: 'max(a: number, b: number): number',
        description: 'Mbalekake angka paling gedhe ing antarane rong angka.',
        params: ['a', 'b'],
        returnType: 'number',
        example: 'max(10, 20) // => 20'
    },
    akar: {
        signature: 'akar(angka: number): number',
        description: 'Mbalekake oyod kuadrat (square root) saka sawijining angka positif.',
        params: ['angka'],
        returnType: 'number',
        example: 'akar(25) // => 5'
    },
    pangkat: {
        signature: 'pangkat(dhasar: number, eksponen: number): number',
        description: 'Mbalekake asil pangangkatan angka dhasar dipangkatake eksponen.',
        params: ['dhasar', 'eksponen'],
        returnType: 'number',
        example: 'pangkat(2, 5) // => 32'
    },
    ngemot: {
        signature: 'ngemot(teks: string, bagean: string): boolean',
        description: 'Priksa apa sawijining teks ngemot cuplikan teks liya (contains/substring).',
        params: ['teks', 'bagean'],
        returnType: 'boolean',
        example: 'ngemot("Jawalang", "lang") // => bener'
    },
    diwiwiti: {
        signature: 'diwiwiti(teks: string, awalan: string): boolean',
        description: 'Priksa apa teks diwiwiti nganggo awalan tartamtu (startsWith).',
        params: ['teks', 'awalan'],
        returnType: 'boolean',
        example: 'diwiwiti("Jawalang", "Jawa") // => bener'
    },
    dipungkasi: {
        signature: 'dipungkasi(teks: string, pungkasan: string): boolean',
        description: 'Priksa apa teks dipungkasi nganggo akhiran tartamtu (endsWith).',
        params: ['teks', 'pungkasan'],
        returnType: 'boolean',
        example: 'dipungkasi("Jawalang", "lang") // => bener'
    },
    trim: {
        signature: 'trim(teks: string): string',
        description: 'Mbusak spasi ing wiwitan lan pungkasan teks.',
        params: ['teks'],
        returnType: 'string',
        example: 'trim("  Jawa  ") // => "Jawa"'
    },
    pecah: {
        signature: 'pecah(teks: string, pemisah: string): string[]',
        description: 'Mecah teks dadi array adhedhasar karakter pemisah (split).',
        params: ['teks', 'pemisah'],
        returnType: 'array',
        example: 'pecah("a,b,c", ",") // => ["a", "b", "c"]'
    },
    saiki: {
        signature: 'saiki(): datetime',
        description: 'Mbalekake wektu saiki minangka obyek DateTime.',
        params: [],
        returnType: 'datetime',
        example: 'gawe w = saiki()'
    },
    timestamp: {
        signature: 'timestamp(waktu: datetime): number',
        description: 'Mbalekake Unix timestamp ing milidetik saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'timestamp(saiki())'
    },
    gaweWektu: {
        signature: 'gaweWektu(tahun: number, wulan: number, dina: number, jam?: number, menit?: number, detik?: number): datetime',
        description: 'Nggawe obyek DateTime anyar saka komponen tanggal/wektu utawa timestamp integer.',
        params: ['tahun', 'wulan', 'dina'],
        returnType: 'datetime',
        example: 'gaweWektu(2026, 9, 6)'
    },
    taun: {
        signature: 'taun(waktu: datetime): number',
        description: 'Njupuk angka taun UTC saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'taun(saiki()) // => 2026'
    },
    wulan: {
        signature: 'wulan(waktu: datetime): number',
        description: 'Njupuk angka wulan UTC (1-12) saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'wulan(saiki()) // => 9'
    },
    dina: {
        signature: 'dina(waktu: datetime): number',
        description: 'Njupuk tanggal/dina UTC (1-31) saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'dina(saiki()) // => 6'
    },
    jam: {
        signature: 'jam(waktu: datetime): number',
        description: 'Njupuk angka jam UTC (0-23) saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'jam(saiki())'
    },
    menit: {
        signature: 'menit(waktu: datetime): number',
        description: 'Njupuk angka menit UTC (0-59) saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'menit(saiki())'
    },
    detik: {
        signature: 'detik(waktu: datetime): number',
        description: 'Njupuk angka detik UTC (0-59) saka obyek DateTime.',
        params: ['waktu'],
        returnType: 'number',
        example: 'detik(saiki())'
    },
    formatWektu: {
        signature: 'formatWektu(waktu: datetime, pola: string): string',
        description: 'Format obyek DateTime dadi teks adhedhasar pola (YYYY, MM, DD, HH, mm, ss).',
        params: ['waktu', 'pola'],
        returnType: 'string',
        example: 'formatWektu(saiki(), "YYYY-MM-DD")'
    },
    parseWektu: {
        signature: 'parseWektu(teks: string): datetime',
        description: 'Ngurai teks tanggal dadi obyek DateTime (format: "YYYY-MM-DD" utawa "YYYY-MM-DD HH:mm:ss").',
        params: ['teks'],
        returnType: 'datetime',
        example: 'parseWektu("2026-09-06")'
    },
    sadurunge: {
        signature: 'sadurunge(a: datetime, b: datetime): boolean',
        description: 'Priksa apa wektu a luwih dhisik tinimbang wektu b (a < b).',
        params: ['a', 'b'],
        returnType: 'boolean',
        example: 'sadurunge(w1, w2)'
    },
    sawise: {
        signature: 'sawise(a: datetime, b: datetime): boolean',
        description: 'Priksa apa wektu a luwih buri tinimbang wektu b (a > b).',
        params: ['a', 'b'],
        returnType: 'boolean',
        example: 'sawise(w1, w2)'
    },
    padhaWektu: {
        signature: 'padhaWektu(a: datetime, b: datetime): boolean',
        description: 'Priksa apa wektu a padha persis karo wektu b (timestamp padha).',
        params: ['a', 'b'],
        returnType: 'boolean',
        example: 'padhaWektu(w1, w2)'
    },
    tambahWektu: {
        signature: 'tambahWektu(waktu: datetime, jumlahDetik: number): datetime',
        description: 'Nambahake wektu kanthi gunggunge detik tartamtu, ngasilake obyek DateTime anyar.',
        params: ['waktu', 'jumlahDetik'],
        returnType: 'datetime',
        example: 'tambahWektu(w, 86400)'
    },
    kurangWektu: {
        signature: 'kurangWektu(waktu: datetime, jumlahDetik: number): datetime',
        description: 'Ngurangi wektu kanthi gunggunge detik tartamtu, ngasilake obyek DateTime anyar.',
        params: ['waktu', 'jumlahDetik'],
        returnType: 'datetime',
        example: 'kurangWektu(w, 3600)'
    },
    jsonEncode: {
        signature: 'jsonEncode(nilai: any): string',
        description: 'Ngonversi struktur data Jawalang dadi teks string format JSON.',
        params: ['nilai'],
        returnType: 'string',
        example: 'jsonEncode({"nama": "Jawalang", "versi": 1.4})'
    },
    jsonDecode: {
        signature: 'jsonDecode(teks: string): any',
        description: 'Ngurai teks format JSON dadi struktur data Jawalang asli.',
        params: ['teks'],
        returnType: 'any',
        example: 'jsonDecode("{\\"a\\": 10}")'
    },
    macaFile: {
        signature: 'macaFile(path: string): string',
        description: 'Maca isi berkas teks berenkode UTF-8 ing njero sandbox root.',
        params: ['path'],
        returnType: 'string',
        example: 'macaFile("data.txt")'
    },
    tulisFile: {
        signature: 'tulisFile(path: string, isi: string): null',
        description: 'Nulis isi teks string kanthi enkoding UTF-8 menyang berkas ing njero sandbox root.',
        params: ['path', 'isi'],
        returnType: 'null',
        example: 'tulisFile("output.txt", "Halo Jawalang")'
    },
    anaPath: {
        signature: 'anaPath(path: string): boolean',
        description: 'Mriksa apa berkas utawa folder ana ing jalur kasebut (bener utawa salah).',
        params: ['path'],
        returnType: 'boolean',
        example: 'anaPath("data.txt")'
    },
    jinisPath: {
        signature: 'jinisPath(path: string): string',
        description: 'Mriksa jinis entri sistem berkas ("file", "folder", utawa "oraAna").',
        params: ['path'],
        returnType: 'string',
        example: 'jinisPath("data")'
    },
    isiFolder: {
        signature: 'isiFolder(path: string): array',
        description: 'Maca lan ngasilake dhaptar jeneng entri ing njero folder minangka array string.',
        params: ['path'],
        returnType: 'array',
        example: 'isiFolder("data")'
    },
    gaweFolder: {
        signature: 'gaweFolder(path: string): null',
        description: 'Nggawe folder anyar kanthi rekursif ing njero sandbox root.',
        params: ['path'],
        returnType: 'null',
        example: 'gaweFolder("data/arsip")'
    },
    uji: {
        signature: 'uji(kondisi: boolean, pesan?: string): boolean',
        description: 'Mriksa apa sawijining kondisi bener (true). Yen salah, mbuwang error assertion.',
        params: ['kondisi', 'pesan'],
        returnType: 'boolean',
        example: 'uji(2 < 3, "kondisi kudu bener")'
    },
    ujiPadha: {
        signature: 'ujiPadha(aktual: any, expected: any, pesan?: string): boolean',
        description: 'Mriksa apa nilai aktual padha (==) karo nilai expected miturut semantik Jawalang.',
        params: ['aktual', 'expected', 'pesan'],
        returnType: 'boolean',
        example: 'ujiPadha(2 + 3, 5, "petungan salah")'
    },
    ujiBeda: {
        signature: 'ujiBeda(aktual: any, expected: any, pesan?: string): boolean',
        description: 'Mriksa apa nilai aktual beda (!=) saka nilai expected miturut semantik Jawalang.',
        params: ['aktual', 'expected', 'pesan'],
        returnType: 'boolean',
        example: 'ujiBeda(10, 20)'
    },
    ujiJinis: {
        signature: 'ujiJinis(nilai: any, tipe: string, pesan?: string): boolean',
        description: 'Mriksa apa jinis data nilai cocog karo jeneng tipe sing diarepake ("number", "string", "boolean", "array", "object", "function", "null", "datetime", lsp).',
        params: ['nilai', 'tipe', 'pesan'],
        returnType: 'boolean',
        example: 'ujiJinis("Jawalang", "string")'
    },
    ujiError: {
        signature: 'ujiError(fungsi: function, pesan?: string): boolean',
        description: 'Mriksa apa pamanggilan fungsi ngasilake runtime error. Yen ora ana error, mbuwang error assertion.',
        params: ['fungsi', 'pesan'],
        returnType: 'boolean',
        example: 'ujiError(guna() { lempar "rusak" })'
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
