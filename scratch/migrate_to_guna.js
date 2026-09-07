const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');

function getAllFiles(dir, ext) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(fullPath, ext));
        } else if (file.endsWith(ext)) {
            results.push(fullPath);
        }
    }
    return results;
}

const jawaFiles = getAllFiles(path.join(projectDir, 'examples'), '.jawa');

console.log(`Found ${jawaFiles.length} .jawa files.`);

let totalReplaced = 0;
for (const file of jawaFiles) {
    let content = fs.readFileSync(file, 'utf8');
    // Pattern: "ekspor fungsi <name>(" or "fungsi <name>("
    // We match 'ekspor fungsi' -> 'ekspor guna'
    // and standalone 'fungsi <name>(' -> 'guna <name>('
    const orig = content;
    
    // Replace 'ekspor fungsi ' with 'ekspor guna '
    content = content.replace(/(\bekspor\s+)fungsi(\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\()/g, '$1guna$2');
    
    // Replace standalone 'fungsi ' with 'guna ' when declaring a function
    content = content.replace(/(^|[\s;{}])fungsi(\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\()/g, '$1guna$2');
    
    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated: ${path.relative(projectDir, file)}`);
        totalReplaced++;
    }
}

console.log(`Total updated files: ${totalReplaced}`);
