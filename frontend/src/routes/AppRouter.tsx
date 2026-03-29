import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout     from "../layout/AppLayout";
import InicioPage    from "../modules/Dashboard/InicioPage";
import ServiciosPage from "../modules/CreateMS/ServiciosPage";
import DetallePage   from "../modules/Detalles/DetallePage";

const PerfilPage = () => <div style={{ padding: 24, color: "#fff" }}>Perfil</div>;

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/inicio" replace />} />

      <Route element={<AppLayout />}>
        <Route path="/inicio"    element={<InicioPage />}    />
        <Route path="/servicios" element={<ServiciosPage />} />
        <Route path="/detalles"  element={<DetallePage />}   />
        <Route path="/perfil"    element={<PerfilPage />}    />
      </Route>
    </Routes>
  );
};

export default AppRouter;
