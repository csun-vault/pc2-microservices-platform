export const BOILERPLATE_PYTHON = `from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Respuesta JSON
        response = {
            "status": "ok",
            "message": "Microservicio Python activo",
            "port": 8000
        }
        
        self.wfile.write(json.dumps(response).encode('utf-8'))

if __name__ == "__main__":
    httpd = HTTPServer(('', 8000), SimpleHandler)
    httpd.serve_forever()`;

export const BOILERPLATE_NODE = `const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Microservicio Node.js activo',
    port: 3000
  }));
});

server.listen(3000, () => {
  console.log('Servidor escuchando...');
});`;