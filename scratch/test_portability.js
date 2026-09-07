const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const results = [];

function recordResult(name, pass, detail) {
    results.push({ name, pass, detail });
}

// 1. Hardcoded Path Audit
try {
    const forbiddenPatterns = [
        /D:\\Jawascript/i,
        /D:\/Jawascript/i,
        /C:\\Users\\MyBook/i,
        /C:\/Users\/MyBook/i,
        /MyBook SAGA/i
    ];

    const dirsToScan = ['src', 'bin', 'scripts', 'language-server', 'vscode-extension', 'scratch'];
    const excludeFiles = new Set([
        path.resolve(PROJECT_ROOT, 'scratch', 'test_distribution.js'),
        path.resolve(PROJECT_ROOT, 'scratch', 'audit_vsix.js'),
        path.resolve(PROJECT_ROOT, 'scratch', 'test_portability.js'),
        path.resolve(PROJECT_ROOT, 'scratch', 'update_readme.js'),
        path.resolve(PROJECT_ROOT, 'vscode-extension', 'RELEASE_VALIDATION.md')
    ]);

    const violations = [];

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
                scanDir(fullPath);
            } else if (entry.isFile()) {
                if (excludeFiles.has(path.resolve(fullPath))) continue;
                const ext = path.extname(entry.name).toLowerCase();
                if (['.exe', '.ico', '.png', '.vsix', '.zip'].includes(ext)) continue;

                const content = fs.readFileSync(fullPath, 'utf8');
                for (const pattern of forbiddenPatterns) {
                    if (pattern.test(content)) {
                        violations.push(`${path.relative(PROJECT_ROOT, fullPath)} matches ${pattern}`);
                        break;
                    }
                }
            }
        }
    }

    for (const d of dirsToScan) {
        scanDir(path.join(PROJECT_ROOT, d));
    }

    if (violations.length === 0) {
        recordResult('Hardcoded Path Audit', true);
    } else {
        recordResult('Hardcoded Path Audit', false, violations.join('; '));
    }
} catch (err) {
    recordResult('Hardcoded Path Audit', false, err.message);
}

// 2. Dynamic Project Root
try {
    let ok = true;
    const details = [];

    const binJawa = fs.readFileSync(path.join(PROJECT_ROOT, 'bin', 'jawa.js'), 'utf8');
    if (!binJawa.includes('../src/cli')) {
        ok = false;
        details.push('bin/jawa.js does not use relative require("../src/cli")');
    }

    const srcCli = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'cli.js'), 'utf8');
    if (!srcCli.includes('path.resolve(process.cwd()') && !srcCli.includes('path.resolve(')) {
        ok = false;
        details.push('src/cli.js does not use dynamic path.resolve');
    }

    const buildLauncher = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'build-launcher.ps1'), 'utf8');
    if (!buildLauncher.includes('$PSScriptRoot') || (!buildLauncher.includes('windir') && !buildLauncher.includes('SystemRoot'))) {
        ok = false;
        details.push('scripts/build-launcher.ps1 does not use dynamic PSScriptRoot or system root');
    }

    const installPs1 = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1'), 'utf8');
    if (!installPs1.includes('$PSScriptRoot') || !installPs1.includes('$env:LOCALAPPDATA')) {
        ok = false;
        details.push('scripts/install.ps1 does not use dynamic PSScriptRoot or LOCALAPPDATA');
    }

    const regression = fs.readFileSync(path.join(PROJECT_ROOT, 'scratch', 'run_full_regression.js'), 'utf8');
    if (!regression.includes('path.resolve(__dirname')) {
        ok = false;
        details.push('scratch/run_full_regression.js does not use path.resolve(__dirname)');
    }

    recordResult('Dynamic Project Root', ok, details.join('; '));
} catch (err) {
    recordResult('Dynamic Project Root', false, err.message);
}

// 3. Scratch Runners
try {
    const sampleRunners = [
        'test_struct_negative.js',
        'test_module_v3_negative.js',
        'test_cli_positive.js',
        'test_inheritance_v5_negative.js'
    ];
    let allRunnersOk = true;
    for (const runner of sampleRunners) {
        const fullPath = path.join(PROJECT_ROOT, 'scratch', runner);
        try {
            execSync(`"${process.execPath}" "${fullPath}"`, {
                cwd: os.tmpdir(),
                stdio: ['pipe', 'pipe', 'pipe']
            });
        } catch (e) {
            allRunnersOk = false;
            break;
        }
    }
    if (allRunnersOk) {
        recordResult('Scratch Runners', true);
    } else {
        recordResult('Scratch Runners', false, 'One or more scratch runners failed when invoked from external cwd');
    }
} catch (err) {
    recordResult('Scratch Runners', false, err.message);
}

// 4. NPM Test Portability
try {
    const regressionScript = path.join(PROJECT_ROOT, 'scratch', 'run_full_regression.js');
    const out = execSync(`"${process.execPath}" "${regressionScript}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8',
        input: 'Budi\n'
    });
    if (out.includes('FINAL REGRESSION STATUS: ALL PASS (100%)')) {
        recordResult('NPM Test Portability', true);
    } else {
        recordResult('NPM Test Portability', false, 'Regression suite output did not confirm 100% pass');
    }
} catch (err) {
    recordResult('NPM Test Portability', false, err.message);
}

// 5. LSP Test Portability
try {
    const lspRunner = path.join(PROJECT_ROOT, 'language-server', 'test', 'run_tests.js');
    const out = execSync(`"${process.execPath}" "${lspRunner}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8'
    });
    if (out.includes('6/6 SUITES')) {
        recordResult('LSP Test Portability', true);
    } else {
        recordResult('LSP Test Portability', false, 'LSP runner did not report 6/6 suites passed');
    }
} catch (err) {
    recordResult('LSP Test Portability', false, err.message);
}

// 6. CLI Portability
try {
    const cliScript = path.join(PROJECT_ROOT, 'bin', 'jawa.js');
    const exampleFile = path.join(PROJECT_ROOT, 'examples', 'cli', 'main.jawa');
    const out = execSync(`"${process.execPath}" "${cliScript}" "${exampleFile}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8'
    });

    // Also test path containing spaces
    const spaceDir = path.join(os.tmpdir(), `jawa space test ${Date.now()}`);
    fs.mkdirSync(spaceDir, { recursive: true });
    const spaceFile = path.join(spaceDir, 'space test.jawa');
    fs.writeFileSync(spaceFile, 'tulis "Spasi Sukses"\n', 'utf8');

    const spaceOut = execSync(`"${process.execPath}" "${cliScript}" "${spaceFile}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8'
    });

    fs.rmSync(spaceDir, { recursive: true, force: true });

    if (out.includes('Asil: 42') && spaceOut.includes('Spasi Sukses')) {
        recordResult('CLI Portability', true);
    } else {
        recordResult('CLI Portability', false, 'CLI output mismatch');
    }
} catch (err) {
    recordResult('CLI Portability', false, err.message);
}

// 7. Module Resolution
try {
    const modDir = path.join(os.tmpdir(), `jawa_mod_test_${Date.now()}`);
    fs.mkdirSync(modDir, { recursive: true });
    const helperFile = path.join(modDir, 'helper.jawa');
    fs.writeFileSync(helperFile, 'ekspor guna nilai() { bali 99 }\n', 'utf8');
    const mainModFile = path.join(modDir, 'main.jawa');
    fs.writeFileSync(mainModFile, 'impor "./helper.jawa" minangka h\ntulis h.nilai()\n', 'utf8');

    const cliScript = path.join(PROJECT_ROOT, 'bin', 'jawa.js');
    const out = execSync(`"${process.execPath}" "${cliScript}" "${mainModFile}"`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8'
    });

    const outExternalCwd = execSync(`"${process.execPath}" "${cliScript}" "${mainModFile}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8'
    });

    fs.rmSync(modDir, { recursive: true, force: true });

    if (out.trim() === '99' && outExternalCwd.trim() === '99') {
        recordResult('Module Resolution', true);
    } else {
        recordResult('Module Resolution', false, `Expected 99, got: "${out.trim()}" and "${outExternalCwd.trim()}"`);
    }
} catch (err) {
    recordResult('Module Resolution', false, err.message);
}

// 8. VS Code Test Portability
try {
    const extRunner = path.join(PROJECT_ROOT, 'vscode-extension', 'tests', 'test_extension.js');
    const out = execSync(`"${process.execPath}" "${extRunner}"`, {
        cwd: os.tmpdir(),
        encoding: 'utf8'
    });
    if (out.includes('Extension Tests Result: 8/8 passed')) {
        recordResult('VS Code Test Portability', true);
    } else {
        recordResult('VS Code Test Portability', false, 'Extension test suite did not report 8/8 passed');
    }
} catch (err) {
    recordResult('VS Code Test Portability', false, err.message);
}

// 9. Installer Portability
try {
    const installScript = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'install.ps1'), 'utf8');
    const uninstallScript = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'uninstall.ps1'), 'utf8');

    const hasPSScriptRoot = installScript.includes('$PSScriptRoot') && uninstallScript.includes('$PSScriptRoot');
    const hasLocalApp = installScript.includes('$env:LOCALAPPDATA');
    const hasPortable = installScript.includes('-Portable');
    const hasHKCU = installScript.includes('HKCU:\\Software\\Classes');

    if (hasPSScriptRoot && hasLocalApp && hasPortable && hasHKCU) {
        recordResult('Installer Portability', true);
    } else {
        recordResult('Installer Portability', false, 'Installer scripts missing portability features');
    }
} catch (err) {
    recordResult('Installer Portability', false, err.message);
}

// 10. Release Script
try {
    const relScript = fs.readFileSync(path.join(PROJECT_ROOT, 'scripts', 'package-release.ps1'), 'utf8');
    const hasDynamicRoot = relScript.includes('Split-Path -Parent $PSScriptRoot');
    const hasDynamicVer = relScript.includes('$pkg.version');
    const hasDynamicRel = relScript.includes('$releaseName');

    if (hasDynamicRoot && hasDynamicVer && hasDynamicRel) {
        recordResult('Release Script', true);
    } else {
        recordResult('Release Script', false, 'package-release.ps1 does not use dynamic path resolution');
    }
} catch (err) {
    recordResult('Release Script', false, err.message);
}

// 11. Clean Clone Test
try {
    const cleanDir = path.join(os.tmpdir(), `jawalang_clean_clone_${Date.now()}`);
    fs.mkdirSync(cleanDir, { recursive: true });

    function copyRecursive(src, dst) {
        fs.mkdirSync(dst, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcItem = path.join(src, entry.name);
            const dstItem = path.join(dst, entry.name);
            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name === '.git') continue;
                copyRecursive(srcItem, dstItem);
            } else {
                fs.copyFileSync(srcItem, dstItem);
            }
        }
    }

    copyRecursive(path.join(PROJECT_ROOT, 'bin'), path.join(cleanDir, 'bin'));
    copyRecursive(path.join(PROJECT_ROOT, 'src'), path.join(cleanDir, 'src'));
    copyRecursive(path.join(PROJECT_ROOT, 'examples'), path.join(cleanDir, 'examples'));
    fs.copyFileSync(path.join(PROJECT_ROOT, 'package.json'), path.join(cleanDir, 'package.json'));

    const cleanCli = path.join(cleanDir, 'bin', 'jawa.js');
    const cleanCliExample = path.join(cleanDir, 'examples', 'cli', 'main.jawa');

    const cleanCliOut = execSync(`"${process.execPath}" "${cleanCli}" "${cleanCliExample}"`, {
        cwd: cleanDir,
        encoding: 'utf8'
    });

    fs.rmSync(cleanDir, { recursive: true, force: true });

    if (cleanCliOut.includes('Asil: 42')) {
        recordResult('Clean Clone Test', true);
    } else {
        recordResult('Clean Clone Test', false, 'Clean clone CLI failed to execute examples/cli/main.jawa');
    }
} catch (err) {
    recordResult('Clean Clone Test', false, err.message);
}

// Output summary table matching exact requested format
console.log('=== Jawalang V1.0.1 Portability Validation ===');
let passCount = 0;
for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (r.pass) passCount++;
    const dots = '.'.repeat(Math.max(2, 29 - r.name.length));
    console.log(`${r.name} ${dots} ${status}`);
    if (!r.pass && r.detail) {
        console.error(`  Details: ${r.detail}`);
    }
}
console.log(`TOTAL: ${passCount}/${results.length} PASS`);

if (passCount !== results.length) {
    process.exit(1);
}
