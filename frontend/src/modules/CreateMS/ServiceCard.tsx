import React, { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "../../components/Icons";
import { BaseCard } from "../../components/Cards/BaseCard";
import { fetchServiceSource, invokeServiceRequest, type Microservice } from "../../services/microservices.service";
import { parseServiceSource } from "./Parser";
import styles from "./ServiciosPage.module.css";

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceCardProps {
    service: Microservice & {
        // Overrides manuales opcionales (tienen prioridad sobre la auto-detección)
        method?: "GET" | "POST";
        params?: Array<{
            name: string;
            type?: "string" | "number" | "boolean";
            required?: boolean;
            in?: "query" | "path";
        }>;
    };
    index: number;
    onStart: (id: string) => void | Promise<void>;
    onStop: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

type PendingAction = "starting" | "stopping" | "deleting" | null;
type SourceState = "idle" | "loading" | "ready" | "error";

// ── Component ────────────────────────────────────────────────────────────────

export const ServiceCard: React.FC<ServiceCardProps> = ({
    service,
    index,
    onStart,
    onStop,
    onDelete,
}) => {
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [logsOpen, setLogsOpen] = useState(false);
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [bodyValue, setBodyValue] = useState("{\n  \n}");
    const [sendStatus, setSendStatus] = useState<"idle" | "ok" | "err">("idle");

    // Source & parsed state
    const [sourceState, setSourceState] = useState<SourceState>("idle");
    const [detectedMethod, setDetectedMethod] = useState<"GET" | "POST" | null>(null);
    const [detectedParams, setDetectedParams] = useState<ReturnType<typeof parseServiceSource>["params"] | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    // Evita re-fetch si ya se cargó para este servicio
    const fetchedRef = useRef(false);

    // Overrides manuales tienen prioridad; si no hay, usa lo detectado; fallback GET
    const method = service.method ?? detectedMethod ?? "GET";
    const params = service.params ?? detectedParams ?? [];

    // ── Flags ─────────────────────────────────────────────────────────────────
    const isRunning = service.status === "running";
    const isPaused = service.status === "paused";
    const isActive = isRunning || isPaused;
    const isBusy = pendingAction !== null;

    const dotClass = isRunning
        ? styles.statusDotRunning
        : isPaused
            ? styles.statusDotPaused
            : styles.statusDotStopped;

    // ── Fetch source al abrir el dropdown (una sola vez) ──────────────────────
    const fetchSource = useCallback(async () => {
        // 1. Evitar re-fetch si ya se cargó o está cargando
        if (fetchedRef.current || sourceState === "loading") return;

        fetchedRef.current = true;
        setSourceState("loading");

        try {
            // 2. Llamamos a nuestra nueva función del servicio
            const data = await fetchServiceSource(service.id);

            // 3. Procesamos el código con tu Parser
            const parsed = parseServiceSource(data.sourceCode);

            // 4. Actualizamos los estados de detección
            setDetectedMethod(parsed.method);
            setDetectedParams(parsed.params);
            setSourceState("ready");

        } catch (err) {
            console.error("Error en fetchSource:", err);
            setSourceState("error");
            // Opcional: permitir reintentar si falló
            fetchedRef.current = false;
        }
    }, [service.id, sourceState]);

    function handleToggleLogs() {
        const next = !logsOpen;
        setLogsOpen(next);
        if (next) fetchSource();
    }

    // Cierra al hacer click fuera
    useEffect(() => {
        if (!logsOpen) return;
        function handler(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setLogsOpen(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [logsOpen]);

    // ── Action handlers ───────────────────────────────────────────────────────

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

    function handleParamChange(name: string, value: string) {
        setParamValues(prev => ({ ...prev, [name]: value }));
    }

    async function handleSend() {
        const base = `http://localhost:${service.port}`;
 
        // GET — abre directo en el navegador, sin CORS
        if (method === "GET") {
            const qs = params
                .filter(p => p.in !== "path" && paramValues[p.name])
                .map(p => `${encodeURIComponent(p.name)}=${encodeURIComponent(paramValues[p.name])}`)
                .join("&");
 
            const path = params
                .filter(p => p.in === "path")
                .reduce((acc, p) => acc
                    .replace(`:${p.name}`,  encodeURIComponent(paramValues[p.name] ?? ""))
                    .replace(`{${p.name}}`, encodeURIComponent(paramValues[p.name] ?? "")),
                "");
 
            window.open(`${base}${path}${qs ? `?${qs}` : ""}`, "_blank");
            return;
        }
 
        // POST — va a través del backend proxy para evitar CORS,
        // luego muestra la respuesta en una pestaña nueva
        setSendStatus("idle");
        try {
            const result = await invokeServiceRequest(service.id, {
                method: "POST",
                body:   bodyValue,
            });
 
            const display = JSON.stringify(result.data, null, 2);
            const status  = result.ok ? "ok" : "err";
            const color   = result.ok ? "#4ade80" : "#f87171";
 
            const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>POST ${base}</title>
  <style>
    body { font-family: "SF Mono", "Fira Code", monospace; background: #0f0f0f; color: #d4d4d4; padding: 24px; margin: 0; }
    .meta { font-size: 11px; color: #555; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
             background: ${color}22; color: ${color}; border: 1px solid ${color}44; margin-left: 8px; }
    pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; line-height: 1.7; color: ${color}; }
  </style>
</head>
<body>
  <div class="meta">POST ${base} <span class="badge">${status.toUpperCase()}</span></div>
  <pre>${display.replace(/</g, "&lt;")}</pre>
</body>
</html>`;
 
            const blob = new Blob([html], { type: "text/html" });
            const url  = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 5000);
 
            setSendStatus(result.ok ? "ok" : "err");
        } catch {
            setSendStatus("err");
        }
        setTimeout(() => setSendStatus("idle"), 2000);
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ position: "relative" }} ref={dropdownRef}>
            <BaseCard
                variant="normal"
                padding="sm"
                radius="lg"
                className={`${styles.cardInner} ${isBusy ? styles.cardBusy : ""}`}
                tilt
                tiltMax={2}
            >
                <span className={styles.cardIndex}>{index}</span>

                <div className={styles.cardTop}>
                    <span className={`${styles.statusDot} ${dotClass}`} />

                    <a
                        className={styles.cardName}
                        href={`${service.url}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        {service.name}
                    </a>

                    <span className={styles.cardPort}>{service.port}</span>

                    <div className={styles.cardActions}>
                        {isActive ? (
                            <button
                                className={styles.cardBtn}
                                onClick={handleStop}
                                aria-label="Detener"
                                title={pendingAction === "stopping" ? "Deteniendo..." : "Detener"}
                                disabled={isBusy}
                            >
                                {pendingAction === "stopping"
                                    ? <span className={styles.spinner} />
                                    : <Icon name="pause" width={13} height={13} />}
                            </button>
                        ) : (
                            <button
                                className={styles.cardBtn}
                                onClick={handleStart}
                                aria-label="Iniciar"
                                title={pendingAction === "starting" ? "Iniciando..." : "Iniciar"}
                                disabled={isBusy}
                            >
                                {pendingAction === "starting"
                                    ? <span className={styles.spinner} />
                                    : <Icon name="play" width={13} height={13} />}
                            </button>
                        )}

                        <button
                            className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
                            onClick={handleDelete}
                            aria-label="Eliminar"
                            title={pendingAction === "deleting" ? "Eliminando..." : "Eliminar"}
                            disabled={isBusy}
                        >
                            {pendingAction === "deleting"
                                ? <span className={styles.spinner} />
                                : <Icon name="trash" width={13} height={13} />}
                        </button>
                    </div>
                </div>

                {isActive && (
                    <div className={styles.cardMetrics}>
                        <div className={styles.metricRow}>
                            <span className={styles.metricLabel}>CPU</span>
                            <div className={styles.metricBar}>
                                <div
                                    className={`${styles.metricFill} ${styles.metricFillCpu}`}
                                    style={{ width: `${service.cpu}%` }}
                                />
                            </div>
                        </div>
                        <div className={styles.metricRow}>
                            <span className={styles.metricLabel}>RAM</span>
                            <div className={styles.metricBar}>
                                <div
                                    className={`${styles.metricFill} ${styles.metricFillRam}`}
                                    style={{ width: `${service.ram}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.cardFooter}>
                    <button
                        className={`${styles.cardFooterBtn} ${logsOpen ? styles.cardFooterBtnActive : ""}`}
                        aria-label="Ver logs"
                        title="Ver logs"
                        disabled={isBusy}
                        onClick={handleToggleLogs}
                    >
                        <Icon name="layout" width={13} height={13} />
                    </button>
                </div>
            </BaseCard>

            {/* ── Logs dropdown ────────────────────────────────────────────── */}
            <div className={`${styles.logsDropdown} ${logsOpen ? styles.logsDropdownOpen : ""}`}>

                {/* Header */}
                <div className={styles.logsHeader}>
                    {sourceState === "loading" ? (
                        <span className={styles.sourceLoading}>
                            <span className={styles.spinner} />
                            Detectando…
                        </span>
                    ) : (
                        <>
                            <span className={`${styles.methodBadge} ${method === "POST" ? styles.methodPost : styles.methodGet}`}>
                                {method}
                            </span>
                            <span className={styles.logsTitle}>
                                {method === "GET" ? "Parámetros" : "Request Body"}
                            </span>
                        </>
                    )}
                    <div className={styles.logsHeaderRight}>
                        {sourceState === "ready" && (
                            <span className={styles.autoDetectedBadge} title="Detectado automáticamente del source">
                                auto
                            </span>
                        )}
                        {sourceState === "error" && (
                            <span className={styles.sourceErrorBadge} title="No se pudo leer el source">
                                sin source
                            </span>
                        )}
                        <span className={styles.logsEndpoint}>:{service.port}</span>
                    </div>
                </div>

                <div className={styles.logsDivider} />

                {/* Body — GET */}
                {method === "GET" && sourceState !== "loading" && (
                    <div className={styles.logsBody}>
                        {params.length === 0 ? (
                            <p className={styles.logsEmpty}>Sin parámetros detectados</p>
                        ) : (
                            params.map(p => (
                                <div key={p.name} className={styles.paramRow}>
                                    <div className={styles.paramMeta}>
                                        <span className={styles.paramName}>{p.name}</span>
                                        {p.in === "path" && (
                                            <span className={styles.paramTag}>path</span>
                                        )}
                                        {p.required && (
                                            <span className={styles.paramRequired}>*</span>
                                        )}
                                    </div>
                                    <input
                                        className={styles.paramInput}
                                        type={p.type === "number" ? "number" : "text"}
                                        placeholder={p.type ?? "string"}
                                        value={paramValues[p.name] ?? ""}
                                        onChange={e => handleParamChange(p.name, e.target.value)}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Body — POST */}
                {method === "POST" && sourceState !== "loading" && (
                    <div className={styles.logsBody}>
                        <textarea
                            className={styles.bodyEditor}
                            value={bodyValue}
                            onChange={e => setBodyValue(e.target.value)}
                            spellCheck={false}
                            rows={5}
                        />
                    </div>
                )}

                {/* Loading skeleton */}
                {sourceState === "loading" && (
                    <div className={styles.logsBody}>
                        <div className={styles.paramSkeleton} />
                        <div className={styles.paramSkeleton} style={{ width: "70%" }} />
                    </div>
                )}

                <div className={styles.logsDivider} />

                {/* Footer */}
                <div className={styles.logsFooter}>
                    <button
                        className={`${styles.sendBtn} ${sendStatus === "ok" ? styles.sendOk :
                            sendStatus === "err" ? styles.sendErr : ""
                            }`}
                        onClick={handleSend}
                        disabled={sourceState === "loading"}
                    >
                        {sendStatus === "ok" ? "✓ OK" : sendStatus === "err" ? "✕ Error" : "Enviar"}
                    </button>
                </div>
            </div>
        </div>
    );
};