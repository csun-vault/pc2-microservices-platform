import { RuntimeStatus } from "@shared/domain.types";

export function isPortAllocatedError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);

  return (
    message.includes("port is already allocated") ||
    message.includes("address already in use") ||
    message.includes("Bind for 0.0.0.0")
  );
}

export function calculateCpuPercent(stats: any): number {
  const cpuDelta =
    (stats.cpu_stats?.cpu_usage?.total_usage ?? 0) -
    (stats.precpu_stats?.cpu_usage?.total_usage ?? 0);

  const systemDelta =
    (stats.cpu_stats?.system_cpu_usage ?? 0) -
    (stats.precpu_stats?.system_cpu_usage ?? 0);

  const onlineCpus =
    stats.cpu_stats?.online_cpus ||
    stats.cpu_stats?.cpu_usage?.percpu_usage?.length ||
    1;

  if (cpuDelta <= 0 || systemDelta <= 0) return 0;

  return (cpuDelta / systemDelta) * onlineCpus * 100;
}

export function calculateRAMPercent(stats: any): number {
  const usage = stats.memory_stats?.usage ?? 0;
  const limit = stats.memory_stats?.limit ?? 1;

  const cache =
    stats.memory_stats?.stats?.total_inactive_file ??
    stats.memory_stats?.stats?.cache ??
    0;

  const used = Math.max(usage - cache, 0);

  return (used / limit) * 100;
}

export type ContainerLogsOptions = {
  tail?: number;
  timestamps?: boolean;
};

export type ContainerLogsResponse = {
  containerId: string;
  containerName: string;
  status: RuntimeStatus;
  tail: number;
  timestamps: boolean;
  content: string;
};

export function mapDockerStateToRuntimeStatus(state?: string): RuntimeStatus {
  if (state === "running") return "running";
  if (state === "restarting") return "restarting";
  return "stopped";
}

export async function readTextStream(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];

  return await new Promise<string>((resolve, reject) => {
    stream.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });

    stream.on("error", reject);
  });
}
