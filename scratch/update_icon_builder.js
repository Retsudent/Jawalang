const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = 'D:\\Jawascript\\scripts\\GenerateIcon.cs';
let content = fs.readFileSync(target, 'utf8');

const insertAfter = 'pngEntries.Add(new KeyValuePair<int, byte[]>(size, ms.ToArray()));';
const codeToInsert = `
                    if (size == 128)
                    {
                        string outPng = Path.Combine(projectRoot, "assets", "jawalang.png");
                        bmp.Save(outPng, ImageFormat.Png);
                        string extPng = Path.Combine(projectRoot, "vscode-extension", "icons", "jawalang.png");
                        string extDir = Path.GetDirectoryName(extPng);
                        if (!Directory.Exists(extDir)) Directory.CreateDirectory(extDir);
                        bmp.Save(extPng, ImageFormat.Png);
                    }`;

if (!content.includes('jawalang.png')) {
    content = content.replace(insertAfter, insertAfter + codeToInsert);
    fs.writeFileSync(target, content, 'utf8');
}

console.log('Updated GenerateIcon.cs');
