const fs = require('fs');
const path = require('path');
const analyzer = require('../src/analyzer');
const { pathToUri } = require('../src/utils');

const filePath = path.resolve(__dirname, '../language-server/test/fixtures/completion.jawa');
const code = fs.readFileSync(filePath, 'utf8');
const testCode = code + '\nm.';
const uri = pathToUri(filePath);

const analysis = analyzer.analyze(testCode, uri);
const sym = analysis.globalScope.lookup('m');
console.log('Symbol m:', sym);
