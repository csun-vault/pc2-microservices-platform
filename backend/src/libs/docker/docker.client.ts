import Docker from "dockerode"

// Instanciar daemon de Docker
let docker : Docker | null = null ;
let isConnected = false;

// Instancia central de Docker
export function getDocker() {
    if ( !docker || !isConnected )
        throw new Error("Daemon no disponible")
    return docker;
}

// Inicializar la instancia de Docker
export async function initDocker() {
    docker = new Docker();
    await checkConnection();
}

// Checker, docker encendido?
export async function checkConnection() {
    if (!docker) return false;

    try {
        await docker.ping();
        isConnected = true;
    } catch {
        isConnected = false;
    }

    return isConnected;
}


