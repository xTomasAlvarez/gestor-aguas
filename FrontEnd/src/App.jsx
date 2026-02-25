import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar       from "./components/Navbar";
import ClientesPage from "./pages/ClientesPage";
import VentasPage   from "./pages/VentasPage";
import GastosPage   from "./pages/GastosPage";
import LlenadosPage from "./pages/LlenadosPage";

const App = () => {
    return (
        <BrowserRouter>
            <Navbar />
            <Routes>
                <Route path="/"         element={<Navigate to="/clientes" replace />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/ventas"   element={<VentasPage />} />
                <Route path="/gastos"   element={<GastosPage />} />
                <Route path="/llenados" element={<LlenadosPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
