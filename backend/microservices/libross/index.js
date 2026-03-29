const http = require('http');
const url = require('url');

const libros = [
    { id: 1, titulo: "The Pragmatic Programmer", autor: "Hunt", disponible: true },
    { id: 2, titulo: "Clean Code", autor: "Martin", disponible: false },
    { id: 3, titulo: "Eloquent JavaScript", autor: "Haverbeke", disponible: true }
];

const server = http.createServer((req, res) => {
    const { query } = url.parse(req.url, true);

    // El parser debería detectar 'autor' y 'disponible'
    const autorNombre = query.autor;
    const soloDisponibles = query.disponible === 'true';

    let resultado = libros;

    if (autorNombre) {
        resultado = resultado.filter(l => l.autor.toLowerCase().includes(autorNombre.toLowerCase()));
    }
    if (query.disponible) {
        resultado = resultado.filter(l => l.disponible === soloDisponibles);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, data: resultado }));
});

server.listen(4070, () => console.log('Library API on 4070'));