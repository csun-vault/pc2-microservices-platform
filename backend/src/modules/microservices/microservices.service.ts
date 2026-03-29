import * as registry from "@libs/registry/registry.service";
import * as dockerService from "@libs/docker/docker.service";
import type { ServiceRecord } from "@shared/domain.types";

import * as helper from "./microservices.helpers"
import { newRecord } from "./microservices.constants";
import type { CreateServiceBody } from "./microservices.schema";
import { createMicroserviceDirectory, getMicroserviceSourceCode, removeMicroserviceDirectory } from "./microservices.files";
import { getFirstAvailablePort } from "./microservices.helpers";
import { DEFAULT_PORT_START } from "./microservices.constants";

export async function createMicroservice(
    body: CreateServiceBody
): Promise<{ reason?: string; rec?: ServiceRecord; ok: boolean; internalPort?: number; externalPort?:number }> {
    let {
        name,
        language,
        sourceCode,
        internalPort,
        externalPort,
        description,
    } = body;

    const exists = await helper.microserviceExists(name);
    if (exists) return { ok: false, reason: "NAME_ALREADY_EXISTS" };

    const resolvedInternalPort = internalPort ?? DEFAULT_PORT_START;
    const resolvedExternalPort = externalPort ?? (await getFirstAvailablePort());

    const id = name;
    const imageName = `ms-${id}:latest`;
    const containerName = `ms-${id}`;
    const now = new Date().toISOString();

    const record = newRecord({
        id,
        name,
        language,
        now,
        containerName,
        imageName,
        internalPort: resolvedInternalPort,
        externalPort: resolvedExternalPort,
        description,
    });

    try {
        await createMicroserviceDirectory({
            id,
            language,
            sourceCode,
            port: resolvedInternalPort,
            createdAt: now,
        });

        const containerId = await helper.buildAndStartMicroservice({
            id,
            language,
            sourceCode,
            internalPort: resolvedInternalPort,
            externalPort: resolvedExternalPort,
            imageName,
            containerName,
        });

        const updatedRecord = await helper.markMicroserviceAsUp({
            id,
            record,
            containerId,
            containerName,
            imageName,
        });

        await registry.appendService(updatedRecord);

        return { ok: true, rec: updatedRecord };
    } catch (err) {
        console.error("❌ EXPLOTÓ CREATING SERVICE:", err);
        await dockerService.stopAndRemoveContainer(containerName).catch(() => { });
        await dockerService.removeImage(imageName).catch(() => { });
        await removeMicroserviceDirectory(id).catch(() => { });

        const message = err instanceof Error ? err.message : String(err);

        if (message.startsWith("PORT_ALREADY_EXISTS:")) {
            const parsedPort = Number(message.split(":")[1]);
            return {
                ok: false,
                reason: "PORT_ALREADY_EXISTS",
                externalPort: Number.isFinite(parsedPort) ? parsedPort : resolvedExternalPort,
                internalPort: Number.isFinite(parsedPort) ? parsedPort : resolvedExternalPort,
            };
        }

        return { ok: false, reason: "CREATE_FAILED" };
    }
}

export async function listMicroservices() {
    const services = await registry.getAllServices();

    // Llamada a Docker para la lista de contenedores
    const containers = await dockerService.getContainerList();

    return services.map((service) => {
        const match = containers.find(
            (c) => c.containerName === service.container.containerName
        );

        const runtimeStatus = match?.status ?? "stopped"; // Caso donde no esté en la lista de contenedores
        const status = runtimeStatus === "running" ? "UP"
            : !match ? "ERROR"
                : "DOWN";

        return {
            ...service,
            metadata: { ...service.metadata, runtimeStatus, status },
        };
    });
}

export async function getMicroserviceById(id: string) {
    const service = await registry.findServiceById(id);

    if (!service) return null;

    const containers = await dockerService.getContainerList();
    const match = containers.find((c) => c.containerName === service.container.containerName);

    const runtimeStatus = match?.status ?? "stopped";
    const status = runtimeStatus === "running" ? "UP"
        : !match ? "ERROR"
            : "DOWN";

    return {
        ...service,
        metadata: { ...service.metadata, runtimeStatus, status },
    };
}

export async function deleteMicroservice(id: string): Promise<boolean | null> {
    const service = await registry.findServiceById(id);
    if (!service) return null;

    await dockerService.stopAndRemoveContainer(service.container.containerName);
    await dockerService.removeImage(service.build.imageName);

    // Elimina la carpeta del microservicio (confirmar)
    await removeMicroserviceDirectory(id);

    // Elimina del registry
    await registry.removeService(id);
    return true
}

export async function getMicroserviceSource(id:string) {
    const service = await registry.findServiceById(id);
    if (!service) return null;

    const source = await getMicroserviceSourceCode(id);
    return source
}

// Manejo de estado de los microservicios
export async function startMicroservice(id: string) {
    const service = await registry.findServiceById(id);
    if (!service) return null;

    await dockerService.startExistingContainer(service.container.containerName);

    const updatedRecord: ServiceRecord = {
        ...service,
        metadata: {
            ...service.metadata,
            status: "UP",
            runtimeStatus: "running",
            updatedAt: new Date().toISOString(),
        },
        container: {
            ...service.container,
            status: "running",
        },
    };

    await registry.updateService(id, updatedRecord);


    return { id, status: "UP", runtimeStatus: "running", service: updatedRecord };
}

export async function stopMicroservice(id: string) {
    const service = await registry.findServiceById(id);
    if (!service) return null;

    await dockerService.stopExistingContainer(service.container.containerName);

    const updatedRecord: ServiceRecord = {
        ...service,
        metadata: {
            ...service.metadata,
            status: "DOWN",
            runtimeStatus: "stopped",
            updatedAt: new Date().toISOString(),
        },
        container: {
            ...service.container,
            status: "stopped",
        },
    };

    await registry.updateService(id, updatedRecord);

    return { id, status: "DOWN", runtimeStatus: "stopped", service: updatedRecord };
}

export async function restartMicroservice(id: string) {
    const service = await registry.findServiceById(id);
    if (!service) return null;

    await dockerService.restartExistingContainer(service.container.containerName);

    const updatedRecord: ServiceRecord = {
        ...service,
        metadata: {
            ...service.metadata,
            status: "UP",
            runtimeStatus: "running",
            updatedAt: new Date().toISOString(),
        },
        container: {
            ...service.container,
            status: "running",
        },
    };

    await registry.updateService(id, updatedRecord);


    return { id, status: "UP", runtimeStatus: "running", service: updatedRecord };
}