import { useLocation } from "react-router-dom";
import { useNavDirection } from "../../hooks/useNavDirection";
import styles from "./PageTransition.module.css";

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * PageTransition — slide horizontal con dirección automática.
 *
 * useNavDirection() calcula la dirección sincrónicamente
 * durante este render, así que cuando React monta el nuevo
 * div (por el cambio de key), animClass ya tiene el valor
 * correcto — sin condiciones de carrera.
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
      <div key={location.pathname} className={`${styles.page} ${animClass}`}>
        {children}
      </div>
    </div>
  );
};

export default PageTransition;