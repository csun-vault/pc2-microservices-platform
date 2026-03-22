import React, { useRef, useCallback } from "react";
import styles from "./BaseCard.module.css";

/* ============================================================
   Types
   ============================================================ */
export type CardVariant = "subtle" | "normal" | "strong";
export type CardStroke  = "none" | "default" | "accent";
export type CardPadding = "none" | "xs" | "sm" | "md" | "lg" | "xl";
export type CardRadius  = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface CardRadii {
  topLeft?:     string;
  topRight?:    string;
  bottomRight?: string;
  bottomLeft?:  string;
}

export interface BaseCardProps {
  children:   React.ReactNode;
  variant?:   CardVariant;
  stroke?:    CardStroke;
  padding?:   CardPadding;
  radius?:    CardRadius;
  radii?:     CardRadii;
  /**
   * Activa el efecto tilt 3D + spotlight que sigue al cursor.
   * Ideal para cards que quieres destacar visualmente.
   */
  tilt?:      boolean;
  /**
   * Intensidad máxima del tilt en grados. Default: 12
   * Valores recomendados: 6 (sutil) | 12 (normal) | 18 (dramático)
   */
  tiltMax?:   number;
  onClick?:   React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  style?:     React.CSSProperties;
  role?:      string;
  "aria-label"?: string;
}

/* ============================================================
   Lookup maps
   ============================================================ */
const VARIANT_CLASS: Record<CardVariant, string> = {
  subtle: styles.variantSubtle,
  normal: styles.variantNormal,
  strong: styles.variantStrong,
};
const STROKE_CLASS: Record<CardStroke, string> = {
  none:    styles.strokeNone,
  default: styles.strokeDefault,
  accent:  styles.strokeAccent,
};
const PADDING_CLASS: Record<CardPadding, string> = {
  none: styles.paddingNone,
  xs:   styles.paddingXs,
  sm:   styles.paddingSm,
  md:   styles.paddingMd,
  lg:   styles.paddingLg,
  xl:   styles.paddingXl,
};
const RADIUS_CLASS: Record<CardRadius, string> = {
  none:  styles.radiusNone,
  sm:    styles.radiusSm,
  md:    styles.radiusMd,
  lg:    styles.radiusLg,
  xl:    styles.radiusXl,
  "2xl": styles.radius2xl,
  full:  styles.radiusFull,
};

function buildBorderRadius(radii: CardRadii): string {
  const tl = radii.topLeft     ?? "16px";
  const tr = radii.topRight    ?? "16px";
  const br = radii.bottomRight ?? "16px";
  const bl = radii.bottomLeft  ?? "16px";
  return `${tl} ${tr} ${br} ${bl}`;
}

/* ============================================================
   Tilt hook — lógica aislada para claridad
   ============================================================

   Cómo funciona el tilt 3D + spotlight:

   1. onMouseMove:
      - Calcula la posición del cursor relativa al centro de la card
        normalizada entre -1 y +1 en ambos ejes.
      - Multiplica por `tiltMax` para obtener los grados de rotación.
      - Aplica `rotateX` y `rotateY` via style inline (sin CSS transition
        para que siga al cursor sin lag).
      - Actualiza las CSS custom properties --mouse-x / --mouse-y
        en porcentaje para que el gradiente del spotlight siga al cursor.

   2. onMouseLeave:
      - Añade la clase `tiltResting` que activa la transición CSS suave
        de vuelta a transform: none (efecto "spring back").
      - Resetea las custom properties del spotlight.
      - Quita `tiltResting` después de que termina la transición
        para no bloquear la siguiente entrada del mouse.
*/
function useTilt(tiltMax: number) {
  const cardRef    = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = cardRef.current;
      if (!el) return;

      const rect   = el.getBoundingClientRect();
      // Posición relativa al centro, normalizada -1..+1
      const xRel   = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
      const yRel   = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;

      // rotateY positivo → inclinación derecha, rotateX negativo → inclinación hacia arriba
      const rotY   =  xRel * tiltMax;
      const rotX   = -yRel * tiltMax;

      // Posición del spotlight en porcentaje
      const pctX   = ((e.clientX - rect.left)  / rect.width)  * 100;
      const pctY   = ((e.clientY - rect.top)   / rect.height) * 100;

      // Sin transition aquí — queremos que siga al cursor sin lag
      el.style.transition = "box-shadow 0.28s ease, background 0.28s ease, border-color 0.28s ease";
      el.style.transform  = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`;
      el.style.setProperty("--mouse-x", `${pctX}%`);
      el.style.setProperty("--mouse-y", `${pctY}%`);

      if (!isHovering.current) {
        isHovering.current = true;
        el.classList.add(styles.tiltActive);
        el.classList.remove(styles.tiltResting);
      }
    },
    [tiltMax]
  );

  const onMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;

    isHovering.current = false;

    // Activar transición suave para volver al reposo
    el.classList.remove(styles.tiltActive);
    el.classList.add(styles.tiltResting);
    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    el.style.setProperty("--mouse-x", "50%");
    el.style.setProperty("--mouse-y", "50%");

    // Limpiar clase después de la transición (0.55s en CSS)
    setTimeout(() => {
      if (el && !isHovering.current) {
        el.classList.remove(styles.tiltResting);
        el.style.transform  = "";
        el.style.transition = "";
      }
    }, 560);
  }, []);

  return { cardRef, onMouseMove, onMouseLeave };
}

/* ============================================================
   Component
   ============================================================ */

/**
 * BaseCard — contenedor glass reutilizable.
 *
 * ```tsx
 * // Básica
 * <BaseCard>contenido</BaseCard>
 *
 * // Con tilt 3D + spotlight
 * <BaseCard tilt tiltMax={10} variant="strong">contenido</BaseCard>
 *
 * // Esquinas personalizadas
 * <BaseCard radii={{ topLeft: "0", topRight: "0" }}>contenido</BaseCard>
 *
 * // Card interactiva con acento
 * <BaseCard stroke="accent" onClick={fn}>contenido</BaseCard>
 * ```
 */
export const BaseCard: React.FC<BaseCardProps> = ({
  children,
  variant  = "normal",
  stroke   = "default",
  padding  = "md",
  radius   = "lg",
  radii,
  tilt     = false,
  tiltMax  = 12,
  onClick,
  className = "",
  style,
  role,
  "aria-label": ariaLabel,
}) => {
  const { cardRef, onMouseMove, onMouseLeave } = useTilt(tiltMax);

  const borderRadius = radii ? buildBorderRadius(radii) : undefined;

  const composedClass = [
    styles.card,
    VARIANT_CLASS[variant],
    STROKE_CLASS[stroke],
    PADDING_CLASS[padding],
    !radii ? RADIUS_CLASS[radius] : "",
    onClick ? styles.interactive : "",
    className,
  ].filter(Boolean).join(" ");

  const composedStyle: React.CSSProperties = {
    ...(borderRadius ? { borderRadius } : {}),
    ...style,
  };

  return (
    <div
      ref={cardRef}
      className={composedClass}
      style={composedStyle}
      onClick={onClick}
      role={role ?? (onClick ? "button" : undefined)}
      aria-label={ariaLabel}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(e as never); }
          : undefined
      }
      /* Tilt handlers — solo se activan si tilt=true */
      onMouseMove={tilt ? onMouseMove : undefined}
      onMouseLeave={tilt ? onMouseLeave : undefined}
    >
      {/* Spotlight layer — solo se renderiza si tilt=true */}
      {tilt && <div className={styles.spotlight} aria-hidden="true" />}

      {children}
    </div>
  );
};

export default BaseCard;