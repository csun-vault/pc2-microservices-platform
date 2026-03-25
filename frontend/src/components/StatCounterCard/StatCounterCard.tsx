import { BaseCard } from "../Cards/BaseCard";
import { Icon } from "../Icons";
import type { CardRadius } from "../Cards/BaseCard";
import styles from "./StatCounterCard.module.css";

interface StatCounterCardProps {
  /** Icono del componente Icon */
  icon:     React.ComponentProps<typeof Icon>["name"];
  /** Etiqueta del contador */
  label:    string;
  /** Valor numérico a mostrar */
  value?:   number;
  /** Estado de carga */
  loading?: boolean;
  /** Esquinas personalizadas — para encajar en grids con bordes compartidos */
  radius?:  CardRadius;
  radii?:   React.ComponentProps<typeof BaseCard>["radii"];
}

/* ============================================================
   StatCounterCard
   Bloque compacto reutilizable: icono + label + número grande.
   Úsalo para Imágenes, Plantillas, Redes, Volúmenes, etc.

   Ejemplo:
   <StatCounterCard icon="box"     label="Imágenes"   value={6} />
   <StatCounterCard icon="squares" label="Plantillas" value={2} />
   ============================================================ */
export const StatCounterCard: React.FC<StatCounterCardProps> = ({
  icon,
  label,
  value,
  loading = false,
  radius  = "xl",
  radii,
}) => {
  return (
    <BaseCard
      variant="normal"
      padding="none"
      radius={radius}
      radii={radii}
      tilt
      tiltMax={1}
    >
      <div className={styles.card}>
        <div className={styles.header}>
          <Icon name={icon} className={styles.icon} />
          <span className={styles.label}>{label}</span>
        </div>

        {loading || value === undefined ? (
          <div className={styles.skeletonValue} />
        ) : (
          <span className={styles.value}>{value}</span>
        )}
      </div>
    </BaseCard>
  );
};

export default StatCounterCard;