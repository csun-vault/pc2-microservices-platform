import AppRouter from "./routes/AppRouter";

/**
 * App — punto de entrada de la aplicación.
 *
 * Solo monta el router. El BrowserRouter vive en main.tsx
 * para que esté disponible en toda la app desde el inicio.
 */
const App: React.FC = () => {
  return <AppRouter />;
};

export default App;