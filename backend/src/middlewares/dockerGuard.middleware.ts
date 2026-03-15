import { checkConnection } from "@libs/docker/docker.client";
import { HTTPError } from "@modules/app/error.model";
import { Middleware } from "@type/express.types";

let daemonCache : boolean | null = null;
let lastChecked = 0;
const checkEachSeconds = 6000;

export const dockerGuard : Middleware = async (req, res, next) => {
    const now = Date.now();

    if (!daemonCache || now - lastChecked > checkEachSeconds ){
        daemonCache = await checkConnection();
        lastChecked = now;
    }

    if (!daemonCache) 
        throw new HTTPError({statusCode:503, type:"SERVICE_UNAVAILABLE" ,message:"Docker Engine no está corriendo (Daemon no encontrado)"});
    
    next();
}
