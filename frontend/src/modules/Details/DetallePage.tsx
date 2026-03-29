import { useState, useEffect, useCallback } from "react";
import { Icon } from "../../components/Icons";
import {
    fetchServices,
    startService,
    stopService,
    deleteService,
    type Microservice,
} from "../../services/microservices.service";
import { ServiceCard } from "../CreateMS/ServiceCard";
import { ServiceDetailPanel } from "./ServiceDetailPanel";
import styles from "./DetallePage.module.css";
import serviciosStyles from "../CreateMS/ServiciosPage.module.css";

export const DetallePage: React.FC = () => {
    const [services, setServices] = useState<Microservice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<Microservice | null>(null);

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
            setSelectedService((prev) => (prev?.id === id ? updated : prev));
        } catch {
            setError("No se pudo iniciar el servicio.");
        }
    };

    const handleStop = async (id: string) => {
        try {
            setError(null);
            const updated = await stopService(id);
            setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
            setSelectedService((prev) => (prev?.id === id ? updated : prev));
        } catch {
            setError("No se pudo detener el servicio.");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            setError(null);
            await deleteService(id);
            setServices((prev) => prev.filter((s) => s.id !== id));
            setSelectedService((prev) => (prev?.id === id ? null : prev));
        } catch {
            setError("No se pudo eliminar el servicio.");
        }
    };

    const isEmpty = !loading && !error && services.length === 0;

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <Icon name="list" className={styles.headerIcon} width={18} height={18} />
                    <h1 className={styles.headerTitle}>Detalles</h1>
                </div>
            </header>

            {/* Click en área vacía cierra el panel */}
            <div
                className={`${styles.contentArea} ${selectedService ? styles.splitLayout : ""}`}
                onClick={() => setSelectedService(null)}
            >
                <div className={styles.gridWrapper}>
                    <div className={serviciosStyles.grid}>
                        {loading &&
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className={serviciosStyles.skeleton} />
                            ))}

                        {error && !loading && (
                            <div className={serviciosStyles.errorBox}>{error}</div>
                        )}

                        {isEmpty && (
                            <div className={serviciosStyles.emptyBox}>
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
                                    isSelected={selectedService?.id === svc.id}
                                    onSelect={setSelectedService}
                                />
                            ))}
                    </div>
                </div>

                {selectedService && (
                    <ServiceDetailPanel
                        service={selectedService}
                        onClose={() => setSelectedService(null)}
                        onStart={handleStart}
                        onStop={handleStop}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
};

export default DetallePage;