export interface DockerLogsResponse {
    containerId: string;
    containerName: string;
    status: string;
    tail: number;
    timestamps: boolean;
    content: string; 
}

/**
 * Obtiene los logs de un contenedor específico
 */
const BASE_URL = import.meta.env.VITE_API_URL

export async function fetchContainerLogs(containerName: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/docker/logs/${containerName}`);
    if (!res.ok) throw new Error("Error fetching logs");
    
    const json = await res.json();
    return json.data.logs.content;
}