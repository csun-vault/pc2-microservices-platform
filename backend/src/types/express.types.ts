import type { Request, Response, NextFunction, ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

export type Controller<
    P extends ParamsDictionary = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery extends ParsedQs = ParsedQs
> = (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
) => Promise<void | Response> | void | Response;

export type Middleware<
    P extends ParamsDictionary = ParamsDictionary,
    ResBody = any,
    ReqBody = any,
    ReqQuery extends ParsedQs = ParsedQs
> = (
    req: Request<P, ResBody, ReqBody, ReqQuery>,
    res: Response<ResBody>,
    next: NextFunction
) => Promise<void | Response> | void | Response;