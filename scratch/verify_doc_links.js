const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');

const filesToCheck = [
  path.join(rootDir, 'Readme.md'),
  ...fs.readdirSync(docsDir).filter(f => f.endsWith('.md')).map(f => path.join(docsDir, f))
];

console.log(`Checking ${filesToCheck.length} markdown files for broken relative links...\n`);

let totalLinks = 0;
let brokenLinks = 0;

for (const filePath of filesToCheck) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relFilePath = path.relative(rootDir, filePath);
  
  // 1. Remove fenced code blocks
  content = content.replace(/```[\s\S]*?```/g, '');
  
  // 2. Remove inline code snippets `...`
  content = content.replace(/`[^`]+`/g, '');
  
  // 3. Match Markdown links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(content)) !== null) {
    const rawLink = match[2].trim();
    
    // Skip anchor-only links (#anchor) or external web links
    if (rawLink.startsWith('#') || rawLink.startsWith('http://') || rawLink.startsWith('https://') || rawLink.startsWith('mailto:')) {
      continue;
    }
    
    totalLinks++;
    
    // Split target file and anchor
    const [targetPart, anchor] = rawLink.split('#');
    
    if (!targetPart) {
      // Just an anchor link that had something preceding
      continue;
    }
    
    const targetPath = path.resolve(path.dirname(filePath), targetPart);
    
    if (!fs.existsSync(targetPath)) {
      console.error(`❌ BROKEN LINK in [${relFilePath}]: "${rawLink}" -> Target not found: ${targetPath}`);
      brokenLinks++;
    }
  }
}

console.log(`\nScan complete!`);
console.log(`Total relative links verified: ${totalLinks}`);
console.log(`Broken links found: ${brokenLinks}`);

if (brokenLinks > 0) {
  process.exit(1);
} else {
  console.log('✅ All relative links are 100% valid!');
}
