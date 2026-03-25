import { useEffect, useState } from "react";
import { BaseCard } from "../Cards/BaseCard";
import { Icon } from "../Icons";
import {
  fetchDockerEngine,
  type DockerEngineInfo,
  type DockerStatus,
} from "../../services/home.service";
import styles from "./DockerEngine.module.css";

/* ---- Lookups ---- */
const DOT_CLASS: Record<DockerStatus, string> = {
  running: styles.dotRunning,
  stopped: styles.dotStopped,
  error:   styles.dotError,
};
const LABEL_CLASS: Record<DockerStatus, string> = {
  running: styles.labelRunning,
  stopped: styles.labelStopped,
  error:   styles.labelError,
};
const LABEL_TEXT: Record<DockerStatus, string> = {
  running: "Running",
  stopped: "Stopped",
  error:   "Error",
};

/* ============================================================
   DockerEngineCard
   ============================================================ */
export const DockerEngineCard: React.FC = () => {
  const [data,    setData]    = useState<DockerEngineInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    fetchDockerEngine()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    /*
      className={styles.wrapper} pasa height:100% al BaseCard
      para que se estire al alto de su contenedor en el grid.
    */
    <BaseCard variant="normal" padding="none" radius="xl" className={styles.wrapper} tilt tiltMax={1}>
      <div className={styles.card}>

        {/* Dot de estado */}
        {!loading && data && (
          <span className={`${styles.statusDot} ${DOT_CLASS[data.status]}`} />
        )}

        {/* Icono Docker */}
        <Icon name="docker" className={styles.dockerIcon} />

        {/* Nombre + versión */}
        <div className={styles.info}>
          {loading ? (
            <>
              <div className={styles.skeletonName} />
              <div className={styles.skeletonVersion} />
            </>
          ) : error ? (
            <span className={styles.name} style={{ color: "#f87171" }}>
              No disponible
            </span>
          ) : data ? (
            <>
              <span className={styles.name}>Docker Engine</span>
              <span className={styles.version}>Ver. {data.version}</span>
            </>
          ) : null}
        </div>

        {/* Label de estado */}
        {!loading && data && (
          <span className={`${styles.statusLabel} ${LABEL_CLASS[data.status]}`}>
            {LABEL_TEXT[data.status]}
          </span>
        )}

      </div>
    </BaseCard>
  );
};

export default DockerEngineCard;