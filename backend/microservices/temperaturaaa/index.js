const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const query = parsedUrl.query;

    // El parser detectará 'celsius' como number por el nombre
    const celsius = parseFloat(query.celsius);

    res.setHeader('Content-Type', 'application/json');

    if (isNaN(celsius)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ ok: false, message: "Ingresa un número en 'celsius'" }));
    }

    const fahrenheit = (celsius * 9/5) + 32;
    const kelvin = celsius + 273.15;

    res.statusCode = 200;
    res.end(JSON.stringify({
        ok: true,
        original: celsius + "°C",
        fahrenheit: fahrenheit.toFixed(2) + "°F",
        kelvin: kelvin.toFixed(2) + "K"
    }));
});

server.listen(4060, () => {
    console.log('Conversor Node corriendo en http://localhost:4060');
});