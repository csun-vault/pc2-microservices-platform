import { ErrorTypes } from "@shared/queries.types";

export class HTTPError extends Error {
    public statusCode   : number;
    public type         : ErrorTypes;
    public details?     : unknown;

    constructor ( params : {
        message       : string,
        statusCode?   : number,
        type?         : ErrorTypes,
        details?      : unknown,
    }) {
        super(params.message);
        this.statusCode   = params.statusCode ?? 500;
        this.type         = params.type ?? "INTERNAL_ERROR"
        this.details      = params.details;
    }
}