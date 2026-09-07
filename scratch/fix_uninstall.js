const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../scripts\\uninstall.ps1');
let content = fs.readFileSync(target, 'utf8');
content = content.replace('Write-Warning "Could not delete $installDir: $_"', 'Write-Warning "Could not delete ${installDir} - $_"');
fs.writeFileSync(target, content, 'utf8');
console.log('Fixed uninstall.ps1');
