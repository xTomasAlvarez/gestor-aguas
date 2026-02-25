import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar       from "./components/Navbar";
import ClientesPage from "./pages/ClientesPage";
import VentasPage   from "./pages/VentasPage";
import GastosPage   from "./pages/GastosPage";
import LlenadosPage from "./pages/LlenadosPage";
import PlanillaPage from "./pages/PlanillaPage";

const App = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/"          element={<Navigate to="/clientes" replace />} />
                <Route path="/clientes"  element={<ClientesPage />} />
                <Route path="/ventas"    element={<VentasPage />} />
                <Route path="/planilla"  element={<PlanillaPage />} />
                <Route path="/llenados"  element={<LlenadosPage />} />
                <Route path="/gastos"    element={<GastosPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
