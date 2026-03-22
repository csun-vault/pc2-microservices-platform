import { Outlet } from "react-router-dom";
import NavBar from "./NavBar/NavBar";
import styles from "./AppLayout.module.css";

/**
 * AppLayout — Layout principal de la aplicación.
 *
 * Responsabilidades:
 *   - Fondo oscuro con blobs decorativos animados
 *   - NavBar fija en la parte inferior
 *   - <Outlet /> donde React Router monta cada página
 *
 * NO gestiona títulos ni headers de página — cada módulo/vista
 * es dueño de su propio header (patrón "dumb layout").
 */
const AppLayout: React.FC = () => {
  return (
    <div className={styles.root}>
      {/* Blobs decorativos del fondo */}
      <div className={styles.blobPurple} aria-hidden="true" />
      <div className={styles.blobTeal}   aria-hidden="true" />
      <div className={styles.blobCenter} aria-hidden="true" />

      {/* Contenido de la página activa */}
      <main className={styles.content}>
        <Outlet />
      </main>

      {/* NavBar fija — siempre visible */}
      <NavBar />
    </div>
  );
};

export default AppLayout;