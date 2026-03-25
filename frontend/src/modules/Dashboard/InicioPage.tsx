import { useEffect, useState, useCallback } from "react";
import { Icon } from "../../components/Icons";
import { DockerEngineCard }  from "../../components/DockerEngineCard/DockerEngineCard";
import { ContainersCard }    from "../../components/ContainersCard/ContainersCard";
import { StatCounterCard }   from "../../components/StatCounterCard/StatCounterCard";
import { MetricChart }       from "../../components/MetricChart/MetricChart";
import {
  fetchDockerCounters,
  fetchMetricsHistory,
  fetchMetricsSnapshot,
  type DockerCounters,
  type MetricPoint,
} from "../../services/home.service";
import styles from "./InicioPage.module.css";

/* ============================================================
   InicioPage
   Orquesta la carga de datos y compone los widgets del home.

   Decisiones de arquitectura:
   - DockerEngineCard maneja su propio fetch internamente
     (es autocontenida, no necesita estado en el padre).
   - DockerCounters se carga aquí y se pasa como props a
     ContainersCard y StatCounterCard (un solo fetch compartido).
   - MetricChart recibe el historial inicial desde aquí y
     gestiona su propio polling via la prop `fetchPoint`.
   ============================================================ */
const InicioPage: React.FC = () => {

  /* ---- Contadores Docker --------------------------------- */
  const [counters,        setCounters]        = useState<DockerCounters | null>(null);
  const [countersLoading, setCountersLoading] = useState(true);

  useEffect(() => {
    fetchDockerCounters()
      .then(setCounters)
      .catch(console.error)
      .finally(() => setCountersLoading(false));
  }, []);

  /* ---- Historial inicial de métricas -------------------- */
  const [cpuHistory, setCpuHistory] = useState<MetricPoint[]>([]);
  const [ramHistory, setRamHistory] = useState<MetricPoint[]>([]);

  useEffect(() => {
    fetchMetricsHistory()
      .then(({ cpu, ram }) => {
        setCpuHistory(cpu);
        setRamHistory(ram);
      })
      .catch(console.error);
  }, []);

  /* ---- fetchPoint para polling de CPU ------------------- */
  const fetchCpuPoint = useCallback(async (): Promise<MetricPoint> => {
    const snap = await fetchMetricsSnapshot();
    return snap.cpu;
  }, []);

  /* ---- fetchPoint para polling de RAM ------------------- */
  const fetchRamPoint = useCallback(async (): Promise<MetricPoint> => {
    const snap = await fetchMetricsSnapshot();
    return snap.ram;
  }, []);

  /* ---- Render -------------------------------------------- */
  return (
    <div className={styles.page}>

      {/* ---- Header ---- */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon name="home" className={styles.headerIcon} width={20} height={20} />
          <h1 className={styles.headerTitle}>Inicio</h1>
        </div>
        <button className={styles.headerAction} aria-label="Añadir">
          <Icon name="plus" width={16} height={16} />
        </button>
      </header>

      {/* ---- Docker Engine ---- */}
      <section className={styles.section}>
        <DockerEngineCard />
      </section>

      {/* ---- Contadores: Contenedores / Imágenes / Plantillas ---- */}
      <section className={styles.section}>
        <div className={styles.statsGrid}>

          {/* Contenedores — columna izquierda, ocupa 2 filas */}
          <div className={styles.containerSlot}>
            <ContainersCard
              data={counters?.containers}
              loading={countersLoading}
            />
          </div>

          {/* Imágenes — columna derecha, fila 1 */}
          <div className={styles.statSlot}>
            <StatCounterCard
              icon="box"
              label="Imágenes"
              value={counters?.images}
              loading={countersLoading}
            />
          </div>

          {/* Plantillas — columna derecha, fila 2 */}
          <div className={styles.statSlot}>
            <StatCounterCard
              icon="squares"
              label="Plantillas"
              value={counters?.templates}
              loading={countersLoading}
            />
          </div>

        </div>
      </section>

      <div className={styles.divider} />

      {/* ---- Gráfica CPU ---- */}
      <section className={styles.section}>
        <MetricChart
          label="CPU"
          color="#4ade80"
          initialData={cpuHistory}
          fetchPoint={fetchCpuPoint}
          pollingMs={5000}
          chartHeight={110}
          maxPoints={30}
        />
      </section>

      {/* ---- Gráfica RAM ---- */}
      <section className={styles.section}>
        <MetricChart
          label="RAM"
          color="#f9a8d4"
          initialData={ramHistory}
          fetchPoint={fetchRamPoint}
          pollingMs={5000}
          chartHeight={110}
          maxPoints={30}
        />
      </section>

    </div>
  );
};

export default InicioPage;