/* ============================================================
   services/microservices.service.ts
   Capa de datos — mock listo para conectar a API real.

   Para conectar a tu backend real:
   1. Cambia BASE_URL a tu endpoint.
   2. Descomenta las llamadas fetch reales.
   3. Elimina los datos MOCK_* y los setTimeout.
   ============================================================ */

// ---- Tipos ------------------------------------------------

export type ServiceStatus = "running" | "stopped" | "paused";

export interface Microservice {
  id: string;
  name: string;
  port: number;
  status: ServiceStatus;
  cpu: number;   // porcentaje 0–100
  ram: number;   // porcentaje 0–100
}

export interface CreateServicePayload {
  name: string;
  port: number;
  code: string;
}

// ---- Config -----------------------------------------------

const BASE_URL = "/api"; // Cambia a tu URL real cuando tengas backend

// ---- Mock data --------------------------------------------

const MOCK_SERVICES: Microservice[] = [
  { id: "1", name: "myPython", port: 3000, status: "running", cpu: 45, ram: 62 },
  { id: "2", name: "myFlask",  port: 3001, status: "paused",  cpu: 12, ram: 28 },
  { id: "3", name: "myPython", port: 3010, status: "stopped", cpu: 0,  ram: 5  },
  { id: "4", name: "myNode",   port: 3000, status: "stopped", cpu: 0,  ram: 3  },
  { id: "5", name: "myNode",   port: 3000, status: "stopped", cpu: 0,  ram: 8  },
];

// ---- Helpers mock -----------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- API --------------------------------------------------

/**
 * GET /api/services
 * Retorna la lista de microservicios.
 */
export async function fetchServices(): Promise<Microservice[]> {
  // ── Real ──────────────────────────────────────────────────
  // const res = await fetch(`${BASE_URL}/services`);
  // if (!res.ok) throw new Error("Error fetching services");
  // return res.json();

  // ── Mock ──────────────────────────────────────────────────
  await delay(600);
  return [...MOCK_SERVICES];
}

/**
 * POST /api/services/:id/start
 * Arranca un microservicio detenido.
 */
export async function startService(id: string): Promise<Microservice> {
  // const res = await fetch(`${BASE_URL}/services/${id}/start`, { method: "POST" });
  // if (!res.ok) throw new Error("Error starting service");
  // return res.json();

  await delay(400);
  const svc = MOCK_SERVICES.find((s) => s.id === id)!;
  svc.status = "running";
  return { ...svc };
}

/**
 * POST /api/services/:id/stop
 * Detiene un microservicio activo.
 */
export async function stopService(id: string): Promise<Microservice> {
  // const res = await fetch(`${BASE_URL}/services/${id}/stop`, { method: "POST" });
  // if (!res.ok) throw new Error("Error stopping service");
  // return res.json();

  await delay(400);
  const svc = MOCK_SERVICES.find((s) => s.id === id)!;
  svc.status = "stopped";
  return { ...svc };
}

/**
 * DELETE /api/services/:id
 * Elimina un microservicio.
 */
export async function deleteService(id: string): Promise<void> {
  // const res = await fetch(`${BASE_URL}/services/${id}`, { method: "DELETE" });
  // if (!res.ok) throw new Error("Error deleting service");

  await delay(400);
  const idx = MOCK_SERVICES.findIndex((s) => s.id === id);
  if (idx !== -1) MOCK_SERVICES.splice(idx, 1);
}

/**
 * POST /api/services
 * Crea un nuevo microservicio.
 * Body: { name, port, code }
 */
export async function createService(
  payload: CreateServicePayload
): Promise<Microservice> {
  // const res = await fetch(`${BASE_URL}/services`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });
  // if (!res.ok) throw new Error("Error creating service");
  // return res.json();

  await delay(800);
  const newService: Microservice = {
    id: String(Date.now()),
    name: payload.name,
    port: payload.port,
    status: "stopped",
    cpu: 0,
    ram: 0,
  };
  MOCK_SERVICES.push(newService);
  return newService;
}