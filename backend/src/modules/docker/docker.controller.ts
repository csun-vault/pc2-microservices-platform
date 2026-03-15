import { type Controller } from "@type/express.types"
import { HTTPError } from "@modules/app/error.model";
import * as ds from "@libs/docker/docker.service"

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
