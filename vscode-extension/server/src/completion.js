const { BUILTINS, KEYWORDS, isPositionInRange } = require('./utils');

const CompletionItemKind = {
    Text: 1,
    Method: 2,
    Function: 3,
    Constructor: 4,
    Field: 5,
    Variable: 6,
    Class: 7,
    Module: 9,
    Property: 10,
    Keyword: 14,
    Snippet: 15
};

/**
 * LSP Semantic Completion Provider (textDocument/completion)
 */
function getCompletions(analysisResult, position) {
    if (!analysisResult) return [];

    const { text, tokens, scopes, globalScope, structs } = analysisResult;
    const { line, character } = position;

    // Get current line text up to cursor position
    const lines = text.split('\n');
    const currentLine = lines[line] || '';
    const textBeforeCursor = currentLine.slice(0, character);

    // 1. Member access completion: check for trailing "."
    const dotMatch = textBeforeCursor.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.\s*$/);
    if (dotMatch) {
        const receiverName = dotMatch[1];
        return getMemberCompletions(receiverName, position, analysisResult);
    }

    // 2. General scope-based completion
    let matchedScope = globalScope;
    for (const sc of scopes) {
        if (sc.range && isPositionInRange(position, sc.range)) {
            matchedScope = sc;
        }
    }

    const items = [];
    const seen = new Set();

    // A. Visible symbols in scope (variables, parameters, functions, structs, namespaces)
    const visible = matchedScope.getAllVisibleSymbols();
    for (const sym of visible) {
        if (sym.kind === 'builtin') continue; // Handled separately with full details
        if (seen.has(sym.name)) continue;
        seen.add(sym.name);

        let kind = CompletionItemKind.Variable;
        let detail = sym.kind;
        let documentation = '';

        if (sym.kind === 'function') {
            kind = CompletionItemKind.Function;
            detail = `guna ${sym.name}(${(sym.parameters || []).join(', ')})`;
            documentation = `Fungsi: ${sym.name}`;
        } else if (sym.kind === 'struct') {
            kind = CompletionItemKind.Class;
            detail = `bentuk ${sym.name}`;
            documentation = `Struct: ${sym.name}`;
        } else if (sym.kind === 'parameter') {
            kind = CompletionItemKind.Variable;
            detail = `(parameter) ${sym.name}`;
        } else if (sym.kind === 'variable') {
            kind = CompletionItemKind.Variable;
            detail = sym.inferredType ? `(variable) ${sym.name}: ${sym.inferredType}` : `(variable) ${sym.name}`;
        } else if (sym.kind === 'namespace') {
            kind = CompletionItemKind.Module;
            detail = `(namespace) ${sym.name}`;
        }

        items.push({
            label: sym.name,
            kind,
            detail,
            documentation
        });
    }

    // B. Built-in functions
    for (const [name, info] of Object.entries(BUILTINS)) {
        if (seen.has(name)) continue;
        seen.add(name);

        items.push({
            label: name,
            kind: CompletionItemKind.Function,
            detail: info.signature,
            documentation: `${info.description}\n\n**Tuladha:**\n\`\`\`jawa\n${info.example}\n\`\`\``
        });
    }

    // C. Language Keywords
    for (const [kw, info] of Object.entries(KEYWORDS)) {
        if (seen.has(kw)) continue;
        seen.add(kw);

        items.push({
            label: kw,
            kind: CompletionItemKind.Keyword,
            detail: info.detail,
            documentation: `\`\`\`jawa\n${info.doc}\n\`\`\``
        });
    }

    return items;
}

function getMemberCompletions(receiverName, position, analysisResult) {
    const { scopes, structs, globalScope } = analysisResult;
    const items = [];

    // Find innermost scope
    let matchedScope = globalScope;
    for (const sc of scopes) {
        if (sc.range && isPositionInRange(position, sc.range)) {
            matchedScope = sc;
        }
    }

    // Case 1: "iki." receiver inside method
    if (receiverName === 'iki') {
        const encStruct = matchedScope.enclosingStruct;
        if (encStruct) {
            return collectStructMembers(encStruct, structs);
        }
    }

    // Case 2: "super." receiver in subclass method
    if (receiverName === 'super') {
        const encStruct = matchedScope.enclosingStruct;
        if (encStruct && encStruct.parent) {
            const parentName = typeof encStruct.parent === 'string' ? encStruct.parent : encStruct.parent.value;
            const parentStruct = structs.get(parentName);
            if (parentStruct) {
                return collectStructMembers(parentStruct, structs);
            }
        }
    }

    // Case 3: Namespace receiver (e.g. math.tambah)
    const sym = matchedScope.lookup(receiverName);
    if (sym && sym.kind === 'namespace' && sym.moduleRecord) {
        const mod = sym.moduleRecord;
        for (const [vName, vInfo] of Object.entries(mod.exports.variables || {})) {
            items.push({
                label: vName,
                kind: CompletionItemKind.Variable,
                detail: `(variable) ${vName}`,
                documentation: `Diekspor saka modul`
            });
        }
        for (const [fName, fInfo] of Object.entries(mod.exports.functions || {})) {
            items.push({
                label: fName,
                kind: CompletionItemKind.Function,
                detail: `guna ${fName}(${(fInfo.parameters || []).join(', ')})`,
                documentation: `Fungsi diekspor saka modul`
            });
        }
        for (const [sName, sInfo] of Object.entries(mod.exports.structs || {})) {
            items.push({
                label: sName,
                kind: CompletionItemKind.Class,
                detail: `bentuk ${sName}`,
                documentation: `Struct diekspor saka modul`
            });
        }
        return items;
    }

    // Case 4: Instance receiver (e.g. w = anyar Wong(); w.)
    if (sym && sym.inferredType && sym.inferredType.startsWith('instance of ')) {
        const targetStructName = sym.inferredType.replace('instance of ', '').trim();
        const targetStruct = structs.get(targetStructName) || globalScope.lookup(targetStructName);
        if (targetStruct && targetStruct.kind === 'struct') {
            return collectStructMembers(targetStruct, structs);
        }
    }

    return items;
}

function collectStructMembers(structSym, structsMap) {
    const items = [];
    const seen = new Set();

    let current = structSym;
    while (current && current.kind === 'struct') {
        // Collect fields
        for (const f of current.fields || []) {
            if (!seen.has(f)) {
                seen.add(f);
                items.push({
                    label: f,
                    kind: CompletionItemKind.Field,
                    detail: `(property) ${current.name}.${f}`
                });
            }
        }

        // Collect methods
        if (current.methods) {
            for (const [mName, mInfo] of current.methods.entries()) {
                if (!seen.has(mName)) {
                    seen.add(mName);
                    const isCtor = mName === 'wiwiti';
                    const params = (mInfo.parameters || []).join(', ');
                    items.push({
                        label: mName,
                        kind: isCtor ? CompletionItemKind.Constructor : CompletionItemKind.Method,
                        detail: isCtor ? `wiwiti(${params})` : `guna ${mName}(${params})`,
                        documentation: `Method saka struct ${current.name}`
                    });
                }
            }
        }

        // Walk up inheritance chain
        if (current.parent) {
            const parentName = typeof current.parent === 'string' ? current.parent : current.parent.value;
            current = structsMap.get(parentName);
        } else {
            current = null;
        }
    }

    return items;
}

module.exports = {
    getCompletions
};
