import { Icon } from "../Icons";
import { BaseCard } from "../Cards/BaseCard";
import type { ContainersStats } from "../../services/home.service";
import styles from "./ContainersCard.module.css";

type IconColor = "green" | "yellow" | "red";

const ICON_CLASS:  Record<IconColor, string> = {
  green:  styles.iconGreen,
  yellow: styles.iconYellow,
  red:    styles.iconRed,
};
const COUNT_CLASS: Record<IconColor, string> = {
  green:  styles.countGreen,
  yellow: styles.countYellow,
  red:    styles.countRed,
};

interface ContainersCardProps {
  data?:    ContainersStats;
  loading?: boolean;
}

/* ============================================================
   ContainersCard
   Bloque grande que muestra el total de contenedores
   y sus sub-estados (running / stopped / error).
   ============================================================ */
export const ContainersCard: React.FC<ContainersCardProps> = ({ data, loading = false }) => {
  return (
    <BaseCard variant="normal" padding="none" radius="xl" tilt tiltMax={1}>
      <div className={styles.card}>

        {/* Header */}
        <div className={styles.header}>
          <Icon name="container" className={styles.headerIcon} />
          <span className={styles.headerLabel}>Contenedores</span>
        </div>

        {/* Body */}
        <div className={styles.body}>

          {/* Sub-estados */}
          <div className={styles.subStates}>
            {loading || !data ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.subStateRow}>
                  <div style={{
                    width: 13, height: 13, borderRadius: 4,
                    background: "rgba(255,255,255,0.08)",
                  }} />
                  <div style={{
                    width: 24, height: 11, borderRadius: 4,
                    background: "rgba(255,255,255,0.08)",
                  }} />
                </div>
              ))
            ) : (
              data.subStates.map((s) => (
                <div key={s.label} className={styles.subStateRow}>
                  <Icon
                    name={s.label === "Running" ? "on" : s.label === "Stopped" ? "off" : "errorIcon"}
                    className={`${styles.subStateIcon} ${ICON_CLASS[s.label === "Running" ? "green" : s.label === "Stopped" ? "yellow" : "red"]}`}
                  />
                  <span className={`${styles.subStateCount} ${COUNT_CLASS[s.label === "Running" ? "green" : s.label === "Stopped" ? "yellow" : "red"]}`}>
                    {s.count}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Total */}
          {loading || !data ? (
            <div className={styles.skeletonTotal} />
          ) : (
            <span className={styles.total}>{data.total}</span>
          )}

        </div>
      </div>
    </BaseCard>
  );
};

export default ContainersCard;