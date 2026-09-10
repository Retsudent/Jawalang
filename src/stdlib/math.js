/**
 * Jawalang Standard Library — Math Module
 *
 * Pure, deterministic mathematical utilities.
 */

const { requireArgCount, requireNumber } = require("./helpers");

const mathBuiltins = {
    abs(args) {
        requireArgCount("abs", args, 1);
        requireNumber("abs", args[0], 0, true);
        return Math.abs(args[0]);
    },

    min(args) {
        requireArgCount("min", args, 2);
        requireNumber("min", args[0], 0, false);
        requireNumber("min", args[1], 1, false);
        return Math.min(args[0], args[1]);
    },

    max(args) {
        requireArgCount("max", args, 2);
        requireNumber("max", args[0], 0, false);
        requireNumber("max", args[1], 1, false);
        return Math.max(args[0], args[1]);
    },

    akar(args) {
        requireArgCount("akar", args, 1);
        requireNumber("akar", args[0], 0, true);
        if (args[0] < 0) {
            throw new Error(
                `Angka kanggo akar() ora kena negatif: ${args[0]} (Angka untuk akar() tidak boleh negatif)`
            );
        }
        return Math.sqrt(args[0]);
    },

    pangkat(args) {
        requireArgCount("pangkat", args, 2);
        requireNumber("pangkat", args[0], 0, false);
        requireNumber("pangkat", args[1], 1, false);
        if (args[0] < 0 && !Number.isInteger(args[1])) {
            throw new Error(
                `Pangkat pecahan kanggo angka negatif ora didhukung: base ${args[0]}, exponent ${args[1]} (Pangkat pecahan untuk angka negatif tidak didukung)`
            );
        }
        return Math.pow(args[0], args[1]);
    }
};

module.exports = mathBuiltins;
