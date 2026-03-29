import { HTTPError } from "@modules/app/error.model";
import type { ServicesLanguage } from "@shared/domain.types";

export type CreateServiceBody = {
    name: string;
    description: string;
    language: ServicesLanguage;
    sourceCode: string;
    internalPort?: number | null;
    externalPort?: number | null;
};

const SUPPORTED_LANGUAGES: ServicesLanguage[] = ["node", "python"];

function normalizePort(value: unknown, fieldName: string): number | null {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: `El campo '${fieldName}' debe ser un número entero positivo o null`,
        });
    }

    return value;
}

export function validateCreateServiceBody(body: unknown): CreateServiceBody {
    if (!body || typeof body !== "object") {
        throw new HTTPError({
            statusCode: 400,
            type: "BAD_REQUEST",
            message: "El body no puede estar vacío",
        });
    }

    const {
        name,
        description,
        language,
        sourceCode,
        internalPort,
        externalPort,
    } = body as Record<string, unknown>;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "El campo 'name' es requerido como texto",
        });
    }

    if (!/^[a-zA-Z0-9-]+$/.test(name.trim())) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message:
                "El campo 'name' solo puede contener letras, números y guiones (ej: mi-servicio)",
        });
    }

    if (typeof description !== "string" || description.trim().length === 0) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "El campo 'description' es requerido",
        });
    }

    if (!language || !SUPPORTED_LANGUAGES.includes(language as ServicesLanguage)) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: `El campo 'language' debe ser uno de: ${SUPPORTED_LANGUAGES.join(", ")}`,
        });
    }

    if (!sourceCode || typeof sourceCode !== "string" || sourceCode.trim().length === 0) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "El campo 'sourceCode' es requerido",
        });
    }

    const normalizedInternalPort = normalizePort(internalPort, "internalPort");
    const normalizedExternalPort = normalizePort(externalPort, "externalPort");

    return {
        name: name.trim(),
        description: description.trim(),
        language: language as ServicesLanguage,
        sourceCode: sourceCode.trim(),
        internalPort: normalizedInternalPort,
        externalPort: normalizedExternalPort,
    };
}