# pc2-microservices-platform
Plataforma basada en microservicios y Docker que permite la creación, despliegue y administración dinámica de servicios independientes mediante un dashboard web.

# UI/UX boiler
<img width="1876" height="708" alt="image" src="https://github.com/user-attachments/assets/473bbd2c-f2f9-400b-a288-9f31694159ca" />

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
│  GET    /services/:id/source       → Lee codigo fuente     │
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
          |                                        |
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