import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../layout/AppLayout";
import InicioPage from "../modules/Dashboard/InicioPage";
import ServiciosPage from "../modules/CreateMS/ServiciosPage";
import DetallePage from "../modules/Details/DetallePage";

/*
  Páginas aún no desarrolladas — placeholders temporales.
  Reemplaza con los componentes reales cuando los crees.
*/
const PerfilPage = () => <div style={{ padding: 24, color: "#fff" }}>Perfil</div>;

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Redirige la raíz a /inicio */}
      <Route path="/" element={<Navigate to="/inicio" replace />} />

      {/* Layout con NavBar */}
      <Route element={<AppLayout />}>
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/detalles" element={<DetallePage />} />
        <Route path="/perfil" element={<PerfilPage />} />
      </Route>

      {/* 404 — descomenta cuando tengas la página */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
};

export default AppRouter;