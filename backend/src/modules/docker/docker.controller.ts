import { type Controller } from "@type/express.types"
import { HTTPError } from "@modules/app/error.model";
import * as ds from "@libs/docker/docker.service"
import { validateStatsQuery } from "./docker.schema";

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

  const stats = await ds.getContainersMetricsSnapshot({ containerName: query.containerName!, containerNames: query.containerNames!, onlyRunning: query.onlyRunning!});

  if (query.containerName && stats.items.length === 0) 
    throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: `No existe un contenedor con nombre '${query.containerName}'`});
  
  if (query.containerNames && stats.items.length === 0)
    throw new HTTPError({statusCode: 404, type: "NOT_FOUND", message: "No se encontraron contenedores para los nombres enviados" });

  return res.json({ ok: true, data: { stats } });
};