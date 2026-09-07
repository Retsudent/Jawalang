const path = require("path");
const readline = require("readline");

const lexer = require("./lexer");
const parser = require("./parser");
const interpreter = require("./interpreter");
const ModuleLoader = require("./module_loader");

/**
 * Check if the accumulated input is complete or needs continuation lines.
 * Returns false if inside unclosed quotes, unclosed brackets/parens/braces,
 * or ending with a continuation operator.
 */
function isCompleteInput(source) {
    let paren = 0;
    let bracket = 0;
    let brace = 0;
    let inString = false;
    let i = 0;

    while (i < source.length) {
        const ch = source[i];

        if (inString) {
            if (ch === "\\") {
                i += 2; // skip escape
                continue;
            }
            if (ch === '"') {
                inString = false;
            }
            i++;
            continue;
        }

        // Single-line comment
        if (ch === "/" && source[i + 1] === "/") {
            i += 2;
            while (i < source.length && source[i] !== "\n") {
                i++;
            }
            continue;
        }

        if (ch === '"') {
            inString = true;
            i++;
            continue;
        }

        if (ch === "(") paren++;
        else if (ch === ")") paren--;
        else if (ch === "[") bracket++;
        else if (ch === "]") bracket--;
        else if (ch === "{") brace++;
        else if (ch === "}") brace--;

        i++;
    }

    if (inString || paren > 0 || bracket > 0 || brace > 0) {
        return false;
    }

    // Trailing operators indicating an incomplete statement or expression
    const trimmed = source.trim();
    if (/(?:[+\-*/=,<>]|\blan\b|\butawa\b|\bnganti\b|\blangkah\b)$/.test(trimmed)) {
        return false;
    }

    return true;
}

/**
 * REPL Session holding persistent state across inputs
 */
class ReplSession {
    constructor(options = {}) {
        this.isDebug = !!options.isDebug;
        this.cwd = options.cwd || process.cwd();
        this.filePath = path.resolve(this.cwd, "repl.jawa");
        this.loader = new ModuleLoader();
        this.globalEnv = new interpreter.Environment();
        this.globalFunctions = {};
        this.globalStructs = {};
        this.rootExports = { variables: {}, functions: {}, structs: {} };
    }

    /**
     * Evaluate code string in this persistent session.
     * Handles statements and bare expressions seamlessly.
     */
    eval(code) {
        if (!code || code.trim() === "") {
            return { ok: true, empty: true, printed: false };
        }

        let tokens;
        try {
            tokens = lexer(code);
        } catch (err) {
            return { ok: false, error: err.message, stack: err.stack };
        }

        if (tokens.length === 0) {
            return { ok: true, empty: true, printed: false };
        }

        let ast;
        let isExpression = false;

        // Try parsing as normal statements first
        try {
            ast = parser(tokens);
        } catch (parseErr) {
            // If statement parse failed, try expression parse fallback
            try {
                ast = parser(tokens, { expressionOnly: true });
                isExpression = true;
            } catch (_) {
                // If expression parse also fails, re-throw the original statement error
                return { ok: false, error: parseErr.message, stack: parseErr.stack };
            }
        }

        let resultValue = undefined;
        let resultFormatted = undefined;
        let hadResult = false;

        const execOptions = {
            filePath: this.filePath,
            loader: this.loader,
            globalEnv: this.globalEnv,
            globalFunctions: this.globalFunctions,
            globalStructs: this.globalStructs,
            rootExports: this.rootExports,
            isRepl: true,
            onReplResult: (val, formatted) => {
                hadResult = true;
                resultValue = val;
                resultFormatted = formatted;
            }
        };

        try {
            interpreter(ast, execOptions);
            return {
                ok: true,
                empty: false,
                printed: hadResult,
                value: resultValue,
                formatted: resultFormatted
            };
        } catch (execErr) {
            return { ok: false, error: execErr.message, stack: execErr.stack };
        }
    }
}

const BANNER_TEXT = `Jawalang REPL v1.2.0
Ketik .bantu untuk bantuan.
`;

const HELP_TEXT = `Jawalang REPL commands:
  .help / .bantu   Show help
  .exit / .metu    Exit REPL
  .clear / .resik  Clear screen
`;

/**
 * Launch interactive REPL interface
 */
function startRepl(options = {}) {
    const isDebug = !!options.isDebug;
    const session = new ReplSession({ isDebug });

    const input = options.input || process.stdin;
    const output = options.output || process.stdout;

    output.write(BANNER_TEXT);

    const rl = readline.createInterface({
        input,
        output,
        prompt: "jawa> "
    });

    let buffer = "";

    rl.prompt();

    rl.on("line", (line) => {
        // Check meta commands only on clean top-level line
        if (buffer === "") {
            const trimmed = line.trim();
            if (trimmed === ".help" || trimmed === ".bantu") {
                output.write(HELP_TEXT);
                rl.prompt();
                return;
            }
            if (trimmed === ".exit" || trimmed === ".metu") {
                rl.close();
                process.exit(0);
                return;
            }
            if (trimmed === ".clear" || trimmed === ".resik") {
                try {
                    console.clear();
                } catch (_) {
                    output.write("\\x1Bc");
                }
                rl.prompt();
                return;
            }
        }

        buffer = buffer ? buffer + "\n" + line : line;

        if (!isCompleteInput(buffer)) {
            rl.setPrompt("...> ");
            rl.prompt();
            return;
        }

        const codeToExecute = buffer;
        buffer = "";

        // Pause readline while running so synchronous stdin reads (takon) don't conflict
        rl.pause();

        const res = session.eval(codeToExecute);

        if (res.ok) {
            if (res.printed) {
                output.write(res.formatted + "\n");
            }
        } else {
            if (isDebug) {
                console.error(res.stack || res.error);
            } else {
                console.error(`[Error Jawalang]: ${res.error}`);
            }
        }

        rl.resume();
        rl.setPrompt("jawa> ");
        rl.prompt();
    });

    rl.on("SIGINT", () => {
        output.write("^C\n");
        buffer = "";
        rl.setPrompt("jawa> ");
        rl.prompt();
    });

    rl.on("close", () => {
        output.write("\n");
        process.exit(0);
    });

    return { session, rl };
}

module.exports = {
    ReplSession,
    isCompleteInput,
    startRepl,
    BANNER_TEXT,
    HELP_TEXT
};
