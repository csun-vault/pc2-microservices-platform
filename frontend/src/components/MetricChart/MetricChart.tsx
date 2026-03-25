import { useEffect, useRef, useState, useCallback, useId } from "react";
import { BaseCard } from "../Cards/BaseCard";
import { Icon } from "../Icons";
import type { MetricPoint } from "../../services/home.service";
import styles from "./MetricChart.module.css";

interface MetricChartProps {
  label:        string;
  color:        string;
  initialData?: MetricPoint[];
  fetchPoint?:  () => Promise<MetricPoint>;
  pollingMs?:   number;
  chartHeight?: number;
  maxPoints?:   number;
}

/* ============================================================
   Helper — path SVG suavizado con Bézier cúbicas
   ============================================================ */
function buildSmoothPath(pts: { x: number; y: number }[], tension = 0.3): string {
  if (pts.length < 2) return "";
  const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const cpX = (c.x - p.x) * tension;
    d.push(`C ${p.x + cpX} ${p.y}, ${c.x - cpX} ${c.y}, ${c.x} ${c.y}`);
  }
  return d.join(" ");
}

/* ============================================================
   MetricChart
   ============================================================ */
export const MetricChart: React.FC<MetricChartProps> = ({
  label,
  color,
  initialData  = [],
  fetchPoint,
  pollingMs    = 5000,
  chartHeight  = 110,
  maxPoints    = 30,
}) => {
  const [points,  setPoints]  = useState<MetricPoint[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /*
    useId genera un ID único por instancia del componente.
    Es necesario porque tenemos dos MetricChart en la misma
    página (CPU y RAM) y cada uno necesita su propio <defs>
    en el SVG — si comparten el mismo id="grad", el segundo
    sobreescribe el primero y ambos usan el mismo color.
  */
  const uid    = useId().replace(/:/g, "");
  const gradId = `mgGrad_${uid}`;

  /* ---- Polling ------------------------------------------- */
  const poll = useCallback(async () => {
    if (!fetchPoint) return;
    try {
      const pt = await fetchPoint();
      setPoints((prev) => {
        const next = [...prev, pt];
        return next.length > maxPoints ? next.slice(next.length - maxPoints) : next;
      });
      setLoading(false);
    } catch { /* silencioso */ }
  }, [fetchPoint, maxPoints]);

  useEffect(() => {
    if (fetchPoint) poll();
    if (fetchPoint && pollingMs > 0) {
      timerRef.current = setInterval(poll, pollingMs);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [poll, fetchPoint, pollingMs]);

  useEffect(() => {
    if (initialData.length > 0) { setPoints(initialData); setLoading(false); }
  }, [initialData]);

  /* ---- Cálculo de coordenadas ----------------------------
     CLAVE: usamos un viewBox con proporciones FIJAS (600×100)
     y preserveAspectRatio="xMidYMid meet" para que el SVG
     escale manteniendo proporciones — nunca aplasta el contenido.
     El texto (labels del eje Y) vive FUERA del SVG en HTML
     para que no se deforme al redimensionar.
  ---------------------------------------- */
  const VW       = 600;
  const VH       = 100;
  const PAD_TOP  = 6;
  const PAD_BOT  = 6;
  const PAD_L    = 4;   // sin padding izquierdo — los labels van en HTML
  const PAD_R    = 4;
  const plotW    = VW - PAD_L - PAD_R;
  const plotH    = VH - PAD_TOP - PAD_BOT;

  const toSvg = (pt: MetricPoint, i: number, total: number) => ({
    x: PAD_L + (i / Math.max(total - 1, 1)) * plotW,
    y: PAD_TOP + plotH - (Math.min(100, Math.max(0, pt.value)) / 100) * plotH,
  });

  const svgPts   = points.map((p, i) => toSvg(p, i, points.length));
  const linePath = buildSmoothPath(svgPts);
  const areaPath = svgPts.length >= 2
    ? `${linePath} L ${svgPts[svgPts.length - 1].x} ${PAD_TOP + plotH} L ${svgPts[0].x} ${PAD_TOP + plotH} Z`
    : "";

  const lastPt     = svgPts[svgPts.length - 1];
  const currentVal = points[points.length - 1]?.value ?? 0;

  // Posición Y del label del valor actual — mapeada al alto del contenedor
  const valLabelPct = lastPt
    ? ((lastPt.y / VH) * 100).toFixed(1)
    : "50";

  /* ---- Render -------------------------------------------- */
  return (
    <BaseCard variant="normal" padding="none" radius="xl">
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Icon name="chartBar" className={styles.headerIcon} />
            <span className={styles.title}>
              Uso <strong className={styles.titleBold}>{label}</strong>
            </span>
          </div>
          <button className={styles.moreBtn} aria-label="Más opciones">···</button>
        </div>

        {/* Chart area */}
        {loading ? (
          <div className={styles.skeleton} style={{ height: chartHeight }} />
        ) : (
          <div className={styles.chartArea} style={{ height: chartHeight }}>

            {/* Labels eje Y — HTML puro, nunca se deforman */}
            <div className={styles.yAxis}>
              {[40, 30, 20, 10, 0].map((v) => (
                <span key={v} className={styles.yLabel}>
                  {v}%
                </span>
              ))}
            </div>

            {/* Wrapper del SVG — ocupa el resto del ancho */}
            <div className={styles.svgWrapper}>

              {/* Valor actual — flotante sobre el SVG */}
              <span
                className={styles.currentValue}
                style={{ color, top: `${valLabelPct}%` }}
              >
                {currentVal.toFixed(1)}%
              </span>

              <svg
                className={styles.chartSvg}
                viewBox={`0 0 ${VW} ${VH}`}
                /*
                  preserveAspectRatio="none" estiraba el SVG.
                  Con "xMidYMid meet" el SVG escala proporcionalmente
                  y nunca aplasta ni el texto ni la línea.
                  "xMinYMin meet" alinea arriba-izquierda.
                */
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={`Gráfica uso ${label}`}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.55" />
                    <stop offset="100%" stopColor={color} stopOpacity="0"    />
                  </linearGradient>
                </defs>

                {/* Líneas guía horizontales — solo líneas, sin texto */}
                {[40, 30, 20, 10, 0].map((v) => {
                  const y = PAD_TOP + plotH - (v / 100) * plotH;
                  return (
                    <line
                      key={v}
                      x1={PAD_L} y1={y}
                      x2={VW - PAD_R} y2={y}
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Área degradada */}
                {areaPath && (
                  <path d={areaPath} fill={`url(#${gradId})`} stroke="none" opacity="1" />
                )}

                {/* Línea principal */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Punto del valor más reciente */}
                {lastPt && (
                  <circle
                    cx={lastPt.x}
                    cy={lastPt.y}
                    r="3"
                    fill={color}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                  />
                )}
              </svg>
            </div>
          </div>
        )}

      </div>
    </BaseCard>
  );
};

export default MetricChart;