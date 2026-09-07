const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');
const JAWA_EXE = path.join(PROJECT, 'bin', 'jawa.exe');
const PKG_PATH = path.join(PROJECT, 'package.json');

let passed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        console.log(`PASS: ${name}`);
        passed++;
    } catch (e) {
        console.error(`FAIL: ${name}`);
        console.error('  Error:', e.message);
        if (e.stdout) console.error('  Stdout:', e.stdout.toString());
        if (e.stderr) console.error('  Stderr:', e.stderr.toString());
    }
}

console.log('=== RUNNING DISTRIBUTION HARDENING TESTS ===\n');

// 1. No hardcoded developer paths in runtime, launcher, and scripts
test('no hardcoded developer path in codebase', () => {
    const filesToCheck = [
        path.join(PROJECT, 'src', 'cli.js'),
        path.join(PROJECT, 'src', 'launcher', 'jawa.cs'),
        path.join(PROJECT, 'bin', 'jawa.js'),
        path.join(PROJECT, 'bin', 'cli.js'),
        path.join(PROJECT, 'bin', 'jawa.cmd'),
        path.join(PROJECT, 'scripts', 'install.ps1'),
        path.join(PROJECT, 'scripts', 'uninstall.ps1'),
        path.join(PROJECT, 'scripts', 'build-launcher.ps1'),
        path.join(PROJECT, 'scripts', 'package-release.ps1')
    ];

    const forbiddenPatterns = [
        /D:\\Jawascript/i,
        /D:\/Jawascript/i,
        /C:\\Users\\MyBook/i,
        /C:\/Users\/MyBook/i
    ];

    for (const f of filesToCheck) {
        if (!fs.existsSync(f)) throw new Error(`File missing: ${f}`);
        const text = fs.readFileSync(f, 'utf8');
        for (const pattern of forbiddenPatterns) {
            if (pattern.test(text)) {
                throw new Error(`Forbidden hardcoded developer path pattern ${pattern} found in ${f}`);
            }
        }
    }
});

// 2. Launcher path resolution
test('launcher path resolution works relative to baseDir', () => {
    // Run jawa.exe from release directory independently
    const relExe = path.join(PROJECT, 'release', 'Jawalang-v1.0.0-windows-x64', 'bin', 'jawa.exe');
    if (!fs.existsSync(relExe)) {
        throw new Error(`Release executable missing: ${relExe}`);
    }
    const out = execSync(`"${relExe}" --version`, { cwd: 'C:\\', encoding: 'utf8' }).trim();
    if (!out.includes('Jawalang v1.0.0')) {
        throw new Error(`Expected Jawalang v1.0.0, got: ${out}`);
    }
});

// 3. Package version consistency
test('package version consistency across all entry points', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    const expectedVer = `Jawalang v${pkg.version}`;

    const cliOut = execSync(`node "${path.join(PROJECT, 'bin', 'jawa.js')}" --version`, { encoding: 'utf8' }).trim();
    if (cliOut !== expectedVer) {
        throw new Error(`bin/jawa.js version mismatch: expected "${expectedVer}", got "${cliOut}"`);
    }

    const exeOut = execSync(`"${JAWA_EXE}" --version`, { encoding: 'utf8' }).trim();
    if (exeOut !== expectedVer) {
        throw new Error(`bin/jawa.exe version mismatch: expected "${expectedVer}", got "${exeOut}"`);
    }
});

// 4. Installer path configuration
test('installer path configuration is portable and HKCU-based', () => {
    const installScript = fs.readFileSync(path.join(PROJECT, 'scripts', 'install.ps1'), 'utf8');
    if (!installScript.includes('HKCU:\\Software\\Classes')) {
        throw new Error('Installer does not target HKCU registry');
    }
    if (!installScript.includes('$env:LOCALAPPDATA')) {
        throw new Error('Installer does not default to %LOCALAPPDATA%');
    }
    if (!installScript.includes('-Portable')) {
        throw new Error('Installer does not support -Portable switch');
    }
});

// 5. Uninstall cleanup logic
test('uninstall cleanup logic removes only Jawalang entries', () => {
    const uninstallScript = fs.readFileSync(path.join(PROJECT, 'scripts', 'uninstall.ps1'), 'utf8');
    if (!uninstallScript.includes('HKCU:\\Software\\Classes\\.jawa')) {
        throw new Error('Uninstall does not remove .jawa association');
    }
    if (!uninstallScript.includes('HKCU:\\Software\\Classes\\Jawalang.Source')) {
        throw new Error('Uninstall does not remove Jawalang.Source ProgID');
    }
    if (!uninstallScript.includes('OrdinalIgnoreCase')) {
        throw new Error('Uninstall PATH comparison is not case-insensitive');
    }
});

// 6. Quoted executable path
test('quoted executable path in registry association', () => {
    const openCmd = execSync(`powershell -Command "(Get-ItemProperty 'HKCU:\\Software\\Classes\\Jawalang.Source\\shell\\open\\command').'(default)'"`, { encoding: 'utf8' }).trim();
    if (!openCmd.startsWith('"') || !openCmd.includes('jawa.exe" "%1"')) {
        throw new Error(`Registry open command is not properly quoted: ${openCmd}`);
    }
});

// 7. Quoted source path in context menu
test('quoted source path in context menu', () => {
    const runCmd = execSync(`powershell -Command "(Get-ItemProperty 'HKCU:\\Software\\Classes\\Jawalang.Source\\shell\\run_jawa\\command').'(default)'"`, { encoding: 'utf8' }).trim();
    if (!runCmd.startsWith('"') || !runCmd.includes('jawa.exe" "%1"')) {
        throw new Error(`Context menu run command is not properly quoted: ${runCmd}`);
    }
});

// 8. Build artifact exists
test('build artifact exists', () => {
    if (!fs.existsSync(JAWA_EXE)) throw new Error('bin/jawa.exe missing');
    if (!fs.existsSync(path.join(PROJECT, 'assets', 'jawalang.ico'))) throw new Error('assets/jawalang.ico missing');
    const stat = fs.statSync(JAWA_EXE);
    if (stat.size < 5000) throw new Error(`bin/jawa.exe file size too small: ${stat.size} bytes`);
});

// 9. Release package structure exists
test('release package structure exists and is complete', () => {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    const releaseDir = path.join(PROJECT, 'release', `Jawalang-v${pkg.version}-windows-x64`);
    const releaseZip = path.join(PROJECT, 'release', `Jawalang-v${pkg.version}-windows-x64.zip`);

    if (!fs.existsSync(releaseDir)) throw new Error(`Release directory missing: ${releaseDir}`);
    if (!fs.existsSync(path.join(releaseDir, 'bin', 'jawa.exe'))) throw new Error('Release jawa.exe missing');
    if (!fs.existsSync(path.join(releaseDir, 'bin', 'jawa.js'))) throw new Error('Release jawa.js missing');
    if (!fs.existsSync(path.join(releaseDir, 'src', 'cli.js'))) throw new Error('Release src/cli.js missing');
    if (!fs.existsSync(path.join(releaseDir, 'assets', 'jawalang.ico'))) throw new Error('Release icon missing');
    if (!fs.existsSync(path.join(releaseDir, 'scripts', 'install.ps1'))) throw new Error('Release install.ps1 missing');
    if (!fs.existsSync(releaseZip)) throw new Error(`Release zip archive missing: ${releaseZip}`);
});

// 10. Interactive takon() fixture execution via CLI
test('interactive takon() fixture works via CLI', () => {
    const fixture = path.join(PROJECT, 'examples', 'cli', 'interactive.jawa');
    const out = execSync(`"${JAWA_EXE}" "${fixture}"`, { input: 'Budi\n', encoding: 'utf8' }).trim();
    if (!out.includes('Halo Budi') || !out.includes('sugeng rawuh')) {
        throw new Error(`Unexpected output from interactive fixture: ${out}`);
    }
});

console.log(`\nDistribution Hardening Result: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
