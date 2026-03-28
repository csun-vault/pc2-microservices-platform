
import { ServicesLanguage } from "@shared/domain.types";

export interface ContainerMetricUsage {
  containerId: string;
  containerName: string;
  cpu: number;
  ram: number;
  ts: number;
  status?: string;
}
export interface ContainersMetricsResponse {
  scope: "single" | "many" | "all";
  items: ContainerMetricUsage[];
  summary: {
    cpuAvg: number;
    ramAvg: number;
    containers: number;
  };
}

// Nombre del archivo según el lenguaje
export const SOURCE_FILENAME: Record<ServicesLanguage, string> = {
    node   : "index.js",
    python : "main.py",
};

export const DOCKERFILES: Record<ServicesLanguage, (port: number) => string> = {
    node: (port) => `
FROM node:20-alpine
WORKDIR /app
COPY index.js .
EXPOSE ${port}
CMD ["node", "index.js"]
`.trim(),

    python: (port) => `
FROM python:3.11-slim
WORKDIR /app
COPY main.py .
EXPOSE ${port}
CMD ["python", "main.py"]
`.trim(),
};
