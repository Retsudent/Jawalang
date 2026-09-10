/**
 * Jawalang Standard Library — File System Foundation (V1.4.0 Phase 13)
 *
 * Provides sandboxed, portable, synchronous, and non-destructive
 * filesystem operations:
 * - macaFile(path)
 * - tulisFile(path, isi)
 * - anaPath(path)
 * - jinisPath(path)
 * - isiFolder(path)
 * - gaweFolder(path)
 *
 * All operations must pass through resolveSandboxPath() to ensure
 * strict root containment and prevent traversal / symlink escapes.
 */

const fs = require("fs");
const path = require("path");
const {
    getType,
    requireArgCount,
    requireString
} = require("./helpers");

// Context stack for deterministic sandbox root management without global state pollution
const contextStack = [];

/**
 * Returns the currently active sandbox root directory.
 * Falls back to process.cwd() if no sandbox context is active.
 *
 * @returns {string}
 */
function getActiveSandboxRoot() {
    if (contextStack.length > 0) {
        return contextStack[contextStack.length - 1].sandboxRoot;
    }
    return process.cwd();
}

/**
 * Executes a function within a scoped sandbox root.
 * Guarantees context cleanup via try...finally.
 *
 * @param {string} sandboxRoot
 * @param {Function} fn
 * @returns {any}
 */
function withSandbox(sandboxRoot, fn) {
    const resolvedRoot = path.resolve(sandboxRoot || process.cwd());
    let canonicalRoot = resolvedRoot;
    try {
        if (fs.existsSync(resolvedRoot)) {
            canonicalRoot = fs.realpathSync.native ? fs.realpathSync.native(resolvedRoot) : fs.realpathSync(resolvedRoot);
        }
    } catch (_) {}

    contextStack.push({ sandboxRoot: canonicalRoot });
    try {
        return fn();
    } finally {
        contextStack.pop();
    }
}

/**
 * Checks whether child is within or equal to parent path.
 * On Windows, comparison is case-insensitive.
 *
 * @param {string} parent
 * @param {string} child
 * @returns {boolean}
 */
function isSubPath(parent, child) {
    let p = path.resolve(parent);
    let c = path.resolve(child);
    if (process.platform === "win32") {
        p = p.toLowerCase();
        c = c.toLowerCase();
    }
    const rel = path.relative(p, c);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

/**
 * Centralized Path & Security Resolver.
 *
 * Validates, normalizes, canonicalizes, and verifies containment
 * of a user-supplied filesystem path within the active sandbox root.
 *
 * @param {string} userPath
 * @param {Object} [options]
 * @param {string} [options.sandboxRoot]
 * @returns {string} Safe absolute filesystem path
 */
function resolveSandboxPath(userPath, options = {}) {
    // 1. Argument type check
    if (typeof userPath !== "string") {
        throw new Error(
            `Path kudu string, nanging ditemu: "${getType(userPath)}" (Path harus berupa string)`
        );
    }

    // 2. Reject empty or whitespace-only paths
    const trimmed = userPath.trim();
    if (trimmed === "") {
        throw new Error("Path ora kena kosong (Path tidak boleh kosong)");
    }

    // 3. Reject null bytes
    if (trimmed.includes("\0")) {
        throw new Error("Path ora sah amarga ngemot null byte (Path tidak valid karena mengandung null byte)");
    }

    // 4. Reject absolute paths across platforms
    // Check drive letters (e.g. C:), UNC (\\ or //), or root slashes (/ or \)
    const isWindowsAbsolute = /^[a-zA-Z]:/.test(trimmed);
    const isUnc = /^(\\\\|\/\/)/.test(trimmed);
    const isRootSlash = trimmed.startsWith("/") || trimmed.startsWith("\\");
    if (path.isAbsolute(trimmed) || isWindowsAbsolute || isUnc || isRootSlash) {
        throw new Error(`Path absolut ora diijini: "${userPath}" (Path absolut tidak diizinkan)`);
    }

    // 5. Determine sandbox root
    const rawRoot = options.sandboxRoot || getActiveSandboxRoot();
    const resolvedRoot = path.resolve(rawRoot);
    let canonicalRoot = resolvedRoot;
    try {
        if (fs.existsSync(resolvedRoot)) {
            canonicalRoot = fs.realpathSync.native ? fs.realpathSync.native(resolvedRoot) : fs.realpathSync(resolvedRoot);
        }
    } catch (_) {}

    // 6. Lexical resolution and containment check
    const resolvedPath = path.resolve(canonicalRoot, trimmed);
    if (!isSubPath(canonicalRoot, resolvedPath)) {
        throw new Error(`Path "${userPath}" ora diijini amarga metu saka sandbox (Path berada di luar sandbox)`);
    }

    // 7. Symlink / Junction escape check
    if (fs.existsSync(resolvedPath)) {
        let realTarget = resolvedPath;
        try {
            realTarget = fs.realpathSync.native ? fs.realpathSync.native(resolvedPath) : fs.realpathSync(resolvedPath);
        } catch (_) {}
        if (!isSubPath(canonicalRoot, realTarget)) {
            throw new Error(`Path "${userPath}" ora diijini amarga target metu saka sandbox (Symlink escape terdeteksi)`);
        }
        return realTarget;
    }

    // If target does not exist yet, verify closest existing ancestor
    let current = path.dirname(resolvedPath);
    while (current && current !== path.dirname(current)) {
        if (fs.existsSync(current)) {
            let realAncestor = current;
            try {
                realAncestor = fs.realpathSync.native ? fs.realpathSync.native(current) : fs.realpathSync(current);
            } catch (_) {}
            if (!isSubPath(canonicalRoot, realAncestor)) {
                throw new Error(`Path "${userPath}" ora diijini amarga target metu saka sandbox (Symlink escape terdeteksi)`);
            }
            break;
        }
        current = path.dirname(current);
    }

    return resolvedPath;
}

/**
 * Creates filesystem built-in functions bound to a specific or dynamic sandbox root.
 *
 * @param {string|Function} [getSandboxRoot]
 * @returns {Object}
 */
function createFilesystemBuiltins(getSandboxRoot) {
    function getRoot() {
        if (typeof getSandboxRoot === "function") {
            return getSandboxRoot();
        }
        if (typeof getSandboxRoot === "string") {
            return getSandboxRoot;
        }
        return getActiveSandboxRoot();
    }

    return {
        /**
         * macaFile(path)
         * Membaca berkas UTF-8 menjadi string. Berkas kosong mengembalikan "".
         */
        macaFile(args) {
            requireArgCount("macaFile", args, 1);
            requireString("macaFile", args[0], 0, true);

            const userPath = args[0];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });

            if (!fs.existsSync(safePath)) {
                throw new Error(`File "${userPath}" ora ditemokake (File tidak ditemukan)`);
            }

            const stat = fs.statSync(safePath);
            if (stat.isDirectory()) {
                throw new Error(`Path "${userPath}" minangka folder, dudu file (Path adalah direktori, bukan file)`);
            }

            try {
                return fs.readFileSync(safePath, "utf8");
            } catch (err) {
                throw new Error(`Ora bisa maca file "${userPath}": ${err.message}`);
            }
        },

        /**
         * tulisFile(path, isi)
         * Menulis isi string berenkode UTF-8 ke berkas. Mengembalikan null.
         */
        tulisFile(args) {
            requireArgCount("tulisFile", args, 2);
            requireString("tulisFile", args[0], 0);
            requireString("tulisFile", args[1], 1);

            const userPath = args[0];
            const content = args[1];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });

            if (fs.existsSync(safePath)) {
                const stat = fs.statSync(safePath);
                if (stat.isDirectory()) {
                    throw new Error(`Path "${userPath}" wis ana minangka folder (Path sudah ada sebagai folder)`);
                }
            } else {
                const parentDir = path.dirname(safePath);
                if (!fs.existsSync(parentDir)) {
                    throw new Error(`Folder induk kanggo "${userPath}" ora ditemokake (Folder tidak ditemukan)`);
                }
            }

            try {
                fs.writeFileSync(safePath, content, "utf8");
                return null;
            } catch (err) {
                throw new Error(`Ora bisa nulis file "${userPath}": ${err.message}`);
            }
        },

        /**
         * anaPath(path)
         * Memeriksa keberadaan berkas atau direktori. Mengembalikan bener atau salah.
         * Pelanggaran keamanan sandbox melempar error, bukan mengembalikan salah.
         */
        anaPath(args) {
            requireArgCount("anaPath", args, 1);
            requireString("anaPath", args[0], 0, true);

            const userPath = args[0];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });
            return fs.existsSync(safePath);
        },

        /**
         * jinisPath(path)
         * Mengembalikan "file", "folder", atau "oraAna".
         */
        jinisPath(args) {
            requireArgCount("jinisPath", args, 1);
            requireString("jinisPath", args[0], 0, true);

            const userPath = args[0];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });

            if (!fs.existsSync(safePath)) {
                return "oraAna";
            }

            try {
                const stat = fs.statSync(safePath);
                if (stat.isFile()) return "file";
                if (stat.isDirectory()) return "folder";
                return "oraAna";
            } catch (_) {
                return "oraAna";
            }
        },

        /**
         * isiFolder(path)
         * Mengembalikan daftar entri di dalam folder sebagai array string.
         */
        isiFolder(args) {
            requireArgCount("isiFolder", args, 1);
            requireString("isiFolder", args[0], 0, true);

            const userPath = args[0];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });

            if (!fs.existsSync(safePath)) {
                throw new Error(`Folder "${userPath}" ora ditemokake (Folder tidak ditemukan)`);
            }

            const stat = fs.statSync(safePath);
            if (!stat.isDirectory()) {
                throw new Error(`Path "${userPath}" dudu folder (Path bukan folder)`);
            }

            try {
                return fs.readdirSync(safePath);
            } catch (err) {
                throw new Error(`Ora bisa maca folder "${userPath}": ${err.message}`);
            }
        },

        /**
         * gaweFolder(path)
         * Membuat folder secara rekursif. Idempoten jika sudah ada.
         * Melempar error jika path sudah ada sebagai berkas. Mengembalikan null.
         */
        gaweFolder(args) {
            requireArgCount("gaweFolder", args, 1);
            requireString("gaweFolder", args[0], 0, true);

            const userPath = args[0];
            const safePath = resolveSandboxPath(userPath, { sandboxRoot: getRoot() });

            if (fs.existsSync(safePath)) {
                const stat = fs.statSync(safePath);
                if (stat.isFile()) {
                    throw new Error(`Path "${userPath}" wis ana minangka file (Path sudah ada sebagai file)`);
                }
                return null;
            }

            try {
                fs.mkdirSync(safePath, { recursive: true });
                return null;
            } catch (err) {
                throw new Error(`Ora bisa nggawe folder "${userPath}": ${err.message}`);
            }
        }
    };
}

const filesystemBuiltins = createFilesystemBuiltins(getActiveSandboxRoot);

module.exports = {
    ...filesystemBuiltins,
    createFilesystemBuiltins,
    resolveSandboxPath,
    withSandbox,
    getActiveSandboxRoot,
    isSubPath
};
