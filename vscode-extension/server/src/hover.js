const { BUILTINS, KEYWORDS, findTokenAt, isPositionInRange } = require('./utils');

/**
 * LSP Semantic Hover Provider (textDocument/hover)
 */
function getHover(analysisResult, position) {
    if (!analysisResult || !analysisResult.tokens) return null;

    const token = findTokenAt(analysisResult.tokens, position);
    if (!token) return null;

    const word = token.value;

    // 1. Built-in functions hover
    if (BUILTINS[word]) {
        const info = BUILTINS[word];
        const md = [
            `\`\`\`jawa\n${info.signature}\n\`\`\``,
            `**Built-in function** (Returns: \`${info.returnType}\`)`,
            '',
            info.description,
            '',
            `**Tuladha:**`,
            `\`\`\`jawa\n${info.example}\n\`\`\``
        ].join('\n');
        return {
            contents: { kind: 'markdown', value: md },
            range: token.loc
        };
    }

    // 2. Language Keywords hover
    if (KEYWORDS[word]) {
        const info = KEYWORDS[word];
        const md = [
            `**(keyword) ${word}** — ${info.detail}`,
            '',
            `\`\`\`jawa\n${info.doc}\n\`\`\``
        ].join('\n');
        return {
            contents: { kind: 'markdown', value: md },
            range: token.loc
        };
    }

    // 3. User-defined symbol hover
    let matchedScope = analysisResult.globalScope;
    for (const sc of analysisResult.scopes) {
        if (sc.range && isPositionInRange(position, sc.range)) {
            matchedScope = sc;
        }
    }

    const sym = matchedScope.lookup(word);
    if (sym) {
        let md = '';

        if (sym.kind === 'variable') {
            md = [
                `\`\`\`jawa\ngawe ${sym.name}\n\`\`\``,
                `**(variable) ${sym.name}**`,
                `Tipe data: \`${sym.inferredType || 'any'}\``
            ].join('\n\n');
        } else if (sym.kind === 'parameter') {
            md = [
                `\`\`\`jawa\n${sym.name}\n\`\`\``,
                `**(parameter) ${sym.name}**`,
                `Fungsi: \`${sym.enclosingFunction || sym.enclosingMethod || 'blok'}\``
            ].join('\n\n');
        } else if (sym.kind === 'function') {
            const paramList = (sym.parameters || []).map(p => typeof p === 'string' ? p : p.value || p);
            const paramDoc = paramList.length > 0 ? `\nParameter:\n${paramList.map(p => `  - \`${p}\``).join('\n')}` : '';
            md = [
                `\`\`\`jawa\nguna ${sym.name}(${paramList.join(', ')})\n\`\`\``,
                `**Function**${paramDoc}`,
                `Returns: \`${sym.returnType || 'unknown'}\``
            ].join('\n\n');
        } else if (sym.kind === 'struct') {
            const parentDoc = sym.parent ? ` ngembangake ${sym.parent}` : '';
            const fieldsDoc = (sym.fields && sym.fields.length > 0)
                ? `\n**Properties:**\n${sym.fields.map(f => `  - \`${f}\``).join('\n')}`
                : '';
            const methodsDoc = (sym.methods && sym.methods.size > 0)
                ? `\n**Methods:**\n${Array.from(sym.methods.values()).map(m => `  - \`${m.name}(${(m.parameters || []).join(', ')})\``).join('\n')}`
                : '';
            md = [
                `\`\`\`jawa\nbentuk ${sym.name}${parentDoc}\n\`\`\``,
                `**Struct**${fieldsDoc}${methodsDoc}`
            ].join('\n\n');
        } else if (sym.kind === 'namespace') {
            md = [
                `\`\`\`jawa\nminangka ${sym.name}\n\`\`\``,
                `**(namespace) ${sym.name}**`,
                `Sumber modul: \`${sym.moduleRecord?.canonicalPath || ''}\``
            ].join('\n\n');
        } else if (sym.kind === 'method' || sym.kind === 'constructor') {
            const paramList = (sym.parameters || []).join(', ');
            md = [
                `\`\`\`jawa\n${sym.name === 'wiwiti' ? 'wiwiti' : 'guna ' + sym.name}(${paramList})\n\`\`\``,
                `**${sym.name === 'wiwiti' ? 'Constructor' : 'Method'}**`
            ].join('\n\n');
        }

        if (md) {
            return {
                contents: { kind: 'markdown', value: md },
                range: token.loc
            };
        }
    }

    return null;
}

module.exports = {
    getHover
};
