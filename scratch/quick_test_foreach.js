const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const code = `
gawe sekolah = {
    "nama": "SMK Jawascript",
    "siswa": [
        {
            "nama": "Budi",
            "nilai": [80, 90, 95]
        },
        {
            "nama": "Siti",
            "nilai": [85, 92, 98]
        }
    ]
}

tulis sekolah["nama"]

kanggo saben siswa ing sekolah["siswa"] {
    tulis siswa["nama"]

    kanggo saben nilai ing siswa["nilai"] {
        tulis nilai
    }
}
`;

try {
    const tokens = lexer(code);
    const ast = parser(tokens);
    interpreter(ast);
    console.log("SUCCESS");
} catch (e) {
    console.error("ERROR:", e);
}
