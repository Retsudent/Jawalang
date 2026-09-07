const fs = require('fs');
const path = require('path');

const parserPath = path.resolve('D:/Jawascript/src/parser.js');
let code = fs.readFileSync(parserPath, 'utf8');

// 1. Add helpers after blockDepth = 0;
const helperCode = `    let blockDepth = 0;

    function tokenLoc(tok) {
        if (!tok || !tok.loc) return { line: 0, character: 0 };
        return tok.loc.start;
    }

    function tokenEndLoc(tok) {
        if (!tok || !tok.loc) return { line: 0, character: 0 };
        return tok.loc.end;
    }

    function withLoc(node, startTok, endTok) {
        if (!node || typeof node !== "object") return node;
        if (!node.loc) {
            const start = tokenLoc(startTok);
            const end = tokenEndLoc(endTok || startTok);
            node.loc = { start, end };
        }
        return node;
    }

    function syntaxError(msg, errTok = tokens[i] || tokens[tokens.length - 1]) {
        const err = new Error(msg);
        if (errTok && errTok.loc) {
            err.line = errTok.loc.start.line;
            err.character = errTok.loc.start.character;
            err.loc = errTok.loc;
            err.token = errTok;
        }
        return err;
    }`;

if (!code.includes('function syntaxError(')) {
    code = code.replace('    let blockDepth = 0;', helperCode);
}

// 2. Replace throw new Error with throw syntaxError
code = code.replace(/throw new Error\(/g, 'throw syntaxError(');

// 3. Attach loc to primary tokens:
// IDENTIFIER:
code = code.replace(
    /return \{\s*type: "IDENTIFIER",\s*value: token\.value\s*\};/g,
    'return withLoc({ type: "IDENTIFIER", value: token.value }, token, token);'
);

// NUMBER:
code = code.replace(
    /return \{\s*type: "NUMBER",\s*value: token\.value\s*\};/g,
    'return withLoc({ type: "NUMBER", value: token.value }, token, token);'
);

// STRING:
code = code.replace(
    /return \{\s*type: "STRING",\s*value: token\.value\s*\};/g,
    'return withLoc({ type: "STRING", value: token.value }, token, token);'
);

// BOOLEAN:
code = code.replace(
    /return \{\s*type: "BOOLEAN",\s*value: token\.value\s*\};/g,
    'return withLoc({ type: "BOOLEAN", value: token.value }, token, token);'
);

// NULL:
code = code.replace(
    /return \{\s*type: "NULL",\s*value: null\s*\};/g,
    'return withLoc({ type: "NULL", value: null }, token, token);'
);

// IkiExpression:
code = code.replace(
    /return \{\s*type: "IkiExpression"\s*\};/g,
    'return withLoc({ type: "IkiExpression" }, token, token);'
);

// SuperExpression:
code = code.replace(
    /return \{\s*type: "SuperExpression"\s*\};/g,
    'return withLoc({ type: "SuperExpression" }, token, token);'
);

// VariableDeclaration:
code = code.replace(
    /return \{\s*type: "VariableDeclaration",\s*name: nameToken\.value,\s*init: initExpr\s*\};/g,
    'return withLoc({ type: "VariableDeclaration", name: nameToken.value, nameLoc: nameToken.loc, init: initExpr }, token, tokens[i - 1]);'
);

// FunctionDeclaration:
code = code.replace(
    /return \{\s*type: "FunctionDeclaration",\s*name: nameToken\.value,\s*parameters: parameters,\s*body: body\s*\};/g,
    'return withLoc({ type: "FunctionDeclaration", name: nameToken.value, nameLoc: nameToken.loc, parameters: parameters, body: body }, token, tokens[i - 1]);'
);

// StructDeclaration:
code = code.replace(
    /return \{\s*type: "StructDeclaration",\s*name: structName,\s*parent: parentNode,\s*fields: fields,\s*methods: methods\s*\};/g,
    'return withLoc({ type: "StructDeclaration", name: structName, nameLoc: nameToken.loc, parent: parentNode, fields: fields, methods: methods }, token, tokens[i - 1]);'
);

fs.writeFileSync(parserPath, code, 'utf8');
console.log('src/parser.js enhanced with position metadata & syntaxError tracking!');
