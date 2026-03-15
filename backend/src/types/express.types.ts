import type { Request, Response, NextFunction } from "express";

export type Controller = (
    req   : Request,
    res   : Response,
) => Promise<void | Response> | void | Response;

export type Middleware = (
    req   : Request,
    res   : Response,
    next  : NextFunction
) => Promise<void | Response> | void | Response;
