/* ============================================================
   parseServiceSource.ts
   Auto-detecta método HTTP y parámetros desde el source code
   de un microservicio Node.js (Express/Fastify) o Python (Flask/FastAPI).
   ============================================================ */

export interface DetectedParam {
    name: string;
    type: "string" | "number" | "boolean";
    required: boolean;
    in: "query" | "path" | "body"; // Añadido 'body' para los POST
}

export interface ParsedService {
    method: "GET" | "POST";
    params: DetectedParam[];
    port?: number; // Nueva propiedad opcional
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function detectPort(src: string): number | undefined {
    const normalized = src
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t");

    const portSignals = [
        // Python http.server robusto:
        // HTTPServer(('0.0.0.0', 4002), H)
        // HTTPServer(('', 4002), H)
        // HTTPServer((HOST, 4002), H)
        /(?:HTTPServer|TCPServer|ThreadingHTTPServer|ThreadingTCPServer)\s*\(\s*\(\s*[^,]+,\s*(\d+)\s*\)\s*,/i,

        // Flask / FastAPI / uvicorn
        /\bapp\.run\s*\([^)]*?\bport\s*=\s*(\d+)/i,
        /\buvicorn\.run\s*\([^)]*?\bport\s*=\s*(\d+)/i,

        // Fallback genérico Python
        /\bport\s*=\s*(\d+)/i,

        // Node
        /\.listen\s*\(\s*(\d+)\s*[,)]/i,
        /\.listen\s*\(\s*\{[^}]*\bport\s*:\s*(\d+)/i,
    ];

    for (const regex of portSignals) {
        const match = normalized.match(regex);
        if (match?.[1]) return Number(match[1]);
    }

    return undefined;
}
function stripStrings(src: string): string {
    return src
        .replace(/`[^`]*`/g, '``')           // JS template literals
        .replace(/"(?:[^"\\]|\\.)*"/g, '""')  // Double quotes
        .replace(/'(?:[^'\\]|\\.)*'/g, "''")  // Single quotes
        .replace(/#.*$/gm, '')                // Python comments
        .replace(/\/\*[\s\S]*?\*\//g, '');    // JS block comments
}

// ── Detección de método ───────────────────────────────────────────────────────

const POST_SIGNALS = [
    // Node.js
    /req\.method\s*===?\s*['"]POST['"]/i,
    /app\.(post|router\.post)\s*\(/,
    /router\.(post)\s*\(/,
    /fastify\.(post)\s*\(/,
    /req\.on\s*\(\s*['"]data['"]/,
    /JSON\.parse\s*\(\s*body\s*\)/,
    /express\.json\(\)/,
    // Python (Flask / FastAPI / http.server)
    /@app\.post\s*\(/,
    /@router\.post\s*\(/,
    /methods=\[[^\]]*['"]POST['"][^\]]*\]/,
    /request\.method\s*==\s*['"]POST['"]/i,
    /self\.send_response\([^)]*\)\s*#\s*POST/i, // Convención en BaseHTTPRequestHandler
];

const GET_SIGNALS = [
    // Node.js
    /req\.method\s*===?\s*['"]GET['"]/i,
    /req\.query/,
    /searchParams/,
    /app\.(get|router\.get)\s*\(/,
    /router\.(get)\s*\(/,
    /fastify\.(get)\s*\(/,
    // Python (Flask / FastAPI / http.server)
    /@app\.get\s*\(/,
    /@router\.get\s*\(/,
    /methods=\[[^\]]*['"]GET['"][^\]]*\]/,
    /request\.args/,
    /request\.query_params/,
    /request\.method\s*==\s*['"]GET['"]/i,
];

function detectMethod(src: string): "GET" | "POST" {
    const stripped = stripStrings(src);

    let postScore = POST_SIGNALS.filter(r => r.test(stripped)).length;
    let getScore = GET_SIGNALS.filter(r => r.test(stripped)).length;

    // POST explícito tiene prioridad, al igual que en tu versión original
    if (postScore > 0 && postScore >= getScore) return "POST";
    return "GET";
}

// ── Detección de parámetros ───────────────────────────────────────────────────

function extractParams(src: string): DetectedParam[] {
    const found = new Map<string, DetectedParam>();

    function add(name: string, inType: "query" | "path" | "body") {
        if (!name || name.length > 40 || /^[0-9]/.test(name)) return;

        // Evitar keywords de JS y Python
        const blackList = [
            "true", "false", "null", "undefined", "req", "res", "err", "data", "body", "chunk",
            "self", "request", "response", "None", "True", "False"
        ];
        if (blackList.includes(name)) return;

        if (!found.has(name)) {
            found.set(name, {
                name,
                type: inferType(name),
                required: inType === "path", // Path params suelen ser requeridos
                in: inType,
            });
        }
    }

    const IDENT = "[a-zA-Z_][a-zA-Z0-9_]*";

    // ── PATH PARAMS ──
    // JS: /ruta/:param o /ruta/{param}
    for (const m of src.matchAll(new RegExp(`['"\`][^'"\`]*\/:(${IDENT})`, "g"))) add(m[1], "path");
    for (const m of src.matchAll(new RegExp(`['"\`][^'"\`]*\/\\{(${IDENT})\\}`, "g"))) add(m[1], "path");
    for (const m of src.matchAll(new RegExp(`<\\s*(?:\\w+\\s*:\\s*)?(${IDENT})\\s*>`, "g"))) add(m[1], "path");

    // JS Destructuring: const { id } = req.params
    for (const m of src.matchAll(/const\s*\{([^}]+)\}\s*=\s*(?:req\.params|params)/g)) {
        m[1].split(",").forEach(n => add(n.trim().split(/[\s:=]/)[0], "path"));
    }

    // ── QUERY PARAMS ──
    // 1. Accesos directos: .query.xxx o .args.xxx (Node/Python)
    for (const m of src.matchAll(new RegExp(`\\.(?:query|args|query_params)\\.(${IDENT})`, "g"))) {
        add(m[1], "query");
    }

    // 2. Accesos tipo diccionario: .query['xxx'] o .args['xxx']
    for (const m of src.matchAll(new RegExp(`\\.(?:query|args|query_params)\\[['"](${IDENT})['"]\\]`, "g"))) {
        add(m[1], "query");
    }

    // 3. Métodos .get(): .get('xxx')
    for (const m of src.matchAll(/\.get\(\s*['"]([^'"]+)['"]\s*(?:,|\))/g)) {
        add(m[1], "query");
    }

    // 4. Destructuring
    for (const m of src.matchAll(/const\s*\{([^}]+)\}\s*=\s*(?:req\.query|query|parsedUrl\.query|args)/g)) {
        m[1].split(",").forEach(n => add(n.trim().split(/[\s:=]/)[0], "query"));
    }

    // 5. Aliases de query: const query = parsedUrl.query;
    const queryAliases = new Set<string>(["query"]);

    for (const m of src.matchAll(/\bconst\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:req\.query|parsedUrl\.query|args|request\.args)\b/g)) {
        queryAliases.add(m[1]);
    }

    // 6. Uso del alias: query.celsius
    for (const alias of queryAliases) {
        // query.celsius
        const dotRe = new RegExp(`\\b${alias}\\.(${IDENT})\\b(?!\\s*\\()`, "g");
        for (const m of src.matchAll(dotRe)) add(m[1], "query");

        // query["celsius"]
        const bracketRe = new RegExp(`\\b${alias}\\[['"](${IDENT})['"]\\]`, "g");
        for (const m of src.matchAll(bracketRe)) add(m[1], "query");

        // query.get("name") o query.get("name", default)
        const getterRe = new RegExp(`\\b${alias}\\.get\\(\\s*['"](${IDENT})['"]\\s*(?:,|\\))`, "g");
        for (const m of src.matchAll(getterRe)) add(m[1], "query");
    }
    
    // ── BODY PARAMS (Para POST) ──
    // JS: req.body.xxx
    for (const m of src.matchAll(new RegExp(`req\\.body\\.?(${IDENT})|req\\.body\\[['"]?(${IDENT})['"]?\\]`, "g"))) {
        if (m[1] || m[2]) add(m[1] || m[2], "body");
    }
    // JS Destructuring: const { email } = req.body
    for (const m of src.matchAll(/const\s*\{([^}]+)\}\s*=\s*req\.body/g)) {
        m[1].split(",").forEach(n => add(n.trim().split(/[\s:=]/)[0], "body"));
    }
    // Python (Flask/FastAPI): request.json.get('xxx'), request.form.get('xxx')
    for (const m of src.matchAll(/request\.(?:json|form|data)\.get\(['"]([^'"]+)['"]\)/g)) add(m[1], "body");
    for (const m of src.matchAll(/request\.(?:json|form)\[['"]([^'"]+)['"]\]/g)) add(m[1], "body");


    // ── HINTS EN COMENTARIOS ──
    for (const m of src.matchAll(/\/\/[^\n]*\?([^\s\n]+)/g)) {
        m[1].split("&").forEach(pair => {
            const k = pair.split("=")[0];
            if (k) add(k.replace(/[^a-zA-Z0-9_]/g, ""), "query");
        });
    }

    console.log(Array.from(found.values()));
    return Array.from(found.values());
}

function inferType(name: string): "string" | "number" | "boolean" {
    const lower = name.toLowerCase();
    if (/^(id|count|page|limit|offset|age|year|month|day|size|num|qty|quantity|amount|score|index|total|max|min|port|version|wacc|vpn)/.test(lower)) return "number";
    if (/^(is|has|show|enable|active|visible|flag|bool|toggle)/.test(lower)) return "boolean";
    return "string";
}

// ── Export principal ──────────────────────────────────────────────────────────

export function parseServiceSource(sourceCode: string): ParsedService {
    console.log("ALOO")
    const method = detectMethod(sourceCode);
    const params = extractParams(sourceCode);
    const port = detectPort(sourceCode);

    console.log("SOURCE CODE:", sourceCode);
    console.log("DETECTED PORT:", port);

    return { method, params, port };
}