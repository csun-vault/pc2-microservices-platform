import * as reg from "@libs/registry/registry.service"
import * as ds from "@libs/docker/docker.service"
import { CreateServiceBody } from "./microservices.schema";
import { ServiceRecord } from "@shared/domain.types";
import { DEFAULT_PORT_END, DEFAULT_PORT_START } from "./microservices.constants";

export async function microserviceExists(id: string): Promise<boolean> {
    const existing = await reg.readRegistry();
    return existing.services.some((service) => service.metadata.id === id);
}

export async function buildAndStartMicroservice(params: {id: string; language: CreateServiceBody["language"]; sourceCode: string; internalPort: number; externalPort: number; imageName: string; containerName: string; }): Promise<string> {
    const { id, language, sourceCode, internalPort, externalPort, imageName, containerName } = params;

    await ds.buildImageFromSource({ serviceId: id, language, sourceCode, internalPort, imageName });
    const containerId = await ds.createAndStartContainer({ imageName,containerName, internalPort, externalPort});

    return containerId;
}

export async function markMicroserviceAsUp(params: { id: string; record: ServiceRecord; containerId: string; containerName: string; imageName: string }): Promise<ServiceRecord> {
    const { id, record, containerId, containerName, imageName } = params;

    const updatedAt = new Date().toISOString();

    const updated: Partial<ServiceRecord> = {
        metadata: {
            ...record.metadata,
            status: "UP",
            runtimeStatus: "running",
            updatedAt,
        },
        container: {
            status: "running",
            containerId,
            containerName,
            image: {
                id: containerId,
                name: imageName,
            },
        },
    };

    await reg.updateService(id, updated);

    return {
        ...record,
        ...updated,
    };
}

export async function markMicroserviceAsError(id: string, record: ServiceRecord): Promise<void> {
    await reg.updateService(id, {
        metadata: {
            ...record.metadata,
            status: "ERROR",
            updatedAt: new Date().toISOString(),
        },
    });
}
export async function getUsedPorts(): Promise<Set<number>> {
  const services = await reg.getAllServices();

  return new Set(
    services
      .map((s) => s.ports?.external)
      .filter((p): p is number => typeof p === "number")
  );
}

export async function getFirstAvailablePort(
  start = DEFAULT_PORT_START,
  end = DEFAULT_PORT_END
): Promise<number> {
  const usedPorts = await getUsedPorts();

  for (let port = start; port <= end; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error("NO_AVAILABLE_PORTS");
}