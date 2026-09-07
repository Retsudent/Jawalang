/**
 * LSP Document Symbol Provider (Hierarchical Outline)
 */
const SymbolKind = {
    Namespace: 3,
    Class: 5,
    Method: 6,
    Property: 7,
    Field: 8,
    Constructor: 9,
    Function: 12,
    Variable: 13,
    Struct: 23
};

function getDocumentSymbols(analysisResult) {
    if (!analysisResult || !analysisResult.ast) return [];

    const symbols = [];

    for (const stmt of analysisResult.ast) {
        let actual = stmt;
        if (stmt.type === 'ExportStatement' && stmt.declaration) {
            actual = stmt.declaration;
        }

        if (actual.type === 'VariableDeclaration') {
            const range = actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
            const selectionRange = actual.nameLoc || range;
            symbols.push({
                name: actual.name,
                detail: 'variable',
                kind: SymbolKind.Variable,
                range,
                selectionRange
            });
        } else if (actual.type === 'FunctionDeclaration') {
            const range = actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
            const selectionRange = actual.nameLoc || range;
            const paramStr = (actual.parameters || []).join(', ');
            symbols.push({
                name: actual.name,
                detail: `guna(${paramStr})`,
                kind: SymbolKind.Function,
                range,
                selectionRange
            });
        } else if (actual.type === 'StructDeclaration') {
            const range = actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
            const selectionRange = actual.nameLoc || range;
            const children = [];

            // Fields
            for (const f of actual.fields || []) {
                const fRange = f.loc || range;
                children.push({
                    name: f.name,
                    detail: 'property',
                    kind: SymbolKind.Field,
                    range: fRange,
                    selectionRange: f.nameLoc || fRange
                });
            }

            // Methods & constructor
            for (const m of actual.methods || []) {
                const mRange = m.loc || range;
                const isCtor = m.name === 'wiwiti';
                const mParams = (m.parameters || []).join(', ');
                children.push({
                    name: m.name,
                    detail: isCtor ? `wiwiti(${mParams})` : `guna(${mParams})`,
                    kind: isCtor ? SymbolKind.Constructor : SymbolKind.Method,
                    range: mRange,
                    selectionRange: m.nameLoc || mRange
                });
            }

            symbols.push({
                name: actual.name,
                detail: actual.parent ? `ngembangake ${actual.parent}` : 'bentuk',
                kind: SymbolKind.Struct,
                range,
                selectionRange,
                children
            });
        } else if (actual.type === 'ImportStatement' && actual.alias) {
            const range = actual.loc || { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } };
            symbols.push({
                name: actual.alias.value,
                detail: `impor "${actual.source?.value}"`,
                kind: SymbolKind.Namespace,
                range,
                selectionRange: actual.alias.loc || range
            });
        }
    }

    return symbols;
}

module.exports = {
    getDocumentSymbols,
    SymbolKind
};
