const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

console.log('Testing NPM package installation from tarball...');
const PROJECT_ROOT = path.resolve(__dirname, '..');
const tarballPath = path.join(PROJECT_ROOT, 'jawalang-1.2.0.tgz');

if (!fs.existsSync(tarballPath)) {
    console.error('Tarball not found at:', tarballPath);
    process.exit(1);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jawa-npm-test-'));
try {
    console.log('Created temporary test directory:', tmpDir);
    execSync(`npm install "${tarballPath}"`, { cwd: tmpDir, stdio: 'inherit' });

    const binJawa = path.join(tmpDir, 'node_modules', 'jawalang', 'bin', 'jawa.js');
    const binJawalang = path.join(tmpDir, 'node_modules', 'jawalang', 'bin', 'jawalang.js');

    const vJawa = execSync(`node "${binJawa}" --version`, { encoding: 'utf8' }).trim();
    const vJawalang = execSync(`node "${binJawalang}" --version`, { encoding: 'utf8' }).trim();

    console.log('Installed bin/jawa.js version:', vJawa);
    console.log('Installed bin/jawalang.js version:', vJawalang);

    if (!vJawa.includes('1.2.0') || !vJawalang.includes('1.2.0')) {
        throw new Error(`Version mismatch: jawa=${vJawa}, jawalang=${vJawalang}`);
    }

    const helpJawa = execSync(`node "${binJawa}" --help`, { encoding: 'utf8' });
    if (!helpJawa.includes('repl')) {
        throw new Error('Installed package help text is missing repl command');
    }

    const replEval = execSync(`node "${binJawa}" repl`, {
        encoding: 'utf8',
        input: '100 * 5\n.exit\n'
    });
    if (!replEval.includes('500')) {
        throw new Error('REPL evaluation inside installed package failed to produce 500');
    }

    console.log('TARBALL INSTALLATION & EXECUTION TEST: ALL PASS');
} finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log('Cleaned up temporary test directory:', tmpDir);
}
