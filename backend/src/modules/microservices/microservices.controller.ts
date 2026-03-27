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
} from "./microservices.service";

type IdParams = { id: string };

export const createService: Controller = async (req, res) => {
    const body = validateCreateServiceBody(req.body);
    const result = await createMicroservice(body);

    if (!result.ok) {
        if (result.reason === "NAME_ALREADY_EXISTS")
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: `Ya existe un microservicio con el nombre '${body.name}'`,});
        
        if (result.reason === "PORT_ALREADY_EXISTS")
            throw new HTTPError({ statusCode: 409, type: "CONFLICT", message: `Ya existe un microservicio con el puerto '${result.port}'`,});
    
    }
    
    return res.status(201).json({ ok: true, data: { service: result.rec} });
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