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

const BASE_URL = "/api"; // ← cambia a tu URL real

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ============================================================
   Tipos exportados — contrato de datos del Home
   ============================================================ */

export type DockerStatus = "running" | "stopped" | "error";

export interface DockerEngineInfo {
  version:  string;
  status:   DockerStatus;
}

export interface ContainerSubState {
  /** Icono a usar del componente Icon */
  icon:  "on" | "off" | "errorIcon";
  /** Color del indicador */
  color: "green" | "yellow" | "red";
  /** Cantidad de contenedores en este estado */
  count: number;
  /** Etiqueta legible */
  label: string;
}

export interface ContainersStats {
  total:      number;
  subStates:  ContainerSubState[];
}

export interface DockerCounters {
  containers: ContainersStats;
  images:     number;
  templates:  number;
}

export interface MetricPoint {
  /** Timestamp en ms (Date.now()) */
  ts:    number;
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
  // ── Real ──────────────────────────────────────────────────
  // const res = await fetch(`${BASE_URL}/docker/engine`);
  // if (!res.ok) throw new Error("Error fetching docker engine");
  // return res.json(); // { version: string, status: DockerStatus }

  // ── Mock ──────────────────────────────────────────────────
  await delay(400);
  return { version: "24.0.7", status: "running" };
}

/* ============================================================
   API — Contadores Docker
   GET /api/docker/stats
   ============================================================ */
export async function fetchDockerCounters(): Promise<DockerCounters> {
  // ── Real ──────────────────────────────────────────────────
  // const res = await fetch(`${BASE_URL}/docker/stats`);
  // if (!res.ok) throw new Error("Error fetching docker counters");
  // return res.json();

  // ── Mock ──────────────────────────────────────────────────
  await delay(500);
  return {
    containers: {
      total: 6,
      subStates: [
        { icon: "on",        color: "green",  count: 3, label: "Running" },
        { icon: "off",       color: "yellow", count: 2, label: "Stopped" },
        { icon: "errorIcon", color: "red",    count: 1, label: "Error"   },
      ],
    },
    images:    6,
    templates: 2,
  };
}

/* ============================================================
   API — Snapshot de métricas (un punto nuevo)
   GET /api/metrics/snapshot
   ============================================================ */
export async function fetchMetricsSnapshot(): Promise<MetricsSnapshot> {
  // ── Real ──────────────────────────────────────────────────
  // const res = await fetch(`${BASE_URL}/metrics/snapshot`);
  // if (!res.ok) throw new Error("Error fetching metrics");
  // const data = await res.json(); // { cpu: number, ram: number }
  // return {
  //   cpu: { ts: Date.now(), value: data.cpu },
  //   ram: { ts: Date.now(), value: data.ram },
  // };

  // ── Mock ──────────────────────────────────────────────────
  seedHistory();
  await delay(200);
  const lastCpu = _cpuHistory[_cpuHistory.length - 1]?.value ?? 25;
  const lastRam = _ramHistory[_ramHistory.length - 1]?.value ?? 28;
  const cpu = generatePoint(lastCpu, 6);
  const ram = generatePoint(lastRam, 5);
  _cpuHistory = [..._cpuHistory.slice(-MAX_POINTS + 1), cpu];
  _ramHistory = [..._ramHistory.slice(-MAX_POINTS + 1), ram];
  return { cpu, ram };
}

/* ============================================================
   API — Historial completo de métricas (carga inicial)
   GET /api/metrics/history
   ============================================================ */
export async function fetchMetricsHistory(): Promise<{
  cpu: MetricPoint[];
  ram: MetricPoint[];
}> {
  // ── Real ──────────────────────────────────────────────────
  // const res = await fetch(`${BASE_URL}/metrics/history`);
  // if (!res.ok) throw new Error("Error fetching history");
  // return res.json(); // { cpu: MetricPoint[], ram: MetricPoint[] }

  // ── Mock ──────────────────────────────────────────────────
  seedHistory();
  await delay(300);
  return { cpu: [..._cpuHistory], ram: [..._ramHistory] };
}