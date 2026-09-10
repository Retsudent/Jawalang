/**
 * Jawalang Standard Library (stdlib) Aggregator
 *
 * Exposes all standard library modules and built-in functions
 * for runtime integration and tooling.
 */

const helpers = require("./helpers");
const mathBuiltins = require("./math");
const stringBuiltins = require("./string");
const datetimeBuiltins = require("./datetime");
const jsonBuiltins = require("./json");
const filesystemBuiltins = require("./filesystem");
const { testingBuiltins } = require("./testing");

const stdlibBuiltins = {
    ...mathBuiltins,
    ...stringBuiltins,
    ...datetimeBuiltins,
    ...jsonBuiltins,
    ...filesystemBuiltins,
    ...testingBuiltins
};

const stdlibMetadata = {
    // Math Module
    abs: { category: "Math", arity: 1, returnType: "number", pure: true },
    min: { category: "Math", arity: 2, returnType: "number", pure: true },
    max: { category: "Math", arity: 2, returnType: "number", pure: true },
    akar: { category: "Math", arity: 1, returnType: "number", pure: true },
    pangkat: { category: "Math", arity: 2, returnType: "number", pure: true },

    // String Module
    ngemot: { category: "String", arity: 2, returnType: "boolean", pure: true },
    diwiwiti: { category: "String", arity: 2, returnType: "boolean", pure: true },
    dipungkasi: { category: "String", arity: 2, returnType: "boolean", pure: true },
    trim: { category: "String", arity: 1, returnType: "string", pure: true },
    pecah: { category: "String", arity: 2, returnType: "array", pure: true },

    // Date & Time Module
    saiki: { category: "DateTime", arity: 0, returnType: "datetime", pure: false },
    timestamp: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    gaweWektu: { category: "DateTime", arity: [1, 3, 6], returnType: "datetime", pure: true },
    taun: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    wulan: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    dina: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    jam: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    menit: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    detik: { category: "DateTime", arity: 1, returnType: "number", pure: true },
    formatWektu: { category: "DateTime", arity: 2, returnType: "string", pure: true },
    parseWektu: { category: "DateTime", arity: 1, returnType: "datetime", pure: true },
    sadurunge: { category: "DateTime", arity: 2, returnType: "boolean", pure: true },
    sawise: { category: "DateTime", arity: 2, returnType: "boolean", pure: true },
    padhaWektu: { category: "DateTime", arity: 2, returnType: "boolean", pure: true },
    tambahWektu: { category: "DateTime", arity: 2, returnType: "datetime", pure: true },
    kurangWektu: { category: "DateTime", arity: 2, returnType: "datetime", pure: true },

    // JSON & Serialization Module (V1.4.0 Phase 12)
    jsonEncode: { category: "Serialization", arity: 1, returnType: "string", pure: true },
    jsonDecode: { category: "Serialization", arity: 1, returnType: "any", pure: true },

    // File System Module (V1.4.0 Phase 13)
    macaFile: { category: "File System", arity: 1, returnType: "string", pure: false },
    tulisFile: { category: "File System", arity: 2, returnType: "null", pure: false },
    anaPath: { category: "File System", arity: 1, returnType: "boolean", pure: false },
    jinisPath: { category: "File System", arity: 1, returnType: "string", pure: false },
    isiFolder: { category: "File System", arity: 1, returnType: "array", pure: false },
    gaweFolder: { category: "File System", arity: 1, returnType: "null", pure: false },

    // Testing & Assertion Module (V1.4.0 Phase 14)
    uji: { category: "Testing", arity: [1, 2], returnType: "boolean", pure: false },
    ujiPadha: { category: "Testing", arity: [2, 3], returnType: "boolean", pure: false },
    ujiBeda: { category: "Testing", arity: [2, 3], returnType: "boolean", pure: false },
    ujiJinis: { category: "Testing", arity: [2, 3], returnType: "boolean", pure: false },
    ujiError: { category: "Testing", arity: [1, 2], returnType: "boolean", pure: false }
};

module.exports = {
    helpers,
    mathBuiltins,
    stringBuiltins,
    datetimeBuiltins,
    jsonBuiltins,
    filesystemBuiltins,
    testingBuiltins,
    stdlibBuiltins,
    stdlibMetadata
};

