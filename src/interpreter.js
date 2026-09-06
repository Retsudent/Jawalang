const fs = require("fs");

class BreakSignal {}
class ContinueSignal {}
class ReturnSignal {
    constructor(value) {
        this.value = value;
    }
}

class Environment {
    constructor(parent = null) {
        this.bindings = {};
        this.parent = parent;
    }

    has(name) {
        if (name in this.bindings) return true;
        if (this.parent) return this.parent.has(name);
        return false;
    }

    get(name) {
        if (name in this.bindings) {
            return this.bindings[name];
        }
        if (this.parent) {
            return this.parent.get(name);
        }
        throw new Error(`Variabel "${name}" durung digawe! (Variabel belum dibuat)`);
    }

    define(name, value) {
        this.bindings[name] = value;
    }

    assign(name, value) {
        if (name in this.bindings) {
            this.bindings[name] = value;
            return;
        }
        if (this.parent && this.parent.has(name)) {
            this.parent.assign(name, value);
            return;
        }
        throw new Error(`Variabel "${name}" durung digawe! Gunakake "gawe ${name} = ..." dhisik.`);
    }
}

function interpreter(ast) {
    const globalEnv = new Environment();
    const functions = {};
    const MAX_LOOP_ITERATIONS = 100000;
    const MAX_CALL_STACK = 500;
    let callStackDepth = 0;

    // Helper format nilai kanggo cithak (PrintStatement, arrayToString, lan error)
    function formatValue(val, isTopLevel = false) {
        if (val === null) return "null";
        if (val === true) return "bener";
        if (val === false) return "salah";
        if (typeof val === "string") {
            return isTopLevel ? val : `"${val}"`;
        }
        if (typeof val === "number") return String(val);
        if (Array.isArray(val)) {
            return "[" + val.map(el => formatValue(el, false)).join(", ") + "]";
        }
        if (val && typeof val === "object" && val._isFunction) {
            return `<fungsi ${val.name || ""}>`.trim();
        }
        if (val && typeof val === "object") {
            const keys = Object.keys(val);
            if (keys.length === 0) return "{}";
            const pairs = keys.map(k => `"${k}": ${formatValue(val[k], false)}`);
            return "{" + pairs.join(", ") + "}";
        }
        return String(val);
    }

    // Helper validasi indeks array (digunakake bareng dening IndexExpression, IndexAssignment, lan built-in)
    function validateIndex(arr, idx) {
        if (typeof idx !== "number" || !Number.isInteger(idx)) {
            throw new Error(`Index array kudu bilangan bulat, nanging ditemu: "${formatValue(idx, false)}" (Index harus bilangan bulat)`);
        }
        if (idx < 0) {
            throw new Error(`Index array ora oleh negatif: ${idx} (Index tidak boleh negatif)`);
        }
        if (idx >= arr.length) {
            throw new Error(`Index array ${idx} ngluwihi ukuran array ${arr.length} (Index melebihi ukuran array)`);
        }
    }

    // Helper deteksi tipe terpusat (Type System V1)
    function getType(val) {
        if (val === null) return "null";
        if (Array.isArray(val)) return "array";
        if (typeof val === "boolean") return "boolean";
        if (typeof val === "number") return "number";
        if (typeof val === "string") return "string";
        if (typeof val === "function" || (val && typeof val === "object" && val._isFunction)) return "function";
        if (typeof val === "object") return "object";
        return "unknown";
    }

    // Built-in Function Registry Resmi
    const builtins = {
        jinis(args) {
            if (args.length !== 1) {
                throw new Error(
                    `Function built-in "jinis" mbutuhake 1 argument, nanging diwenehi ${args.length} (Function built-in "jinis" membutuhkan 1 argument)`
                );
            }
            return getType(args[0]);
        },

        dawa(args) {
            if (args.length !== 1) {
                throw new Error(
                    `Function built-in "dawa" mbutuhake 1 argument, nanging diwenehi ${args.length} (Function built-in "dawa" membutuhkan 1 argument)`
                );
            }
            const target = args[0];
            if (!Array.isArray(target) && typeof target !== "string") {
                throw new Error(
                    `dawa() mung bisa digunakake kanggo array utawa string, nanging ditemu: "${getType(target)}" (dawa() hanya bisa digunakan untuk array atau string)`
                );
            }
            return target.length;
        },

        jupuk(args) {
            if (args.length !== 2) {
                throw new Error(
                    `Function built-in "jupuk" mbutuhake 2 argument, nanging diwenehi ${args.length} (Function built-in "jupuk" membutuhkan 2 argument)`
                );
            }
            const target = args[0];
            if (!Array.isArray(target)) {
                throw new Error(
                    `Mung array sing bisa diindex, nanging ditemu: "${getType(target)}" (Hanya array yang bisa diindex)`
                );
            }
            validateIndex(target, args[1]);
            return target[args[1]];
        },

        nambah(args) {
            if (args.length !== 2) {
                throw new Error(
                    `Function built-in "nambah" mbutuhake 2 argument, nanging diwenehi ${args.length} (Function built-in "nambah" membutuhkan 2 argument)`
                );
            }
            const target = args[0];
            if (!Array.isArray(target)) {
                throw new Error(
                    `nambah() mbutuhake array, nanging ditemu: "${getType(target)}" (nambah() membutuhkan array)`
                );
            }
            target.push(args[1]);
            return null;
        },

        busak(args) {
            if (args.length !== 2) {
                throw new Error(
                    `Function built-in "busak" mbutuhake 2 argument, nanging diwenehi ${args.length} (Function built-in "busak" membutuhkan 2 argument)`
                );
            }
            const target = args[0];
            if (!Array.isArray(target)) {
                throw new Error(
                    `busak() mbutuhake array, nanging ditemu: "${getType(target)}" (busak() membutuhkan array)`
                );
            }
            validateIndex(target, args[1]);
            target.splice(args[1], 1);
            return null;
        },

        // =====================================
        // STRING UTILITY ENGINE V1
        // =====================================
        motong(args) {
            if (args.length !== 3) {
                throw new Error(
                    `Function built-in "motong" mbutuhake 3 argument, nanging diwenehi ${args.length} (Function built-in "motong" membutuhkan 3 argument)`
                );
            }
            const target = args[0];
            if (typeof target !== "string") {
                throw new Error(
                    `motong() mung bisa digunakake kanggo string, nanging ditemu: "${getType(target)}" (motong() hanya bisa digunakan untuk string)`
                );
            }
            const mulai = args[1];
            if (typeof mulai !== "number" || !Number.isInteger(mulai)) {
                throw new Error(
                    `Index wiwitan motong() kudu bilangan bulat, nanging ditemu: "${mulai}" (Index awal motong() harus bilangan bulat)`
                );
            }
            if (mulai < 0) {
                throw new Error(
                    `Index wiwitan motong() ora oleh negatif: ${mulai} (Index awal motong() tidak boleh negatif)`
                );
            }
            const akhir = args[2];
            if (typeof akhir !== "number" || !Number.isInteger(akhir)) {
                throw new Error(
                    `Index pungkasan motong() kudu bilangan bulat, nanging ditemu: "${akhir}" (Index akhir motong() harus bilangan bulat)`
                );
            }
            if (akhir < 0) {
                throw new Error(
                    `Index pungkasan motong() ora oleh negatif: ${akhir} (Index akhir motong() tidak boleh negatif)`
                );
            }
            if (mulai > akhir) {
                throw new Error(
                    `Index wiwitan ora oleh luwih gedhe tinimbang index pungkasan (Index awal tidak boleh lebih besar dari index akhir)`
                );
            }
            if (mulai > target.length) {
                throw new Error(
                    `Index wiwitan motong() ${mulai} ngluwihi dawa string ${target.length} (Index awal motong() melebihi panjang string)`
                );
            }
            if (akhir > target.length) {
                throw new Error(
                    `Index pungkasan motong() ${akhir} ngluwihi dawa string ${target.length} (Index akhir motong() melebihi panjang string)`
                );
            }
            return target.slice(mulai, akhir);
        },

        ngganti(args) {
            if (args.length !== 3) {
                throw new Error(
                    `Function built-in "ngganti" mbutuhake 3 argument, nanging diwenehi ${args.length} (Function built-in "ngganti" membutuhkan 3 argument)`
                );
            }
            const target = args[0];
            if (typeof target !== "string") {
                throw new Error(
                    `Argument kapisan ngganti() kudu string, nanging ditemu: "${getType(target)}" (Argument pertama ngganti() harus string)`
                );
            }
            const lama = args[1];
            if (typeof lama !== "string") {
                throw new Error(
                    `Argument kapindho ngganti() kudu string, nanging ditemu: "${getType(lama)}" (Argument kedua ngganti() harus string)`
                );
            }
            const anyar = args[2];
            if (typeof anyar !== "string") {
                throw new Error(
                    `Argument katelu ngganti() kudu string, nanging ditemu: "${getType(anyar)}" (Argument ketiga ngganti() harus string)`
                );
            }
            return target.split(lama).join(anyar);
        },

        gedhe(args) {
            if (args.length !== 1) {
                throw new Error(
                    `Function built-in "gedhe" mbutuhake 1 argument, nanging diwenehi ${args.length} (Function built-in "gedhe" membutuhkan 1 argument)`
                );
            }
            const target = args[0];
            if (typeof target !== "string") {
                throw new Error(
                    `gedhe() mung bisa digunakake kanggo string, nanging ditemu: "${getType(target)}" (gedhe() hanya bisa digunakan untuk string)`
                );
            }
            return target.toUpperCase();
        },

        cilik(args) {
            if (args.length !== 1) {
                throw new Error(
                    `Function built-in "cilik" mbutuhake 1 argument, nanging diwenehi ${args.length} (Function built-in "cilik" membutuhkan 1 argument)`
                );
            }
            const target = args[0];
            if (typeof target !== "string") {
                throw new Error(
                    `cilik() mung bisa digunakake kanggo string, nanging ditemu: "${getType(target)}" (cilik() hanya bisa digunakan untuk string)`
                );
            }
            return target.toLowerCase();
        },

        // =====================================
        // INPUT ENGINE V1
        // =====================================
        takon(args) {
            if (args.length > 1) {
                throw new Error(
                    `Function built-in "takon" mbutuhake 0 utawa 1 argument, nanging diwenehi ${args.length} (Function built-in "takon" membutuhkan 0 atau 1 argument)`
                );
            }
            if (args.length === 1 && typeof args[0] !== "string") {
                throw new Error(
                    `Argumen prompt ing "takon" kudu string, nanging ditemu: "${getType(args[0])}" (Argumen prompt pada "takon" harus string)`
                );
            }
            const prompt = args.length === 1 ? args[0] : "";
            if (prompt) {
                process.stdout.write(prompt);
            }

            const buf = Buffer.alloc(1);
            const bytes = [];
            while (true) {
                let bytesRead = 0;
                try {
                    bytesRead = fs.readSync(0, buf, 0, 1, null);
                } catch (e) {
                    break;
                }
                if (bytesRead === 0) {
                    break;
                }
                const b = buf[0];
                if (b === 10) { // \n
                    break;
                }
                if (b !== 13) { // \r
                    bytes.push(b);
                }
            }
            return Buffer.from(bytes).toString("utf8");
        }
    };

    function getValue(node, env) {
        if (!node) {
            throw new Error("Node ekspresi kosong");
        }

        // =========================
        // NUMBER
        // =========================
        if (node.type === "NUMBER") {
            return node.value;
        }

        // =========================
        // STRING
        // =========================
        if (node.type === "STRING") {
            return node.value;
        }

        // =========================
        // BOOLEAN (bener / salah)
        // =========================
        if (node.type === "BOOLEAN") {
            return node.value;
        }

        // =========================
        // NULL
        // =========================
        if (node.type === "NULL" || node.type === "NullLiteral") {
            return null;
        }

        // =========================
        // VARIABLE
        // =========================
        if (node.type === "IDENTIFIER") {
            if (env.has(node.value)) {
                return env.get(node.value);
            }
            if (node.value in functions) {
                return { _isFunction: true, name: node.value, ...functions[node.value] };
            }
            return env.get(node.value);
        }

        // =========================
        // FUNCTION CALL (CallExpression)
        // =========================
        if (node.type === "CallExpression") {
            const callee = node.callee;

            // Evaluasi argument pada scope pemanggil (caller environment)
            const evaluatedArgs = node.arguments.map(arg => getValue(arg, env));

            // 1. Cek User-defined function (prioritas luwih dhuwur, ngidini override)
            if (callee in functions) {
                const fn = functions[callee];

                if (evaluatedArgs.length !== fn.parameters.length) {
                    throw new Error(
                        `Function "${callee}" mbutuhake ${fn.parameters.length} argument, nanging diwenehi ${evaluatedArgs.length}`
                    );
                }

                if (callStackDepth >= MAX_CALL_STACK) {
                    throw new Error("Batas kedalaman pemanggilan function terlampaui (Potensi infinite recursion)");
                }

                // Buat local environment baru yang merujuk ke globalEnv
                const localEnv = new Environment(globalEnv);

                for (let p = 0; p < fn.parameters.length; p++) {
                    localEnv.define(fn.parameters[p], evaluatedArgs[p]);
                }

                callStackDepth++;
                try {
                    execute(fn.body, localEnv);
                    return null; // Return default jika fungsi selesai tanpa "bali"
                } catch (e) {
                    if (e instanceof ReturnSignal) {
                        return e.value;
                    }
                    throw e;
                } finally {
                    callStackDepth--;
                }
            }

            // 2. Cek Built-in function
            if (callee in builtins) {
                return builtins[callee](evaluatedArgs);
            }

            // 3. Undefined function
            throw new Error(`Function "${callee}" durung digawe`);
        }

        // =========================
        // UNARY EXPRESSION (-x, +x, ora x)
        // =========================
        if (node.type === "UnaryExpression") {
            const arg = getValue(node.argument, env);

            if (node.operator === "-") {
                if (arg === null) {
                    throw new Error(`Operator unary "-" ora bisa digunakake kanggo null (Operator unary "-" tidak bisa digunakan untuk null)`);
                }
                if (typeof arg === "object") {
                    throw new Error(`Operator unary "-" ora bisa digunakake kanggo ${getType(arg)} (Operator unary "-" tidak bisa digunakan untuk ${getType(arg)})`);
                }
                return -arg;
            }
            if (node.operator === "+") {
                if (arg === null) {
                    throw new Error(`Operator unary "+" ora bisa digunakake kanggo null (Operator unary "+" tidak bisa digunakan untuk null)`);
                }
                if (typeof arg === "object") {
                    throw new Error(`Operator unary "+" ora bisa digunakake kanggo ${getType(arg)} (Operator unary "+" tidak bisa digunakan untuk ${getType(arg)})`);
                }
                return +arg;
            }
            if (node.operator === "ora") {
                if (typeof arg !== "boolean") {
                    throw new Error('Operator "ora" mbutuhake nilai boolean (Operator "ora" membutuhkan nilai boolean)');
                }
                return !arg;
            }
            throw new Error(`Operator unary ora dikenal: "${node.operator}"`);
        }

        // =========================
        // BINARY EXPRESSION (+, -, *, /, >, <, >=, <=, ==, !=, lan, utawa)
        // =========================
        if (node.type === "BinaryExpression") {
            // Evaluasi logika dengan short-circuit dan validasi boolean
            if (node.operator === "lan") {
                const left = getValue(node.left, env);
                if (typeof left !== "boolean") {
                    throw new Error('Operator "lan" mbutuhake nilai boolean (Operator "lan" membutuhkan nilai boolean)');
                }
                if (left === false) {
                    return false;
                }
                const right = getValue(node.right, env);
                if (typeof right !== "boolean") {
                    throw new Error('Operator "lan" mbutuhake nilai boolean (Operator "lan" membutuhkan nilai boolean)');
                }
                return right;
            }

            if (node.operator === "utawa") {
                const left = getValue(node.left, env);
                if (typeof left !== "boolean") {
                    throw new Error('Operator "utawa" mbutuhake nilai boolean (Operator "utawa" membutuhkan nilai boolean)');
                }
                if (left === true) {
                    return true;
                }
                const right = getValue(node.right, env);
                if (typeof right !== "boolean") {
                    throw new Error('Operator "utawa" mbutuhake nilai boolean (Operator "utawa" membutuhkan nilai boolean)');
                }
                return right;
            }

            const left = getValue(node.left, env);
            const right = getValue(node.right, env);

            switch (node.operator) {
                // Matematika
                case "+":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "+" ora bisa digunakake kanggo null (Operasi "+" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "+" ora bisa digunakake kanggo ${badType} (Operasi "+" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left + right;

                case "-":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "-" ora bisa digunakake kanggo null (Operasi "-" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "-" ora bisa digunakake kanggo ${badType} (Operasi "-" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left - right;

                case "*":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "*" ora bisa digunakake kanggo null (Operasi "*" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "*" ora bisa digunakake kanggo ${badType} (Operasi "*" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left * right;

                case "/":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "/" ora bisa digunakake kanggo null (Operasi "/" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "/" ora bisa digunakake kanggo ${badType} (Operasi "/" tidak bisa digunakan untuk ${badType})`);
                    }
                    if (right === 0) {
                        throw new Error("Ora bisa dibagi 0! (Tidak bisa membagi dengan nol)");
                    }
                    return left / right;

                // Perbandingan
                case ">":
                    if (left === null || right === null) {
                        throw new Error(`Operasi ">" ora bisa digunakake kanggo null (Operasi ">" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi ">" ora bisa digunakake kanggo ${badType} (Operasi ">" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left > right;

                case "<":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "<" ora bisa digunakake kanggo null (Operasi "<" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "<" ora bisa digunakake kanggo ${badType} (Operasi "<" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left < right;

                case ">=":
                    if (left === null || right === null) {
                        throw new Error(`Operasi ">=" ora bisa digunakake kanggo null (Operasi ">=" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi ">=" ora bisa digunakake kanggo ${badType} (Operasi ">=" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left >= right;

                case "<=":
                    if (left === null || right === null) {
                        throw new Error(`Operasi "<=" ora bisa digunakake kanggo null (Operasi "<=" tidak bisa digunakan untuk null)`);
                    }
                    if (typeof left === "object" || typeof right === "object") {
                        const badType = typeof left === "object" ? getType(left) : getType(right);
                        throw new Error(`Operasi "<=" ora bisa digunakake kanggo ${badType} (Operasi "<=" tidak bisa digunakan untuk ${badType})`);
                    }
                    return left <= right;

                case "==":
                    return left === right;

                case "!=":
                    return left !== right;

                default:
                    throw new Error(`Operator ora dikenal: "${node.operator}"`);
            }
        }

        // =========================
        // ARRAY (ArrayExpression)
        // =========================
        if (node.type === "ArrayExpression") {
            return node.elements.map(el => getValue(el, env));
        }

        // =========================
        // OBJECT (ObjectExpression)
        // =========================
        if (node.type === "ObjectExpression") {
            const obj = {};
            for (const prop of node.properties) {
                obj[prop.key] = getValue(prop.value, env);
            }
            return obj;
        }

        // =========================
        // INDEX EXPRESSION (arr[i], obj[k])
        // =========================
        if (node.type === "IndexExpression") {
            const obj = getValue(node.object, env);
            if (obj === null) {
                throw new Error('Ora bisa ngakses property saka null (Tidak bisa mengakses property dari null)');
            }
            if (Array.isArray(obj)) {
                const idx = getValue(node.index, env);
                validateIndex(obj, idx);
                return obj[idx];
            }
            if (typeof obj === "object" && !obj._isFunction) {
                const key = getValue(node.index, env);
                if (typeof key !== "string") {
                    throw new Error(`Object mung bisa diakses nganggo key string, nanging ditemu: "${getType(key)}" (Object hanya bisa diakses dengan key string)`);
                }
                if (key in obj) {
                    return obj[key];
                }
                return null;
            }
            throw new Error(`Mung array utawa object sing bisa diindex, nanging ditemu: "${getType(obj)}" (Hanya array atau object yang bisa diindex)`);
        }

        throw new Error(`Ora bisa nemokake nilai saka "${node.type}"`);
    }

    // Helper: ubah array JS dadi string format [1, 2, 3]
    function arrayToString(val) {
        if (!Array.isArray(val)) {
            if (val === null) return "null";
            if (val === true) return "bener";
            if (val === false) return "salah";
            if (typeof val === "string") return `"${val}"`;
            return String(val);
        }
        return "[" + val.map(arrayToString).join(", ") + "]";
    }

    function execute(statements, env) {
        if (!Array.isArray(statements)) {
            return;
        }

        for (const node of statements) {
            // =========================
            // DEKLARASI VARIABEL (gawe ...)
            // =========================
            if (node.type === "VariableDeclaration") {
                env.define(node.name, getValue(node.value, env));
                continue;
            }

            // =========================
            // UBAH NILAI VARIABEL (x = ...)
            // =========================
            if (node.type === "AssignmentStatement") {
                env.assign(node.name, getValue(node.value, env));
                continue;
            }

            // =========================
            // UBAH NILAI ELEMEN ARRAY / PROPERTY OBJECT (arr[i] = ..., obj[k] = ...)
            // =========================
            if (node.type === "IndexAssignmentStatement") {
                const obj = getValue(node.object, env);
                if (obj === null) {
                    throw new Error('Ora bisa ngowahi property saka null (Tidak bisa mengubah property dari null)');
                }
                if (Array.isArray(obj)) {
                    const idx = getValue(node.index, env);
                    validateIndex(obj, idx);
                    obj[idx] = getValue(node.value, env);
                    continue;
                }
                if (typeof obj === "object" && !obj._isFunction) {
                    const key = getValue(node.index, env);
                    if (typeof key !== "string") {
                        throw new Error(`Key object kudu awujud string, nanging ditemu: "${getType(key)}" (Key object harus berupa string)`);
                    }
                    obj[key] = getValue(node.value, env);
                    continue;
                }
                throw new Error(`Mung array utawa object sing bisa diubah elemente, nanging ditemu: "${getType(obj)}" (Hanya array atau object yang bisa diubah elemennya)`);
            }

            // =========================
            // TULIS (print)
            // =========================
            if (node.type === "PrintStatement") {
                const val = getValue(node.expression, env);
                console.log(formatValue(val, true));
                continue;
            }

            // =========================
            // EXPRESSION STATEMENT (misal: salam() standalone)
            // =========================
            if (node.type === "ExpressionStatement") {
                getValue(node.expression, env);
                continue;
            }

            // =========================
            // YEN / LIYANE (if / else)
            // =========================
            if (node.type === "IfStatement") {
                const condition = getValue(node.condition, env);

                if (condition) {
                    execute(node.thenBlock, env);
                } else if (node.elseBlock) {
                    execute(node.elseBlock, env);
                }

                continue;
            }

            // =========================
            // MANDHEG (break)
            // =========================
            if (node.type === "BreakStatement") {
                throw new BreakSignal();
            }

            // =========================
            // LANJUT (continue)
            // =========================
            if (node.type === "ContinueStatement") {
                throw new ContinueSignal();
            }

            // =========================
            // NALIKA (while loop)
            // =========================
            if (node.type === "WhileStatement") {
                let iterations = 0;

                while (getValue(node.condition, env)) {
                    iterations++;
                    if (iterations > MAX_LOOP_ITERATIONS) {
                        throw new Error("Perulangan ngluwihi wates maksimum (Potensi infinite loop terdeteksi)");
                    }

                    try {
                        execute(node.body, env);
                    } catch (e) {
                        if (e instanceof BreakSignal) {
                            break;
                        }
                        if (e instanceof ContinueSignal) {
                            continue;
                        }
                        throw e;
                    }
                }

                continue;
            }

            // =========================
            // KANGGO (for loop)
            // =========================
            if (node.type === "ForStatement") {
                const startVal = getValue(node.start, env);
                const endVal = getValue(node.end, env);
                const stepVal = node.step ? getValue(node.step, env) : (startVal <= endVal ? 1 : -1);

                if (typeof startVal !== "number" || typeof endVal !== "number" || typeof stepVal !== "number") {
                    throw new Error('Nilai wiwitan, pungkasan, lan langkah ing perulangan "kanggo" kudu angka');
                }

                if (stepVal === 0) {
                    throw new Error('Langkah ing perulangan "kanggo" ora kena 0');
                }

                let iterations = 0;
                env.define(node.variable, startVal);

                while (stepVal > 0 ? env.get(node.variable) <= endVal : env.get(node.variable) >= endVal) {
                    iterations++;
                    if (iterations > MAX_LOOP_ITERATIONS) {
                        throw new Error("Perulangan ngluwihi wates maksimum (Potensi infinite loop terdeteksi)");
                    }

                    try {
                        execute(node.body, env);
                    } catch (e) {
                        if (e instanceof BreakSignal) {
                            break;
                        }
                        if (e instanceof ContinueSignal) {
                            // Lompat sisa body, langkah tetap ditambah
                        } else {
                            throw e;
                        }
                    }

                    env.assign(node.variable, env.get(node.variable) + stepVal);
                }

                continue;
            }

            // =========================
            // FUNGSI (Deklarasi Fungsi)
            // =========================
            if (node.type === "FunctionDeclaration") {
                if (node.name in functions) {
                    throw new Error(`Function "${node.name}" wis ana`);
                }
                functions[node.name] = node;
                continue;
            }

            // =========================
            // BALI (Return)
            // =========================
            if (node.type === "ReturnStatement") {
                const val = node.value ? getValue(node.value, env) : null;
                throw new ReturnSignal(val);
            }

            throw new Error(`Statement ora dikenal: "${node.type}"`);
        }
    }

    try {
        execute(ast, globalEnv);
    } catch (e) {
        if (e instanceof BreakSignal) {
            throw new Error('"mandheg" mung bisa digunakake ing njero loop');
        }
        if (e instanceof ContinueSignal) {
            throw new Error('"lanjut" mung bisa digunakake ing njero loop');
        }
        if (e instanceof ReturnSignal) {
            throw new Error('"bali" mung bisa digunakake ing njero fungsi');
        }
        throw e;
    }
}

module.exports = interpreter;