const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = path.resolve(__dirname, '..');
const SCRATCH = __dirname;

console.log('====================================================');
console.log('           JAWALANG FULL REGRESSION SUITE           ');
console.log('====================================================\n');

// 1. POSITIVE TESTS
const positiveFiles = [
    'examples/oi.jawa',
    'examples/tes_percabangan.jawa',
    'examples/test_expression.jawa',
    'examples/test_logical.jawa',
    'examples/test_loop.jawa',
    'examples/tes_lengkap.jawa',
    'examples/test_function.jawa',
    'examples/test_function_scope.jawa',
    'examples/test_array.jawa',
    'examples/test_string.jawa',
    'examples/test_builtin.jawa',
    'examples/test_type.jawa',
    'examples/test_object.jawa',
    'examples/test_object_builtin.jawa',
    'examples/test_array_object.jawa',
    'examples/test_foreach.jawa',
    'examples/test_exception.jawa',
    'examples/test_module.jawa',
    'examples/test_module_v11.jawa',
    'examples/test_higher_order.jawa',
    'examples/test_collection_v2.jawa',
    'examples/test_struct.jawa',
    'examples/test_guna.jawa',
    'examples/test_module_v2.jawa',
    'examples/test_module_v3.jawa',
    'examples/test_dot_notation_v4.jawa',
    'examples/test_inheritance_v5.jawa',
    'examples/test_stdlib_v140.jawa',
    'examples/test_datetime.jawa',
    'examples/test_json.jawa',
    'examples/test_filesystem.jawa',
    'examples/test_filesystem_error.jawa',
    'examples/test_testing.jawa',
    'examples/test_testing_error.jawa'
];

let posPassed = 0;
console.log('--- 1. Positive Tests ---');
for (const file of positiveFiles) {
    const fullFilePath = path.join(PROJECT, file);
    try {
        execSync(`"${process.execPath}" "${path.join(PROJECT, 'index.js')}" "${fullFilePath}"`, {
            cwd: PROJECT,
            stdio: ['pipe', 'pipe', 'pipe'],
            input: 'Budi\n' // In case test_type or test_input asks for input
        });
        console.log(`PASS: ${file}`);
        posPassed++;
    } catch (err) {
        console.error(`FAIL: ${file}`);
        console.error(((err.stdout || '') + (err.stderr || '')).trim());
    }
}
console.log(`Positive Result: ${posPassed}/${positiveFiles.length} passed\n`);

// 2. NEGATIVE TESTS
const negativeFiles = [
    'examples/test_array_error.jawa',
    'examples/test_builtin_error.jawa',
    'examples/test_string_error.jawa',
    'examples/test_input_error.jawa',
    'examples/test_type_error.jawa',
    'examples/test_object_error.jawa',
    'examples/test_object_builtin_error.jawa',
    'examples/test_array_object_error.jawa',
    'examples/test_foreach_error.jawa',
    'examples/test_exception_error.jawa',
    'examples/test_module_error.jawa',
    'examples/test_module_v11_error.jawa',
    'examples/test_higher_order_error.jawa',
    'examples/test_collection_v2_error.jawa',
    'examples/test_struct_error.jawa',
    'examples/test_module_v2_error.jawa',
    'examples/test_module_v3_error.jawa',
    'examples/test_dot_notation_v4_error.jawa',
    'examples/test_inheritance_v5_error.jawa',
    'examples/test_stdlib_v140_error.jawa',
    'examples/test_datetime_error.jawa',
    'examples/test_json_error.jawa'
];

let negPassed = 0;
console.log('--- 2. Negative Tests (Must exit 1) ---');
for (const file of negativeFiles) {
    const fullFilePath = path.join(PROJECT, file);
    try {
        execSync(`"${process.execPath}" "${path.join(PROJECT, 'index.js')}" "${fullFilePath}"`, {
            cwd: PROJECT,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.error(`FAIL: ${file} (Expected error, but succeeded)`);
    } catch (err) {
        if (err.status === 1) {
            console.log(`PASS: ${file} (exit code 1)`);
            negPassed++;
        } else {
            console.error(`FAIL: ${file} (Expected exit code 1, got ${err.status})`);
        }
    }
}
console.log(`Negative Result: ${negPassed}/${negativeFiles.length} passed\n`);

// 3. SCRATCH NEGATIVE RUNNERS
const scratchRunners = [
    'test_object_negative.js',
    'test_object_builtin_negative.js',
    'test_integration_negative.js',
    'test_foreach_negative.js',
    'test_exception_negative.js',
    'test_module_negative.js',
    'test_module_v11_negative.js',
    'test_higher_order_negative.js',
    'test_collection_v2_negative.js',
    'test_struct_negative.js',
    'test_module_v2_negative.js',
    'test_module_v3_negative.js',
    'test_dot_notation_v4_negative.js',
    'test_cli_positive.js',
    'test_cli_negative.js',
    'test_inheritance_v5_negative.js',
    'test_repl.js',
    'test_language_server.js',
    'test_references_v130.js',
    'test_stdlib_v140.js',
    'test_datetime_v140.js',
    'test_json_v140.js',
    'test_filesystem_v140.js',
    'test_testing_v140.js'
];

let runnerPassed = 0;
console.log('--- 3. Scratch Test Suites ---');
for (const runner of scratchRunners) {
    const fullPath = path.join(SCRATCH, runner);
    if (!fs.existsSync(fullPath)) {
        console.log(`SKIP: ${runner} (not found)`);
        continue;
    }
    try {
        execSync(`"${process.execPath}" "${fullPath}"`, {
            cwd: PROJECT,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`PASS: ${runner}`);
        runnerPassed++;
    } catch (err) {
        console.error(`FAIL: ${runner}`);
        console.error(((err.stdout || '') + (err.stderr || '')).trim());
    }
}
console.log(`Scratch Runners Result: ${runnerPassed}/${scratchRunners.length} passed\n`);

console.log('====================================================');
const totalAll = posPassed === positiveFiles.length &&
                 negPassed === negativeFiles.length &&
                 runnerPassed === scratchRunners.length;
console.log(`FINAL REGRESSION STATUS: ${totalAll ? 'ALL PASS (100%)' : 'SOME FAILED'}`);
console.log('====================================================');

if (!totalAll) process.exit(1);
