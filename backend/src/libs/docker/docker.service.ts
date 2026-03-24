import { getDocker } from "./docker.client";
import type { ServiceContainerRef } from "@shared/domain.types"

import * as path from "path";
import * as fs from "fs/promises";
import type { ServicesLanguage } from "@shared/domain.types";
import { HTTPError } from "@modules/app/error.model";

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


/*
    ==================================
            SOBRE CONTENEDORES 
    ==================================
*/
//  ( docker ps -a ) Listar todos los contenedores
export async function getContainerList () {
    const docker = getDocker();

    const containers = await docker.listContainers({ all: true });
    
    const containerRefs : ServiceContainerRef[] = containers.map((container) => ({
        status: 
            container.Status.startsWith("Up") ? "running" 
            : container.Status.startsWith("Exited") ? "stopped" 
            : "restarting",
        
        containerId: container.Id,
        containerName: container.Names?.[0]?.replace(/^\//, "") ?? "",
        image: {
            id : container.ImageID,
            name: container.Image
        }
    })); 
    
    return containerRefs
}

const DOCKERFILES: Record<ServicesLanguage, (port: number) => string> = {
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

// Nombre del archivo según el lenguaje
export const SOURCE_FILENAME: Record<ServicesLanguage, string> = {
    node   : "index.js",
    python : "main.py",
};

//  Probando construir la imagen Docker desde el sourceCode en memoria
export async function buildImageFromSource(params: {
    serviceId  : string;
    language   : ServicesLanguage;
    sourceCode : string;
    port       : number;
    imageName  : string;
}): Promise<void> {
    const docker = getDocker();
    const { serviceId, language, sourceCode, port, imageName } = params;

    // Directorio temporal para el build
    const buildDir = path.join("/tmp", `ms-build-${serviceId}`);
    await fs.mkdir(buildDir, { recursive: true });

    // Ambos Dockerfile y sourceCode en el directorio temporal y se construye la img
    await fs.writeFile(path.join(buildDir, "Dockerfile"), DOCKERFILES[language](port), "utf-8");
    await fs.writeFile(path.join(buildDir, SOURCE_FILENAME[language]), sourceCode, "utf-8");
    
    const stream = await docker.buildImage(
        { context: buildDir, src: ["Dockerfile", SOURCE_FILENAME[language]] },
        { t: imageName }
    );

    await new Promise<void>((resolve, reject) => {
        docker.modem.followProgress(stream, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    // Limpiar archivos temporales
    await fs.rm(buildDir, { recursive: true, force: true });
}


export async function startContainer(params: {
    imageName     : string;
    containerName : string;
    internalPort  : number;
    externalPort  : number;
}): Promise<string> {
    const docker = getDocker();
    const { imageName, containerName, internalPort, externalPort } = params;

    const container = await docker.createContainer({
        Image      : imageName,
        name       : containerName,
        ExposedPorts: { [`${internalPort}/tcp`]: {} },
        HostConfig : {
            PortBindings: {
                [`${internalPort}/tcp`]: [{ HostPort: String(externalPort) }],
            },
        },
    });

    await container.start();
    return container.id;
}

// Acciones sobre contenedores

// Para el endpoint de eliminar el microservicio
export async function stopAndRemoveContainer(containerName: string): Promise<void> {
    const docker = getDocker();

    try {
        const container = docker.getContainer(containerName);
        const info = await container.inspect();

        if (info.State.Running) { // Solo si está corriendo, detiene
            await container.stop();
        }

        await container.remove();
    } catch (err: any) {
        if (err?.statusCode === 404) return; // Si no existe
        throw err;
    }
}

export async function removeImage(imageName: string): Promise<void> {
    const docker = getDocker();

    try {
        const image = docker.getImage(imageName);
        await image.remove({ force: true });
    } catch (err: any) {
        if (err?.statusCode === 404) return;
        throw err;
    }
}

// Para los endpoints de start, stop y restart
export async function startExistingContainer(containerName: string): Promise<void> {
    const docker = getDocker();
    try {
        const container = docker.getContainer(containerName);
        const info = await container.inspect();

        if (info.State.Running)
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: "El contenedor ya está corriendo" });

        await container.start();
    } catch (err: any) {
        if (err instanceof HTTPError) throw err;
        if (err?.statusCode === 404)
            throw new HTTPError({ statusCode: 404, type: "NOT_FOUND", message: "El contenedor no existe en Docker" });
        throw err;
    }
}

export async function stopExistingContainer(containerName: string): Promise<void> {
    const docker = getDocker();
    try {
        const container = docker.getContainer(containerName);
        const info = await container.inspect();

        if (!info.State.Running)
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: "El contenedor ya está detenido" });

        await container.stop();
    } catch (err: any) {
        if (err instanceof HTTPError) throw err;
        if (err?.statusCode === 404)
            throw new HTTPError({ statusCode: 404, type: "NOT_FOUND", message: "El contenedor no existe en Docker" });
        throw err;
    }
}

export async function restartExistingContainer(containerName: string): Promise<void> {
    const docker = getDocker();
    try {
        const container = docker.getContainer(containerName);
        await container.restart();
    } catch (err: any) {
        if (err?.statusCode === 404)
            throw new HTTPError({ statusCode: 404, type: "NOT_FOUND", message: "El contenedor no existe en Docker" });
        throw err;
    }
}