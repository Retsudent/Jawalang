/**
 * Diagnostics engine formatting and filtering for LSP
 */
function getDiagnostics(analysisResult) {
    if (!analysisResult || !analysisResult.diagnostics) {
        return [];
    }

    const seen = new Set();
    const result = [];

    for (const diag of analysisResult.diagnostics) {
        if (!diag || !diag.range || !diag.range.start || !diag.range.end) continue;

        // Ensure non-negative positions
        const startLine = Math.max(0, diag.range.start.line || 0);
        const startChar = Math.max(0, diag.range.start.character || 0);
        const endLine = Math.max(startLine, diag.range.end.line || 0);
        const endChar = Math.max(startChar, diag.range.end.character || 0);

        const key = `${startLine}:${startChar}-${endLine}:${endChar}-${diag.message}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
            severity: diag.severity || 1,
            range: {
                start: { line: startLine, character: startChar },
                end: { line: endLine, character: endChar }
            },
            message: diag.message,
            source: diag.source || 'Jawalang'
        });
    }

    return result;
}

module.exports = {
    getDiagnostics
};
