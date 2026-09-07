const lexer = require('D:/Jawascript/src/lexer');
const parser = require('D:/Jawascript/src/parser');
const interpreter = require('D:/Jawascript/src/interpreter');

const code = `
// 1. Basic throw & catch
coba {
    lempar "Koneksi gagal"
} tangkep err {
    tulis err
}

// 2. Engine runtime error catch
gawe data = [10, 20]
coba {
    tulis data[100]
} tangkep err {
    tulis "Error data 100 ditangkap"
}

// 3. ReturnSignal isolation
fungsi testReturn() {
    coba {
        bali 42
    } tangkep err {
        tulis "ORA OLEH METU"
    }
}
tulis testReturn()

// 4. BreakSignal isolation
gawe angka = [1, 2, 3, 4]
kanggo saben x ing angka {
    coba {
        yen x == 3 {
            mandheg
        }
        tulis x
    } tangkep err {
        tulis "ORA OLEH METU BREAK"
    }
}

// 5. ContinueSignal isolation
kanggo saben y ing [1, 2, 3] {
    coba {
        yen y == 2 {
            lanjut
        }
        tulis y
    } tangkep err {
        tulis "ORA OLEH METU CONTINUE"
    }
}

// 6. Nested try & rethrow
coba {
    coba {
        lempar "inner"
    } tangkep err {
        tulis err
        lempar "outer rethrow"
    }
} tangkep err2 {
    tulis err2
}

// 7. Throw types: number, null, object
coba {
    lempar 123
} tangkep err {
    tulis err
    tulis jinis(err)
}

coba {
    lempar null
} tangkep err {
    tulis jinis(err)
}

coba {
    lempar {"pesan": "gagal", "kode": 500}
} tangkep err {
    tulis err["pesan"]
    tulis err["kode"]
}

// 8. Scope: coba does not create new scope, err is not leaked
gawe varX = 10
coba {
    varX = 20
} tangkep err {
    tulis err
}
tulis varX

// 9. Foreach integration
kanggo saben z ing [1, 2, 3] {
    coba {
        yen z == 2 {
            lempar "salah"
        }
        tulis z
    } tangkep err {
        tulis err
    }
}
`;

try {
    const tokens = lexer(code);
    const ast = parser(tokens);
    interpreter(ast);
    console.log("ALL QUICK TESTS PASSED");
} catch (e) {
    console.error("ERROR:", e);
}
