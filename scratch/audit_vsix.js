const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const vsixPath = path.resolve('D:/Jawascript/vscode-extension', 'jawalang-vscode-1.0.0.vsix');
const inspectDir = path.resolve('D:/Jawascript/scratch', 'vsix_inspect');

if (fs.existsSync(inspectDir)) {
    fs.rmSync(inspectDir, { recursive: true, force: true });
}
fs.mkdirSync(inspectDir, { recursive: true });

console.log('=== VSIX PACKAGE AUDIT ===');
console.log(`Inspecting: ${vsixPath}`);

child_process.execSync(`tar -xf "${vsixPath}" -C "${inspectDir}"`);

const leaks = [];
const allFiles = [];

function scanDir(dir) {
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const rel = path.relative(inspectDir, full);
        if (fs.statSync(full).isDirectory()) {
            scanDir(full);
        } else {
            allFiles.push(rel);
            const content = fs.readFileSync(full);
            // Check if it looks like text
            const isText = !rel.endsWith('.png');
            if (isText) {
                const str = content.toString('utf8');
                if (str.includes('D:\\Jawascript') || str.includes('D:/Jawascript') ||
                    str.includes('C:\\Users\\MyBook') || str.includes('C:/Users/MyBook') ||
                    str.includes('MyBook SAGA')) {
                    leaks.push({ file: rel, match: 'Developer path detected' });
                }
            }
        }
    }
}

scanDir(inspectDir);

console.log('\nPackage contents:');
allFiles.forEach(f => console.log(`  - ${f}`));

console.log('\nAudit checks:');
const hasLicense = allFiles.some(f => f.toLowerCase().includes('license'));
const hasReadme = allFiles.some(f => f.toLowerCase().includes('readme'));
const hasChangelog = allFiles.some(f => f.toLowerCase().includes('changelog'));
const hasPackageJson = allFiles.some(f => f.toLowerCase().includes('package.json'));
const hasGrammar = allFiles.some(f => f.toLowerCase().includes('syntaxes') && f.endsWith('.json'));
const hasSnippets = allFiles.some(f => f.toLowerCase().includes('snippets') && f.endsWith('.json'));
const hasExtensionJs = allFiles.some(f => f.toLowerCase().includes('src') && f.endsWith('extension.js'));
const hasIcons = allFiles.some(f => f.toLowerCase().includes('icons') && (f.endsWith('.png') || f.endsWith('.svg')));
const hasNoTests = !allFiles.some(f => f.toLowerCase().includes('test'));

console.log(`  1. LICENSE present: ${hasLicense ? 'PASS' : 'FAIL'}`);
console.log(`  2. README present: ${hasReadme ? 'PASS' : 'FAIL'}`);
console.log(`  3. CHANGELOG present: ${hasChangelog ? 'PASS' : 'FAIL'}`);
console.log(`  4. package.json present: ${hasPackageJson ? 'PASS' : 'FAIL'}`);
console.log(`  5. Grammar present: ${hasGrammar ? 'PASS' : 'FAIL'}`);
console.log(`  6. Snippets present: ${hasSnippets ? 'PASS' : 'FAIL'}`);
console.log(`  7. Extension entry point present: ${hasExtensionJs ? 'PASS' : 'FAIL'}`);
console.log(`  8. Icons present: ${hasIcons ? 'PASS' : 'FAIL'}`);
console.log(`  9. Tests excluded (.vscodeignore): ${hasNoTests ? 'PASS' : 'FAIL'}`);
console.log(` 10. Developer path leaks: ${leaks.length === 0 ? 'PASS (0 leaks)' : 'FAIL (' + leaks.length + ' leaks)'}`);

if (leaks.length > 0) {
    console.error('\nLeaks detected:');
    leaks.forEach(l => console.error(`  - ${l.file}: ${l.match}`));
}

const allPassed = hasLicense && hasReadme && hasChangelog && hasPackageJson &&
                  hasGrammar && hasSnippets && hasExtensionJs && hasIcons &&
                  hasNoTests && leaks.length === 0;

console.log(`\nAudit Verdict: ${allPassed ? 'ALL PASS' : 'FAIL'}`);
if (!allPassed) process.exit(1);
