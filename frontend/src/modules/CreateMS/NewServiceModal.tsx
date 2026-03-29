import { useState, useEffect, useRef } from "react";
import { Icon } from "../../components/Icons";
import styles from "./ServiciosPage.module.css";
import { extractPortFromCode } from "./Modal.helper";

type Language = "python" | "node";

export interface NewServiceModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (params: {
        name: string;
        internalPort: number | null;
        externalPort: number | null;
        sourceCode: string;
        language: Language;
        memLimitMB: number;
        cpuCores: number;
        autoStart: boolean;
        description: string;
    }) => Promise<void>;
}

const DEFAULT_CODE_PYTHON =
    `# Escribe tu código aquí\ndef saludar():\n    return jsonify({"status": "ok", "data": "hola"})`;
const DEFAULT_CODE_NODE =
    `// Escribe tu código aquí\nconst saludar = (req, res) => {\n  res.json({ status: "ok", data: "hola" });\n};`;

const MEM_MIN = 64;
const MEM_MAX = 4096;
const CPU_MIN = 0.1;
const CPU_MAX = 8;
const CPU_STEP = 0.1;

export const NewServiceModal: React.FC<NewServiceModalProps> = ({ open, onClose, onCreate }) => {
    const [name, setName] = useState("");
    const [internalPort, setInternalPort] = useState("");
    const [externalPort, setExternalPort] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [language, setLanguage] = useState<Language>("python");
    const [langOpen, setLangOpen] = useState(false);
    const [memLimit, setMemLimit] = useState(512);
    const [cpuCores, setCpuCores] = useState(1);
    const [autoStart, setAutoStart] = useState(false);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(true);

    const mountedRef = useRef(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    /* Animación entrada / salida + reset completo al abrir */
    useEffect(() => {
        if (open) {
            /* Reset de todos los campos cada vez que se abre */
            setName("");
            setInternalPort("");
            setExternalPort("");
            setCode("");
            setDescription("");
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
        setDescription("");
    };

    const handleSubmit = async () => {
        if (!name.trim() || !code.trim()) return;
        setLoading(true);
        try {
            await onCreate({
                name: name.trim(),
                internalPort: internalPort ?  Number(internalPort) : 4010,
                externalPort: externalPort ? Number(externalPort) : null,
                sourceCode: code,
                language,
                memLimitMB: memLimit,
                cpuCores,
                autoStart,
                description: description || "",
            });
        } finally {
            onClose(); // el reset lo maneja el useEffect al cambiar open → false → true
            setLoading(false);
        }
    };

    const isValid = name.trim() && code.trim();

    /* Porcentajes para el track del slider */
    const memPct = ((memLimit - MEM_MIN) / (MEM_MAX - MEM_MIN)) * 100;
    const cpuPct = ((cpuCores - CPU_MIN) / (CPU_MAX - CPU_MIN)) * 100;

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
                        onChange={(e) => setName(e.target.value.toLowerCase())}
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
                        onChange={(e) => {
                            const newCode = e.target.value;
                            setCode(newCode);

                            const detectedPort = extractPortFromCode(newCode);
        
                            if (detectedPort !== null) {
                                setInternalPort(String(detectedPort));
                            }
                        }}                        
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
                        <div className={styles.descriptionWrapper}>
                            <textarea
                                className={styles.editor}
                                placeholder="Describe tu microservicio"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                spellCheck={false}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                            />
                        </div>
                    </div>

                    {/* Derecha: Puerto + Checkbox + Botones */}
                    <div className={styles.footerRight}>

                        <div className={styles.portRow}>
                            <span className={styles.resourceLabel}>Puerto</span>
                            <input
                                className={`${styles.modalInput} ${styles.portInput}`}
                                placeholder="INTERNAL"
                                type="number"
                                min={1}
                                max={65535}
                                value={internalPort}
                                onChange={(e) => setInternalPort(e.target.value)}
                                disabled
                            />
                            /
                            <input
                                className={`${styles.modalInput} ${styles.portInput}`}
                                placeholder="EXTERNAL"
                                type="number"
                                min={1}
                                max={65535}
                                value={externalPort}
                                onChange={(e) => setExternalPort(e.target.value)}
                            />
                        </div>

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
                        <div className={styles.separator}></div>
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
