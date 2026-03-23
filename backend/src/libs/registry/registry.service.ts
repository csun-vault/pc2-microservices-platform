import * as fs from "fs/promises";
import * as path from "path";
import type { ServicesRegistry } from "./registry.types";
import type { ServiceRecord } from "@shared/domain.types";

const REGISTRY_PATH = path.resolve(__dirname, "../services.registry.json");

export async function readRegistry(): Promise<ServicesRegistry> {
    try {
        const raw = await fs.readFile(REGISTRY_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        // Para poder inicializar si el archivo estaba vacío o sin la clave
        return parsed?.services ? parsed : { services: [] };
    } catch {
        return { services: [] };
    }
}

export async function writeRegistry(registry: ServicesRegistry): Promise<void> {
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
}

export async function appendService(record: ServiceRecord): Promise<void> {
    const registry = await readRegistry();
    registry.services.push(record);
    await writeRegistry(registry);
}

export async function updateService(
    id: string,
    patch: Partial<ServiceRecord>
): Promise<void> {
    const registry = await readRegistry();
    const index = registry.services.findIndex((s) => s.metadata.id === id);
    if (index === -1) return;
    registry.services[index] = {...registry.services[index], ...patch} as ServiceRecord;
    await writeRegistry(registry);
}

export async function findServiceById(id: string): Promise<ServiceRecord | null> {
    const registry = await readRegistry();
    return registry.services.find((s) => s.metadata.id === id) ?? null;
}