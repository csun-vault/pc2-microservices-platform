import type { Controller } from "@type/express.types";
import { validateCreateServiceBody } from "./microservices.schema";
import { createMicroservice } from "./microservices.service";

export const createService: Controller = async (req, res) => {
    const body = validateCreateServiceBody(req.body);
    const record = await createMicroservice(body);
    return res.status(201).json({ ok: true, data: { service: record } });
};