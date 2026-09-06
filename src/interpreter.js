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
        // VARIABLE
        // =========================
        if (node.type === "IDENTIFIER") {
            return env.get(node.value);
        }

        // =========================
        // FUNCTION CALL (CallExpression)
        // =========================
        if (node.type === "CallExpression") {
            const callee = node.callee;

            if (!(callee in functions)) {
                throw new Error(`Function "${callee}" durung digawe`);
            }

            const fn = functions[callee];

            // Evaluasi argument pada scope pemanggil (caller environment)
            const evaluatedArgs = node.arguments.map(arg => getValue(arg, env));

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

        // =========================
        // UNARY EXPRESSION (-x, +x, ora x)
        // =========================
        if (node.type === "UnaryExpression") {
            const arg = getValue(node.argument, env);

            if (node.operator === "-") {
                return -arg;
            }
            if (node.operator === "+") {
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
                    return left + right;

                case "-":
                    return left - right;

                case "*":
                    return left * right;

                case "/":
                    if (right === 0) {
                        throw new Error("Ora bisa dibagi 0! (Tidak bisa membagi dengan nol)");
                    }
                    return left / right;

                // Perbandingan
                case ">":
                    return left > right;

                case "<":
                    return left < right;

                case ">=":
                    return left >= right;

                case "<=":
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
        // INDEX EXPRESSION (arr[i])
        // =========================
        if (node.type === "IndexExpression") {
            const obj = getValue(node.object, env);
            if (!Array.isArray(obj)) {
                throw new Error(`Mung array sing bisa diindex, nanging ditemu: "${typeof obj}" (Hanya array yang bisa diindex)`);
            }
            const idx = getValue(node.index, env);
            if (typeof idx !== "number" || !Number.isInteger(idx)) {
                throw new Error(`Index array kudu bilangan bulat, nanging ditemu: "${idx}" (Index harus bilangan bulat)`);
            }
            if (idx < 0) {
                throw new Error(`Index array ora oleh negatif: ${idx} (Index tidak boleh negatif)`);
            }
            if (idx >= obj.length) {
                throw new Error(`Index array ${idx} ngluwihi ukuran array ${obj.length} (Index melebihi ukuran array)`);
            }
            return obj[idx];
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
            // UBAH NILAI ELEMEN ARRAY (arr[i] = ...)
            // =========================
            if (node.type === "IndexAssignmentStatement") {
                const obj = getValue(node.object, env);
                if (!Array.isArray(obj)) {
                    throw new Error(`Mung array sing bisa diubah elemente, nanging ditemu: "${typeof obj}" (Hanya array yang bisa diubah elemennya)`);
                }
                const idx = getValue(node.index, env);
                if (typeof idx !== "number" || !Number.isInteger(idx)) {
                    throw new Error(`Index array kudu bilangan bulat, nanging ditemu: "${idx}" (Index harus bilangan bulat)`);
                }
                if (idx < 0) {
                    throw new Error(`Index array ora oleh negatif: ${idx} (Index tidak boleh negatif)`);
                }
                if (idx >= obj.length) {
                    throw new Error(`Index array ${idx} ngluwihi ukuran array ${obj.length} (Index melebihi ukuran array)`);
                }
                obj[idx] = getValue(node.value, env);
                continue;
            }

            // =========================
            // TULIS (print)
            // =========================
            if (node.type === "PrintStatement") {
                const val = getValue(node.expression, env);
                if (Array.isArray(val)) {
                    console.log(arrayToString(val));
                } else {
                    console.log(val);
                }
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