import type { Controller } from "@type/express.types";
import { HTTPError } from "@modules/app/error.model";
import { validateCreateServiceBody } from "./microservices.schema";
import {
    createMicroservice,
    listMicroservices,
    getMicroserviceById,
    deleteMicroservice,
    startMicroservice,
    stopMicroservice,
    restartMicroservice,
    getMicroserviceSource,
} from "./microservices.service";

type IdParams = { id: string };

export const createService: Controller = async (req, res) => {
    const body = validateCreateServiceBody(req.body);
    const result = await createMicroservice(body);
    console.log(result)

    if (!result.ok) {
        if (result.reason === "NAME_ALREADY_EXISTS")
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: `Ya existe un microservicio con el nombre '${body.name}'`,});
        
        if (result.reason === "PORT_ALREADY_EXISTS")
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: `Ya existe un microservicio con el puerto '${result.externalPort}'`,});
    }
    
    return res.status(201).json({ ok: true, data: { service: result.rec } });
};

export const listServices: Controller = async (_req, res) => {
    const services = await listMicroservices();
    return res.json({ ok: true, data: { services } });
};

export const getServiceById: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const service = await getMicroserviceById(id);

    if (!service)
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'`});

    return res.json({ ok: true, data: { service } });
};

export const deleteService: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    console.log(id)
    const deleted = await deleteMicroservice(id);

    if (!deleted)
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe el microservicio con id '${id}'`});

    return res.json({ ok: true, message: `Microservicio '${id}' eliminado correctamente` });
};

export const startService: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const result = await startMicroservice(id);

    if (!result)
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'` });

    return res.json({ ok: true, data: result });
};

export const stopService: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const result = await stopMicroservice(id);

    if (!result)
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'`});

    return res.json({ ok: true, data: result });
};

export const restartService: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const result = await restartMicroservice(id);

    if (!result) 
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'`});

    return res.json({ ok: true, data: result });
};

export const getSourceCode: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const result = await getMicroserviceSource(id);

    if (!result) 
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'`});

    return res.json({ ok: true, data: result });
};

export const invokeService: Controller<IdParams> = async (req, res) => {
    const { id } = req.params;
    const service = await getMicroserviceById(id);
 
    if (!service)
        throw new HTTPError({ statusCode: 404, type: "NOT_FOUND", message: `No existe un microservicio con id '${id}'` });
 
    const { method = "GET", path = "/", query, body } = req.body as {
        method: "GET" | "POST";
        path?:  string;
        query?: string;
        body?:  string;
    };
 
    const url = `http://localhost:${service.ports.external}${path}${query ? `?${query}` : ""}`;
 
    const upstream = await fetch(url, method === "POST"
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: body ?? "" }
        : { method: "GET" }
    );
 
    const contentType = upstream.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await upstream.json() : await upstream.text();
 
    return res.status(upstream.status).json({ ok: upstream.ok, data });
};