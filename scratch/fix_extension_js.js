const fs = require('fs');
const path = require('path');

const target = 'D:\\Jawascript\\vscode-extension\\src\\extension.js';
let content = fs.readFileSync(target, 'utf8');

content = content.replace(
    'item.documentation = new vscode.MarkdownString(```jawa\\n${kw.doc}\\n```);',
    'item.documentation = new vscode.MarkdownString("```jawa\\n" + kw.doc + "\\n```");'
);

content = content.replace(
    'item.documentation = new vscode.MarkdownString(`${info.description}\\n\\n**Tuladha:**\\n```jawa\\n${info.example}\\n```);',
    'item.documentation = new vscode.MarkdownString(info.description + "\\n\\n**Tuladha:**\\n```jawa\\n" + info.example + "\\n```");'
);

fs.writeFileSync(target, content, 'utf8');
console.log('Fixed extension.js');
