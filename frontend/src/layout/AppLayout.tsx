import { Outlet } from "react-router-dom";
import NavBar        from "./NavBar/NavBar";
import PageTransition from "./PageTransition/PageTransition";
import styles from "./AppLayout.module.css";

const AppLayout: React.FC = () => {
  return (
    <div className={styles.root}>
      <div className={styles.blobPurple} aria-hidden="true" />
      <div className={styles.blobTeal}   aria-hidden="true" />
      <div className={styles.blobCenter} aria-hidden="true" />

      <main className={styles.content}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <NavBar />
    </div>
  );
};

export default AppLayout;