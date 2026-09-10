/**
 * Jawalang Standard Library — Validation & Type Helpers
 *
 * Provides standardized, consistent argument count and type assertion
 * helpers adhering to Jawalang error reporting conventions.
 */

const ORDINALS_JAWA = ["kapisan", "kapindho", "katelu", "kapat", "kalima"];
const ORDINALS_ID = ["pertama", "kedua", "ketiga", "keempat", "kelima"];

/**
 * Detects the Jawalang type of a given runtime value.
 *
 * @param {any} val
 * @returns {string}
 */
function getType(val) {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    if (typeof val === "string") return "string";
    if (val && typeof val === "object" && val._isDateTime) return "datetime";
    if (val && typeof val === "object" && val._isNamespace) return "namespace";
    if (val && typeof val === "object" && val._isInstance) return "instance";
    if (val && typeof val === "object" && val._isStruct) return "struct";
    if (typeof val === "function" || (val && typeof val === "object" && val._isFunction)) return "function";
    if (typeof val === "object") return "object";
    return "unknown";
}

/**
 * Enforces exact argument count for a built-in function.
 *
 * @param {string} fnName
 * @param {Array} args
 * @param {number} expected
 */
function requireArgCount(fnName, args, expected) {
    if (args.length !== expected) {
        throw new Error(
            `Function built-in "${fnName}" mbutuhake ${expected} argument, nanging diwenehi ${args.length} (Function built-in "${fnName}" membutuhkan ${expected} argument)`
        );
    }
}

/**
 * Enforces that a value is a strict number.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireNumber(fnName, val, argIndex = 0, isSingleArg = false) {
    if (typeof val !== "number" || isNaN(val)) {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo number, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk number)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu number, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus number)`
        );
    }
}

/**
 * Enforces that a value is a strict string.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireString(fnName, val, argIndex = 0, isSingleArg = false) {
    if (typeof val !== "string") {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo string, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk string)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu string, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus string)`
        );
    }
}

/**
 * Enforces that a value is an array.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireArray(fnName, val, argIndex = 0, isSingleArg = false) {
    if (!Array.isArray(val)) {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo array, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk array)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu array, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus array)`
        );
    }
}

/**
 * Enforces that a value is an object.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireObject(fnName, val, argIndex = 0, isSingleArg = false) {
    if (getType(val) !== "object") {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo object, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk object)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu object, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus object)`
        );
    }
}

/**
 * Enforces that a value is a boolean.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireBoolean(fnName, val, argIndex = 0, isSingleArg = false) {
    if (typeof val !== "boolean") {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo boolean, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk boolean)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu boolean, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus boolean)`
        );
    }
}

/**
 * Enforces that a value is an integer number.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireInteger(fnName, val, argIndex = 0, isSingleArg = false) {
    requireNumber(fnName, val, argIndex, isSingleArg);
    if (!Number.isInteger(val)) {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mbutuhake bilangan bulat (integer), nanging ditemu: ${val} (${fnName}() membutuhkan bilangan bulat)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu bilangan bulat (integer), nanging ditemu: ${val} (Argument ${ordId} ${fnName}() harus bilangan bulat)`
        );
    }
}

/**
 * Enforces that a value is a valid Jawalang DateTime object.
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireDateTime(fnName, val, argIndex = 0, isSingleArg = false) {
    if (!val || typeof val !== "object" || !val._isDateTime) {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo datetime, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk datetime)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu datetime, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus datetime)`
        );
    }
}

/**
 * Checks if a given year is a leap year.
 *
 * @param {number} year
 * @returns {boolean}
 */
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Returns the maximum number of days in a given month (1-based, 1 = Jan).
 *
 * @param {number} year
 * @param {number} month
 * @returns {number}
 */
function getDaysInMonth(year, month) {
    switch (month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            return 31;
        case 4: case 6: case 9: case 11:
            return 30;
        case 2:
            return isLeapYear(year) ? 29 : 28;
        default:
            return 0;
    }
}

/**
 * Enforces that an argument count falls within a specified range [min, max].
 *
 * @param {string} fnName
 * @param {Array} args
 * @param {number} min
 * @param {number} max
 */
function requireArgRange(fnName, args, min, max) {
    if (args.length < min || args.length > max) {
        throw new Error(
            `Function built-in "${fnName}" mbutuhake ${min} nganti ${max} argument, nanging diwenehi ${args.length} (Function built-in "${fnName}" membutuhkan ${min} sampai ${max} argument)`
        );
    }
}

/**
 * Checks if a value is a callable entity in Jawalang.
 *
 * @param {any} val
 * @returns {boolean}
 */
function isCallable(val) {
    if (typeof val === "function") return true;
    if (val && typeof val === "object") {
        if (val._isFunction || val._isBoundMethod) return true;
    }
    return false;
}

/**
 * Enforces that a value is callable (function, method, or builtin).
 *
 * @param {string} fnName
 * @param {any} val
 * @param {number} argIndex
 * @param {boolean} isSingleArg
 */
function requireCallable(fnName, val, argIndex = 0, isSingleArg = false) {
    if (!isCallable(val)) {
        if (isSingleArg) {
            throw new Error(
                `${fnName}() mung bisa digunakake kanggo function, nanging ditemu: "${getType(val)}" (${fnName}() hanya bisa digunakan untuk function)`
            );
        }
        const ordJawa = ORDINALS_JAWA[argIndex] || `kaping ${argIndex + 1}`;
        const ordId = ORDINALS_ID[argIndex] || `ke-${argIndex + 1}`;
        throw new Error(
            `Argument ${ordJawa} ${fnName}() kudu function, nanging ditemu: "${getType(val)}" (Argument ${ordId} ${fnName}() harus function)`
        );
    }
}

/**
 * Checks runtime equality according to Jawalang semantics.
 *
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 */
function isEqual(a, b) {
    if (a && typeof a === "object" && a._isDateTime && b && typeof b === "object" && b._isDateTime) {
        return a.timestamp === b.timestamp;
    }
    return a === b;
}

/**
 * Formats a Jawalang runtime value for display in assertions and error messages.
 *
 * @param {any} val
 * @param {boolean} isTopLevel
 * @param {Set} _seen
 * @returns {string}
 */
function formatValue(val, isTopLevel = false, _seen = null) {
    if (val === null) return "null";
    if (val === true) return "bener";
    if (val === false) return "salah";
    if (typeof val === "string") {
        return isTopLevel ? val : `"${val}"`;
    }
    if (typeof val === "number") return String(val);
    if (Array.isArray(val)) {
        return "[" + val.map(el => formatValue(el, false, _seen)).join(", ") + "]";
    }
    if (val && typeof val === "object" && val._isDateTime) {
        return `<datetime ${new Date(val.timestamp).toISOString()}>`;
    }
    if (val && typeof val === "object" && val._isNamespace) {
        return `<namespace ${val.name}>`;
    }
    if (val && typeof val === "object" && val._isBoundMethod) {
        return `<method ${val.name || ""}>`.trim();
    }
    if (val && typeof val === "object" && val._isFunction) {
        return `<fungsi ${val.name || ""}>`.trim();
    }
    if (val && typeof val === "object" && val._isStruct) {
        return `<struct ${val.name}>`;
    }
    if (val && typeof val === "object" && val._isInstance) {
        if (_seen === null) _seen = new Set();
        if (_seen.has(val)) return `${val._structName}{...}`;
        _seen.add(val);
        const pairs = Object.keys(val._fields || {}).map(k =>
            `"${k}": ${formatValue(val._fields[k], false, _seen)}`
        );
        _seen.delete(val);
        return `${val._structName}{${pairs.join(", ")}}`;
    }
    if (val && typeof val === "object") {
        const keys = Object.keys(val);
        if (keys.length === 0) return "{}";
        const pairs = keys.map(k => `"${k}": ${formatValue(val[k], false, _seen)}`);
        return "{" + pairs.join(", ") + "}";
    }
    return String(val);
}

module.exports = {
    getType,
    requireArgCount,
    requireArgRange,
    requireNumber,
    requireString,
    requireArray,
    requireObject,
    requireBoolean,
    requireInteger,
    requireDateTime,
    isCallable,
    requireCallable,
    isEqual,
    formatValue,
    isLeapYear,
    getDaysInMonth
};

