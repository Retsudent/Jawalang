const fs = require('fs');
const path = require('path');

const ROOT = 'D:\\Jawascript';
const cliMainContent = `// Main entry point testing relative module import via CLI
impor "./helper.jawa" minangka helper

gawe pesen = helper.sapa("Panganggo")
tulis pesen

gawe asil = helper.petung(6, 7)
tulis "Asil: " + asil
`;

fs.writeFileSync(path.join(ROOT, 'examples', 'cli', 'main.jawa'), cliMainContent, 'utf8');
console.log('Fixed examples/cli/main.jawa');
