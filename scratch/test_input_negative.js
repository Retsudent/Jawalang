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

// 1. Prompt bukan string (number)
assertThrows("takon(123)", "takon(123)", "kudu string");

// 2. Terlalu banyak argumen
assertThrows("takon(\"A\", \"B\")", "takon(\"A\", \"B\")", "mbutuhake 0 utawa 1 argument");

// 3. Prompt bukan string (boolean)
assertThrows("takon(bener)", "takon(bener)", "kudu string");

// 4. Prompt bukan string (array)
assertThrows("takon([1, 2])", "takon([1, 2])", "kudu string");

console.log("\nTotal Passed:", passed, "Failed:", failed);
if (failed > 0) process.exit(1);
