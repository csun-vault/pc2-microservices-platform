import type { Controller } from "@type/express.types";
import { validateCreateServiceBody } from "./microservices.schema";
import { createMicroservice } from "./microservices.service";
import { listMicroservices } from "./microservices.service";

export const createService: Controller = async (req, res) => {
    const body = validateCreateServiceBody(req.body);
    const record = await createMicroservice(body);
    return res.status(201).json({ ok: true, data: { service: record } });
};

export const listServices: Controller = async (_req, res) => {
    const services = await listMicroservices();
    return res.json({ ok: true, data: { services } });
};