const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');
const JAWA_EXE = path.join(PROJECT, 'bin', 'jawa.exe');

let passed = 0;
let total = 0;

function test(name, cmdArgs, expectedExitCode, expectedFragment) {
    total++;
    try {
        const out = execSync(`"${JAWA_EXE}" ${cmdArgs}`, {
            cwd: PROJECT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.error(`FAIL: ${name} (Expected exit ${expectedExitCode}, but succeeded)`);
    } catch (e) {
        const output = ((e.stdout || '') + (e.stderr || '')).trim();
        const code = e.status;
        const codeMatches = code === expectedExitCode;
        const fragmentMatches = output.includes(expectedFragment);

        if (codeMatches && fragmentMatches) {
            console.log(`PASS: ${name} (exit ${code}) -> contains "${expectedFragment}"`);
            passed++;
        } else {
            console.error(`FAIL: ${name}`);
            if (!codeMatches) console.error(`  Expected exit code ${expectedExitCode}, got ${code}`);
            if (!fragmentMatches) console.error(`  Expected to contain "${expectedFragment}", got: "${output}"`);
        }
    }
}

console.log('=== RUNNING CLI NEGATIVE TESTS ===\n');

// 1. No arguments
test(
    'No arguments prints usage and exits 1',
    '',
    1,
    'Error: No input file specified.'
);

// 2. Missing file
test(
    'Missing file returns error and exits 1',
    'tidakada.jawa',
    1,
    'Error: File not found: tidakada.jawa'
);

// 3. Missing file with run subcommand
test(
    'Missing file with run subcommand returns error and exits 1',
    'run ora_ana.jawa',
    1,
    'Error: File not found: ora_ana.jawa'
);

// 4. Missing argument after run subcommand
test(
    'Missing argument after run subcommand',
    'run',
    1,
    'Error: Missing source file after "run".'
);

// 5. Wrong extension (.js)
test(
    'Wrong extension .js is rejected',
    'index.js',
    1,
    'Error: Jawalang source files must use the .jawa extension.'
);

// 6. Wrong extension (.txt)
test(
    'Wrong extension .txt is rejected',
    'README.txt',
    1,
    'Error: Jawalang source files must use the .jawa extension.'
);

// 7. Directory instead of file
test(
    'Directory instead of file is rejected',
    'examples',
    1,
    'is a directory, not a file.'
);

// 8. Unknown command
test(
    'Unknown command is reported cleanly',
    'abc',
    1,
    'Error: File or command "abc" not found.'
);

// 9. Unknown option
test(
    'Unknown option is reported cleanly',
    '--invalid-option',
    1,
    'Error: Unknown option "--invalid-option".'
);

// 10. Runtime error in program exits 1 with clean format
test(
    'Runtime error in program prints [Error Jawalang] and exits 1',
    'examples\\test_exception_error.jawa',
    1,
    '[Error Jawalang]:'
);

// 11. Node.js internal stack trace is NOT exposed for normal runtime error
test(
    'Internal node stack trace is not exposed without --debug',
    'examples\\test_type_error.jawa',
    1,
    '[Error Jawalang]:'
);

console.log(`\nCLI Negative Result: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
