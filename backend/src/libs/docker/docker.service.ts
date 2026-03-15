import { getDocker } from "./docker.client";
import type { ServiceContainerRef } from "@shared/domain.types"

/*
    ==================================
               SOBRE DAEMON 
    ==================================
*/
export async function getDockerVersion() {
    const docker = getDocker();
    const version = await docker.version();

    return {
        status: version ? "running" : "down",
        version: version.Version,
        os: version.Os
    };

}


/*
    ==================================
            SOBRE CONTENEDORES 
    ==================================
*/
//  ( docker ps -a ) Listar todos los contenedores
export async function getContainerList () {
    const docker = getDocker();

    const containers = await docker.listContainers({ all: true });
    
    const containerRefs : ServiceContainerRef[] = containers.map((container) => ({
        status: 
            container.Status.startsWith("Up") ? "running" 
            : container.Status.startsWith("Exited") ? "stopped" 
            : "restarting",
        
        containerId: container.Id,
        containerName: container.Names?.[0]?.replace(/^\//, "") ?? "",
        image: {
            id : container.ImageID,
            name: container.Image
        }
    })); 
    
    return containerRefs
}