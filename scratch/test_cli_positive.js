const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = 'D:\\Jawascript';
const JAWA_EXE = path.join(PROJECT, 'bin', 'jawa.exe');

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

console.log('=== RUNNING CLI POSITIVE TESTS ===\n');

// 1. --version
test('--version displays Jawalang version', () => {
    const out = execSync(`"${JAWA_EXE}" --version`, { encoding: 'utf8' }).trim();
    if (!out.startsWith('Jawalang ') && !out.startsWith('Jawalang v')) {
        throw new Error(`Expected version format, got "${out}"`);
    }
});

// 2. -v
test('-v displays Jawalang version', () => {
    const out = execSync(`"${JAWA_EXE}" -v`, { encoding: 'utf8' }).trim();
    if (!out.startsWith('Jawalang ') && !out.startsWith('Jawalang v')) {
        throw new Error(`Expected version format, got "${out}"`);
    }
});

// 3. --help
test('--help displays clean usage', () => {
    const out = execSync(`"${JAWA_EXE}" --help`, { encoding: 'utf8' }).trim();
    if (!out.includes('Usage:') || !out.includes('jawa <file.jawa>') || !out.includes('jawa run <file.jawa>')) {
        throw new Error(`Help output malformed: ${out}`);
    }
});

// 4. -h
test('-h displays clean usage', () => {
    const out = execSync(`"${JAWA_EXE}" -h`, { encoding: 'utf8' }).trim();
    if (!out.includes('Usage:') || !out.includes('Commands:')) {
        throw new Error(`Help output malformed: ${out}`);
    }
});

// 5. Direct file execution
test('jawa <file.jawa> executes program', () => {
    const out = execSync(`"${JAWA_EXE}" examples\\hello_cli.jawa`, { cwd: PROJECT, encoding: 'utf8' }).trim();
    if (!out.includes('Halo saka Jawalang versi 1.0.0!')) {
        throw new Error(`Expected greeting, got: ${out}`);
    }
});

// 6. Run subcommand execution
test('jawa run <file.jawa> executes program identically', () => {
    const out = execSync(`"${JAWA_EXE}" run examples\\hello_cli.jawa`, { cwd: PROJECT, encoding: 'utf8' }).trim();
    if (!out.includes('Halo saka Jawalang versi 1.0.0!')) {
        throw new Error(`Expected greeting, got: ${out}`);
    }
});

// 7. Relative path execution
test('jawa with relative path .\\examples\\hello_cli.jawa', () => {
    const out = execSync(`"${JAWA_EXE}" .\\examples\\hello_cli.jawa`, { cwd: PROJECT, encoding: 'utf8' }).trim();
    if (!out.includes('Halo saka Jawalang versi 1.0.0!')) {
        throw new Error(`Expected greeting, got: ${out}`);
    }
});

// 8. Absolute path execution
test('jawa with absolute path D:\\Jawascript\\examples\\hello_cli.jawa', () => {
    const absPath = path.join(PROJECT, 'examples', 'hello_cli.jawa');
    const out = execSync(`"${JAWA_EXE}" "${absPath}"`, { cwd: 'C:\\', encoding: 'utf8' }).trim();
    if (!out.includes('Halo saka Jawalang versi 1.0.0!')) {
        throw new Error(`Expected greeting, got: ${out}`);
    }
});

// 9. Path containing spaces
test('jawa with path containing spaces', () => {
    const spaceDir = path.join(PROJECT, 'scratch', 'folder with space');
    if (!fs.existsSync(spaceDir)) fs.mkdirSync(spaceDir, { recursive: true });
    const spaceFile = path.join(spaceDir, 'space test.jawa');
    fs.writeFileSync(spaceFile, 'gawe s = "Spasi Sukses"\ntulis s\n', 'utf8');

    try {
        const out = execSync(`"${JAWA_EXE}" "${spaceFile}"`, { encoding: 'utf8' }).trim();
        if (out !== 'Spasi Sukses') throw new Error(`Expected "Spasi Sukses", got: "${out}"`);
    } finally {
        if (fs.existsSync(spaceFile)) fs.unlinkSync(spaceFile);
        if (fs.existsSync(spaceDir)) fs.rmdirSync(spaceDir);
    }
});

// 10. Interactive input via takon()
test('jawa with interactive input takon()', () => {
    const tmpInput = path.join(PROJECT, 'scratch', 'tmp_input.jawa');
    fs.writeFileSync(tmpInput, 'gawe p = takon("Input: ")\ntulis "Asil: " + p\n', 'utf8');

    try {
        const out = execSync(`"${JAWA_EXE}" "${tmpInput}"`, {
            input: 'Sugeng Rawuh\n',
            encoding: 'utf8'
        }).trim();
        if (!out.includes('Asil: Sugeng Rawuh')) {
            throw new Error(`Expected "Asil: Sugeng Rawuh", got: "${out}"`);
        }
    } finally {
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
    }
});

// 11. Module relative import preserved regardless of process cwd
test('jawa preserves relative module imports when run from another cwd', () => {
    const out = execSync(`"${JAWA_EXE}" "${path.join(PROJECT, 'examples', 'test_module_v3.jawa')}"`, {
        cwd: 'C:\\',
        encoding: 'utf8'
    }).trim();
    if (!out.includes('Module V3 Test Result: 41 PASS, 0 FAIL')) {
        throw new Error(`Module V3 test failed when run from C:\\: ${out.slice(-200)}`);
    }
});

// 12. Batch wrapper jawa.cmd
test('jawa.cmd execution in cmd.exe', () => {
    const cmdPath = path.join(PROJECT, 'bin', 'jawa.cmd');
    const out = execSync(`cmd /c "${cmdPath}" --version`, { encoding: 'utf8' }).trim();
    if (!out.startsWith('Jawalang ') && !out.startsWith('Jawalang v')) {
        throw new Error(`Expected version format, got "${out}"`);
    }
});

// 13. Module CLI test fixture (examples/cli/main.jawa)
test('jawa executes examples/cli/main.jawa with helper import', () => {
    const mainPath = path.join(PROJECT, 'examples', 'cli', 'main.jawa');
    const out = execSync(`"${JAWA_EXE}" "${mainPath}"`, { cwd: 'C:\\', encoding: 'utf8' }).trim();
    if (!out.includes('Halo Panganggo, sugeng rawuh ing Jawalang CLI!') || !out.includes('Asil: 42')) {
        throw new Error(`Module CLI execution failed: ${out}`);
    }
});

console.log(`\nCLI Positive Result: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
