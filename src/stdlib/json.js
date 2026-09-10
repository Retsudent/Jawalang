/**
 * Jawalang Standard Library — JSON Module (V1.4.0 Phase 12)
 *
 * Provides pure, deterministic JSON serialization and deserialization
 * functions adhering to RFC 8259 and Jawalang standard library architecture.
 */

const helpers = require("./helpers");

const MAX_DEPTH = 500;

/**
 * Validates that a Jawalang value is strictly encodable to JSON.
 * Throws explicit Jawalang runtime errors if an unsupported type,
 * circular reference, or excessive depth is detected.
 *
 * @param {any} val
 * @param {Set<any>} ancestors
 * @param {number} depth
 */
function validateJsonEncodable(val, ancestors = new Set(), depth = 0) {
    if (depth > MAX_DEPTH) {
        throw new Error(
            `Struktur data keliwat jero (maksimal ${MAX_DEPTH} tingkat) / Struktur data terlalu dalam (maksimal ${MAX_DEPTH} tingkat)`
        );
    }

    if (val === null) return;

    const t = helpers.getType(val);

    if (t === "boolean") return;

    if (t === "number") {
        if (!Number.isFinite(val)) {
            throw new Error(
                "Angka ora kena NaN utawa Infinity / Angka tidak boleh NaN atau Infinity"
            );
        }
        return;
    }

    if (t === "string") return;

    // Explicit rejection of unsupported runtime types
    if (t === "datetime") {
        throw new Error(
            'Tipe "datetime" ora bisa diencode dadi JSON / Tipe "datetime" tidak bisa di-encode menjadi JSON'
        );
    }
    if (t === "function") {
        throw new Error(
            'Tipe "function" ora bisa diencode dadi JSON / Tipe "function" tidak bisa di-encode menjadi JSON'
        );
    }
    if (t === "struct") {
        throw new Error(
            'Tipe "struct" ora bisa diencode dadi JSON / Tipe "struct" tidak bisa di-encode menjadi JSON'
        );
    }
    if (t === "instance") {
        throw new Error(
            'Tipe "instance" ora bisa diencode dadi JSON / Tipe "instance" tidak bisa di-encode menjadi JSON'
        );
    }
    if (t === "namespace") {
        throw new Error(
            'Tipe "namespace" ora bisa diencode dadi JSON / Tipe "namespace" tidak bisa di-encode menjadi JSON'
        );
    }

    if (Array.isArray(val)) {
        if (ancestors.has(val)) {
            throw new Error(
                "Circular reference ora bisa diencode dadi JSON / Referensi sirkular tidak bisa di-encode menjadi JSON"
            );
        }
        ancestors.add(val);
        for (let i = 0; i < val.length; i++) {
            validateJsonEncodable(val[i], ancestors, depth + 1);
        }
        ancestors.delete(val);
        return;
    }

    if (t === "object") {
        if (ancestors.has(val)) {
            throw new Error(
                "Circular reference ora bisa diencode dadi JSON / Referensi sirkular tidak bisa di-encode menjadi JSON"
            );
        }
        ancestors.add(val);
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
            validateJsonEncodable(val[keys[i]], ancestors, depth + 1);
        }
        ancestors.delete(val);
        return;
    }

    // Any other unrecognized runtime structure
    throw new Error(
        `Tipe "${t}" ora bisa diencode dadi JSON / Tipe "${t}" tidak bisa di-encode menjadi JSON`
    );
}

/**
 * Encodes a Jawalang data value into a standard JSON string.
 *
 * @param {Array<any>} args
 * @returns {string}
 */
function jsonEncode(args) {
    helpers.requireArgCount("jsonEncode", args, 1);
    const val = args[0];

    // Deep validation for unsupported types, cycles, and depth limits
    validateJsonEncodable(val);

    try {
        const result = JSON.stringify(val);
        if (result === undefined) {
            throw new Error(
                'Tipe data ora bisa diencode dadi JSON / Tipe data tidak bisa di-encode menjadi JSON'
            );
        }
        return result;
    } catch (err) {
        if (err.message && err.message.includes("circular")) {
            throw new Error(
                "Circular reference ora bisa diencode dadi JSON / Referensi sirkular tidak bisa di-encode menjadi JSON"
            );
        }
        throw err;
    }
}

/**
 * Decodes a JSON string into native Jawalang data representations.
 *
 * @param {Array<any>} args
 * @returns {any}
 */
function jsonDecode(args) {
    helpers.requireArgCount("jsonDecode", args, 1);
    helpers.requireString("jsonDecode", args[0], 0, true);

    const text = args[0];
    if (text.trim() === "") {
        throw new Error(
            "Format JSON ora sah: Teks JSON kosong / Format JSON tidak valid: Teks JSON kosong"
        );
    }

    try {
        const parsed = JSON.parse(text);
        return parsed;
    } catch (err) {
        throw new Error(
            `Format JSON ora sah: ${err.message} (Format JSON tidak valid: ${err.message})`
        );
    }
}

const jsonBuiltins = {
    jsonEncode,
    jsonDecode
};

module.exports = jsonBuiltins;
