const http = require('http');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const data = JSON.parse(body);

            // El parser debería detectar 'password' y 'minLen' en el body
            const password = data.password;
            const minLen = data.minLen || 8;

            const esValido = password && password.length >= minLen;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                valid: esValido,
                length: password ? password.length : 0
            }));
        });
    } else {
        res.writeHead(405);
        res.end();
    }
});

server.listen(4080, () => console.log('Auth Checker on 4080'));