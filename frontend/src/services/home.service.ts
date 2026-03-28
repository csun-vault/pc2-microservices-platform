/* ============================================================
   home.service.ts
   Capa de datos del Home — mock listo para API real.

   PARA CONECTAR TU API:
   1. Define BASE_URL con tu endpoint base.
   2. En cada función, descomenta el bloque "── Real ──"
      y elimina el bloque "── Mock ──".
   3. Ajusta los campos del response si tu contrato difiere
      de los tipos definidos aquí.
   ============================================================ */

const BASE_URL = import.meta.env.VITE_BASE_URL // ← cambia a tu URL real
console.log(BASE_URL);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   Tipos exportados — contrato de datos del Home
   ============================================================ */

export type DockerStatus = "running" | "stopped" | "error";

export interface DockerEngineInfo {
  version: string;
  status: DockerStatus;
  os?: string;
}

export interface ContainerSubState {
  /** Cantidad de contenedores en este estado */
  count: number;
  /** Etiqueta legible */
  label: string;
}

export interface ContainersStats {
  total: number;
  subStates: ContainerSubState[];
}

export interface DockerCounters {
  containers: ContainersStats;
  images: number;
  templates: number;
}

export interface MetricPoint {
  /** Timestamp en ms (Date.now()) */
  ts: number;
  /** Valor porcentual 0–100 */
  value: number;
}

export interface MetricsSnapshot {
  cpu: MetricPoint;
  ram: MetricPoint;
}

/* ============================================================
   Mock internals
   ============================================================ */

let _cpuHistory: MetricPoint[] = [];
let _ramHistory: MetricPoint[] = [];
const MAX_POINTS = 30;

function generatePoint(prev: number, volatility = 8): MetricPoint {
  const delta = (Math.random() - 0.5) * volatility * 2;
  const value = Math.min(100, Math.max(2, prev + delta));
  return { ts: Date.now(), value: Math.round(value * 10) / 10 };
}

function seedHistory() {
  if (_cpuHistory.length > 0) return;
  let cpu = 25, ram = 28;
  const now = Date.now();
  for (let i = MAX_POINTS; i >= 0; i--) {
    const cpuPt = generatePoint(cpu, 6);
    const ramPt = generatePoint(ram, 5);
    _cpuHistory.push({ ts: now - i * 5000, value: cpuPt.value });
    _ramHistory.push({ ts: now - i * 5000, value: ramPt.value });
    cpu = cpuPt.value;
    ram = ramPt.value;
  }
}

/* ============================================================
   API — Docker Engine
   GET /api/docker/engine
   ============================================================ */
export async function fetchDockerEngine(): Promise<DockerEngineInfo> {
  const res = await fetch(`${BASE_URL}/docker/version`);
  if (!res.ok) throw new Error("Error fetching docker engine");
  const json = await res.json();
  return json.data.engine;
}

/* ============================================================
   API — Contadores Docker
   GET /api/docker/stats
   ============================================================ */
export async function fetchDockerCounters(): Promise<DockerCounters> {
  const res = await fetch(`${BASE_URL}/docker/summary`);
  if (!res.ok) throw new Error("Error fetching docker counters");
  const json = await res.json();
  return json.data.summary;
}

/* ============================================================
   API — Snapshot de métricas (un punto nuevo)
   GET /api/metrics/snapshot
   ============================================================ */
export async function fetchMetricsSnapshot(params?:{containerName?: string; containerNames?: string[]; onlyRunning?: boolean }): Promise<MetricsSnapshot> {
  const query = new URLSearchParams();

  if (params?.containerName)
    query.set("containerName", params.containerName);

  if (params?.containerNames?.length)
    query.set("containerNames", params.containerNames.join(","));

  if (params?.onlyRunning !== undefined)
    query.set("onlyRunning", String(params.onlyRunning));

  const qs = query.toString();
  const res = await fetch(`${BASE_URL}/docker/stats${qs ? `?${qs}` : ""}`);

  if (!res.ok)
    throw new Error("Error fetching metrics");

  const json = await res.json();
  const stats = json.data.stats;

  return {
    cpu: {
      ts: Date.now(),
      value: stats.summary.cpuAvg,
    },
    ram: {
      ts: Date.now(),
      value: stats.summary.ramAvg,
    },
  };
}

/* ============================================================
   API — Historial completo de métricas (carga inicial)
   GET /api/metrics/history
   ============================================================ */
export async function fetchMetricsHistory(): Promise<{
  cpu: MetricPoint[];
  ram: MetricPoint[];
}> {
  // ── Mock ──────────────────────────────────────────────────
  seedHistory();
  await delay(300);
  return { cpu: [{ts:Date.now(), value:0}], ram: [{ts:Date.now(), value:0}] };
}