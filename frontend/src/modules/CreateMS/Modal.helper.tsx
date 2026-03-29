export function extractPortFromCode(sourceCode: string): number | null {
    if (!sourceCode) return null;

    const normalized = sourceCode
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");

    const portSignals = [
        // Python http.server
        /(?:HTTPServer|TCPServer|ThreadingHTTPServer|ThreadingTCPServer)\s*\(\s*\(\s*[^,]+,\s*(\d+)\s*\)\s*,/i,

        // Flask / FastAPI / uvicorn
        /\bapp\.run\s*\([^)]*?\bport\s*=\s*(\d+)/i,
        /\buvicorn\.run\s*\([^)]*?\bport\s*=\s*(\d+)/i,

        // Generic python fallback
        /\bport\s*=\s*(\d+)/i,

        // Node
        /\.listen\s*\(\s*(\d+)\s*[,)]/i,
        /\.listen\s*\(\s*\{[^}]*\bport\s*:\s*(\d+)/i,
    ];

    for (const regex of portSignals) {
        const match = normalized.match(regex);
        if (match?.[1]) return Number(match[1]);
    }

    return null;
}