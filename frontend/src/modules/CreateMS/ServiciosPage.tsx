import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "../../components/Icons";
import { BaseCard } from "../../components/Cards/BaseCard";
import {
  fetchServices,
  startService,
  stopService,
  deleteService,
  createService,
  type Microservice,
} from "../../services/microservices.service";
import styles from "./ServiciosPage.module.css";

/* ============================================================
   ServiceCard
   ============================================================ */
interface ServiceCardProps {
  service: Microservice;
  index: number;
  onStart:  (id: string) => void;
  onStop:   (id: string) => void;
  onDelete: (id: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  index,
  onStart,
  onStop,
  onDelete,
}) => {
  const isRunning = service.status === "running";
  const isPaused  = service.status === "paused";
  const isActive  = isRunning || isPaused;

  const dotClass =
    isRunning ? styles.statusDotRunning :
    isPaused  ? styles.statusDotPaused  :
    styles.statusDotStopped;

  return (
    <BaseCard variant="normal" padding="sm" radius="lg" className={styles.cardInner} tilt tiltMax={2}>
      <span className={styles.cardIndex}>{index}</span>

      {/* Fila superior */}
      <div className={styles.cardTop}>
        <span className={`${styles.statusDot} ${dotClass}`} />
        <span className={styles.cardName}>{service.name}</span>
        <span className={styles.cardPort}>{service.port}</span>

        <div className={styles.cardActions}>
          {/* Play / Pause toggle */}
          {isActive ? (
            <button
              className={styles.cardBtn}
              onClick={() => onStop(service.id)}
              aria-label="Detener"
              title="Detener"
            >
              <Icon name="pause" width={13} height={13} />
            </button>
          ) : (
            <button
              className={styles.cardBtn}
              onClick={() => onStart(service.id)}
              aria-label="Iniciar"
              title="Iniciar"
            >
              <Icon name="play" width={13} height={13} />
            </button>
          )}

          {/* Eliminar */}
          <button
            className={`${styles.cardBtn} ${styles.cardBtnDelete}`}
            onClick={() => onDelete(service.id)}
            aria-label="Eliminar"
            title="Eliminar"
          >
            <Icon name="trash" width={13} height={13} />
          </button>
        </div>
      </div>

      {/* Métricas — solo visibles si el servicio está activo */}
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

      {/* Footer — icono de logs/detalle */}
      <div className={styles.cardFooter}>
        <button className={styles.cardFooterBtn} aria-label="Ver logs" title="Ver logs">
          <Icon name="layout" width={13} height={13} />
        </button>
      </div>
    </BaseCard>
  );
};

/* ============================================================
   Modal — Nuevo Microservicio
   ============================================================ */
interface NewServiceModalProps {
  open:    boolean;
  onClose: () => void;
  onCreate: (name: string, port: number, code: string) => Promise<void>;
}

const NewServiceModal: React.FC<NewServiceModalProps> = ({ open, onClose, onCreate }) => {
  const [name,    setName]    = useState("");
  const [port,    setPort]    = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const mountedRef = useRef(false);

  /* Controla la transición de entrada/salida */
  useEffect(() => {
    if (open) {
      mountedRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || !port || !code.trim()) return;
    setLoading(true);
    try {
      await onCreate(name.trim(), Number(port), code);
      setName(""); setPort(""); setCode("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim() && port && code.trim();

  if (!open && !visible) return null;

  return (
    <div
      className={visible ? `${styles.modalOverlay} ${styles.modalOverlayVisible}` : styles.modalOverlay}
      onClick={onClose}
    >
      <div
        className={visible ? `${styles.modal} ${styles.modalVisible}` : styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <Icon name="plus" className={styles.modalTitleIcon} width={14} height={14} />
            <span className={styles.modalTitle}>Nuevo Microservicio</span>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Campos */}
        <div className={styles.modalForm}>
          <input
            className={styles.modalInput}
            placeholder="Nombre del servicio"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={`${styles.modalInput} ${styles.modalInputPort}`}
            placeholder="Puerto"
            type="number"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>

        {/* Editor de código */}
        <div className={styles.editorWrapper}>
          <textarea
            className={styles.editor}
            placeholder={"# Escribe tu código aquí\ndef saludar():\n    return jsonify({\"status\": \"ok\", \"data\": \"hola\"})"}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={!isValid || loading}
          >
            {loading ? "Creando..." : "Crear servicio"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   ServiciosPage
   ============================================================ */
const ServiciosPage: React.FC = () => {
  const [services, setServices] = useState<Microservice[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [modal,    setModal]    = useState(false);

  /* ---- Carga inicial -------------------------------------- */
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchServices();
      setServices(data);
    } catch {
      setError("No se pudieron cargar los servicios. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  /* ---- Acciones ------------------------------------------- */
  const handleStart = async (id: string) => {
    const updated = await startService(id);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleStop = async (id: string) => {
    const updated = await stopService(id);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreate = async (name: string, port: number, code: string) => {
    const newSvc = await createService({ name, port, code });
    setServices((prev) => [...prev, newSvc]);
  };

  /* ---- Render --------------------------------------------- */
  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Icon name="container" className={styles.headerIcon} width={18} height={18} />
            <h1 className={styles.headerTitle}>Mis Servicios</h1>
          </div>
          <button
            className={styles.headerAction}
            onClick={() => setModal(true)}
            aria-label="Nuevo microservicio"
          >
            <Icon name="plus" width={16} height={16} />
          </button>
        </header>

        {/* Grid */}
        <div className={styles.grid}>
          {loading && (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))
          )}

          {error && !loading && (
            <div className={styles.errorBox}>{error}</div>
          )}

          {!loading && !error && services.map((svc, i) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              index={i + 1}
              onStart={handleStart}
              onStop={handleStop}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      <NewServiceModal
        open={modal}
        onClose={() => setModal(false)}
        onCreate={handleCreate}
      />
    </>
  );
};

export default ServiciosPage;