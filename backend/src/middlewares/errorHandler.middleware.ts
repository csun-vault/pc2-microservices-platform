import type { Request, Response, NextFunction } from "express";
import { HTTPError } from "../modules/app/error.model";

export function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
    console.error("🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥 GLOBAL ERROR HANDLER 🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥🟥")
    console.error("REQ:", req.method, req.originalUrl)

    // Es error HTTP?
    if (err instanceof HTTPError) {
        console.error("HTTPError:", {
            type          : err.type,
            statusCode    : err.statusCode,
            message       : err.message,
            details       : err.details ?? null,
        });
        console.error(err.stack);

        return res.status(err.statusCode).json({
            ok            : false,
            type          : err.type,
            statusCode    : err.statusCode,
            message       : err.message,
            details       : err.details ?? null,
        });
    }

    // Procedencia desconocida
    console.error(`Unhandled: ${err?.name ?? "Error"}: ${err?.message ?? String(err)}, ${err}`);

    return res.status(500).json({
        ok            : false,
        type          : "INTERNAL_ERROR",
        statusCode    : 500,
        message       : "Error interno del servidor",
    });
}
