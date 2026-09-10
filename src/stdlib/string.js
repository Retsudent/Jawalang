/**
 * Jawalang Standard Library — String Module
 *
 * Pure, deterministic string utilities.
 */

const { requireArgCount, requireString } = require("./helpers");

const stringBuiltins = {
    ngemot(args) {
        requireArgCount("ngemot", args, 2);
        requireString("ngemot", args[0], 0, false);
        requireString("ngemot", args[1], 1, false);
        return args[0].includes(args[1]);
    },

    diwiwiti(args) {
        requireArgCount("diwiwiti", args, 2);
        requireString("diwiwiti", args[0], 0, false);
        requireString("diwiwiti", args[1], 1, false);
        return args[0].startsWith(args[1]);
    },

    dipungkasi(args) {
        requireArgCount("dipungkasi", args, 2);
        requireString("dipungkasi", args[0], 0, false);
        requireString("dipungkasi", args[1], 1, false);
        return args[0].endsWith(args[1]);
    },

    trim(args) {
        requireArgCount("trim", args, 1);
        requireString("trim", args[0], 0, true);
        return args[0].trim();
    },

    pecah(args) {
        requireArgCount("pecah", args, 2);
        requireString("pecah", args[0], 0, false);
        requireString("pecah", args[1], 1, false);
        return args[0].split(args[1]);
    }
};

module.exports = stringBuiltins;
