const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const interactiveContent = `// Interactive CLI fixture using takon()
gawe jeneng = takon("Jeneng: ")
tulis "Halo " + jeneng + ", sugeng rawuh ing Jawalang!"
`;

fs.writeFileSync(path.join(ROOT, 'examples', 'cli', 'interactive.jawa'), interactiveContent, 'utf8');
console.log('Created examples/cli/interactive.jawa');
