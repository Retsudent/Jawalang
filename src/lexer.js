function lexer(source) {
    const tokens = [];
    let i = 0;

    while (i < source.length) {
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
                throw new Error('String ora ditutup nganggo tanda " (String tidak ditutup dengan tanda petik)');
            }

            i++; // Lewati tanda petik penutup

            tokens.push({
                type: "STRING",
                value: value
            });
            continue;
        }

        // =========================
        // ANGKA (Integer & Desimal)
        // =========================
        if (/[0-9]/.test(source[i])) {
            let value = "";
            let hasDot = false;

            while (i < source.length && (/[0-9]/.test(source[i]) || (source[i] === "." && !hasDot))) {
                if (source[i] === ".") {
                    hasDot = true;
                }
                value += source[i];
                i++;
            }

            tokens.push({
                type: "NUMBER",
                value: Number(value)
            });
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
                tokens.push({
                    type: "TULIS",
                    value: value
                });
            } else if (value === "gawe") {
                tokens.push({
                    type: "GAWE",
                    value: value
                });
            } else if (value === "yen") {
                tokens.push({
                    type: "YEN",
                    value: value
                });
            } else if (value === "liyane") {
                tokens.push({
                    type: "LIYANE",
                    value: value
                });
            } else if (value === "bener") {
                tokens.push({
                    type: "BOOLEAN",
                    value: true
                });
            } else if (value === "salah") {
                tokens.push({
                    type: "BOOLEAN",
                    value: false
                });
            } else if (value === "lan") {
                tokens.push({
                    type: "LAN",
                    value: "lan"
                });
            } else if (value === "utawa") {
                tokens.push({
                    type: "UTAWA",
                    value: "utawa"
                });
            } else if (value === "ora") {
                tokens.push({
                    type: "ORA",
                    value: "ora"
                });
            } else if (value === "nalika") {
                tokens.push({
                    type: "NALIKA",
                    value: "nalika"
                });
            } else if (value === "kanggo") {
                tokens.push({
                    type: "KANGGO",
                    value: "kanggo"
                });
            } else if (value === "nganti") {
                tokens.push({
                    type: "NGANTI",
                    value: "nganti"
                });
            } else if (value === "langkah") {
                tokens.push({
                    type: "LANGKAH",
                    value: "langkah"
                });
            } else if (value === "mandheg") {
                tokens.push({
                    type: "MANDHEG",
                    value: "mandheg"
                });
            } else if (value === "lanjut") {
                tokens.push({
                    type: "LANJUT",
                    value: "lanjut"
                });
            } else if (value === "fungsi") {
                tokens.push({
                    type: "FUNGSI",
                    value: "fungsi"
                });
            } else if (value === "bali") {
                tokens.push({
                    type: "BALI",
                    value: "bali"
                });
            } else {
                tokens.push({
                    type: "IDENTIFIER",
                    value: value
                });
            }
            continue;
        }

        // =========================
        // OPERATOR PERBANDINGAN 2 KARAKTER (Harus dicek sebelum 1 karakter)
        // =========================
        if (source.startsWith(">=", i)) {
            tokens.push({ type: "GREATER_EQUAL", value: ">=" });
            i += 2;
            continue;
        }

        if (source.startsWith("<=", i)) {
            tokens.push({ type: "LESS_EQUAL", value: "<=" });
            i += 2;
            continue;
        }

        if (source.startsWith("==", i)) {
            tokens.push({ type: "EQUAL_EQUAL", value: "==" });
            i += 2;
            continue;
        }

        if (source.startsWith("!=", i)) {
            tokens.push({ type: "NOT_EQUAL", value: "!=" });
            i += 2;
            continue;
        }

        // =========================
        // OPERATOR & SIMBOL 1 KARAKTER
        // =========================
        if (source[i] === "+") {
            tokens.push({ type: "PLUS", value: "+" });
            i++;
            continue;
        }

        if (source[i] === "-") {
            tokens.push({ type: "MINUS", value: "-" });
            i++;
            continue;
        }

        if (source[i] === "*") {
            tokens.push({ type: "MULTIPLY", value: "*" });
            i++;
            continue;
        }

        if (source[i] === "/") {
            tokens.push({ type: "DIVIDE", value: "/" });
            i++;
            continue;
        }

        if (source[i] === "=") {
            tokens.push({ type: "EQUALS", value: "=" });
            i++;
            continue;
        }

        if (source[i] === ">") {
            tokens.push({ type: "GREATER", value: ">" });
            i++;
            continue;
        }

        if (source[i] === "<") {
            tokens.push({ type: "LESS", value: "<" });
            i++;
            continue;
        }

        if (source[i] === ",") {
            tokens.push({ type: "COMMA", value: "," });
            i++;
            continue;
        }

        // =========================
        // KURUNG & BLOK
        // =========================
        if (source[i] === "{") {
            tokens.push({ type: "LEFT_BRACE", value: "{" });
            i++;
            continue;
        }

        if (source[i] === "}") {
            tokens.push({ type: "RIGHT_BRACE", value: "}" });
            i++;
            continue;
        }

        if (source[i] === "(") {
            tokens.push({ type: "LEFT_PAREN", value: "(" });
            i++;
            continue;
        }

        if (source[i] === ")") {
            tokens.push({ type: "RIGHT_PAREN", value: ")" });
            i++;
            continue;
        }

        // =========================
        // KURUNG KOTAK (Array)
        // =========================
        if (source[i] === "[") {
            tokens.push({ type: "LEFT_BRACKET", value: "[" });
            i++;
            continue;
        }

        if (source[i] === "]") {
            tokens.push({ type: "RIGHT_BRACKET", value: "]" });
            i++;
            continue;
        }

        // =========================
        // ERROR
        // =========================
        throw new Error(`Karakter ora dikenal (Karakter tidak dikenal): '${source[i]}' ing posisi ${i}`);
    }

    return tokens;
}

module.exports = lexer;