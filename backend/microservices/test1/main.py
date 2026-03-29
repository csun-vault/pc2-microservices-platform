from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        response = {
            "ok": True,
            "message": "Hello world"
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode("utf-8"))

HTTPServer(("0.0.0.0", 4002), Handler).serve_forever()