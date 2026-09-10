/**
 * Jawalang Standard Library — Testing & Assertion Foundation
 *
 * Provides core testing assertion primitives for Jawalang programs:
 * - uji(kondisi, [pesan]): asserts condition is strictly boolean bener (true)
 * - ujiPadha(aktual, expected, [pesan]): asserts equality using Jawalang semantics
 * - ujiBeda(aktual, expected, [pesan]): asserts inequality
 * - ujiJinis(nilai, tipe, [pesan]): asserts runtime type matches expected type string
 * - ujiError(fungsi, [pesan]): asserts callable throws a runtime error
 *
 * Design principles:
 * - Silent on PASS (returns bener / true)
 * - Informative runtime error on FAIL (catchable via coba ... tangkep)
 * - Zero global test state (no passed/failed counters)
 * - No process exit or crash
 * - First-class builtin functions
 */

const {
    getType,
    requireArgRange,
    requireBoolean,
    requireString,
    requireCallable,
    isEqual,
    formatValue
} = require("./helpers");

/**
 * Default callable invoker for standalone usage.
 * Overridden by interpreter with full lexical scope awareness.
 */
function defaultInvoker(fn, args) {
    if (typeof fn === "function") {
        return fn(args);
    }
    if (fn && typeof fn === "object" && typeof fn.function === "function") {
        return fn.function(args);
    }
    throw new Error(`Nilai ora bisa diceluk minangka fungsi (Nilai bukan function): "${formatValue(fn, false)}"`);
}

/**
 * Factory creating testing builtins with a specific callable invoker.
 *
 * @param {Function} [callableInvoker]
 * @returns {Record<string, Function>}
 */
function createTestingBuiltins(callableInvoker = defaultInvoker) {
    const invoker = typeof callableInvoker === "function" ? callableInvoker : defaultInvoker;

    return {
        /**
         * Asserts that a condition is strictly boolean bener (true).
         *
         * @param {Array} args - [kondisi, pesan?]
         * @returns {boolean}
         */
        uji(args) {
            requireArgRange("uji", args, 1, 2);
            const kondisi = args[0];
            requireBoolean("uji", kondisi, 0);

            let pesan = null;
            if (args.length === 2) {
                requireString("uji", args[1], 1);
                pesan = args[1];
            }

            if (kondisi !== true) {
                let msg = "Assertion gagal:";
                if (pesan) {
                    msg += ` ${pesan}\nkondisi kudu bener`;
                } else {
                    msg += " kondisi kudu bener";
                }
                throw new Error(msg);
            }

            return true;
        },

        /**
         * Asserts that actual equals expected according to Jawalang semantics.
         *
         * @param {Array} args - [aktual, expected, pesan?]
         * @returns {boolean}
         */
        ujiPadha(args) {
            requireArgRange("ujiPadha", args, 2, 3);
            const aktual = args[0];
            const expected = args[1];

            let pesan = null;
            if (args.length === 3) {
                requireString("ujiPadha", args[2], 2);
                pesan = args[2];
            }

            if (!isEqual(aktual, expected)) {
                let msg = "Assertion gagal:";
                if (pesan) {
                    msg += ` ${pesan}\n`;
                } else {
                    msg += "\n";
                }
                msg += `expected: ${formatValue(expected, false)}\nactual: ${formatValue(aktual, false)}`;
                throw new Error(msg);
            }

            return true;
        },

        /**
         * Asserts that actual does not equal expected according to Jawalang semantics.
         *
         * @param {Array} args - [aktual, expected, pesan?]
         * @returns {boolean}
         */
        ujiBeda(args) {
            requireArgRange("ujiBeda", args, 2, 3);
            const aktual = args[0];
            const expected = args[1];

            let pesan = null;
            if (args.length === 3) {
                requireString("ujiBeda", args[2], 2);
                pesan = args[2];
            }

            if (isEqual(aktual, expected)) {
                let msg = "Assertion gagal:";
                if (pesan) {
                    msg += ` ${pesan}\n`;
                } else {
                    msg += "\n";
                }
                msg += `nilai kudu beda, nanging padha-padha: ${formatValue(aktual, false)}`;
                throw new Error(msg);
            }

            return true;
        },

        /**
         * Asserts that the runtime type of value matches expected type string.
         *
         * @param {Array} args - [nilai, tipe, pesan?]
         * @returns {boolean}
         */
        ujiJinis(args) {
            requireArgRange("ujiJinis", args, 2, 3);
            const nilai = args[0];
            const tipe = args[1];
            requireString("ujiJinis", tipe, 1);

            let pesan = null;
            if (args.length === 3) {
                requireString("ujiJinis", args[2], 2);
                pesan = args[2];
            }

            const actualType = getType(nilai);
            if (actualType !== tipe) {
                let msg = "Assertion gagal:";
                if (pesan) {
                    msg += ` ${pesan}\n`;
                } else {
                    msg += "\n";
                }
                msg += `expected type "${tipe}"\nactual type "${actualType}"`;
                throw new Error(msg);
            }

            return true;
        },

        /**
         * Asserts that calling the given function throws a runtime error.
         *
         * @param {Array} args - [fungsi, pesan?]
         * @returns {boolean}
         */
        ujiError(args) {
            requireArgRange("ujiError", args, 1, 2);
            const fn = args[0];
            requireCallable("ujiError", fn, 0);

            let pesan = null;
            if (args.length === 2) {
                requireString("ujiError", args[1], 1);
                pesan = args[1];
            }

            let didThrow = false;
            try {
                invoker(fn, []);
            } catch (err) {
                // Control flow signals must not be caught as runtime errors
                if (
                    err &&
                    (err.name === "ReturnSignal" ||
                     err.name === "BreakSignal" ||
                     err.name === "ContinueSignal" ||
                     (err.constructor &&
                      (err.constructor.name === "ReturnSignal" ||
                       err.constructor.name === "BreakSignal" ||
                       err.constructor.name === "ContinueSignal")))
                ) {
                    throw err;
                }
                didThrow = true;
            }

            if (!didThrow) {
                let msg = "Assertion gagal:";
                if (pesan) {
                    msg += ` ${pesan}\n`;
                } else {
                    msg += " ";
                }
                msg += "fungsi kudu ngasilake error (fungsi harus menghasilkan error)";
                throw new Error(msg);
            }

            return true;
        }
    };
}

const testingBuiltins = createTestingBuiltins();

module.exports = {
    createTestingBuiltins,
    testingBuiltins
};
