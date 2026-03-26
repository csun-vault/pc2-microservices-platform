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
type Language = "python" | "node";

interface NewServiceModalProps {
  open:     boolean;
  onClose:  () => void;
  onCreate: (params: {
    name:       string;
    port:       number | null;
    code:       string;
    language:   Language;
    memLimitMB: number;
    cpuCores:   number;
    autoStart:  boolean;
  }) => Promise<void>;
}

const DEFAULT_CODE_PYTHON =
  `# Escribe tu código aquí\ndef saludar():\n    return jsonify({"status": "ok", "data": "hola"})`;
const DEFAULT_CODE_NODE =
  `// Escribe tu código aquí\nconst saludar = (req, res) => {\n  res.json({ status: "ok", data: "hola" });\n};`;

const MEM_MIN  = 64;
const MEM_MAX  = 4096;
const CPU_MIN  = 0.1;
const CPU_MAX  = 8;
const CPU_STEP = 0.1;

const NewServiceModal: React.FC<NewServiceModalProps> = ({ open, onClose, onCreate }) => {
  const [name,      setName]      = useState("");
  const [port,      setPort]      = useState("");
  const [code,      setCode]      = useState("");
  const [language,  setLanguage]  = useState<Language>("python");
  const [langOpen,  setLangOpen]  = useState(false);
  const [memLimit,  setMemLimit]  = useState(512);
  const [cpuCores,  setCpuCores]  = useState(1);
  const [autoStart, setAutoStart] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [visible,   setVisible]   = useState(false);

  const mountedRef  = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Animación entrada / salida + reset completo al abrir */
  useEffect(() => {
    if (open) {
      /* Reset de todos los campos cada vez que se abre */
      setName("");
      setPort("");
      setCode("");
      setLanguage("python");
      setLangOpen(false);
      setMemLimit(512);
      setCpuCores(1);
      setAutoStart(false);
      mountedRef.current = true;
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [open]);

  /* Cierra dropdown al hacer click fuera */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setLangOpen(false);
    /* Solo limpia si el usuario no ha escrito nada propio */
    setCode("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        name:       name.trim(),
        port:       port ? Number(port) : null,
        code,
        language,
        memLimitMB: memLimit,
        cpuCores,
        autoStart,
      });
      onClose(); // el reset lo maneja el useEffect al cambiar open → false → true
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim() && code.trim();

  /* Porcentajes para el track del slider */
  const memPct = ((memLimit - MEM_MIN) / (MEM_MAX - MEM_MIN)) * 100;
  const cpuPct = ((cpuCores  - CPU_MIN) / (CPU_MAX  - CPU_MIN)) * 100;

  if (!open && !visible) return null;

  return (
    <div
      className={`${styles.modalOverlay}${visible ? ` ${styles.modalOverlayVisible}` : ""}`}
      onClick={onClose}
    >
      <div
        className={`${styles.modal}${visible ? ` ${styles.modalVisible}` : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleRow}>
            <Icon name="plus" className={styles.modalTitleIcon} width={14} height={14} />
            <span className={styles.modalTitle}>Nuevo Microservicio</span>
          </div>
          <button className={styles.modalCloseBtn} onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* ── Nombre + Selector de lenguaje ── */}
        <div className={styles.modalForm}>
          <input
            className={styles.modalInput}
            placeholder="Nombre del servicio"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className={styles.langDropdown} ref={dropdownRef}>
            <button
              className={styles.langTrigger}
              onClick={() => setLangOpen((v) => !v)}
              type="button"
            >
              <span className={styles.langDot} data-lang={language} />
              <span>{language === "python" ? "Python" : "Node"}</span>
              <svg
                className={`${styles.langChevron}${langOpen ? ` ${styles.langChevronOpen}` : ""}`}
                viewBox="0 0 10 6"
                fill="none"
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {langOpen && (
              <div className={styles.langMenu}>
                <button
                  className={`${styles.langOption}${language === "python" ? ` ${styles.langOptionActive}` : ""}`}
                  onClick={() => handleLanguageChange("python")}
                >
                  <span className={styles.langDot} data-lang="python" />Python
                </button>
                <button
                  className={`${styles.langOption}${language === "node" ? ` ${styles.langOptionActive}` : ""}`}
                  onClick={() => handleLanguageChange("node")}
                >
                  <span className={styles.langDot} data-lang="node" />Node
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Editor de código ── */}
        <div className={styles.editorWrapper}>
          <textarea
            className={styles.editor}
            placeholder={language === "python" ? DEFAULT_CODE_PYTHON : DEFAULT_CODE_NODE}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* ── Footer ── */}
        <div className={styles.modalFooter}>

          {/* Izquierda: MEM + CPU */}
          <div className={styles.footerLeft}>
            <div className={styles.resourceRow}>
              <span className={styles.resourceLabel}>MEM limit</span>
              <input
                type="range"
                className={styles.slider}
                min={MEM_MIN}
                max={MEM_MAX}
                step={64}
                value={memLimit}
                onChange={(e) => setMemLimit(Number(e.target.value))}
                style={{ "--pct": `${memPct}%` } as React.CSSProperties}
              />
              <span className={styles.resourceValue}>{memLimit} MB</span>
            </div>
            <div className={styles.resourceRow}>
              <span className={styles.resourceLabel}>CPU Cores</span>
              <input
                type="range"
                className={styles.slider}
                min={CPU_MIN}
                max={CPU_MAX}
                step={CPU_STEP}
                value={cpuCores}
                onChange={(e) => setCpuCores(Number(Number(e.target.value).toFixed(1)))}
                style={{ "--pct": `${cpuPct}%` } as React.CSSProperties}
              />
              <span className={styles.resourceValue}>{cpuCores.toFixed(1)}</span>
            </div>
          </div>

          {/* Derecha: Puerto + Checkbox + Botones */}
          <div className={styles.footerRight}>
            <div className={styles.portRow}>
              <span className={styles.resourceLabel}>Puerto</span>
              <input
                className={`${styles.modalInput} ${styles.portInput}`}
                placeholder="DEFAULT"
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={autoStart}
                onChange={(e) => setAutoStart(e.target.checked)}
              />
              <span className={styles.checkLabel}>Levantar al cerrar</span>
            </label>
            <div className={styles.btnGroup}>
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

  const handleCreate: NewServiceModalProps["onCreate"] = async (params) => {
    const newSvc = await createService(params);
    setServices((prev) => [...prev, newSvc]);
  };

  return (
    <>
      <div className={styles.page}>
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

      <NewServiceModal
        open={modal}
        onClose={() => setModal(false)}
        onCreate={handleCreate}
      />
    </>
  );
};

export default ServiciosPage;
