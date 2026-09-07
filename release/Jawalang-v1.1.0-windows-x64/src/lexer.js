function lexer(source) {
    const tokens = [];
    let i = 0;

    // Pre-calculate line offsets for fast, accurate zero-based LSP position mapping
    const lineOffsets = [0];
    for (let idx = 0; idx < source.length; idx++) {
        if (source[idx] === "\n") {
            lineOffsets.push(idx + 1);
        }
    }

    function offsetToPosition(offset) {
        let low = 0, high = lineOffsets.length - 1;
        let line = 0;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (lineOffsets[mid] <= offset) {
                line = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        const character = offset - lineOffsets[line];
        return { line, character, offset };
    }

    function pushToken(type, value, startIdx, endIdx) {
        tokens.push({
            type,
            value,
            loc: {
                start: offsetToPosition(startIdx),
                end: offsetToPosition(endIdx)
            }
        });
    }

    while (i < source.length) {
        const startIdx = i;

        // =========================
        // SPASI / ENTER
        // =========================
        if (/\s/.test(source[i])) {
            i++;
            continue;
        }

        // =========================
        // KOMENTAR (// ...)
        // =========================
        if (source[i] === "/" && source[i + 1] === "/") {
            i += 2;
            while (i < source.length && source[i] !== "\n") {
                i++;
            }
            continue;
        }

        // =========================
        // STRING ("...")
        // =========================
        if (source[i] === '"') {
            i++;
            let value = "";

            while (i < source.length && source[i] !== '"') {
                if (source[i] === "\\" && i + 1 < source.length) {
                    i++;
                    if (source[i] === "n") value += "\n";
                    else if (source[i] === "t") value += "\t";
                    else value += source[i];
                } else {
                    value += source[i];
                }
                i++;
            }

            if (i >= source.length) {
                const pos = offsetToPosition(startIdx);
                const err = new Error('String ora ditutup nganggo tanda " (String tidak ditutup dengan tanda petik)');
                err.line = pos.line;
                err.character = pos.character;
                err.offset = startIdx;
                throw err;
            }

            i++; // Lewati tanda petik penutup

            pushToken("STRING", value, startIdx, i);
            continue;
        }

        // =========================
        // ANGKA (Integer & Desimal)
        // =========================
        if (/[0-9]/.test(source[i])) {
            let value = "";
            let hasDot = false;

            while (
                i < source.length &&
                (/[0-9]/.test(source[i]) || (source[i] === "." && !hasDot && i + 1 < source.length && /[0-9]/.test(source[i + 1])))
            ) {
                if (source[i] === ".") {
                    hasDot = true;
                }
                value += source[i];
                i++;
            }

            pushToken("NUMBER", Number(value), startIdx, i);
            continue;
        }

        // =========================
        // IDENTIFIER / KEYWORD
        // =========================
        if (/[a-zA-Z_]/.test(source[i])) {
            let value = "";

            while (i < source.length && /[a-zA-Z0-9_]/.test(source[i])) {
                value += source[i];
                i++;
            }

            // Keyword Bahasa Jawa
            if (value === "tulis") {
                pushToken("TULIS", value, startIdx, i);
            } else if (value === "gawe") {
                pushToken("GAWE", value, startIdx, i);
            } else if (value === "yen") {
                pushToken("YEN", value, startIdx, i);
            } else if (value === "liyane") {
                pushToken("LIYANE", value, startIdx, i);
            } else if (value === "bener") {
                pushToken("BOOLEAN", true, startIdx, i);
            } else if (value === "salah") {
                pushToken("BOOLEAN", false, startIdx, i);
            } else if (value === "lan") {
                pushToken("LAN", value, startIdx, i);
            } else if (value === "utawa") {
                pushToken("UTAWA", value, startIdx, i);
            } else if (value === "ora") {
                pushToken("ORA", value, startIdx, i);
            } else if (value === "nalika") {
                pushToken("NALIKA", value, startIdx, i);
            } else if (value === "kanggo") {
                pushToken("KANGGO", value, startIdx, i);
            } else if (value === "saben") {
                pushToken("SABEN", value, startIdx, i);
            } else if (value === "ing") {
                pushToken("ING", value, startIdx, i);
            } else if (value === "nganti") {
                pushToken("NGANTI", value, startIdx, i);
            } else if (value === "langkah") {
                pushToken("LANGKAH", value, startIdx, i);
            } else if (value === "mandheg") {
                pushToken("MANDHEG", value, startIdx, i);
            } else if (value === "lanjut") {
                pushToken("LANJUT", value, startIdx, i);
            } else if (value === "guna") {
                pushToken("GUNA", value, startIdx, i);
            } else if (value === "bali") {
                pushToken("BALI", value, startIdx, i);
            } else if (value === "coba") {
                pushToken("COBA", value, startIdx, i);
            } else if (value === "tangkep") {
                pushToken("TANGKEP", value, startIdx, i);
            } else if (value === "lempar") {
                pushToken("LEMPAR", value, startIdx, i);
            } else if (value === "impor") {
                pushToken("IMPOR", value, startIdx, i);
            } else if (value === "ekspor") {
                pushToken("EKSPOR", value, startIdx, i);
            } else if (value === "bentuk") {
                pushToken("BENTUK", value, startIdx, i);
            } else if (value === "anyar") {
                pushToken("ANYAR", value, startIdx, i);
            } else if (value === "iki") {
                pushToken("IKI", value, startIdx, i);
            } else if (value === "wiwiti") {
                pushToken("WIWITI", value, startIdx, i);
            } else if (value === "null") {
                pushToken("NULL", null, startIdx, i);
            } else if (value === "saka") {
                pushToken("SAKA", value, startIdx, i);
            } else if (value === "minangka") {
                pushToken("MINANGKA", value, startIdx, i);
            } else if (value === "ngembangake") {
                pushToken("NGEMBANGAKE", value, startIdx, i);
            } else if (value === "super") {
                pushToken("SUPER", value, startIdx, i);
            } else {
                pushToken("IDENTIFIER", value, startIdx, i);
            }
            continue;
        }

        // =========================
        // OPERATOR PERBANDINGAN 2 KARAKTER (Harus dicek sebelum 1 karakter)
        // =========================
        if (source.startsWith(">=", i)) {
            i += 2;
            pushToken("GREATER_EQUAL", ">=", startIdx, i);
            continue;
        }

        if (source.startsWith("<=", i)) {
            i += 2;
            pushToken("LESS_EQUAL", "<=", startIdx, i);
            continue;
        }

        if (source.startsWith("==", i)) {
            i += 2;
            pushToken("EQUAL_EQUAL", "==", startIdx, i);
            continue;
        }

        if (source.startsWith("!=", i)) {
            i += 2;
            pushToken("NOT_EQUAL", "!=", startIdx, i);
            continue;
        }

        // =========================
        // OPERATOR & SIMBOL 1 KARAKTER
        // =========================
        if (source[i] === "+") {
            i++;
            pushToken("PLUS", "+", startIdx, i);
            continue;
        }

        if (source[i] === "-") {
            i++;
            pushToken("MINUS", "-", startIdx, i);
            continue;
        }

        if (source[i] === "*") {
            i++;
            pushToken("MULTIPLY", "*", startIdx, i);
            continue;
        }

        if (source[i] === "/") {
            i++;
            pushToken("DIVIDE", "/", startIdx, i);
            continue;
        }

        if (source[i] === "=") {
            i++;
            pushToken("EQUALS", "=", startIdx, i);
            continue;
        }

        if (source[i] === ">") {
            i++;
            pushToken("GREATER", ">", startIdx, i);
            continue;
        }

        if (source[i] === "<") {
            i++;
            pushToken("LESS", "<", startIdx, i);
            continue;
        }

        if (source[i] === ",") {
            i++;
            pushToken("COMMA", ",", startIdx, i);
            continue;
        }

        if (source[i] === ":") {
            i++;
            pushToken("COLON", ":", startIdx, i);
            continue;
        }

        if (source[i] === ".") {
            i++;
            pushToken("DOT", ".", startIdx, i);
            continue;
        }

        // =========================
        // KURUNG & BLOK
        // =========================
        if (source[i] === "{") {
            i++;
            pushToken("LEFT_BRACE", "{", startIdx, i);
            continue;
        }

        if (source[i] === "}") {
            i++;
            pushToken("RIGHT_BRACE", "}", startIdx, i);
            continue;
        }

        if (source[i] === "(") {
            i++;
            pushToken("LEFT_PAREN", "(", startIdx, i);
            continue;
        }

        if (source[i] === ")") {
            i++;
            pushToken("RIGHT_PAREN", ")", startIdx, i);
            continue;
        }

        // =========================
        // KURUNG KOTAK (Array)
        // =========================
        if (source[i] === "[") {
            i++;
            pushToken("LEFT_BRACKET", "[", startIdx, i);
            continue;
        }

        if (source[i] === "]") {
            i++;
            pushToken("RIGHT_BRACKET", "]", startIdx, i);
            continue;
        }

        // =========================
        // ERROR
        // =========================
        const pos = offsetToPosition(i);
        const err = new Error(`Karakter ora dikenal (Karakter tidak dikenal): '${source[i]}' ing posisi ${i}`);
        err.line = pos.line;
        err.character = pos.character;
        err.offset = i;
        throw err;
    }

    return tokens;
}

module.exports = lexer;
