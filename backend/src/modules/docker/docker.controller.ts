import { type Controller } from "@type/express.types"
import { HTTPError } from "@modules/app/error.model";
import * as ds from "@libs/docker/docker.service"
import { validateLogsQuery, validateStatsQuery } from "./docker.schema";

// Health route, tomar la version de Docker y ver si está corriendo
export const getDaemonVersion : Controller = async (req, res) => {
    const engine = await ds.getDockerVersion();
    return res.json({ ok: true, data:{engine} })
}

export const listAllContainers : Controller = async (req, res) => {
    // Validar si el daemon está corriendo
    const containers = await ds.getContainerList();
    return res.json({ ok: true, data: { containers } })
}

export const getSummary : Controller = async (req, res) => {
    const summary = await ds.getDockerSummary();
    return res.json({ok: true, data: {summary}})
}

export const getStats: Controller = async (req, res) => {
  const query = validateStatsQuery(req.query);

  const stats = await ds.getContainersMetricsSnapshot(query);

  if (query.containerName && stats.items.length === 0) 
    throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un contenedor con nombre '${query.containerName}'`});
  
  if (query.containerNames && stats.items.length === 0)
    throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: "No se encontraron contenedores para los nombres enviados" });

  return res.json({ ok: true, data: { stats } });
};

export const getLogs: Controller<{containerName: string}> = async (req, res) => {
    const containerName = req.params.containerName?.trim();

    if (!containerName)
        throw new HTTPError({ statusCode: 400, type: "VALIDATION_ERROR", message: "Debes enviar un 'containerName' válido en la URL" });

    const query = validateLogsQuery(req.query);
    const logs = await ds.getContainerLogs(containerName, query);

    if (!logs) 
        throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un contenedor con nombre '${containerName}'`});

    return res.json({ ok: true, data: { logs } });
};