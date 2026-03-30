
# Microservices Platform
`Plataforma de microservicios basada en Docker que permite la creación, despliegue y administración dinámica de servicios independientes mediante un dashboard web.`

---

## Tabla de contenidos

- [UI/UX](#uiux)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
  - [Requisitos previos](#requisitos-previos)
  - [Con Docker Compose (recomendado)](#con-docker-compose-recomendado)
  - [En local (desarrollo)](#en-local-desarrollo)

- [Stack tecnológico](#stack-tecnológico)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Infraestructura](#infraestructura)
- [Diagrama de Arquitectura](#diagrama-de-arquitectura)
- [Referencia de la API](#referencia-de-la-api)
  - [Health](#health)
  - [Microservicios](#microservicios)
  - [Docker](#docker)
- [Notas sobre Docker](#notas-sobre-docker)
- [Ejemplos](#ejemplos)
  - [Conversor de temperatura de grados Celsius a Fahrenheit y Kelvin](#convertor-de-temperatura-de-grados-celsius-a-fahrenheit-y-kelvin)
  - [Servidor de rutas (Python)](#servidor-de-rutas-python)
  - [Validador de contraseñas](#validador-de-contraseñas)

---

## UI/UX

<img width="1239" height="717" alt="image" src="https://github.com/user-attachments/assets/1d568fc9-7dd3-4269-8da1-2399e7561be8" />

---

## Stack tecnológico

### ⌨️ Backend

| Capa | Tecnología |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Integración Docker | Dockerode |
| Lenguaje | TypeScript 5 |
| Runner de desarrollo | tsx (modo watch) |
| Build | tsc + tsc-alias |

### 🖥️ Frontend

| Capa | Tecnología |
|---|---|
| Framework | React 19 |
| Build tool | Vite 7 |
| Lenguaje | TypeScript 5 |
| Enrutamiento | React Router v7 |
| Editor de código | react-simple-code-editor + Prismjs |
| SVGs | vite-plugin-svgr |
| Estilos | CSS Modules |

### 🏢 Infraestructura

| Capa | Tecnología |
|---|---|
| Contenedores | Docker + Docker Compose |
| Orquestación | Docker Compose v2 |

---

## Diagrama de Arquitectura

```text
┌────────────────────────────────────────────────────────────┐
│                         USUARIO                            │
│                  Navegador · localhost                     │
└────────────────────────────────────────────────────────────┘
                              │
                             HTTP
                              │
┌────────────────────────────────────────────────────────────┐
│                  FRONTEND — React + Vite                   │
│                                                            │
│  Dashboard · ServiciosPage · CreateMS · NavBar             │
│  React Router · CSS Modules · Fetch API                    │
│                        puerto 5173                         │
└────────────────────────────────────────────────────────────┘
                              │
                        fetch /api/...
                   (proxy Vite → backend)
                              │
┌────────────────────────────────────────────────────────────┐
│               BACKEND — Node.js + Express                  │
│                                                            │
│  POST   /services                  → Crear microservicio   │
│  GET    /services                  → Listarlos             │
│  GET    /services/:id              → Info por id           │
│  POST   /services/:id/start                                │
│  POST   /services/:id/stop                                 │
│  POST   /services/:id/restart                              │
│  DELETE /services/:id/delete                               │
│  GET    /services/:id/source       → Lee código fuente     │
│  POST   /services/:id/invoke       → Lo invoca como proxy  │
│  GET    /services/:id/logs                                 │
│  GET    /docker/version · /containers · /summary · /stats  │
│                                                            │
│  services.registry.json — persistencia de microservicios   │
│                        puerto 3000                         │
└────────────────────────────────────────────────────────────┘
                              │
                    /var/run/docker.sock
                              │
┌────────────────────────────────────────────────────────────┐
│                      DOCKER ENGINE                         │
│                                                            │
│  Imágenes base: node:20-alpine · python:3.11-slim          │
│  Imagen construida dinámicamente por microservicio         │
│                                                            │
│          ms-{nombre}   → contenedor independiente          │
│               puerto asignado automáticamente              │
└────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴────────────────────┐
          │                                        │
┌──────────────────────┐               ┌──────────────────────┐
│      Node.js         │               │        Python        │
│                      │               │                      │
│  FROM node:20-alpine │               │ FROM python:3.11-slim│
│  index.js            │               │ main.py              │
│  Expone HTTP         │               │ Expone HTTP          │
│  Retorna JSON        │               │ Retorna JSON         │
└──────────────────────┘               └──────────────────────┘

--------------------------------------------------------------
    Persistencia:
    services.registry.json   → metadata de microservicios
    microservices/{id}/      → código fuente + service.json
--------------------------------------------------------------
```

---

## Cómo ejecutar el proyecto

### Requisitos previos

- Docker y Docker Compose instalados y en ejecución
- Socket de Docker disponible en `/var/run/docker.sock`

### Con Docker Compose (recomendado)

```bash
# Clonar el repositorio
git clone https://github.com/csun-vault/pc2-microservices-platform.git
cd pc2-microservices-platform

# Levantar todos los servicios
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |

### ¿Cómo acceder al frontend?

Una vez que los contenedores estén corriendo, tienes dos formas de abrir la aplicación:

**Opción 1** — Desde el navegador
Abre directamente: http://localhost:5173

**Opción 2** — Desde Docker Desktop
Abre Docker Desktop
Ve a la sección Containers
Busca el stack pc2-microservices-platform
Haz click en el link 5173:5173 del contenedor frontend.


### En local (desarrollo)

**Backend**

```bash
cd backend
npm install
npm run dev
```
**Frontend** (en otra terminal)

```bash
cd frontend
npm install
npm run dev
```
---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor | `3000` |
| `HOST` | Host al que se enlaza el servidor | `0.0.0.0` |
| `PUBLIC_HOST` | Hostname público para URLs de contenedores | `localhost` |
| `DOCKER_ENV` | Activa el modo Docker (usa `host.docker.internal`) | `true` |

### Frontend (`frontend/.env.local`)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base para las llamadas al backend | `/api` |

---

## Referencia de la API

Todas las rutas (excepto `/health`) están protegidas por el middleware `dockerGuard`, que verifica que el motor de Docker sea accesible antes de procesar cualquier petición.

### Health

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Retorna el estado del servidor y del motor Docker |

### Microservicios

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/services` | Lista todos los microservicios registrados |
| `POST` | `/services` | Crea un nuevo microservicio en un contenedor |
| `GET` | `/services/:id` | Obtiene la información de un microservicio por ID |
| `POST` | `/services/:id/start` | Inicia un microservicio detenido |
| `POST` | `/services/:id/stop` | Detiene un microservicio en ejecución |
| `POST` | `/services/:id/restart` | Reinicia un microservicio |
| `DELETE` | `/services/:id/delete` | Elimina un microservicio y su contenedor |
| `GET` | `/services/:id/source` | Retorna el código fuente del microservicio |
| `POST` | `/services/:id/invoke` | Invoca el microservicio como proxy (soporta path, query y body personalizados) |
| `GET` | `/services/:id/logs` | Retorna los logs del contenedor |

### Docker

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/docker/version` | Versión del motor Docker |
| `GET` | `/docker/containers` | Lista todos los contenedores |
| `GET` | `/docker/summary` | Estadísticas generales del motor Docker |
| `GET` | `/docker/stats` | Métricas de contenedores (filtrables por `containerName` / `containerNames`) |
| `GET` | `/docker/logs/:containerName` | Logs de un contenedor específico |

---

## Notas sobre Docker

- El backend corre como **root** dentro de su contenedor para acceder al socket de Docker.
- El archivo `services.registry.json` se monta como volumen para que el registro de servicios **persista** entre reinicios del contenedor.
- Los archivos de código de los microservicios se almacenan en `backend/microservices/` y también se montan como volumen.
- El frontend corre en **modo desarrollo** dentro de Docker (`vite --host 0.0.0.0`), lo que habilita HMR durante el desarrollo.

---

## Ejemplos

**Convertor de temperatura de grados Celsius a Fahrenheit y Kelvin**

```js
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const query = parsedUrl.query;
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
```

**Prueba**: `celsius=0`  
**Esperado**: `fahrenheit: 32, kelvin: 273.15`

---

**Servidor de rutas (Python)**
Microservicio con múltiples rutas: saludo personalizado y consulta de usuario por ID.

```python
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query = parse_qs(parsed_url.query)

        # Route: /hello?name=Ion
        if path == "/hello":
            name = query.get("name", ["Guest"])[0]
            response = {
                "ok": True,
                "route": "/hello",
                "queryParams": { "name": name },
                "message": f"Hello, {name}"
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response).encode("utf-8"))
            return

        # Route: /users/:id
        if path.startswith("/users/"):
            parts = path.strip("/").split("/")
            if len(parts) == 2:
                user_id = parts[1]
                response = {
                    "ok": True,
                    "route": "/users/:id",
                    "urlParams": { "id": user_id }
                }
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(response).encode("utf-8"))
                return

        # Fallback 404
        self.send_response(404)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({ "ok": False, "message": "Route not found" }).encode("utf-8"))

HTTPServer(("0.0.0.0", 4002), Handler).serve_forever()
```

**Prueba**: `name=Ion`  
**Esperado en /hello?name=ion**: `Hola ion`  
**Esperado en /id/123**: `id: 123`  

---

**Validador de contraseñas**

```js
const http = require('http');

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const data = JSON.parse(body);
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
```

**Prueba**:  
```json
{ 
  "password": "MiPasswordSegura123", 
  "minLen": 10 
}
```  
**Esperado**: `valid`


[![Ver video](https://img.youtube.com)](https://www.youtube.com)
