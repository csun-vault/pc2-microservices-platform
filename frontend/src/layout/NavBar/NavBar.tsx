import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "../../components/Icons";
import styles from "./navbar.module.css";

/* ============================================================
   Types
   ============================================================ */
type NavItemId = "inicio" | "servicios" | "detalles" | "perfil";
type DotState  = "idle" | "launching" | "landing";

interface NavItemConfig {
  id:    NavItemId;
  label: string;
  icon:  React.ComponentProps<typeof Icon>["name"];
  path:  string;
}

/* ============================================================
   Config
   ============================================================ */
const NAV_ITEMS: NavItemConfig[] = [
  { id: "inicio",    label: "Inicio",    icon: "home",      path: "/" },
  { id: "servicios", label: "Servicios", icon: "container", path: "/servicios" },
  { id: "detalles",  label: "Detalles",  icon: "list",      path: "/detalles" },
  { id: "perfil",    label: "Perfil",    icon: "user",      path: "/perfil" },
];

const MODAL_ACTIONS = [
  { label: "[⚡WIP ] Nuevo contenedor", icon: "container" as const },
  { label: "[⚡WIP ] Nueva imagen",     icon: "box"       as const },
  { label: "[⚡WIP ] Nuevo volumen",    icon: "squares"   as const },
];

/* ============================================================
   Helper — genera el SVG path de la barra con concavidad
   ============================================================
   Coordenadas (sistema SVG = ancho x alto del .track):
     w  = ancho total
     h  = alto total (76px)
     r  = radio de las esquinas de la cápsula (= h/2 = 38)
     cx = centro horizontal (= w/2)
     cr = radio de la concavidad semicircular (encaja el botón +)
        = 36px  (botón de 60px / 2 + 6px de margen)
     cd = qué tan profunda baja la curva desde el borde superior
        = cr   (semicírculo perfecto)

   El path recorre la barra en sentido horario:
   inicio arriba-izquierda → esquina arriba-izq redondeada →
   borde superior hasta la concavidad →
   arco cóncavo (curva hacia ADENTRO = arriba) →
   borde superior hasta esquina arriba-der →
   esquina arriba-der redondeada →
   borde derecho → esquina abajo-der →
   borde inferior → esquina abajo-izq → cierre
*/
function buildNavPath(w: number, h: number): string {
  const r  = h / 2;          // radio cápsulas laterales (38)
  const cx = w / 2;          // centro horizontal
  const cr = 38;             // radio concavidad (botón 60px / 2 + holgura)
  // margen extra a cada lado de la concavidad para la transición suave
  const sweep = cr + 14;

  // Puntos donde la borda superior llega hasta la concavidad
  const x1 = cx - sweep;    // inicio arco cóncavo
  const x2 = cx + sweep;    // fin arco cóncavo

  /*
    SVG arc:  A rx ry x-rotation large-arc-flag sweep-flag x y
    sweep-flag = 0 → anticlockwise (curva hacia adentro = cóncava)
    large-arc-flag = 0 → arco menor
  */
  return [
    `M ${r} 0`,                                    // inicio borde superior izq
    `Q 0 0 0 ${r}`,                                // esquina redondeada izq sup
    `L 0 ${h - r}`,                                // borde izquierdo
    `Q 0 ${h} ${r} ${h}`,                          // esquina redondeada izq inf
    `L ${w - r} ${h}`,                             // borde inferior
    `Q ${w} ${h} ${w} ${h - r}`,                   // esquina redondeada der inf
    `L ${w} ${r}`,                                 // borde derecho
    `Q ${w} 0 ${w - r} 0`,                         // esquina redondeada der sup
    `L ${x2} 0`,                                   // borde superior → concavidad der
    // Arco cóncavo: sweep=1 = gira horario = curva "hacia abajo" (mordida real)
    `A ${cr} ${cr} 0 0 1 ${x1} 0`,                // arco semicircular cóncavo
    `L ${r} 0`,                                    // borde superior ← concavidad izq
    `Z`,
  ].join(" ");
}

/* ============================================================
   NavBar Component
   ============================================================ */
export const NavBar: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* Pestaña activa derivada de la URL */
  const activeFromPath = (): NavItemId => {
    const match = NAV_ITEMS.find((item) => {
      if (item.path === "/") return location.pathname === "/";
      return location.pathname.startsWith(item.path);
    });
    return match?.id ?? "inicio";
  };

  const [activeId,    setActiveId]    = useState<NavItemId>(activeFromPath);
  const [prevId,      setPrevId]      = useState<NavItemId | null>(null);
  const [dotState,    setDotState]    = useState<DotState>("idle");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [modalRender, setModalRender] = useState(false);

  /* Dimensiones reales del contenedor para el path SVG */
  const trackRef  = useRef<HTMLDivElement>(null);
  const [trackW,  setTrackW]  = useState(500);   // fallback hasta que se mida
  const trackH = 76;

  useEffect(() => {
    if (!trackRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setTrackW(entry.contentRect.width);
    });
    ro.observe(trackRef.current);
    setTrackW(trackRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  /* Sync URL → tab activa */
  useEffect(() => {
    setActiveId(activeFromPath());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ---- Animación del punto -------------------------------- */
  const dotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavClick = useCallback(
    (item: NavItemConfig) => {
      if (item.id === activeId) return;
      if (dotTimerRef.current) clearTimeout(dotTimerRef.current);

      setPrevId(activeId);
      setDotState("launching");

      dotTimerRef.current = setTimeout(() => {
        setActiveId(item.id);
        setDotState("landing");
        navigate(item.path);

        dotTimerRef.current = setTimeout(() => {
          setDotState("idle");
          setPrevId(null);
        }, 800);
      }, 280);
    },
    [activeId, navigate]
  );

  useEffect(() => () => { if (dotTimerRef.current) clearTimeout(dotTimerRef.current); }, []);

  /* ---- Modal ---------------------------------------------- */
  const openModal = () => {
    setModalRender(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalOpen(true)));
  };

  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setModalRender(false), 380);
  };

  /* ---- Helpers de clases ---------------------------------- */
  const getDotClass = (itemId: NavItemId): string => {
    const base = styles.dot;
    if (dotState === "launching" && itemId === prevId)   return `${base} ${styles.dotLaunching}`;
    if (dotState === "landing"   && itemId === activeId) return `${base} ${styles.dotLanding}`;
    return base;
  };

  const getItemClass = (itemId: NavItemId): string =>
    itemId === activeId
      ? `${styles.navItem} ${styles.navItemActive}`
      : styles.navItem;

  /* ---- Path SVG generado ---------------------------------- */
  const svgPath = buildNavPath(trackW, trackH);

  /* ============================================================
     Render
     ============================================================ */
  return (
    <>
      {/* ---- Modal ---- */}
      {modalRender && (
        <div
          className={
            modalOpen
              ? `${styles.modalOverlay} ${styles.modalOverlayVisible}`
              : styles.modalOverlay
          }
          onClick={closeModal}
        >
          <div
            className={modalOpen ? `${styles.modal} ${styles.modalVisible}` : styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Añadir servicio</h2>
            <p className={styles.modalSubtitle}>Selecciona qué quieres crear</p>

            <div className={styles.modalActions}>
              {MODAL_ACTIONS.map((action) => (
                <button key={action.label} className={styles.modalAction} onClick={closeModal} disabled >
                  <span className={styles.modalActionIcon}>
                    <Icon name={action.icon} />
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- NavBar ---- */}
      <nav className={styles.wrapper} aria-label="Navegación principal">
        <div className={styles.track} ref={trackRef}>

          {/* SVG de fondo con la forma de cuna */}
          <svg
            className={styles.trackSvg}
            viewBox={`0 0 ${trackW} ${trackH}`}
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              {/* Gradiente para el brillo interno tipo vidrio */}
              <linearGradient id="navGlassGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgba(255,255,255,0.28)" />
                <stop offset="50%"  stopColor="rgba(255,255,255,0.04)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
              </linearGradient>

              {/* Filtro blur para el backdrop simulado en SVG (refuerzo visual) */}
              <filter id="navBlur" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="0.5" />
              </filter>
            </defs>

            {/* Capa de relleno principal — glassmorphism */}
            <path
              d={svgPath}
              fill="rgba(255,255,255,0.13)"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1"
            />

            {/* Capa de brillo superior */}
            <path
              d={svgPath}
              fill="url(#navGlassGrad)"
              stroke="none"
            />

            {/* Borde interior inferior sutil (profundidad) */}
            <path
              d={svgPath}
              fill="none"
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1"
              transform={`translate(0, 1)`}
              opacity="0.5"
            />
          </svg>

          {/* Mitad izquierda — Inicio + Servicios */}
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <button
              key={item.id}
              className={getItemClass(item.id)}
              onClick={() => handleNavClick(item)}
              aria-current={activeId === item.id ? "page" : undefined}
            >
              <span className={getDotClass(item.id)} aria-hidden="true" />
              <span className={styles.navIcon}>
                <Icon name={item.icon} width={24} height={24} aria-hidden="true" />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}

          {/* Espaciador central */}
          <div className={styles.centerSpacer} aria-hidden="true" />

          {/* Mitad derecha — Detalles + Perfil */}
          {NAV_ITEMS.slice(2).map((item) => (
            <button
              key={item.id}
              className={getItemClass(item.id)}
              onClick={() => handleNavClick(item)}
              aria-current={activeId === item.id ? "page" : undefined}
              disabled={item.id === "perfil"}
            >
              <span className={getDotClass(item.id)} aria-hidden="true" />
              <span className={styles.navIcon}>
                <Icon name={item.icon} width={24} height={24} aria-hidden="true" />
              </span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}

          {/* Botón central + */}
          <button
            className={
              modalOpen
                ? `${styles.centerBtn} ${styles.centerBtnOpen}`
                : styles.centerBtn
            }
            onClick={modalOpen ? closeModal : openModal}
            aria-label="Añadir servicio"
            aria-expanded={modalOpen}
          >
            <Icon
              name="plus"
              className={styles.centerBtnIcon}
              width={26}
              height={26}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    </>
  );
};

export default NavBar;