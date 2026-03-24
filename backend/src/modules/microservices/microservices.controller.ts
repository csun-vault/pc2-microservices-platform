import type { Controller } from "@type/express.types";
import { validateCreateServiceBody } from "./microservices.schema";
import { createMicroservice } from "./microservices.service";
import { listMicroservices } from "./microservices.service";
import { getMicroserviceById } from "./microservices.service";
import { deleteMicroservice } from "./microservices.service";
import { startMicroservice } from "./microservices.service";
import { stopMicroservice } from "./microservices.service";
import { restartMicroservice } from "./microservices.service";

export const createService: Controller = async (req, res) => {
    const body = validateCreateServiceBody(req.body);
    const record = await createMicroservice(body);
    return res.status(201).json({ ok: true, data: { service: record } });
};

export const listServices: Controller = async (_req, res) => {
    const services = await listMicroservices();
    return res.json({ ok: true, data: { services } });
};

export const getServiceById: Controller = async (req, res) => {
    const { id } = req.params;
    const service = await getMicroserviceById(id);
    return res.json({ ok: true, data: { service } });
};

export const deleteService: Controller = async (req, res) => {
    const { id } = req.params;
    await deleteMicroservice(id);
    return res.json({ ok: true, message: `Microservicio '${id}' eliminado correctamente` });
};

export const startService: Controller = async (req, res) => {
    const { id } = req.params;
    const result = await startMicroservice(id);
    return res.json({ ok: true, data: result });
};

export const stopService: Controller = async (req, res) => {
    const { id } = req.params;
    const result = await stopMicroservice(id);
    return res.json({ ok: true, data: result });
};

export const restartService: Controller = async (req, res) => {
    const { id } = req.params;
    const result = await restartMicroservice(id);
    return res.json({ ok: true, data: result });
};