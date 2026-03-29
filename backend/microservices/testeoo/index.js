const http = require('http');
const url = require('url');

const tareas = [
    { id: 1, titulo: "Corregir exámenes", estado: "pendiente" },
    { id: 2, titulo: "Subir notas 3er grado", estado: "completado" },
    { id: 3, titulo: "Preparar clase English", estado: "pendiente" }
];

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const estadoFiltro = parsedUrl.query.estado;

    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;

    if (estadoFiltro) {
        const filtradas = tareas.filter(t => t.estado === estadoFiltro);
        // 🔽 CAMBIO AQUÍ: True -> true 🔽
        return res.end(JSON.stringify({ ok: true, data: filtradas }));
    }

    // 🔽 CAMBIO AQUÍ: True -> true 🔽
    res.end(JSON.stringify({ ok: true, data: tareas }));
});

server.listen(4040, () => {
    console.log('Servidor HTTP nativo en puerto 4040');
});