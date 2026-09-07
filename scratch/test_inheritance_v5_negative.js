const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT = 'D:\\Jawascript';

function runCode(code) {
    const tmpFile = path.join(PROJECT, 'examples', '__neg_v5_tmp__.jawa');
    fs.writeFileSync(tmpFile, code, 'utf8');
    try {
        const result = execSync('node index.js examples/__neg_v5_tmp__.jawa', {
            cwd: PROJECT,
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe']
        });
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return { success: true, output: result.trim() };
    } catch (e) {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
        return { success: false, output: ((e.stdout || '') + (e.stderr || '')).trim() };
    }
}

let passed = 0;
let failed = 0;

function test(name, code, expectedFragment) {
    const r = runCode(code);
    if (!r.success && r.output.includes(expectedFragment)) {
        console.log(`PASS: ${name} -> ${expectedFragment}`);
        passed++;
    } else {
        console.log(`FAIL: ${name}`);
        console.log(`  Expected to contain: ${expectedFragment}`);
        console.log(`  Got (success=${r.success}): ${r.output.slice(0, 300)}`);
        failed++;
    }
}

console.log('=== RUNNING JAWALANG V5 INHERITANCE NEGATIVE TESTS ===');

// 1. Missing parent struct
test(
    'Missing parent struct',
    `bentuk Anak ngembangake TidakAda {}`,
    'Struct parent "TidakAda" ora ditemokake'
);

// 2. Self inheritance
test(
    'Self inheritance',
    `bentuk A ngembangake A {}`,
    'Circular inheritance dideteksi'
);

// 3. Parent is not struct (number)
test(
    'Parent is not struct (number variable)',
    `gawe X = 10
bentuk Anak ngembangake X {}`,
    'kudu arupa struct'
);

// 4. Parent is not struct (function)
test(
    'Parent is not struct (function)',
    `guna F() {}
bentuk Anak ngembangake F {}`,
    'kudu arupa struct'
);

// 5. Invalid parent syntax (number token)
test(
    'Invalid parent syntax (number token)',
    `bentuk Anak ngembangake 123 {}`,
    'Sawise "ngembangake" kudu ana jeneng struct induk'
);

// 6. super() outside constructor (in top-level function)
test(
    'super() outside constructor in function',
    `guna test() {
    super()
}`,
    '"super()" mung bisa digunakake ing njero constructor "wiwiti"'
);

// 7. super() at top-level
test(
    'super() at top level',
    `super()`,
    '"super()" mung bisa digunakake ing njero constructor "wiwiti"'
);

// 8. super() in regular method (not wiwiti)
test(
    'super() in regular method',
    `bentuk A {
    guna halo() {
        super()
    }
}`,
    '"super()" mung bisa digunakake ing njero constructor "wiwiti"'
);

// 9. super.halo() at top-level
test(
    'super.halo() at top-level',
    `super.halo()`,
    '"super" mung bisa digunakake ing njero method utawa constructor'
);

// 10. super.halo() outside struct method
test(
    'super.halo() in standalone function',
    `guna test() {
    super.halo()
}`,
    '"super" mung bisa digunakake ing njero method utawa constructor'
);

// 11. Missing parent constructor when args passed
test(
    'Missing parent constructor with args',
    `bentuk IndukPolos {}
bentuk Anak ngembangake IndukPolos {
    wiwiti(x) {
        super(x)
    }
}
gawe a = anyar Anak(10)`,
    'ora duwe constructor "wiwiti"'
);

// 12. Missing parent method
test(
    'Missing parent method',
    `bentuk Induk {}
bentuk Anak ngembangake Induk {
    guna test() {
        super.oraAna()
    }
}
gawe a = anyar Anak()
a.test()`,
    'Method "oraAna" ora ditemokake ing struct induk "Induk"'
);

// 13. Invalid super constructor target (when no parent)
test(
    'super() when no parent exists',
    `bentuk Yatim {
    wiwiti() {
        super()
    }
}
gawe y = anyar Yatim()`,
    'ora duwe struct induk'
);

// 14. Invalid super method target (when no parent)
test(
    'super.method() when no parent exists',
    `bentuk Yatim {
    guna cobaSuper() {
        super.halo()
    }
}
gawe y = anyar Yatim()
y.cobaSuper()`,
    'ora duwe struct induk'
);

// 15. Direct assignment to super
test(
    'Direct assignment to super',
    `super = 10`,
    '"super" ora bisa di-assign langsung'
);

// 16. Property assignment to super
test(
    'Property assignment to super',
    `bentuk A {}
bentuk B ngembangake A {
    guna test() {
        super.x = 10
    }
}`,
    'Property "super" ora bisa di-assign langsung'
);

// 17. gawe x = super() rejected as expression
test(
    'gawe x = super() rejected as expression',
    `bentuk A {}
bentuk B ngembangake A {
    wiwiti() {
        gawe x = super()
    }
}`,
    '"super()" ora bisa digunakake minangka ekspresi'
);

// 18. gawe super = 10 rejected as identifier
test(
    'gawe super = 10 rejected',
    `gawe super = 10`,
    'Sawise "gawe" kudu ana jeneng variabel'
);

// 19. gawe ngembangake = 10 rejected as identifier
test(
    'gawe ngembangake = 10 rejected',
    `gawe ngembangake = 10`,
    'Sawise "gawe" kudu ana jeneng variabel'
);

// 20. Struct declaration inside function rejected (top-level only)
test(
    'bentuk inside function rejected',
    `guna test() {
    bentuk Anak {}
}`,
    '"bentuk" ora bisa digunakake ing njero fungsi'
);

console.log(`\nResult: ${passed}/${passed + failed} passed`);
if (failed > 0) {
    process.exit(1);
}
