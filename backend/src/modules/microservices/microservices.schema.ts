import { HTTPError } from "@modules/app/error.model";
import type { ServicesLanguage } from "@shared/domain.types";

export type CreateServiceBody = {
    name        : string;
    description : string;
    language    : ServicesLanguage;
    sourceCode  : string;
    port        : number;
};

const SUPPORTED_LANGUAGES: ServicesLanguage[] = ["node", "python"];

export function validateCreateServiceBody(body: unknown): CreateServiceBody {
    if (!body || typeof body !== "object")
        throw new HTTPError({ statusCode: 400, type: "BAD_REQUEST", message: "El body no puede estar vacío" });

    const { name, description, language, sourceCode, port } = body as Record<string, unknown>;

    // Para el nombre, validaciones del contenido
    if (!name || typeof name !== "string" || name.trim().length === 0)
        throw new HTTPError({ statusCode: 400, type: "VALIDATION_ERROR", message: "El campo 'name' es requerido como texto" });

    if (!/^[a-zA-Z0-9-]+$/.test(name.trim()))
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "El campo 'name' solo puede contener letras, números y guiones (ej: mi-servicio)",
        });

    // Descripción no vacía
    if (!description || typeof description !== "string" || description.trim().length === 0)
        throw new HTTPError({ statusCode: 400, type: "VALIDATION_ERROR", message: "El campo 'description' es requerido" });
    
        // Lenguage escogido ?
    if (!language || !SUPPORTED_LANGUAGES.includes(language as ServicesLanguage))
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: `El campo 'language' debe ser uno de: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });

    // Código fuente
    if (!sourceCode || typeof sourceCode !== "string" || sourceCode.trim().length === 0)
        throw new HTTPError({ statusCode: 400, type: "VALIDATION_ERROR", message: "El campo 'sourceCode' es requerido" });

    // Puerto
    const parsedPort = Number(port);
    if (!port || isNaN(parsedPort) || parsedPort < 1024 || parsedPort > 65535)
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "El campo 'port' no es válido",
        });

    return {
        name        : name.trim(),
        description : description.trim(),
        language    : language as ServicesLanguage,
        sourceCode  : sourceCode.trim(),
        port        : parsedPort,
    };
}