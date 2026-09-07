const fs = require('fs');
const path = require('path');
const analyzer = require('D:/Jawascript/language-server/src/analyzer');
const { pathToUri } = require('D:/Jawascript/language-server/src/utils');

const filePath = path.resolve('D:/Jawascript/language-server/test/fixtures/completion.jawa');
const code = fs.readFileSync(filePath, 'utf8');
const testCode = code + '\nm.';
const uri = pathToUri(filePath);

const analysis = analyzer.analyze(testCode, uri);
const sym = analysis.globalScope.lookup('m');
console.log('Symbol m:', sym);
