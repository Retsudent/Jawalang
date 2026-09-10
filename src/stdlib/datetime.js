/**
 * Jawalang Standard Library — Date & Time Module
 *
 * Implements pure, deterministic, and immutable Date & Time utilities
 * operating on standard UTC timezone.
 */

const {
    requireArgCount,
    requireNumber,
    requireInteger,
    requireString,
    requireDateTime,
    getDaysInMonth
} = require("./helpers");

/**
 * Creates an immutable Jawalang DateTime object.
 *
 * @param {number} timestamp - Milliseconds since Unix Epoch (UTC)
 * @returns {Readonly<{_isDateTime: boolean, timestamp: number}>}
 */
function createDateTime(timestamp) {
    return Object.freeze({
        _isDateTime: true,
        timestamp: Math.trunc(timestamp)
    });
}

/**
 * Validates calendar components (month and day bounds taking leap years into account).
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @param {string} fnName
 */
function validateCalendar(year, month, day, fnName) {
    if (month < 1 || month > 12) {
        throw new Error(
            `${fnName}() wulan ora sah: ${month} (Wulan kudu antarane 1 nganti 12)`
        );
    }
    const maxDays = getDaysInMonth(year, month);
    if (day < 1 || day > maxDays) {
        throw new Error(
            `${fnName}() dina ora sah: ${day} kanggo wulan ${month} ing taun ${year} (Maksimal ${maxDays} dina)`
        );
    }
}

/**
 * Validates time components (hour, minute, second).
 *
 * @param {number} hour
 * @param {number} minute
 * @param {number} second
 * @param {string} fnName
 */
function validateTime(hour, minute, second, fnName) {
    if (hour < 0 || hour > 23) {
        throw new Error(
            `${fnName}() jam ora sah: ${hour} (Kudu antarane 0 nganti 23)`
        );
    }
    if (minute < 0 || minute > 59) {
        throw new Error(
            `${fnName}() menit ora sah: ${minute} (Kudu antarane 0 nganti 59)`
        );
    }
    if (second < 0 || second > 59) {
        throw new Error(
            `${fnName}() detik ora sah: ${second} (Kudu antarane 0 nganti 59)`
        );
    }
}

const datetimeBuiltins = {
    /**
     * Returns current DateTime.
     */
    saiki(args) {
        requireArgCount("saiki", args, 0);
        return createDateTime(Date.now());
    },

    /**
     * Returns Unix timestamp in milliseconds as an integer number.
     */
    timestamp(args) {
        requireArgCount("timestamp", args, 1);
        requireDateTime("timestamp", args[0], 0, true);
        return args[0].timestamp;
    },

    /**
     * Constructs a DateTime from either:
     * - gaweWektu(timestamp) [1 arg: integer ms]
     * - gaweWektu(tahun, wulan, dina) [3 args: year, month 1-12, day 1-31]
     * - gaweWektu(tahun, wulan, dina, jam, menit, detik) [6 args]
     */
    gaweWektu(args) {
        if (args.length === 1) {
            requireInteger("gaweWektu", args[0], 0, true);
            const ts = args[0];
            if (isNaN(new Date(ts).getTime())) {
                throw new Error(
                    `gaweWektu() timestamp ora sah: ${ts} (Timestamp di luar jangkauan valid)`
                );
            }
            return createDateTime(ts);
        }

        if (args.length === 3) {
            requireInteger("gaweWektu", args[0], 0);
            requireInteger("gaweWektu", args[1], 1);
            requireInteger("gaweWektu", args[2], 2);
            const year = args[0];
            const month = args[1];
            const day = args[2];
            validateCalendar(year, month, day, "gaweWektu");
            return createDateTime(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        }

        if (args.length === 6) {
            requireInteger("gaweWektu", args[0], 0);
            requireInteger("gaweWektu", args[1], 1);
            requireInteger("gaweWektu", args[2], 2);
            requireInteger("gaweWektu", args[3], 3);
            requireInteger("gaweWektu", args[4], 4);
            requireInteger("gaweWektu", args[5], 5);
            const year = args[0];
            const month = args[1];
            const day = args[2];
            const hour = args[3];
            const minute = args[4];
            const second = args[5];
            validateCalendar(year, month, day, "gaweWektu");
            validateTime(hour, minute, second, "gaweWektu");
            return createDateTime(Date.UTC(year, month - 1, day, hour, minute, second, 0));
        }

        throw new Error(
            `Function built-in "gaweWektu" mbutuhake 1, 3, utawa 6 argument, nanging diwenehi ${args.length} (Function built-in "gaweWektu" membutuhkan 1, 3, atau 6 argument)`
        );
    },

    /**
     * Returns UTC full year (e.g. 2026).
     */
    taun(args) {
        requireArgCount("taun", args, 1);
        requireDateTime("taun", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCFullYear();
    },

    /**
     * Returns UTC month (1-based, 1 = Jan ... 12 = Des).
     */
    wulan(args) {
        requireArgCount("wulan", args, 1);
        requireDateTime("wulan", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCMonth() + 1;
    },

    /**
     * Returns UTC day of month (1-31).
     */
    dina(args) {
        requireArgCount("dina", args, 1);
        requireDateTime("dina", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCDate();
    },

    /**
     * Returns UTC hour (0-23).
     */
    jam(args) {
        requireArgCount("jam", args, 1);
        requireDateTime("jam", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCHours();
    },

    /**
     * Returns UTC minute (0-59).
     */
    menit(args) {
        requireArgCount("menit", args, 1);
        requireDateTime("menit", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCMinutes();
    },

    /**
     * Returns UTC second (0-59).
     */
    detik(args) {
        requireArgCount("detik", args, 1);
        requireDateTime("detik", args[0], 0, true);
        return new Date(args[0].timestamp).getUTCSeconds();
    },

    /**
     * Formats DateTime using deterministic pattern tokens: YYYY, MM, DD, HH, mm, ss.
     */
    formatWektu(args) {
        requireArgCount("formatWektu", args, 2);
        requireDateTime("formatWektu", args[0], 0);
        requireString("formatWektu", args[1], 1);

        const d = new Date(args[0].timestamp);
        const yyyy = String(d.getUTCFullYear()).padStart(4, "0");
        const mmMonth = String(d.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(d.getUTCDate()).padStart(2, "0");
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mmMin = String(d.getUTCMinutes()).padStart(2, "0");
        const ss = String(d.getUTCSeconds()).padStart(2, "0");

        return args[1]
            .replace(/YYYY/g, yyyy)
            .replace(/MM/g, mmMonth)
            .replace(/DD/g, dd)
            .replace(/HH/g, hh)
            .replace(/mm/g, mmMin)
            .replace(/ss/g, ss);
    },

    /**
     * Parses deterministic date string (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss / YYYY-MM-DDTHH:mm:ss).
     */
    parseWektu(args) {
        requireArgCount("parseWektu", args, 1);
        requireString("parseWektu", args[0], 0, true);

        const raw = args[0].trim();
        const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z)?)?$/.exec(raw);

        if (!match) {
            throw new Error(
                `parseWektu() nemu format tanggal/wektu sing ora sah: "${raw}" (Format tanggal tidak valid, gunakake "YYYY-MM-DD" utawa "YYYY-MM-DD HH:mm:ss")`
            );
        }

        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const day = parseInt(match[3], 10);
        const hour = match[4] !== undefined ? parseInt(match[4], 10) : 0;
        const minute = match[5] !== undefined ? parseInt(match[5], 10) : 0;
        const second = match[6] !== undefined ? parseInt(match[6], 10) : 0;

        validateCalendar(year, month, day, "parseWektu");
        validateTime(hour, minute, second, "parseWektu");

        return createDateTime(Date.UTC(year, month - 1, day, hour, minute, second, 0));
    },

    /**
     * Returns true if DateTime a is before DateTime b (a < b).
     */
    sadurunge(args) {
        requireArgCount("sadurunge", args, 2);
        requireDateTime("sadurunge", args[0], 0);
        requireDateTime("sadurunge", args[1], 1);
        return args[0].timestamp < args[1].timestamp;
    },

    /**
     * Returns true if DateTime a is after DateTime b (a > b).
     */
    sawise(args) {
        requireArgCount("sawise", args, 2);
        requireDateTime("sawise", args[0], 0);
        requireDateTime("sawise", args[1], 1);
        return args[0].timestamp > args[1].timestamp;
    },

    /**
     * Returns true if DateTime a has exact same timestamp as DateTime b (a === b).
     */
    padhaWektu(args) {
        requireArgCount("padhaWektu", args, 2);
        requireDateTime("padhaWektu", args[0], 0);
        requireDateTime("padhaWektu", args[1], 1);
        return args[0].timestamp === args[1].timestamp;
    },

    /**
     * Adds specified number of seconds to DateTime and returns a new DateTime (pure & immutable).
     */
    tambahWektu(args) {
        requireArgCount("tambahWektu", args, 2);
        requireDateTime("tambahWektu", args[0], 0);
        requireNumber("tambahWektu", args[1], 1);
        const deltaMs = Math.round(args[1] * 1000);
        return createDateTime(args[0].timestamp + deltaMs);
    },

    /**
     * Subtracts specified number of seconds from DateTime and returns a new DateTime (pure & immutable).
     */
    kurangWektu(args) {
        requireArgCount("kurangWektu", args, 2);
        requireDateTime("kurangWektu", args[0], 0);
        requireNumber("kurangWektu", args[1], 1);
        const deltaMs = Math.round(args[1] * 1000);
        return createDateTime(args[0].timestamp - deltaMs);
    }
};

module.exports = datetimeBuiltins;
