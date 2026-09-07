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

// 1. dawa() tanpa argument
assertThrows("dawa()", "dawa()", "mbutuhake 1 argument");

// 2. dawa([1, 2], 3) kelebihan argument
assertThrows("dawa([1, 2], 3)", "dawa([1, 2], 3)", "mbutuhake 1 argument");

// 3. jupuk() tanpa argument
assertThrows("jupuk()", "jupuk()", "mbutuhake 2 argument");

// 4. jupuk([1, 2]) kurang argument
assertThrows("jupuk([1, 2])", "jupuk([1, 2])", "mbutuhake 2 argument");

// 5. jupuk([1, 2], -1) negative index
assertThrows("jupuk([1, 2], -1)", "jupuk([1, 2], -1)", "ora oleh negatif");

// 6. jupuk([1, 2], 99) out of bounds
assertThrows("jupuk([1, 2], 99)", "jupuk([1, 2], 99)", "ngluwihi ukuran array");

// 7. jupuk([1, 2], 1.5) float index
assertThrows("jupuk([1, 2], 1.5)", "jupuk([1, 2], 1.5)", "kudu bilangan bulat");

// 8. jupuk("abc", 0) target bukan array
assertThrows("jupuk(\"abc\", 0)", "jupuk(\"abc\", 0)", "Mung array sing bisa diindex");

// 9. nambah() tanpa argument
assertThrows("nambah()", "nambah()", "mbutuhake 2 argument");

// 10. nambah("abc", 10) target bukan array
assertThrows("nambah(\"abc\", 10)", "nambah(\"abc\", 10)", "nambah() mbutuhake array");

// 11. busak() tanpa argument
assertThrows("busak()", "busak()", "mbutuhake 2 argument");

// 12. busak("abc", 0) target bukan array
assertThrows("busak(\"abc\", 0)", "busak(\"abc\", 0)", "busak() mbutuhake array");

// 13. busak([1, 2], -1) negative index
assertThrows("busak([1, 2], -1)", "busak([1, 2], -1)", "ora oleh negatif");

// 14. busak([1, 2], 99) out of bounds
assertThrows("busak([1, 2], 99)", "busak([1, 2], 99)", "ngluwihi ukuran array");

console.log("\nTotal Passed:", passed, "Failed:", failed);
if (failed > 0) process.exit(1);
