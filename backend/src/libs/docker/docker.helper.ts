export function isPortAllocatedError(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);

    return (
        message.includes("port is already allocated") ||
        message.includes("address already in use") ||
        message.includes("Bind for 0.0.0.0")
    );
}