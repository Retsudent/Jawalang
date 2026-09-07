const path = require('path');
const baseDir = path.resolve(__dirname, '..');
const lexer = require(path.join(baseDir, 'src/lexer'));
const parser = require(path.join(baseDir, 'src/parser'));
const interpreter = require(path.join(baseDir, 'src/interpreter'));

const tests = [
    {
        name: "Bound method stored in variable and called",
        code: `
bentuk Counter {
    gawe count = 0
    fungsi inc() {
        iki["count"] = iki["count"] + 1
    }
}
gawe c = anyar Counter()
gawe tambah = c["inc"]
tambah()
tambah()
tulis c["count"]
`,
        expected: ["2"]
    },
    {
        name: "Mutable field default isolation",
        code: `
bentuk Box {
    gawe items = []
}
gawe b1 = anyar Box()
gawe b2 = anyar Box()
nambah(b1["items"], 10)
tulis dawa(b1["items"])
tulis dawa(b2["items"])
`,
        expected: ["1", "0"]
    },
    {
        name: "Constructor return value is ignored",
        code: `
bentuk C {
    gawe x = 1
    fungsi wiwiti() {
        iki["x"] = 42
        bali 999
    }
}
gawe inst = anyar C()
tulis inst["x"]
tulis jinis(inst)
`,
        expected: ["42", "instance"]
    },
    {
        name: "Dynamic field overrides method",
        code: `
bentuk Robot {
    fungsi bip() {
        tulis "bip"
    }
}
gawe r = anyar Robot()
r["bip"]()
r["bip"] = "rusak"
tulis r["bip"]
`,
        expected: ["bip", "rusak"]
    },
    {
        name: "Bound method with higher-order functions",
        code: `
bentuk Multiplier {
    gawe factor = 3
    fungsi multiply(x) {
        bali x * iki["factor"]
    }
}
gawe m = anyar Multiplier()
gawe arr = [1, 2, 3]
gawe res = terapkan(m["multiply"], arr)
tulis res
`,
        expected: ["[3, 6, 9]"]
    }
];

let allPass = true;
for (const t of tests) {
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
        const tokens = lexer(t.code);
        const ast = parser(tokens);
        interpreter(ast);
        const pass = JSON.stringify(logs) === JSON.stringify(t.expected);
        if (pass) {
            origLog(`PASS: ${t.name}`);
        } else {
            origLog(`FAIL: ${t.name}\n  Expected: ${JSON.stringify(t.expected)}\n  Got:      ${JSON.stringify(logs)}`);
            allPass = false;
        }
    } catch (e) {
        origLog(`ERROR: ${t.name}: ${e.message}`);
        allPass = false;
    } finally {
        console.log = origLog;
    }
}

if (!allPass) process.exit(1);
