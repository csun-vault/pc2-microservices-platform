import { useEffect, useState } from "react";
import type { Microservice } from "../../services/microservices.service";
import { Icon } from "../../components/Icons";
import styles from "./ServiceDetailPanel.module.css";
import { fetchContainerLogs } from "../../services/details.service";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "info" | "logs" | "dockerfile";
type PendingAction = "starting" | "stopping" | "deleting" | null;

interface ServiceDetailPanelProps {
    service: Microservice;
    onClose: () => void;
    onStart: (id: string) => void | Promise<void>;
    onStop: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ServiceDetailPanel: React.FC<ServiceDetailPanelProps> = ({
    service,
    onClose,
    onStart,
    onStop,
    onDelete,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>("info");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    const [logs, setLogs] = useState<string>("");
    const [loadingLogs, setLoadingLogs] = useState(false);

    const isRunning = service.status === "running";
    const isPaused = service.status === "paused";
    const isActive = isRunning || isPaused;
    const isBusy = pendingAction !== null;

    // Efecto para cargar logs cuando cambia a la pestaña "logs"
    useEffect(() => {
        if (activeTab === "logs" && service.containerName) {
            loadLogs();
        }
    }, [activeTab, service.containerName]);

    async function loadLogs() {
        setLoadingLogs(true);
        try {
            const content = await fetchContainerLogs(service.containerName);
            setLogs(content || "No hay logs disponibles para este contenedor.");
        } catch (err) {
            setLogs("Error al cargar los logs.");
        } finally {
            setLoadingLogs(false);
        }
    }

    // ── Cierre por Escape ──────────────────────────────────────────────────────
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    async function handleStart() {
        try { setPendingAction("starting"); await onStart(service.id); }
        finally { setPendingAction(null); }
    }
    async function handleStop() {
        try { setPendingAction("stopping"); await onStop(service.id); }
        finally { setPendingAction(null); }
    }
    async function handleDelete() {
        try { setPendingAction("deleting"); await onDelete(service.id); }
        finally { setPendingAction(null); }
    }

    // ── Status ────────────────────────────────────────────────────────────────
    const statusLabel = isRunning ? "Running" : isPaused ? "Paused" : "Stopped";
    const dotClass = isRunning
        ? styles.statusDotRunning
        : isPaused
            ? styles.statusDotPaused
            : styles.statusDotStopped;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>

            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className={styles.panelHeader}>

                {/* Izquierda: icono + nombre */}
                <div className={styles.panelHeaderLeft}>
                    <Icon name="box" width={15} height={15} className={styles.panelIcon} />
                    <span className={styles.panelName}>{service.name}</span>
                </div>

                {/* Derecha: status + botones + cerrar */}
                <div className={styles.panelHeaderRight}>

                    <div className={styles.statusGroup}>
                        <span className={`${styles.statusDot} ${dotClass}`} />
                        <span className={styles.statusLabel}>{statusLabel}</span>
                    </div>

                    {isActive ? (
                        <button
                            className={styles.actionBtn}
                            onClick={handleStop}
                            disabled={isBusy}
                            title="Pausar"
                            aria-label="Pausar"
                        >
                            {pendingAction === "stopping"
                                ? <span className={styles.spinner} />
                                : <Icon name="pause" width={12} height={12} />}
                        </button>
                    ) : (
                        <button
                            className={styles.actionBtn}
                            onClick={handleStart}
                            disabled={isBusy}
                            title="Iniciar"
                            aria-label="Iniciar"
                        >
                            {pendingAction === "starting"
                                ? <span className={styles.spinner} />
                                : <Icon name="play" width={12} height={12} />}
                        </button>
                    )}

                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={handleDelete}
                        disabled={isBusy}
                        title="Eliminar"
                        aria-label="Eliminar"
                    >
                        {pendingAction === "deleting"
                            ? <span className={styles.spinner} />
                            : <Icon name="trash" width={12} height={12} />}
                    </button>

                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar panel"
                        title="Cerrar"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* ── Subheader: puerto + lenguaje ──────────────────────────────────── */}
            <div className={styles.panelSubheader}>
                <span className={styles.portBadge}>:{service.port}</span>
                <span
                    className={`${styles.langBadge} ${service.language === "python" ? styles.langPython : styles.langNode
                        }`}
                >
                    {service.language === "python" ? "Python" : "Node"}
                </span>
            </div>

            <div className={styles.divider} />

            {/* ── Tabs ──────────────────────────────────────────────────────────── */}
            <div className={styles.tabBar} role="tablist">
                {(["info", "logs", "dockerfile"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "info" ? "INFO" : tab === "logs" ? "LOGS" : "DOCKERFILE"}
                    </button>
                ))}
            </div>

            {/* ── Contenido ─────────────────────────────────────────────────────── */}
            <div className={styles.tabContent} role="tabpanel" aria-label={activeTab}>
                {activeTab === "info" && (
                    <div className={styles.infoContainer}>
                        {/* Sección de Descripción */}
                        <div className={styles.infoSection}>
                            <h4 className={styles.infoTitle}>Descripción</h4>
                            <p className={styles.descriptionText}>
                                {service.description || <span className={styles.descriptionEmpty}>Sin descripción disponible.</span>}
                            </p>
                        </div>

                        {/* Grid de Metadatos */}
                        <div className={styles.metadataGrid}>
                            {/* Red */}
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>URL de Acceso</span>
                                <a href={service.url} target="_blank" rel="noreferrer" className={styles.metaLink}>
                                    {service.url} <Icon name="external" width={10} height={10} />
                                </a>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Base Path</span>
                                <code className={styles.metaCode}>{service.basePath}</code>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Puerto Interno</span>
                                <span className={styles.metaValue}>{service.internalPort}</span>
                            </div>

                            {/* Contenedor */}
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Imagen Docker</span>
                                <span className={styles.metaValue}>{service.imageName}</span>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Nombre Contenedor</span>
                                <span className={styles.metaValue}>{service.containerName}</span>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Health Check</span>
                                <span className={`${styles.healthBadge} ${service.backendStatus === 'UP' ? styles.healthUp : styles.healthDown}`}>
                                    {service.backendStatus || 'UNKNOWN'}
                                </span>
                            </div>

                            {/* Fechas */}
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Creado</span>
                                <span className={styles.metaValue}>
                                    {new Date(service.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>ID del Servicio</span>
                                <code className={styles.metaCodeSmall}>{service.id}</code>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab INFO (ya lo tienes) ── */}
                {activeTab === "info" && (
                    <div className={styles.infoContainer}>
                        {/* ... tu código de info ... */}
                    </div>
                )}

                {/* ── Tab LOGS ── */}
                {activeTab === "logs" && (
                    <div className={styles.logsContainer}>
                        <div className={styles.logsHeader}>
                            <span className={styles.logsTitle}>System Output</span>
                            <button onClick={loadLogs} className={styles.refreshBtn} title="Recargar logs">⟳</button>
                        </div>
                        
                        <div className={styles.terminal}>
                            {loadingLogs ? (
                                <div className={styles.logsLoading}>
                                    <span className={styles.spinner} />
                                    <span>Cargando logs...</span>
                                </div>
                            ) : (
                                <pre className={styles.logsContent}>
                                    {logs || "Esperando salida del sistema..."}
                                </pre>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ServiceDetailPanel;