import React, { useState } from "react";
import { Icon } from "../../components/Icons";
import { BaseCard } from "../../components/Cards/BaseCard";
import { type Microservice } from "../../services/microservices.service";
import styles from "./ServiciosPage.module.css";

interface ServiceCardProps {
    service: Microservice;
    index: number;
    onStart: (id: string) => void | Promise<void>;
    onStop: (id: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
}

type PendingAction = "starting" | "stopping" | "deleting" | null;

export const ServiceCard: React.FC<ServiceCardProps> = ({
    service,
    index,
    onStart,
    onStop,
    onDelete,
}) => {
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    const isRunning = service.status === "running";
    const isPaused = service.status === "paused";
    const isActive = isRunning || isPaused;
    const isBusy = pendingAction !== null;

    const dotClass = isRunning
        ? styles.statusDotRunning
        : isPaused
            ? styles.statusDotPaused
            : styles.statusDotStopped;

    async function handleStart() {
        try {
            setPendingAction("starting");
            await onStart(service.id);
        } finally {
            setPendingAction(null);
        }
    }

    async function handleStop() {
        try {
            setPendingAction("stopping");
            await onStop(service.id);
        } finally {
            setPendingAction(null);
        }
    }

    async function handleDelete() {
        try {
            setPendingAction("deleting");
            await onDelete(service.id);
        } finally {
            setPendingAction(null);
        }
    }

    return (
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
                    href={`http://localhost:${service.port}`}
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
                            {pendingAction === "stopping" ? (
                                <span className={styles.spinner} />
                            ) : (
                                <Icon name="pause" width={13} height={13} />
                            )}
                        </button>
                    ) : (
                        <button
                            className={styles.cardBtn}
                            onClick={handleStart}
                            aria-label="Iniciar"
                            title={pendingAction === "starting" ? "Iniciando..." : "Iniciar"}
                            disabled={isBusy}
                        >
                            {pendingAction === "starting" ? (
                                <span className={styles.spinner} />
                            ) : (
                                <Icon name="play" width={13} height={13} />
                            )}
                        </button>
                    )}

                    <button
                        className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
                        onClick={handleDelete}
                        aria-label="Eliminar"
                        title={pendingAction === "deleting" ? "Eliminando..." : "Eliminar"}
                        disabled={isBusy}
                    >
                        {pendingAction === "deleting" ? (
                            <span className={styles.spinner} />
                        ) : (
                            <Icon name="trash" width={13} height={13} />
                        )}
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
                    className={styles.cardFooterBtn}
                    aria-label="Ver logs"
                    title="Ver logs"
                    disabled={isBusy}
                >
                    <Icon name="layout" width={13} height={13} />
                </button>
            </div>
        </BaseCard>
    );
};