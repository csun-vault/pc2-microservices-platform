import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/Icons";
import styles from "./InicioPage.module.css";

const InicioPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Icon name="home" className={styles.headerIcon} width={18} height={18} />
          <h1 className={styles.headerTitle}>Inicio</h1>
        </div>
        <button
          className={styles.headerAction}
          onClick={() => navigate("/servicios")}
          aria-label="Ir a servicios"
        >
          <Icon name="plus" width={16} height={16} />
        </button>
      </header>

      {/* Contenido vacío — añade tus widgets aquí */}
      <section className={styles.body} />
    </div>
  );
};

export default InicioPage;