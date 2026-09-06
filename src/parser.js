function parser(tokens) {
    let i = 0;
    let loopDepth = 0;
    let inFunction = false;

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

        // Identifier atau Function Call
        if (token.type === "IDENTIFIER") {
            i++;

            // Jika diikuti kurung buka "(", ini adalah CallExpression: nama(...)
            if (tokens[i] && tokens[i].type === "LEFT_PAREN") {
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

                return {
                    type: "CallExpression",
                    callee: token.value,
                    arguments: args
                };
            }

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

        throw new Error(`Nilai ora valid: "${token.value}"`);
    }

    // 1b. parsePostfix()
    // Menangani akses index array setelah primary: arr[0], fn()[1], data[0][1]
    function parsePostfix() {
        let node = parsePrimary();

        while (tokens[i] && tokens[i].type === "LEFT_BRACKET") {
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

        while (i < tokens.length && tokens[i].type !== "RIGHT_BRACE") {
            statements.push(parseStatement());
        }

        if (!tokens[i] || tokens[i].type !== "RIGHT_BRACE") {
            throw new Error('Blok durung ditutup nganggo "}"');
        }

        i++; // lewati "}"

        return statements;
    }

    function parseStatement() {
        const token = tokens[i];

        // =========================
        // GAWE (Deklarasi variabel baru)
        // =========================
        if (token.type === "GAWE") {
            i++; // lewati "gawe"

            const nama = tokens[i];
            if (!nama || nama.type !== "IDENTIFIER") {
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
            // Index assignment: nama[...][...] = ...
            if (tokens[i + 1] && tokens[i + 1].type === "LEFT_BRACKET") {
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
        // FUNGSI (Deklarasi Fungsi)
        // =========================
        if (token.type === "FUNGSI") {
            if (inFunction) {
                throw new Error('Deklarasi "fungsi" ing njero fungsi ora diidinake');
            }
            i++; // lewati "fungsi"

            const nameToken = tokens[i];
            if (!nameToken || nameToken.type !== "IDENTIFIER") {
                throw new Error('Sawise "fungsi" kudu ana jeneng fungsi');
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
                    if (!paramToken || paramToken.type !== "IDENTIFIER") {
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
                "FUNGSI",
                "COBA",
                "TANGKEP",
                "LEMPAR",
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
                "FUNGSI",
                "COBA",
                "TANGKEP",
                "LEMPAR",
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