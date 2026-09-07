const lexer = require('../src/lexer');
const parser = require('../src/parser');
const interpreter = require('../src/interpreter');

function run(code) {
    return interpreter(parser(lexer(code)));
}

let passed = 0;
let failed = 0;

function assertThrows(title, code, expectedMsgSubstr) {
    try {
        run(code);
        console.error("FAIL:", title, "- Haruse ngasilake error nanging ora");
        failed++;
    } catch (e) {
        if (!expectedMsgSubstr || e.message.includes(expectedMsgSubstr)) {
            console.log("PASS:", title, "->", e.message);
            passed++;
        } else {
            console.error("FAIL:", title, "- Pesen error ora cocog:", e.message, "vs:", expectedMsgSubstr);
            failed++;
        }
    }
}

// 1. motong()
assertThrows("motong()", "motong()", "mbutuhake 3 argument");
assertThrows("motong(\"Jawa\")", "motong(\"Jawa\")", "mbutuhake 3 argument");
assertThrows("motong(\"Jawa\", 0)", "motong(\"Jawa\", 0)", "mbutuhake 3 argument");
assertThrows("motong(\"Jawa\", 0, 2, 3)", "motong(\"Jawa\", 0, 2, 3)", "mbutuhake 3 argument");
assertThrows("motong(123, 0, 2)", "motong(123, 0, 2)", "mung bisa digunakake kanggo string");
assertThrows("motong(\"Jawa\", 1.5, 3)", "motong(\"Jawa\", 1.5, 3)", "kudu bilangan bulat");
assertThrows("motong(\"Jawa\", -1, 2)", "motong(\"Jawa\", -1, 2)", "ora oleh negatif");

// 2. ngganti()
assertThrows("ngganti()", "ngganti()", "mbutuhake 3 argument");
assertThrows("ngganti(\"Jawa\")", "ngganti(\"Jawa\")", "mbutuhake 3 argument");
assertThrows("ngganti(\"Jawa\", \"a\")", "ngganti(\"Jawa\", \"a\")", "mbutuhake 3 argument");
assertThrows("ngganti(\"Jawa\", \"a\", \"b\", \"c\")", "ngganti(\"Jawa\", \"a\", \"b\", \"c\")", "mbutuhake 3 argument");
assertThrows("ngganti(123, \"a\", \"b\")", "ngganti(123, \"a\", \"b\")", "Argument kapisan ngganti() kudu string");
assertThrows("ngganti(\"Jawa\", 1, \"b\")", "ngganti(\"Jawa\", 1, \"b\")", "Argument kapindho ngganti() kudu string");
assertThrows("ngganti(\"Jawa\", \"a\", 2)", "ngganti(\"Jawa\", \"a\", 2)", "Argument katelu ngganti() kudu string");

// 3. gedhe()
assertThrows("gedhe()", "gedhe()", "mbutuhake 1 argument");
assertThrows("gedhe(123)", "gedhe(123)", "mung bisa digunakake kanggo string");

// 4. cilik()
assertThrows("cilik()", "cilik()", "mbutuhake 1 argument");
assertThrows("cilik(123)", "cilik(123)", "mung bisa digunakake kanggo string");

console.log("\nTotal Passed:", passed, "Failed:", failed);
if (failed > 0) process.exit(1);
