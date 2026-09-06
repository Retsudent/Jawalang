function parser(tokens) {
    let i = 0;
    let loopDepth = 0;
    let inFunction = false;
    let blockDepth = 0;

    // 1. parsePrimary()
    // Menangani: NUMBER, STRING, BOOLEAN, IDENTIFIER / CallExpression, ekspresi ( ... ), dan Array [ ... ]
    function parsePrimary() {
        if (i >= tokens.length) {
            throw new Error("Dibutuhake nilai (Nilai tidak ditemukan)");
        }

        const token = tokens[i];

        // Mendukung ekspresi dalam tanda kurung ( ... )
        if (token.type === "LEFT_PAREN") {
            i++;
            const expr = parseExpression();
            if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                throw new Error('Kurung buka "(" kudu ditutup nganggo ")"');
            }
            i++;
            return expr;
        }

        // Array literal [ ... ]
        if (token.type === "LEFT_BRACKET") {
            i++; // lewati "["

            const elements = [];

            if (tokens[i] && tokens[i].type !== "RIGHT_BRACKET") {
                while (true) {
                    elements.push(parseExpression());
                    if (tokens[i] && tokens[i].type === "COMMA") {
                        i++; // lewati ","
                    } else {
                        break;
                    }
                }
            }

            if (!tokens[i] || tokens[i].type !== "RIGHT_BRACKET") {
                throw new Error('Kurung kotak "[" kudu ditutup nganggo "]"');
            }
            i++; // lewati "]"

            return {
                type: "ArrayExpression",
                elements: elements
            };
        }

        // Object literal { ... }
        if (token.type === "LEFT_BRACE") {
            i++; // lewati "{"

            const properties = [];

            if (tokens[i] && tokens[i].type !== "RIGHT_BRACE") {
                while (true) {
                    if (!tokens[i]) {
                        throw new Error('Kurung kurawal "{" ing object kudu ditutup nganggo "}"');
                    }

                    // Key kudu string ing V1
                    const keyToken = tokens[i];
                    if (keyToken.type !== "STRING") {
                        throw new Error(`Key object kudu awujud string, nanging ditemu: "${keyToken.value}" (Key object harus berupa string)`);
                    }
                    i++; // lewati string key

                    if (!tokens[i] || tokens[i].type !== "COLON") {
                        throw new Error('Sawise key object kudu ana tanda ":" (Setelah key object harus ada tanda ":")');
                    }
                    i++; // lewati ":"

                    const valNode = parseExpression();

                    properties.push({
                        key: keyToken.value,
                        value: valNode
                    });

                    if (tokens[i] && tokens[i].type === "COMMA") {
                        i++; // lewati ","
                        if (tokens[i] && tokens[i].type === "RIGHT_BRACE") {
                            break;
                        }
                    } else {
                        break;
                    }
                }
            }

            if (!tokens[i] || tokens[i].type !== "RIGHT_BRACE") {
                throw new Error('Kurung kurawal "{" ing object kudu ditutup nganggo "}"');
            }
            i++; // lewati "}"

            return {
                type: "ObjectExpression",
                properties: properties
            };
        }

        // Identifier
        if (token.type === "IDENTIFIER") {
            i++;
            return {
                type: "IDENTIFIER",
                value: token.value
            };
        }

        if (
            token.type === "NUMBER" ||
            token.type === "STRING" ||
            token.type === "BOOLEAN" ||
            token.type === "NULL"
        ) {
            i++;
            return {
                type: token.type,
                value: token.value
            };
        }

        // iki (current receiver reference)
        if (token.type === "IKI") {
            i++;
            return {
                type: "IkiExpression"
            };
        }

        // anyar StructName(args...) utawa anyar ns["StructName"](args...)
        if (token.type === "ANYAR") {
            const nextToken = tokens[i + 1];
            if (nextToken && nextToken.type === "IDENTIFIER" && tokens[i + 2] && tokens[i + 2].type === "LEFT_PAREN") {
                i++; // lewati "anyar"

                const targetToken = tokens[i];
                const targetName = targetToken.value;
                i++; // lewati nama struct
                i++; // lewati "("

                const args = [];
                if (tokens[i] && tokens[i].type !== "RIGHT_PAREN") {
                    while (true) {
                        args.push(parseExpression());
                        if (tokens[i] && tokens[i].type === "COMMA") {
                            i++; // lewati ","
                        } else {
                            break;
                        }
                    }
                }

                if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                    throw new Error('"anyar" mbutuhake kurung tutup ")" sawise argumen');
                }
                i++; // lewati ")"

                return {
                    type: "NewExpression",
                    target: targetName,
                    arguments: args
                };
            }

            if (nextToken && nextToken.type === "IDENTIFIER" && tokens[i + 2] && tokens[i + 2].type === "LEFT_BRACKET") {
                i++; // lewati "anyar"

                let targetNode = {
                    type: "IDENTIFIER",
                    value: tokens[i].value
                };
                i++; // lewati identifier

                while (tokens[i] && tokens[i].type === "LEFT_BRACKET") {
                    i++; // lewati "["
                    const indexExpr = parseExpression();
                    if (!tokens[i] || tokens[i].type !== "RIGHT_BRACKET") {
                        throw new Error('Kurung kotak "[" ing akses struct kudu ditutup nganggo "]"');
                    }
                    i++; // lewati "]"
                    targetNode = {
                        type: "IndexExpression",
                        object: targetNode,
                        index: indexExpr
                    };
                }

                if (!tokens[i] || tokens[i].type !== "LEFT_PAREN") {
                    throw new Error('"anyar" mbutuhake kurung buka "(" kanggo argumen');
                }
                i++; // lewati "("

                const args = [];
                if (tokens[i] && tokens[i].type !== "RIGHT_PAREN") {
                    while (true) {
                        args.push(parseExpression());
                        if (tokens[i] && tokens[i].type === "COMMA") {
                            i++; // lewati ","
                        } else {
                            break;
                        }
                    }
                }

                if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                    throw new Error('"anyar" mbutuhake kurung tutup ")" sawise argumen');
                }
                i++; // lewati ")"

                return {
                    type: "NewExpression",
                    target: targetNode,
                    arguments: args
                };
            }

            // Yen dudu "anyar StructName(...)", anyar dianggep minangka identifier
            i++;
            return {
                type: "IDENTIFIER",
                value: "anyar"
            };
        }

        throw new Error(`Nilai ora valid: "${token.value}"`);
    }

    // 1b. parsePostfix()
    // Menangani akses index array lan panggilan fungsi berantai: arr[0], fn()[1], operasi[0](2, 3), obj["aksi"]()
    function parsePostfix() {
        let node = parsePrimary();

        while (tokens[i] && (tokens[i].type === "LEFT_BRACKET" || tokens[i].type === "LEFT_PAREN")) {
            if (tokens[i].type === "LEFT_BRACKET") {
                i++; // lewati "["

                if (i >= tokens.length) {
                    throw new Error('Dibutuhake ekspresi index sawise "["');
                }

                const index = parseExpression();

                if (!tokens[i] || tokens[i].type !== "RIGHT_BRACKET") {
                    throw new Error('Kurung kotak "[" ing akses index kudu ditutup nganggo "]"');
                }
                i++; // lewati "]"

                node = {
                    type: "IndexExpression",
                    object: node,
                    index: index
                };
            } else if (tokens[i].type === "LEFT_PAREN") {
                i++; // lewati "("

                const args = [];
                if (tokens[i] && tokens[i].type !== "RIGHT_PAREN") {
                    while (true) {
                        args.push(parseExpression());
                        if (tokens[i] && tokens[i].type === "COMMA") {
                            i++; // lewati ","
                        } else {
                            break;
                        }
                    }
                }

                if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                    throw new Error('Kurung buka "(" ing pamanggilan fungsi kudu ditutup nganggo ")"');
                }
                i++; // lewati ")"

                node = {
                    type: "CallExpression",
                    callee: node,
                    arguments: args
                };
            }
        }

        return node;
    }

    // 2. parseUnary()
    // Menangani operator unary: ora (NOT), minus (-), dan plus (+)
    function parseUnary() {
        if (tokens[i] && (tokens[i].type === "MINUS" || tokens[i].type === "PLUS" || tokens[i].type === "ORA")) {
            const token = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${token.value}"`);
            }
            const argument = parseUnary();
            return {
                type: "UnaryExpression",
                operator: token.value,
                argument: argument
            };
        }

        return parsePostfix();
    }

    // 3. parseMultiplicative()
    // Menangani perkalian dan pembagian (*, /) dengan precedence lebih tinggi dari (+, -)
    function parseMultiplicative() {
        let left = parseUnary();

        while (
            i < tokens.length &&
            (tokens[i].type === "MULTIPLY" || tokens[i].type === "DIVIDE")
        ) {
            const operator = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${operator.value}"`);
            }
            const right = parseUnary();
            left = {
                type: "BinaryExpression",
                operator: operator.value,
                left: left,
                right: right
            };
        }

        return left;
    }

    // 4. parseAdditive()
    // Menangani penjumlahan dan pengurangan (+, -)
    function parseAdditive() {
        let left = parseMultiplicative();

        while (
            i < tokens.length &&
            (tokens[i].type === "PLUS" || tokens[i].type === "MINUS")
        ) {
            const operator = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${operator.value}"`);
            }
            const right = parseMultiplicative();
            left = {
                type: "BinaryExpression",
                operator: operator.value,
                left: left,
                right: right
            };
        }

        return left;
    }

    // 5. parseComparison()
    // Menangani operator perbandingan (>, <, >=, <=, ==, !=)
    function parseComparison() {
        let left = parseAdditive();

        const comparisonOps = [
            "GREATER",
            "LESS",
            "GREATER_EQUAL",
            "LESS_EQUAL",
            "EQUAL_EQUAL",
            "NOT_EQUAL"
        ];

        while (i < tokens.length && comparisonOps.includes(tokens[i].type)) {
            const operator = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${operator.value}"`);
            }
            const right = parseAdditive();
            left = {
                type: "BinaryExpression",
                operator: operator.value,
                left: left,
                right: right
            };
        }

        return left;
    }

    // 6. parseAnd()
    // Menangani operator logika AND (lan) dengan precedence lebih tinggi dari utawa (OR)
    function parseAnd() {
        let left = parseComparison();

        while (i < tokens.length && tokens[i].type === "LAN") {
            const operator = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${operator.value}"`);
            }
            const right = parseComparison();
            left = {
                type: "BinaryExpression",
                operator: operator.value,
                left: left,
                right: right
            };
        }

        return left;
    }

    // 7. parseOr()
    // Menangani operator logika OR (utawa)
    function parseOr() {
        let left = parseAnd();

        while (i < tokens.length && tokens[i].type === "UTAWA") {
            const operator = tokens[i];
            i++;
            if (i >= tokens.length) {
                throw new Error(`Dibutuhake nilai sawise operator "${operator.value}"`);
            }
            const right = parseAnd();
            left = {
                type: "BinaryExpression",
                operator: operator.value,
                left: left,
                right: right
            };
        }

        return left;
    }

    // 8. parseExpression()
    // Entry point utama untuk ekspresi
    function parseExpression() {
        return parseOr();
    }

    // Helper untuk mengurai blok kode di dalam tanda kurung kurawal { ... }
    function parseBlock() {
        if (!tokens[i] || tokens[i].type !== "LEFT_BRACE") {
            throw new Error('Sawise kondisi/perulangan/fungsi kudu ana "{"');
        }

        i++; // lewati "{"

        const statements = [];
        blockDepth++;

        while (i < tokens.length && tokens[i].type !== "RIGHT_BRACE") {
            statements.push(parseStatement());
        }

        blockDepth--;

        if (!tokens[i] || tokens[i].type !== "RIGHT_BRACE") {
            throw new Error('Blok durung ditutup nganggo "}"');
        }

        i++; // lewati "}"

        return statements;
    }

    function parseStatement() {
        const token = tokens[i];

        // =========================
        // KURUNG BUKA / KOTAK (Pemanggilan fungsi berperingkat / parenthesized / array call minangka statement)
        // =========================
        if (token.type === "LEFT_PAREN" || token.type === "LEFT_BRACKET") {
            const expr = parseExpression();
            return {
                type: "ExpressionStatement",
                expression: expr
            };
        }

        // =========================
        // GAWE (Deklarasi variabel baru)
        // =========================
        if (token.type === "GAWE") {
            i++; // lewati "gawe"

            const nama = tokens[i];
            if (!nama || (nama.type !== "IDENTIFIER" && nama.type !== "ANYAR")) {
                throw new Error('Sawise "gawe" kudu ana jeneng variabel');
            }
            i++; // lewati nama

            const equals = tokens[i];
            if (!equals || equals.type !== "EQUALS") {
                throw new Error('Sawise jeneng variabel kudu ana tanda "="');
            }
            i++; // lewati "="

            if (i >= tokens.length) {
                throw new Error('Dibutuhake nilai sawise "="');
            }

            const nilai = parseExpression();

            return {
                type: "VariableDeclaration",
                name: nama.value,
                value: nilai
            };
        }

        // =========================
        // IDENTIFIER (Re-assignment, Index Assignment, ATAU Function Call Standalone)
        // =========================
        if (token.type === "IDENTIFIER") {
            // Index assignment: nama[...][...] = ... UTAWA Function Call liwat index: nama[...](...)
            if (tokens[i + 1] && tokens[i + 1].type === "LEFT_BRACKET") {
                // Scan forward to see if followed by '(' (ExpressionStatement)
                let look = i + 1;
                let bDepth = 0;
                while (look < tokens.length) {
                    if (tokens[look].type === "LEFT_BRACKET") {
                        bDepth++;
                    } else if (tokens[look].type === "RIGHT_BRACKET") {
                        bDepth--;
                        if (bDepth === 0) {
                            if (tokens[look + 1] && tokens[look + 1].type === "LEFT_BRACKET") {
                                look++;
                                continue;
                            }
                            look++;
                            break;
                        }
                    }
                    look++;
                }

                if (tokens[look] && tokens[look].type === "LEFT_PAREN") {
                    const expr = parseExpression();
                    return {
                        type: "ExpressionStatement",
                        expression: expr
                    };
                }

                i++; // lewati nama identifer
                let objectNode = { type: "IDENTIFIER", value: token.value };

                // Parse satu atau lebih indexing: [expr][expr]...
                const indices = [];
                while (tokens[i] && tokens[i].type === "LEFT_BRACKET") {
                    i++; // lewati "["
                    if (i >= tokens.length) {
                        throw new Error('Dibutuhake ekspresi index sawise "["');
                    }
                    indices.push(parseExpression());
                    if (!tokens[i] || tokens[i].type !== "RIGHT_BRACKET") {
                        throw new Error('Kurung kotak "[" kudu ditutup nganggo "]"');
                    }
                    i++; // lewati "]"
                }

                // Pastikan diikuti "="
                if (!tokens[i] || tokens[i].type !== "EQUALS") {
                    throw new Error('Sawise akses index kudu ana tanda "=" kanggo assignment');
                }
                i++; // lewati "="

                if (i >= tokens.length) {
                    throw new Error('Dibutuhake nilai sawise "="');
                }

                const nilai = parseExpression();

                // Bangun IndexAssignmentStatement: object, semua index kecuali terakhir sebagai nested IndexExpression, index terakhir
                // Jika indices = [a, b, c], maka object = arr[a][b], index = c
                let targetObject = objectNode;
                for (let k = 0; k < indices.length - 1; k++) {
                    targetObject = {
                        type: "IndexExpression",
                        object: targetObject,
                        index: indices[k]
                    };
                }

                return {
                    type: "IndexAssignmentStatement",
                    object: targetObject,
                    index: indices[indices.length - 1],
                    value: nilai
                };
            }

            // Re-assignment: nama = ...
            if (tokens[i + 1] && tokens[i + 1].type === "EQUALS") {
                const nama = token.value;
                i += 2; // lewati nama dan "="

                if (i >= tokens.length) {
                    throw new Error('Dibutuhake nilai sawise "="');
                }

                const nilai = parseExpression();

                return {
                    type: "AssignmentStatement",
                    name: nama,
                    value: nilai
                };
            }

            // Function call sebagai statement: nama(...)
            if (tokens[i + 1] && tokens[i + 1].type === "LEFT_PAREN") {
                const expr = parseExpression();
                return {
                    type: "ExpressionStatement",
                    expression: expr
                };
            }
        }

        // =========================
        // IKI (assignment / call statement)
        // =========================
        if (token.type === "IKI") {
            // iki = val → DITOLAK
            if (tokens[i + 1] && tokens[i + 1].type === "EQUALS") {
                throw new Error('"iki" ora bisa di-assign langsung (iki tidak bisa di-assign). Gunakake iki["property"] = nilai');
            }

            // Check if: iki["prop"]...["prop"] = val (index assignment)
            // vs: iki["prop"]()... (expression statement)
            if (tokens[i + 1] && tokens[i + 1].type === "LEFT_BRACKET") {
                // Scan forward past all bracket chains
                let look = i + 1;
                let bDepth = 0;
                while (look < tokens.length) {
                    if (tokens[look].type === "LEFT_BRACKET") {
                        bDepth++;
                    } else if (tokens[look].type === "RIGHT_BRACKET") {
                        bDepth--;
                        if (bDepth === 0) {
                            if (tokens[look + 1] && tokens[look + 1].type === "LEFT_BRACKET") {
                                look++;
                                continue;
                            }
                            look++;
                            break;
                        }
                    }
                    look++;
                }

                if (tokens[look] && tokens[look].type === "EQUALS") {
                    // Index assignment: iki["prop"]... = val
                    i++; // lewati "iki"
                    let objectNode = { type: "IkiExpression" };

                    const indices = [];
                    while (tokens[i] && tokens[i].type === "LEFT_BRACKET") {
                        i++; // lewati "["
                        indices.push(parseExpression());
                        if (!tokens[i] || tokens[i].type !== "RIGHT_BRACKET") {
                            throw new Error('Kurung kotak "[" kudu ditutup nganggo "]"');
                        }
                        i++; // lewati "]"
                    }

                    if (!tokens[i] || tokens[i].type !== "EQUALS") {
                        throw new Error('Sawise akses index "iki" kudu ana tanda "=" kanggo assignment');
                    }
                    i++; // lewati "="

                    const nilai = parseExpression();

                    let targetObject = objectNode;
                    for (let k = 0; k < indices.length - 1; k++) {
                        targetObject = {
                            type: "IndexExpression",
                            object: targetObject,
                            index: indices[k]
                        };
                    }

                    return {
                        type: "IndexAssignmentStatement",
                        object: targetObject,
                        index: indices[indices.length - 1],
                        value: nilai
                    };
                }
            }

            // iki["method"]() or iki["prop"] standalone → ExpressionStatement
            const expr = parseExpression();
            return {
                type: "ExpressionStatement",
                expression: expr
            };
        }

        // =========================
        // ANYAR (anyar Struct() as statement OR anyar = ... re-assignment)
        // =========================
        if (token.type === "ANYAR") {
            if (tokens[i + 1] && tokens[i + 1].type === "EQUALS") {
                const nama = token.value;
                i += 2; // lewati nama dan "="
                if (i >= tokens.length) {
                    throw new Error('Dibutuhake nilai sawise "="');
                }
                const nilai = parseExpression();
                return {
                    type: "AssignmentStatement",
                    name: nama,
                    value: nilai
                };
            }
            const expr = parseExpression();
            return {
                type: "ExpressionStatement",
                expression: expr
            };
        }

        // =========================
        // TULIS (Output / print)
        // =========================
        if (token.type === "TULIS") {
            i++; // lewati "tulis"

            if (i >= tokens.length) {
                throw new Error('"tulis" mbutuhake nilai utawa ekspresi');
            }

            const expr = parseExpression();

            return {
                type: "PrintStatement",
                expression: expr
            };
        }

        // =========================
        // YEN (Percabangan if / else)
        // =========================
        if (token.type === "YEN") {
            i++; // lewati "yen"

            if (i >= tokens.length || tokens[i].type === "LEFT_BRACE") {
                throw new Error('Sawise "yen" kudu ana kondisi sadurunge "{"');
            }

            const condition = parseExpression();
            const thenBlock = parseBlock();

            let elseBlock = null;

            if (tokens[i] && tokens[i].type === "LIYANE") {
                i++; // lewati "liyane"

                // Mendukung "liyane yen" (else if)
                if (tokens[i] && tokens[i].type === "YEN") {
                    elseBlock = [parseStatement()];
                } else {
                    elseBlock = parseBlock();
                }
            }

            return {
                type: "IfStatement",
                condition: condition,
                thenBlock: thenBlock,
                elseBlock: elseBlock
            };
        }

        if (token.type === "LIYANE") {
            throw new Error('"liyane" kudu ditulis sawise blok "yen"');
        }

        // =========================
        // NALIKA (While loop)
        // =========================
        if (token.type === "NALIKA") {
            i++; // lewati "nalika"

            if (i >= tokens.length || tokens[i].type === "LEFT_BRACE") {
                throw new Error('Sawise "nalika" kudu ana kondisi sadurunge "{"');
            }

            const condition = parseExpression();

            loopDepth++;
            const body = parseBlock();
            loopDepth--;

            return {
                type: "WhileStatement",
                condition: condition,
                body: body
            };
        }

        // =========================
        // KANGGO (For loop: kanggo i = 1 nganti 10 [langkah 2] { ... } UTAWA kanggo saben item ing array { ... })
        // =========================
        if (token.type === "KANGGO") {
            i++; // lewati "kanggo"

            // Foreach loop: kanggo saben <variable> ing <array> { ... }
            if (tokens[i] && tokens[i].type === "SABEN") {
                i++; // lewati "saben"

                const iteratorToken = tokens[i];
                if (!iteratorToken || iteratorToken.type !== "IDENTIFIER") {
                    throw new Error('Sawise "saben" kudu ana jeneng variabel iterator');
                }
                const iterator = iteratorToken.value;
                i++; // lewati nama variabel iterator

                const ingToken = tokens[i];
                if (!ingToken || ingToken.type !== "ING") {
                    throw new Error('Perulangan "kanggo saben" mbutuhake tembung kunci "ing"');
                }
                i++; // lewati "ing"

                if (i >= tokens.length || tokens[i].type === "LEFT_BRACE") {
                    throw new Error('Dibutuhake ekspresi sumber sawise "ing"');
                }

                const iterable = parseExpression();

                if (!tokens[i] || tokens[i].type !== "LEFT_BRACE") {
                    throw new Error('Sawise ekspresi "ing" kudu ana blok "{"');
                }

                loopDepth++;
                const body = parseBlock();
                loopDepth--;

                return {
                    type: "ForEachStatement",
                    iterator: iterator,
                    iterable: iterable,
                    body: body
                };
            }

            const variableToken = tokens[i];
            if (!variableToken || variableToken.type !== "IDENTIFIER") {
                throw new Error('Sawise "kanggo" kudu ana jeneng variabel (contoh: kanggo i = 1 nganti 10)');
            }
            i++; // lewati nama variabel

            const equalsToken = tokens[i];
            if (!equalsToken || equalsToken.type !== "EQUALS") {
                throw new Error('Sawise jeneng variabel ing "kanggo" kudu ana tanda "="');
            }
            i++; // lewati "="

            if (i >= tokens.length) {
                throw new Error('Dibutuhake nilai wiwitan sawise "=" ing perulangan "kanggo"');
            }

            const startExpr = parseExpression();

            const ngantiToken = tokens[i];
            if (!ngantiToken || ngantiToken.type !== "NGANTI") {
                throw new Error('Perulangan "kanggo" mbutuhake tembung kunci "nganti" (contoh: kanggo i = 1 nganti 10)');
            }
            i++; // lewati "nganti"

            if (i >= tokens.length) {
                throw new Error('Dibutuhake nilai pungkasan sawise "nganti" ing perulangan "kanggo"');
            }

            const endExpr = parseExpression();

            let stepExpr = null;
            if (tokens[i] && tokens[i].type === "LANGKAH") {
                i++; // lewati "langkah"
                if (i >= tokens.length) {
                    throw new Error('Dibutuhake nilai langkah sawise "langkah"');
                }
                stepExpr = parseExpression();
            }

            loopDepth++;
            const body = parseBlock();
            loopDepth--;

            return {
                type: "ForStatement",
                variable: variableToken.value,
                start: startExpr,
                end: endExpr,
                step: stepExpr,
                body: body
            };
        }

        // =========================
        // MANDHEG (Break)
        // =========================
        if (token.type === "MANDHEG") {
            if (loopDepth <= 0) {
                throw new Error('"mandheg" mung bisa digunakake ing njero loop');
            }
            i++; // lewati "mandheg"
            return {
                type: "BreakStatement"
            };
        }

        // =========================
        // LANJUT (Continue)
        // =========================
        if (token.type === "LANJUT") {
            if (loopDepth <= 0) {
                throw new Error('"lanjut" mung bisa digunakake ing njero loop');
            }
            i++; // lewati "lanjut"
            return {
                type: "ContinueStatement"
            };
        }

        // =========================
        // GUNA (Deklarasi Fungsi)
        // =========================
        if (token.type === "GUNA") {
            if (inFunction) {
                throw new Error('Deklarasi "guna" ing njero fungsi ora diidinake');
            }
            i++; // lewati "guna"

            const nameToken = tokens[i];
            if (!nameToken || nameToken.type !== "IDENTIFIER") {
                throw new Error('Sawise "guna" kudu ana jeneng fungsi');
            }
            i++; // lewati nama fungsi

            if (!tokens[i] || tokens[i].type !== "LEFT_PAREN") {
                throw new Error('Sawise jeneng fungsi kudu ana "("');
            }
            i++; // lewati "("

            const parameters = [];
            if (tokens[i] && tokens[i].type !== "RIGHT_PAREN") {
                while (true) {
                    const paramToken = tokens[i];
                    if (!paramToken || (paramToken.type !== "IDENTIFIER" && paramToken.type !== "ANYAR")) {
                        throw new Error('Jeneng parameter fungsi kudu arupa identifier');
                    }
                    parameters.push(paramToken.value);
                    i++; // lewati parameter

                    if (tokens[i] && tokens[i].type === "COMMA") {
                        i++; // lewati ","
                    } else {
                        break;
                    }
                }
            }

            if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                throw new Error('Daftar parameter fungsi kudu ditutup nganggo ")"');
            }
            i++; // lewati ")"

            const prevInFunction = inFunction;
            const prevLoopDepth = loopDepth;
            inFunction = true;
            loopDepth = 0;

            const body = parseBlock();

            inFunction = prevInFunction;
            loopDepth = prevLoopDepth;

            return {
                type: "FunctionDeclaration",
                name: nameToken.value,
                parameters: parameters,
                body: body
            };
        }

        // =========================
        // COBA / TANGKEP (Try / Catch)
        // =========================
        if (token.type === "COBA") {
            i++; // lewati "coba"

            if (!tokens[i] || tokens[i].type !== "LEFT_BRACE") {
                throw new Error('Sawise "coba" kudu ana blok "{"');
            }

            const tryBlock = parseBlock();

            if (!tokens[i] || tokens[i].type !== "TANGKEP") {
                throw new Error('Blok "coba" mbutuhake blok "tangkep"');
            }
            i++; // lewati "tangkep"

            const paramToken = tokens[i];
            if (!paramToken || paramToken.type !== "IDENTIFIER") {
                throw new Error('Sawise "tangkep" kudu ana jeneng variabel error');
            }
            const catchParameter = paramToken.value;
            i++; // lewati nama variabel error

            if (!tokens[i] || tokens[i].type !== "LEFT_BRACE") {
                throw new Error('Sawise parameter "tangkep" kudu ana blok "{"');
            }

            const catchBlock = parseBlock();

            return {
                type: "TryCatchStatement",
                tryBlock: tryBlock,
                catchParameter: catchParameter,
                catchBlock: catchBlock
            };
        }

        if (token.type === "TANGKEP") {
            throw new Error('"tangkep" mung bisa digunakake sawise blok "coba"');
        }

        // =========================
        // LEMPAR (Throw)
        // =========================
        if (token.type === "LEMPAR") {
            i++; // lewati "lempar"

            const statementTokens = [
                "TULIS",
                "GAWE",
                "YEN",
                "LIYANE",
                "NALIKA",
                "KANGGO",
                "MANDHEG",
                "LANJUT",
                "BALI",
                "GUNA",
                "COBA",
                "TANGKEP",
                "LEMPAR",
                "IMPOR",
                "EKSPOR",
                "BENTUK",
                "RIGHT_BRACE"
            ];

            if (i >= tokens.length || statementTokens.includes(tokens[i].type)) {
                throw new Error('Dibutuhake ekspresi sawise "lempar"');
            }

            const expr = parseExpression();

            return {
                type: "ThrowStatement",
                expression: expr
            };
        }

        // =========================
        // IMPOR (Import Module V1/V2/V3)
        // =========================
        if (token.type === "IMPOR") {
            if (blockDepth > 0) {
                if (inFunction) {
                    throw new Error('"impor" ora bisa digunakake ing njero fungsi (Impor hanya bisa digunakan di top-level module)');
                }
                if (loopDepth > 0) {
                    throw new Error('"impor" ora bisa digunakake ing njero loop (Impor hanya bisa digunakan di top-level module)');
                }
                throw new Error('"impor" mung bisa digunakake ing top-level module (Impor hanya bisa digunakan di top-level module)');
            }
            i++; // lewati "impor"

            const nextToken = tokens[i];
            if (!nextToken) {
                throw new Error('Dibutuhake string path modul sawise "impor" (misal: impor "nama_modul")');
            }

            // Form 1: Selective import — impor { a, b minangka c } saka "path"
            if (nextToken.type === "LEFT_BRACE") {
                i++; // lewati "{"

                const specifiers = [];
                if (!tokens[i] || tokens[i].type === "RIGHT_BRACE") {
                    throw new Error('Dhaftar simbol ing njero "{" ora kena kosong ing selective import');
                }

                while (tokens[i] && tokens[i].type !== "RIGHT_BRACE") {
                    if (tokens[i].type !== "IDENTIFIER") {
                        throw new Error(`Dibutuhake jeneng simbol ing dhaftar impor, nanging ditemu: "${tokens[i].value}"`);
                    }
                    const imported = tokens[i].value;
                    i++; // lewati imported symbol

                    let local = imported;
                    if (tokens[i] && tokens[i].type === "MINANGKA") {
                        i++; // lewati "minangka"
                        if (!tokens[i] || tokens[i].type !== "IDENTIFIER") {
                            throw new Error('Dibutuhake jeneng alias sawise "minangka"');
                        }
                        local = tokens[i].value;
                        i++; // lewati local alias
                    }

                    specifiers.push({ imported, local });

                    if (tokens[i] && tokens[i].type === "COMMA") {
                        i++; // lewati ","
                    } else {
                        break;
                    }
                }

                if (!tokens[i] || tokens[i].type !== "RIGHT_BRACE") {
                    throw new Error('Kurung kurawal "{" ing impor kudu ditutup nganggo "}"');
                }
                i++; // lewati "}"

                if (!tokens[i] || tokens[i].type !== "SAKA") {
                    throw new Error('Dibutuhake keyword "saka" sawise dhaftar impor "{ ... }"');
                }
                i++; // lewati "saka"

                const pathToken = tokens[i];
                if (!pathToken || pathToken.type !== "STRING") {
                    throw new Error('Dibutuhake string path modul sawise "saka"');
                }
                i++; // lewati string path

                return {
                    type: "ImportStatement",
                    mode: "selective",
                    path: pathToken.value,
                    specifiers: specifiers
                };
            }

            // Form 2 & 3: String path -> Namespace import utawa Legacy import
            if (nextToken.type === "STRING") {
                const importPath = nextToken.value;
                i++; // lewati string path

                if (tokens[i] && tokens[i].type === "MINANGKA") {
                    i++; // lewati "minangka"
                    const nsToken = tokens[i];
                    if (!nsToken || nsToken.type !== "IDENTIFIER") {
                        throw new Error('Dibutuhake jeneng namespace sawise "minangka"');
                    }
                    i++; // lewati namespace identifier

                    return {
                        type: "ImportStatement",
                        mode: "namespace",
                        path: importPath,
                        namespace: nsToken.value
                    };
                }

                return {
                    type: "ImportStatement",
                    mode: "legacy",
                    path: importPath
                };
            }

            throw new Error('Dibutuhake string path modul sawise "impor" (misal: impor "nama_modul" utawa impor { x } saka "nama_modul")');
        }

        // =========================
        // EKSPOR (Export Symbol)
        // =========================
        if (token.type === "EKSPOR") {
            if (blockDepth > 0) {
                if (inFunction) {
                    throw new Error('"ekspor" ora bisa digunakake ing njero fungsi (Ekspor hanya bisa digunakan di top-level module)');
                }
                if (loopDepth > 0) {
                    throw new Error('"ekspor" ora bisa digunakake ing njero loop (Ekspor hanya bisa digunakan di top-level module)');
                }
                throw new Error('"ekspor" mung bisa digunakake ing top-level module (Ekspor hanya bisa digunakan di top-level module)');
            }
            i++; // lewati "ekspor"

            const nextToken = tokens[i];
            if (!nextToken) {
                throw new Error('Dibutuhake deklarasi fungsi utawa variabel sawise "ekspor" (contoh: ekspor guna ... utawa ekspor gawe ...)');
            }

            if (nextToken.type === "GUNA") {
                const decl = parseStatement();
                decl.isExported = true;
                return {
                    type: "ExportStatement",
                    declaration: decl
                };
            }

            if (nextToken.type === "GAWE") {
                const decl = parseStatement();
                decl.isExported = true;
                return {
                    type: "ExportStatement",
                    declaration: decl
                };
            }

            if (nextToken.type === "BENTUK") {
                const decl = parseStatement();
                decl.isExported = true;
                return {
                    type: "ExportStatement",
                    declaration: decl
                };
            }

            throw new Error(`Dibutuhake deklarasi fungsi utawa variabel sawise "ekspor", nanging ditemu: "${nextToken.value || nextToken.type}"`);
        }

        // =========================
        // BENTUK (Struct Declaration)
        // =========================
        if (token.type === "BENTUK") {
            // Top-level only
            if (blockDepth > 0) {
                if (inFunction) {
                    throw new Error('"bentuk" ora bisa digunakake ing njero fungsi (Struct hanya bisa dideklarasikake di top-level)');
                }
                if (loopDepth > 0) {
                    throw new Error('"bentuk" ora bisa digunakake ing njero loop (Struct hanya bisa dideklarasikake di top-level)');
                }
                throw new Error('"bentuk" mung bisa digunakake ing top-level (Struct hanya bisa dideklarasikake di top-level)');
            }
            i++; // lewati "bentuk"

            const nameToken = tokens[i];
            if (!nameToken || nameToken.type !== "IDENTIFIER") {
                throw new Error('Sawise "bentuk" kudu ana jeneng struct');
            }
            const structName = nameToken.value;
            i++; // lewati nama struct

            if (!tokens[i] || tokens[i].type !== "LEFT_BRACE") {
                throw new Error(`Sawise jeneng struct "${structName}" kudu ana "{"`);
            }
            i++; // lewati "{"
            blockDepth++;

            const fields = [];
            const methods = [];

            while (i < tokens.length && tokens[i].type !== "RIGHT_BRACE") {
                const memberToken = tokens[i];

                // Field: gawe nama = defaultExpr
                if (memberToken.type === "GAWE") {
                    i++; // lewati "gawe"
                    const fieldNameToken = tokens[i];
                    if (!fieldNameToken || fieldNameToken.type !== "IDENTIFIER") {
                        throw new Error(`Sawise "gawe" ing struct "${structName}" kudu ana jeneng property`);
                    }
                    const fieldName = fieldNameToken.value;
                    if (fields.some(f => f.name === fieldName)) {
                        throw new Error(`Property "${fieldName}" wis dideklarasikake ing struct "${structName}"`);
                    }
                    i++; // lewati nama field

                    if (!tokens[i] || tokens[i].type !== "EQUALS") {
                        throw new Error(`Sawise jeneng property "${fieldName}" ing struct kudu ana "="`);
                    }
                    i++; // lewati "="

                    const defaultVal = parseExpression();
                    fields.push({
                        type: "FieldDeclaration",
                        name: fieldName,
                        defaultValue: defaultVal
                    });
                    continue;
                }

                // Method: guna nama(params) { ... }
                if (memberToken.type === "GUNA") {
                    i++; // lewati "guna"

                    const methodNameToken = tokens[i];
                    if (!methodNameToken || (methodNameToken.type !== "IDENTIFIER" && methodNameToken.type !== "WIWITI")) {
                        throw new Error(`Sawise "guna" ing struct "${structName}" kudu ana jeneng method`);
                    }
                    const methodName = methodNameToken.value;
                    if (methods.some(m => m.name === methodName)) {
                        throw new Error(`Method "${methodName}" wis dideklarasikake ing struct "${structName}"`);
                    }
                    i++; // lewati nama method

                    if (!tokens[i] || tokens[i].type !== "LEFT_PAREN") {
                        throw new Error(`Sawise jeneng method "${methodName}" kudu ana "("`);
                    }
                    i++; // lewati "("

                    const params = [];
                    if (tokens[i] && tokens[i].type !== "RIGHT_PAREN") {
                        while (true) {
                            const paramToken = tokens[i];
                            if (!paramToken || (paramToken.type !== "IDENTIFIER" && paramToken.type !== "ANYAR")) {
                                throw new Error("Jeneng parameter method kudu arupa identifier");
                            }
                            params.push(paramToken.value);
                            i++;

                            if (tokens[i] && tokens[i].type === "COMMA") {
                                i++; // lewati ","
                            } else {
                                break;
                            }
                        }
                    }

                    if (!tokens[i] || tokens[i].type !== "RIGHT_PAREN") {
                        throw new Error(`Daftar parameter method "${methodName}" kudu ditutup nganggo ")"`);
                    }
                    i++; // lewati ")"

                    // Parse method body: methods can use iki but can't have nested guna decl
                    const prevInFunction = inFunction;
                    const prevLoopDepth = loopDepth;
                    inFunction = true;
                    loopDepth = 0;

                    const body = parseBlock();

                    inFunction = prevInFunction;
                    loopDepth = prevLoopDepth;

                    methods.push({
                        type: "MethodDeclaration",
                        name: methodName,
                        parameters: params,
                        body: body
                    });
                    continue;
                }

                throw new Error(`Ing njero struct "${structName}" mung diijinake deklarasi "gawe" (property) utawa "guna" (method), nanging ditemu: "${memberToken.value || memberToken.type}"`);
            }

            blockDepth--;
            if (!tokens[i] || tokens[i].type !== "RIGHT_BRACE") {
                throw new Error(`Blok struct "${structName}" kudu ditutup nganggo "}"`);
            }
            i++; // lewati "}"

            return {
                type: "StructDeclaration",
                name: structName,
                fields: fields,
                methods: methods
            };
        }

        // =========================
        // BALI (Return)
        // =========================
        if (token.type === "BALI") {
            if (!inFunction) {
                throw new Error('"bali" mung bisa digunakake ing njero fungsi');
            }
            i++; // lewati "bali"

            const statementTokens = [
                "TULIS",
                "GAWE",
                "YEN",
                "LIYANE",
                "NALIKA",
                "KANGGO",
                "MANDHEG",
                "LANJUT",
                "BALI",
                "GUNA",
                "COBA",
                "TANGKEP",
                "LEMPAR",
                "IMPOR",
                "EKSPOR",
                "BENTUK",
                "RIGHT_BRACE"
            ];

            let value = null;
            if (i < tokens.length && !statementTokens.includes(tokens[i].type)) {
                value = parseExpression();
            }

            return {
                type: "ReturnStatement",
                value: value
            };
        }

        throw new Error(`Statement ora dikenal: "${token.value}"`);
    }


    const ast = [];

    while (i < tokens.length) {
        ast.push(parseStatement());
    }

    return ast;
}

module.exports = parser;