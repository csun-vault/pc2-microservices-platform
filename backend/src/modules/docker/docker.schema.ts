import { HTTPError } from "@modules/app/error.model";

export type StatsQuery = {
    containerName?: string | undefined;
    containerNames?: string[] | undefined;
    onlyRunning?: boolean | undefined;
};

export function validateStatsQuery(query: unknown): StatsQuery {
    if (!query || typeof query !== "object") {
        return {};
    }

    const { containerName, containerNames, onlyRunning } = query as Record<string, unknown>;

    let parsedContainerName: string | undefined;
    let parsedContainerNames: string[] | undefined;
    let parsedOnlyRunning: boolean | undefined;

    if (containerName !== undefined) {
        if (typeof containerName !== "string" || containerName.trim().length === 0) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'containerName' debe ser un texto no vacío",
            });
        }

        parsedContainerName = containerName.trim();
    }

    if (containerNames !== undefined) {
        if (typeof containerNames !== "string") {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'containerNames' debe ser un string separado por comas",
            });
        }

        const names = containerNames
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);

        if (names.length === 0) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'containerNames' debe incluir al menos un nombre válido",
            });
        }

        parsedContainerNames = names;
    }

    if (parsedContainerName && parsedContainerNames) {
        throw new HTTPError({
            statusCode: 400,
            type: "VALIDATION_ERROR",
            message: "Debes enviar 'containerName' o 'containerNames', no ambos",
        });
    }

    if (onlyRunning !== undefined) {
        if (typeof onlyRunning !== "string") {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'onlyRunning' debe ser 'true', 'false', '1' o '0'",
            });
        }

        if (!["true", "false", "1", "0"].includes(onlyRunning)) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'onlyRunning' debe ser 'true', 'false', '1' o '0'",
            });
        }

        parsedOnlyRunning = onlyRunning === "true" || onlyRunning === "1";
    }

    return {
        containerName: parsedContainerName,
        containerNames: parsedContainerNames,
        onlyRunning: parsedOnlyRunning,
    };
}