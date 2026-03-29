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

export type LogsQuery = {
    tail?: number;
    timestamps?: boolean;
};

export function validateLogsQuery(query: unknown): LogsQuery {
    if (!query || typeof query !== "object") {
        return {
            tail: 200,
            timestamps: true,
        };
    }

    const { tail, timestamps } = query as Record<string, unknown>;

    let parsedTail = 200;
    let parsedTimestamps = true;

    if (tail !== undefined) {
        if (typeof tail !== "string" || !/^\d+$/.test(tail)) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'tail' debe ser un entero positivo",
            });
        }

        const numericTail = Number(tail);

        if (!Number.isInteger(numericTail) || numericTail < 1 || numericTail > 5000) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'tail' debe estar entre 1 y 5000",
            });
        }

        parsedTail = numericTail;
    }

    if (timestamps !== undefined) {
        if (typeof timestamps !== "string" || !["true", "false", "1", "0"].includes(timestamps)) {
            throw new HTTPError({
                statusCode: 400,
                type: "VALIDATION_ERROR",
                message: "El query param 'timestamps' debe ser 'true', 'false', '1' o '0'",
            });
        }

        parsedTimestamps = timestamps === "true" || timestamps === "1";
    }

    return {
        tail: parsedTail,
        timestamps: parsedTimestamps,
    };
}