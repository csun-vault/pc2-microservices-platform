import { useState, useEffect, useCallback } from "react";
import { Icon } from "../../components/Icons";
import {
  fetchServices,
  startService,
  stopService,
  deleteService,
  createService,
  type Microservice,
} from "../../services/microservices.service";
import styles from "./ServiciosPage.module.css";
import { ServiceCard } from "./ServiceCard";
import { NewServiceModal, NewServiceModalProps } from "./NewServiceModal";

export const ServiciosPage: React.FC = () => {
  const [services, setServices] = useState<Microservice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);

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

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleStart = async (id: string) => {
    try {
      setError(null);
      const updated = await startService(id);
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setError("No se pudo iniciar el servicio.");
    }
  };

  const handleStop = async (id: string) => {
    try {
      setError(null);
      const updated = await stopService(id);
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setError("No se pudo detener el servicio.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("No se pudo eliminar el servicio.");
    }
  };

  const handleCreate: NewServiceModalProps["onCreate"] = async (params) => {
    try {
      setError(null);
      const newSvc = await createService(params);
      setServices((prev) => [...prev, newSvc]);
      setModal(false);
    } catch (err) {
      setError(`No se pudo crear el servicio. ${err}`);
      throw new Error("CREATE_FAILED");
    }
  };

  const isEmpty = !loading && !error && services.length === 0;

  return (
    <>
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Icon
              name="container"
              className={styles.headerIcon}
              width={18}
              height={18}
            />
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
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}

          {error && !loading && <div className={styles.errorBox}>{error}</div>}

          {isEmpty && (
            <div className={styles.emptyBox}>
              No se encontraron servicios.
            </div>
          )}

          {!loading &&
            !error &&
            services.map((svc, i) => (
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