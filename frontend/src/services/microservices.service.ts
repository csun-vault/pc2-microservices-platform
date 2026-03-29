/* ============================================================
   services/microservices.service.ts
   Capa de datos conectada al backend real.

   - Usa los tipos compartidos del dominio
   - Lee la respuesta real de /services
   - Adapta ServiceRecord -> Microservice para la UI
   ============================================================ */

import type {
  ServiceRecord,
  ServicesLanguage,
  ServiceStatus as BackendServiceStatus,
  RuntimeStatus,
} from "../../../shared/domain.types";

// ---- Tipos UI ---------------------------------------------

export type UiServiceStatus = "running" | "stopped" | "paused";

export interface Microservice {
  id: string;
  name: string;
  description: string;
  language: ServicesLanguage;

  status: UiServiceStatus;

  port: number;
  internalPort: number;
  externalPort: number;

  url: string;
  basePath: string;

  cpu: number;
  ram: number;

  createdAt: string;
  updatedAt: string;

  backendStatus: BackendServiceStatus;
  runtimeStatus: RuntimeStatus;
  containerName: string;
  imageName: string;
}

export interface CreateServicePayload {
  name: string;
  description: string;
  language: ServicesLanguage;
  internalPort: number | null;
  externalPort: number | null;
  sourceCode: string;
  memLimitMB: number;
  cpuCores: number;
  autoStart: boolean;
}

// ---- Tipos API reales -------------------------------------

type ApiResponse<T> = {
  ok: boolean;
  data: T;
};

type GetServicesResponse = ApiResponse<{
  services: ServiceRecord[];
}>;

type CreateServiceResponse = ApiResponse<{
  service: ServiceRecord;
}>;

type StartStopServiceResponse = ApiResponse<{
  service: ServiceRecord;
}>;

// ---- Config -----------------------------------------------

const BASE_URL = import.meta.env.VITE_BASE_URL
console.log(BASE_URL)
// ---- Helpers ----------------------------------------------

function ensureOk(response: Response, fallbackMessage: string) {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
}

function mapUiStatus(
  backendStatus: BackendServiceStatus,
  runtimeStatus: RuntimeStatus
): UiServiceStatus {
  if (backendStatus === "BUILDING") return "paused";
  if (backendStatus === "ERROR") return "paused";
  if (runtimeStatus === "restarting") return "paused";
  if (runtimeStatus === "running") return "running";
  return "stopped";
}

function mapServiceRecordToMicroservice(service: ServiceRecord): Microservice {
  return {
    id: service.metadata.id,
    name: service.metadata.displayName,
    description: service.metadata.description,
    language: service.metadata.language,

    status: mapUiStatus(
      service.metadata.status,
      service.container.status ?? service.metadata.runtimeStatus
    ),

    port: service.endpoint?.port ?? service.ports?.external ?? 0,
    internalPort: service.ports?.internal ?? 0,
    externalPort: service.ports?.external ?? 0,

    url: service.endpoint?.url ?? "",
    basePath: service.endpoint?.basePath ?? "",

    cpu: service.resources?.usage?.cpuPercent ?? 0,
    ram: service.resources?.usage?.memoryPercent ?? 0,

    createdAt: service.metadata.createdAt,
    updatedAt: service.metadata.updatedAt,

    backendStatus: service.metadata.status,
    runtimeStatus: service.container.status ?? service.metadata.runtimeStatus,
    containerName: service.container?.containerName ?? "",
    imageName: service.build?.imageName ?? service.container?.image?.name ?? "",
  };
}

function extractServiceFromMutationPayload(payload: unknown): ServiceRecord {
  const data = payload as Partial<StartStopServiceResponse["data"]> &
    Partial<CreateServiceResponse["data"]> &
    Partial<ServiceRecord>;

  if ("metadata" in (data as object) && "container" in (data as object)) {
    return data as ServiceRecord;
  }

  if (data.service) {
    return data.service;
  }

  throw new Error("La respuesta del backend no contiene un service válido");
}

// ---- API --------------------------------------------------

/**
 * GET /services
 * Retorna la lista de microservicios del backend.
 */
export async function fetchServices(): Promise<Microservice[]> {
  const res = await fetch(`${BASE_URL}/services`);
  ensureOk(res, "Error fetching services");

  const json: GetServicesResponse = await res.json();

  if (!json.ok) {
    throw new Error("Backend returned ok=false when fetching services");
  }

  return json.data.services.map(mapServiceRecordToMicroservice);
}

/**
 * GET /services/:id/source
 * Retorna la lista de microservicios del backend.
 */
export async function fetchServiceSource(id: string): Promise<{ sourceCode: string; language: ServicesLanguage }> {
  const res = await fetch(`${BASE_URL}/services/${id}/source`);
  ensureOk(res, "Error fetching service source");

  const json: ApiResponse<{ sourceCode: string; language: ServicesLanguage }> = await res.json();

  if (!json.ok) {
    throw new Error("Backend returned ok=false when fetching source");
  }

  return json.data;
}

/**
 * POST /services/:id/start
 * Arranca un microservicio detenido.
 */
export async function startService(name: string): Promise<Microservice> {
  const res = await fetch(`${BASE_URL}/services/${name}/start`, {
    method: "POST",
  });
  ensureOk(res, "Error starting service");

  const json = await res.json();

  // Soporta:
  // { ok, data: { service } }
  // o directamente { metadata, container, ... }
  const serviceRecord = json?.data
    ? extractServiceFromMutationPayload(json.data)
    : extractServiceFromMutationPayload(json);

  return mapServiceRecordToMicroservice(serviceRecord);
}

/**
 * POST /services/:id/stop
 * Detiene un microservicio activo.
 */
export async function invokeServiceRequest(
  id: string,
  payload: {
    method: "GET" | "POST";
    path?: string;
    query?: string;
    body?: string;
  },
): Promise<{ ok: boolean; data: unknown }> {
  const res = await fetch(`${BASE_URL}/services/${id}/invoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json() as { ok: boolean; data: unknown };
  return json;
}

/**
 * POST /services/:id/stop
 * Detiene un microservicio activo.
 */
export async function stopService(name: string): Promise<Microservice> {
  const res = await fetch(`${BASE_URL}/services/${name}/stop`, {
    method: "POST",
  });
  ensureOk(res, "Error stopping service");

  const json = await res.json();

  const serviceRecord = json?.data
    ? extractServiceFromMutationPayload(json.data)
    : extractServiceFromMutationPayload(json);

  return mapServiceRecordToMicroservice(serviceRecord);
}

/**
 * DELETE /services/:id
 * Elimina un microservicio.
 */
export async function deleteService(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/services/${id}/delete`, {
    method: "DELETE",
  });
  ensureOk(res, "Error deleting service");
}

/**
 * POST /services
 * Crea un nuevo microservicio.
 * Body: { name, port, code, language, memLimitMB, cpuCores, autoStart }
 */
export async function createService(
  payload: CreateServicePayload
): Promise<Microservice> {
  const res = await fetch(`${BASE_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // 1. Si la respuesta no es exitosa (2xx)
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    const errorMessage = errorData.message || `Error ${res.status}: Falló la creación`;

    throw new Error(errorMessage);
  }

  // Si llegamos aquí, la respuesta es 200-299
  const json = await res.json();
  console.log(json)
  console.log(json)

  const serviceRecord = json?.data?.service
    ? extractServiceFromMutationPayload(json.data)
    : extractServiceFromMutationPayload(json);

  return mapServiceRecordToMicroservice(serviceRecord);
}