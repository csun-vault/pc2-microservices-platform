import * as path from "path";
import * as fs from "fs/promises";
import { SOURCE_FILENAME } from "@libs/docker/docker.constants";
import { ServicesLanguage } from "@shared/domain.types";

function getMicroserviceDir(id: string) {
    return path.join(process.cwd(), "microservices", id);
}

export async function createMicroserviceDirectory(params: {
    id          : string;
    language    : ServicesLanguage;
    sourceCode  : string;
    port        : number;
    createdAt   : string;
}) {
    const { id, language, sourceCode, port, createdAt } = params;

    // Crear carpeta del microservicio, se guarda codigo y metadata (confirmar)
    const serviceDir = getMicroserviceDir(id);
    await fs.mkdir(serviceDir, { recursive: true });

    await fs.writeFile(path.join(serviceDir, SOURCE_FILENAME[language]), sourceCode, "utf-8");

    await fs.writeFile(
        path.join(serviceDir, "service.json"),
        JSON.stringify({ id, language, port, createdAt }, null, 2),
        "utf-8"
    );
}

export async function removeMicroserviceDirectory(id: string) {
    const serviceDir = getMicroserviceDir(id);
    await fs.rm(serviceDir, { recursive: true, force: true });
}


export async function getMicroserviceSourceCode(id: string) {
    const servicePath = getMicroserviceDir(id);

    try {
        const configRaw = await fs.readFile(path.join(servicePath, "service.json"), "utf-8");
        const config = JSON.parse(configRaw);

        // 3. Determinamos el nombre del archivo según el lenguaje
        const fileName = config.language === "node" ? "index.js" : "app.py";
        
        // 4. Leemos el código fuente
        const sourceCode = await fs.readFile(path.join(servicePath, fileName), "utf-8");

        return {
            ...config,
            sourceCode
        };
    } catch (error) {
        console.error("Error al leer el código:", error);
        throw new Error("No se pudo encontrar el código fuente del servicio");
    }
}