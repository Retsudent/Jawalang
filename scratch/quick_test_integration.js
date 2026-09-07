const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const code = `
gawe sekolah = {
    "nama": "SMK Jawascript",
    "kelas": [
        {
            "nama": "TRPL 1",
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
    ]
}

tulis sekolah["nama"]
tulis sekolah["kelas"][0]["nama"]
tulis sekolah["kelas"][0]["siswa"][0]["nama"]
tulis sekolah["kelas"][0]["siswa"][0]["nilai"][1]

sekolah["kelas"][0]["siswa"][0]["nama"] = "Dewi"
sekolah["kelas"][0]["siswa"][0]["nilai"][1] = 99
tulis sekolah["kelas"][0]["siswa"][0]["nama"]
tulis sekolah["kelas"][0]["siswa"][0]["nilai"][1]
`;

try {
    const tokens = lexer(code);
    const ast = parser(tokens);
    interpreter(ast);
    console.log("SUCCESS");
} catch (e) {
    console.error("ERROR:", e);
}
