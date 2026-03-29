import { getDocker } from "./docker.client";
import type { ServiceContainerRef, ContainerMetricUsage, ContainersMetricsResponse, RuntimeStatus } from "@shared/domain.types"

import * as df from "./docker.files"
import type { ServicesLanguage } from "@shared/domain.types";
import { calculateCpuPercent, calculateRAMPercent, ContainerLogsOptions, ContainerLogsResponse, isPortAllocatedError, mapDockerStateToRuntimeStatus, readTextStream } from "./docker.helper";
import { get } from "http";
import { StatsQuery } from "@modules/docker/docker.schema";
import { PassThrough } from "stream";

/*
    ==================================
               SOBRE DAEMON 
    ==================================
*/
export async function getDockerVersion() {
    const docker = getDocker();
    const version = await docker.version();

    return {
        status: version ? "running" : "down",
        version: version.Version,
        os: version.Os
    };
}

//  Probando construir la imagen Docker desde el sourceCode en memoria
export async function buildImageFromSource(params: { serviceId: string; language: ServicesLanguage; sourceCode: string; internalPort: number; imageName: string; }): Promise<void> {
    const docker = getDocker();
    const { imageName } = params;

    const { buildDir, src } = await df.createBuildContext(params);

    const stream = await docker.buildImage({ context: buildDir, src }, { t: imageName });

    // Espera aquí hasta que Docker termine de construir la imagen. Si falla, lanza error
    await new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(
            stream,
            (err, res) => {
                if (err) return reject(err);

                const hasError = res?.some(item => item.errorDetail);
                if (hasError) {
                    const errorMsg = res.find(item => item.errorDetail)?.error || "Docker Build Error";
                    return reject(new Error(errorMsg));
                }
                resolve();
            },
            (event) => {
                // Opcional: ver el progreso en tu consola del backend
                if (event.stream) console.log("Docker:", event.stream.trim());
            }
        );
    });

    // Limpiar archivos temporales
    await df.removeBuildContext(buildDir);
}

/*
    ==================================
            SOBRE CONTENEDORES 
    ==================================
*/
//  ( docker info containerName ) Tomar la info de un contenedor
async function getContainerInfo(containerName: string) {
    const docker = getDocker();
    const container = docker.getContainer(containerName);
    const info = await container.inspect();

    return { container, info };
}


async function normalizeDockerLogs(
    raw: NodeJS.ReadableStream | Buffer,
    tty: boolean
): Promise<string> {
    const docker = getDocker();

    if (Buffer.isBuffer(raw)) {
        return raw.toString("utf8").trim();
    }

    if (tty) {
        return (await readTextStream(raw)).trim();
    }

    const stdout = new PassThrough();
    const stderr = new PassThrough();

    const stdoutPromise = readTextStream(stdout);
    const stderrPromise = readTextStream(stderr);

    raw.on("end", () => {
        stdout.end();
        stderr.end();
    });

    raw.on("error", (err) => {
        stdout.destroy(err as Error);
        stderr.destroy(err as Error);
    });

    docker.modem.demuxStream(raw as any, stdout, stderr);

    const [out, err] = await Promise.all([stdoutPromise, stderrPromise]);

    return [out, err].filter(Boolean).join("\n").trim();
}

export async function getContainerLogs(
    containerName: string,
    options: ContainerLogsOptions = {}
): Promise<ContainerLogsResponse | null> {
    const { container, info } = await getContainerInfo(containerName);

    if (!info) return null;

    const tail = options.tail ?? 200;
    const timestamps = options.timestamps ?? true;

    const rawLogs = await container.logs({
        stdout: true,
        stderr: true,
        follow: false as const,
        timestamps,
        tail,
    });

    const content = rawLogs.toString("utf8").trim();

    return {
        containerId: info.Id,
        containerName,
        status: mapDockerStateToRuntimeStatus(info.State?.Status),
        tail,
        timestamps,
        content,
    };
}

async function getOneContainerMetrics(containerRef: { containerId: string; containerName: string; status?: RuntimeStatus }): Promise<ContainerMetricUsage | null> {
    const docker = getDocker();
    const container = docker.getContainer(containerRef.containerId);
    try {
        const stats = await container.stats({ stream: false });

        return {
            containerId: containerRef.containerId,
            containerName: containerRef.containerName,
            status: containerRef.status || "stopped",
            cpu: Number(calculateCpuPercent(stats).toFixed(1)),
            ram: Number(calculateRAMPercent(stats).toFixed(1)),
            ts: Date.now(),
        };
    } catch (error) {

        return {
            containerId: containerRef.containerId,
            containerName: containerRef.containerName,
            status: containerRef.status || "stopped",
            cpu: 0,
            ram: 0,
            ts: Date.now(),
        };
    }
}

export async function getContainersMetricsSnapshot({ containerName, containerNames, onlyRunning }: StatsQuery): Promise<ContainersMetricsResponse> {
    const allContainers = await getContainerList();

    let selected = allContainers;

    if (onlyRunning) {
        selected = selected.filter((c) => c.status === "running");
    }

    if (containerName) {
        selected = selected.filter((c) => c.containerName === containerName);

    } else if (containerNames?.length) {
        const namesSet = new Set(containerNames);
        selected = selected.filter((c) => namesSet.has(c.containerName));
    }

    const itemsRaw = await Promise.all(
        selected.map((container) =>
            getOneContainerMetrics({
                containerId: container.containerId,
                containerName: container.containerName,
                status: container.status,
            })
        )
    );

    const items = itemsRaw.filter((x): x is ContainerMetricUsage => x !== null);

    const cpuAvg = items.length > 0 ? Number((items.reduce((acc, item) => acc + item.cpu, 0) / items.length).toFixed(1)) : 0;
    const ramAvg = items.length > 0 ? Number((items.reduce((acc, item) => acc + item.ram, 0) / items.length).toFixed(1)) : 0;

    const scope: "single" | "many" | "all" = containerName ? "single" : containerNames?.length ? "many" : "all";

    return {
        scope,
        items,
        summary: {
            cpuAvg,
            ramAvg,
            containers: items.length,
        },
    };
}

//  ( docker ps -a ) Listar todos los contenedores
export async function getContainerList() {
    const docker = getDocker();

    const containers = await docker.listContainers({ all: true });

    const containerRefs: ServiceContainerRef[] = containers.map((container) => ({
        status:
            container.Status.startsWith("Up") ? "running"
                : container.Status.startsWith("Exited") ? "stopped"
                    : "restarting",

        containerId: container.Id,
        containerName: container.Names?.[0]?.replace(/^\//, "") ?? "",
        image: {
            id: container.ImageID,
            name: container.Image
        }
    }));

    return containerRefs
}

export async function getDockerSummary() {
    const containers = await getContainerList();

    const summary = containers.reduce(
        (acc, cc) => {
            if (cc.status === "running") {
                acc.running++;
            } else if (cc.status === "stopped") {
                acc.stopped++;
            } else {
                acc.error++;
            }

            if (cc.image?.name) {
                acc.imageSet.add(cc.image.name);
            }

            return acc;
        },

        {
            running: 0,
            stopped: 0,
            error: 0,
            imageSet: new Set<string>()
        }
    );

    return {
        containers: {

            total: containers.length,
            subStates: [
                { label: "Running", count: summary.running },
                { label: "Stopped", count: summary.stopped },
                { label: "Error", count: summary.error },
            ],
        },

        images: summary.imageSet.size,
        templates: summary.imageSet.size
    };
}

//  ( docker run/start containerName ) Start un contenedor
export async function createAndStartContainer(params: { imageName: string; containerName: string; internalPort: number; externalPort: number; }): Promise<string> {
    const docker = getDocker();
    const { imageName, containerName, internalPort, externalPort } = params;

    let container = docker.getContainer(containerName);

    const info = await container.inspect().catch((err: any) => {
        if (err?.statusCode === 404) return null;
        throw err;
    });

    if (!info) {
        container = await docker.createContainer({
            Image: imageName,
            name: containerName,
            ExposedPorts: {
                [`${internalPort}/tcp`]: {},
            },
            HostConfig: {
                PortBindings: {
                    [`${internalPort}/tcp`]: [{ HostPort: String(externalPort) }],
                },
            },
        });

        try {
            await container.start();
        } catch (err) {
            if (isPortAllocatedError(err))
                throw new Error(`PORT_ALREADY_ALLOCATED:${externalPort}`);
        }

        return container.id;
    }

    if (!info.State.Running) {
        try {
            await container.start();
        } catch (err) {
            if (isPortAllocatedError(err))
                throw new Error(`PORT_ALREADY_ALLOCATED:${externalPort}`);
        }
    }

    return container.id;
}

//  ( docker remove containerName ) Apagar y borrar contenedor por nombre
export async function stopAndRemoveContainer(containerName: string): Promise<void> {
    const { container, info } = await getContainerInfo(containerName);

    // Si no hay información, retornar nada
    if (!info) return;

    // Solo si está corriendo apagar
    if (info.State.Running) {
        await container.stop();
    }

    // Borrar al final
    await container.remove();
}

// 
export async function removeImage(imageName: string): Promise<void> {
    const docker = getDocker();
    const image = docker.getImage(imageName);

    await image.remove({ force: true }).catch((err: any) => {
        if (err?.statusCode === 404) return;
        throw err;
    });
}

// Para los endpoints de start, stop y restart
export async function startExistingContainer(containerName: string): Promise<"started" | "already_running" | "not_found"> {
    const { container, info } = await getContainerInfo(containerName);

    if (!info) return "not_found";
    if (info.State.Running) return "already_running";

    await container.start();
    return "started";
}

export async function stopExistingContainer(containerName: string): Promise<string> {
    const { container, info } = await getContainerInfo(containerName);

    if (!info) return "not_found";
    if (!info.State.Running) return "already_stopped";

    await container.stop();
    return "stopped";
}

export async function restartExistingContainer(containerName: string): Promise<string> {
    const { container, info } = await getContainerInfo(containerName);

    if (!info) return 'not_found';

    await container.restart();
    return container.id;
}