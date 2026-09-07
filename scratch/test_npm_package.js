const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const results = [];

function record(name, pass, detail) {
    results.push({ name, pass, detail });
}

const TARBALL_PATH = path.join(PROJECT_ROOT, 'jawalang-1.1.0.tgz');
const TEMP_DIR = path.join(os.tmpdir(), `Jawalang NPM Test Space ${Date.now()}`);

try {
    // 1. Package metadata
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
        const ok = pkg.name === 'jawalang' &&
                   pkg.version === '1.1.0' &&
                   pkg.main === 'index.js' &&
                   pkg.engines && pkg.engines.node &&
                   pkg.repository && pkg.repository.url;
        if (ok) {
            record('Package metadata', true);
        } else {
            record('Package metadata', false, 'Missing or invalid metadata in package.json');
        }
    } catch (e) {
        record('Package metadata', false, e.message);
    }

    // 2. Bin mapping
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
        const binJawa = pkg.bin && (pkg.bin.jawa === './bin/jawa.js' || pkg.bin.jawa === 'bin/jawa.js');
        const binJawalang = pkg.bin && (pkg.bin.jawalang === './bin/jawa.js' || pkg.bin.jawalang === 'bin/jawa.js');
        const fileExists = fs.existsSync(path.join(PROJECT_ROOT, 'bin', 'jawa.js'));

        const jawaJsBuf = fs.readFileSync(path.join(PROJECT_ROOT, 'bin', 'jawa.js'));
        const hasCRLF = jawaJsBuf.includes(Buffer.from('\r\n'));
        const firstLine = jawaJsBuf.toString('utf8').split('\n')[0];
        const shebangOk = firstLine === '#!/usr/bin/env node';

        if (binJawa && binJawalang && fileExists && !hasCRLF && shebangOk) {
            record('Bin mapping', true);
        } else {
            record('Bin mapping', false, 'Bin mapping invalid or bin/jawa.js has CRLF/invalid shebang');
        }
    } catch (e) {
        record('Bin mapping', false, e.message);
    }

    // 3. File whitelist
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
        const hasWhitelist = Array.isArray(pkg.files) && pkg.files.length > 0;
        const noScratch = !pkg.files.some(f => f.includes('scratch'));
        const noRelease = !pkg.files.some(f => f.includes('release'));
        const noVscode = !pkg.files.some(f => f.includes('vscode'));
        if (hasWhitelist && noScratch && noRelease && noVscode) {
            record('File whitelist', true);
        } else {
            record('File whitelist', false, 'File whitelist missing or includes excluded directories');
        }
    } catch (e) {
        record('File whitelist', false, e.message);
    }

    // 4. Tarball creation
    try {
        if (!fs.existsSync(TARBALL_PATH)) {
            execSync('npm pack', { cwd: PROJECT_ROOT, stdio: 'pipe' });
        }
        const stat = fs.statSync(TARBALL_PATH);
        if (stat.size > 1000 && stat.size < 100000) { // Should be ~45 KB
            record('Tarball creation', true);
        } else {
            record('Tarball creation', false, `Tarball size outside expected range: ${stat.size} bytes`);
        }
    } catch (e) {
        record('Tarball creation', false, e.message);
    }

    // 5. Tarball contents
    try {
        const listOutput = execSync(`tar -tf "${TARBALL_PATH}"`, { encoding: 'utf8' });
        const files = listOutput.split(/\r?\n/).filter(Boolean);
        const hasCli = files.includes('package/src/cli.js');
        const hasLexer = files.includes('package/src/lexer.js');
        const hasParser = files.includes('package/src/parser.js');
        const hasInterpreter = files.includes('package/src/interpreter.js');
        const hasModuleLoader = files.includes('package/src/module_loader.js');
        const hasBin = files.includes('package/bin/jawa.js');
        const hasIndex = files.includes('package/index.js');
        const hasPkg = files.includes('package/package.json');
        const noNodeModules = !files.some(f => f.includes('node_modules'));
        const noExe = !files.some(f => f.endsWith('.exe'));

        if (hasCli && hasLexer && hasParser && hasInterpreter && hasModuleLoader &&
            hasBin && hasIndex && hasPkg && noNodeModules && noExe && files.length <= 15) {
            record('Tarball contents', true);
        } else {
            record('Tarball contents', false, `Tarball content check failed (files: ${files.length})`);
        }
    } catch (e) {
        record('Tarball contents', false, e.message);
    }

    // 6. Local install in temporary clean directory with spaces
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    try {
        execSync('npm init -y', { cwd: TEMP_DIR, stdio: 'pipe' });
        execSync(`npm install "${TARBALL_PATH}"`, { cwd: TEMP_DIR, stdio: 'pipe' });
        const installedPkg = path.join(TEMP_DIR, 'node_modules', 'jawalang', 'package.json');
        if (fs.existsSync(installedPkg)) {
            record('Local install', true);
        } else {
            record('Local install', false, 'Installed package.json missing in node_modules/jawalang');
        }
    } catch (e) {
        record('Local install', false, e.message);
    }

    // 7. npx jawa
    try {
        const out = execSync('npx jawa --version', { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        if (out.includes('Jawalang v1.1.0')) {
            record('npx jawa', true);
        } else {
            record('npx jawa', false, `Unexpected output: ${out}`);
        }
    } catch (e) {
        record('npx jawa', false, e.message);
    }

    // 8. npx jawalang
    try {
        const out = execSync('npx jawalang --version', { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        if (out.includes('Jawalang v1.1.0')) {
            record('npx jawalang', true);
        } else {
            record('npx jawalang', false, `Unexpected output: ${out}`);
        }
    } catch (e) {
        record('npx jawalang', false, e.message);
    }

    // 9. Global install
    try {
        execSync(`npm install -g "${TARBALL_PATH}"`, { stdio: 'pipe' });
        record('Global install', true);
    } catch (e) {
        record('Global install', false, e.message);
    }

    // 10. jawa command
    try {
        const out = execSync('jawa --version', { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        if (out.includes('Jawalang v1.1.0')) {
            record('jawa command', true);
        } else {
            record('jawa command', false, `Unexpected output: ${out}`);
        }
    } catch (e) {
        record('jawa command', false, e.message);
    }

    // 11. jawalang command
    try {
        const out = execSync('jawalang --version', { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        if (out.includes('Jawalang v1.1.0')) {
            record('jawalang command', true);
        } else {
            record('jawalang command', false, `Unexpected output: ${out}`);
        }
    } catch (e) {
        record('jawalang command', false, e.message);
    }

    // 12. Program execution
    try {
        const helloFile = path.join(TEMP_DIR, 'hello.jawa');
        fs.writeFileSync(helloFile, 'tulis "Sugeng Rawuh V1.1.0"\n', 'utf8');
        const outJawa = execSync(`jawa "${helloFile}"`, { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        const outJawalang = execSync(`jawalang "${helloFile}"`, { cwd: TEMP_DIR, encoding: 'utf8' }).trim();

        if (outJawa === 'Sugeng Rawuh V1.1.0' && outJawalang === 'Sugeng Rawuh V1.1.0') {
            record('Program execution', true);
        } else {
            record('Program execution', false, `Output mismatch: "${outJawa}" vs "${outJawalang}"`);
        }
    } catch (e) {
        record('Program execution', false, e.message);
    }

    // 13. Module resolution
    try {
        const modDir = path.join(TEMP_DIR, 'mod_sub');
        fs.mkdirSync(modDir, { recursive: true });
        const helperFile = path.join(modDir, 'helper.jawa');
        fs.writeFileSync(helperFile, 'ekspor guna petung(a, b) { bali a * b }\n', 'utf8');
        const mainFile = path.join(modDir, 'main.jawa');
        fs.writeFileSync(mainFile, 'impor "./helper.jawa" minangka h\ntulis h.petung(6, 7)\n', 'utf8');

        // Execute from parent directory (TEMP_DIR)
        const out = execSync(`jawa "${mainFile}"`, { cwd: TEMP_DIR, encoding: 'utf8' }).trim();
        if (out === '42') {
            record('Module resolution', true);
        } else {
            record('Module resolution', false, `Expected 42, got: "${out}"`);
        }
    } catch (e) {
        record('Module resolution', false, e.message);
    }

    // 14. takon()
    try {
        const inputFile = path.join(TEMP_DIR, 'takon_test.jawa');
        fs.writeFileSync(inputFile, 'gawe jeneng = takon("Jeneng: ")\ntulis "Sugeng " + jeneng\n', 'utf8');
        const out = execSync(`jawa "${inputFile}"`, {
            cwd: TEMP_DIR,
            input: 'Budi\n',
            encoding: 'utf8'
        }).trim();

        if (out.includes('Sugeng Budi')) {
            record('takon()', true);
        } else {
            record('takon()', false, `Expected output containing "Sugeng Budi", got: "${out}"`);
        }
    } catch (e) {
        record('takon()', false, e.message);
    }

    // 15. Runtime errors
    try {
        const errFile = path.join(TEMP_DIR, 'err_test.jawa');
        fs.writeFileSync(errFile, 'tulis variabel_sing_ora_ana\n', 'utf8');
        try {
            execSync(`jawa "${errFile}"`, { cwd: TEMP_DIR, stdio: 'pipe' });
            record('Runtime errors', false, 'Expected execution to fail with exit code 1, but succeeded');
        } catch (errProcess) {
            if (errProcess.status === 1) {
                record('Runtime errors', true);
            } else {
                record('Runtime errors', false, `Expected status 1, got ${errProcess.status}`);
            }
        }
    } catch (e) {
        record('Runtime errors', false, e.message);
    }

} finally {
    // Cleanup temporary test directory
    try {
        fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (_) {}
}

// Print exact required validation block
console.log('=== Jawalang V1.1.0 NPM Package Validation ===\n');
let allPass = true;
for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL';
    if (!r.pass) allPass = false;
    const dots = '.'.repeat(Math.max(2, 26 - r.name.length));
    console.log(`${r.name} ${dots} ${status}`);
    if (!r.pass && r.detail) {
        console.error(`  Detail: ${r.detail}`);
    }
}

console.log(`\nNPM PACKAGE STATUS: ${allPass ? 'PASS' : 'FAIL'}`);

if (!allPass) {
    process.exit(1);
}
