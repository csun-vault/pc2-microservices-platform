/**
 * Extrae el puerto de un string de código (Node.js/Express o Python/Flask)
 * @param sourceCode El código fuente como string
 * @returns El puerto como número o null si no se encuentra
 */

export function extractPortFromCode(sourceCode: string): number | null {
    if (!sourceCode) return null;

    // 1. Patrón para Node.js / Express: .listen(4010, ...) o .listen(4010)
    // Busca ".listen(" seguido de números opcionalmente rodeados de espacios o comillas
    const nodeRegex = /\.listen\(\s*['"]?(\d+)['"]?\s*[,)]/;

    // 2. Patrón para Flask (Python): app.run(port=5000) o app.run(host='0.0.0.0', port=5000)
    // Busca "port=" seguido de números
    const flaskRegex = /port\s*=\s*(\d+)/;

    // Intentar match con Node.js
    const nodeMatch = sourceCode.match(nodeRegex);
    if (nodeMatch && nodeMatch[1]) {
        return parseInt(nodeMatch[1], 10);
    }

    // Intentar match con Flask
    const flaskMatch = sourceCode.match(flaskRegex);
    if (flaskMatch && flaskMatch[1]) {
        return parseInt(flaskMatch[1], 10);
    }

    return null;
}