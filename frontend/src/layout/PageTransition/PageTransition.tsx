import { useLocation } from "react-router-dom";
import { useNavDirection } from "../../hooks/useNavDirection";
import styles from "./PageTransition.module.css";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition — envuelve el <Outlet /> de AppLayout.
 *
 * Detecta si el usuario navega "hacia adelante" o "hacia atrás"
 * en el orden canónico de tabs y aplica el slide correspondiente.
 *
 * Uso en AppLayout:
 *   <PageTransition>
 *     <Outlet />
 *   </PageTransition>
 *
 * La key={pathname} fuerza el re-mount en cada navegación,
 * lo que reinicia la animación CSS automáticamente.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location  = useLocation();
  const direction = useNavDirection();

  const animClass =
    direction === "forward"  ? styles.slideInRight :
    direction === "backward" ? styles.slideInLeft  :
    styles.fadeIn;

  return (
    <div className={styles.wrapper}>
      {/*
        key={location.pathname} es la pieza clave:
        React desmonta y remonta el div en cada cambio de ruta,
        lo que reinicia la animación CSS desde 0.
      */}
      <div key={location.pathname} className={`${styles.page} ${animClass}`}>
        {children}
      </div>
    </div>
  );
};

export default PageTransition;