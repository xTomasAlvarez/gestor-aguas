import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }     from "./context/AuthContext";
import ProtectedRoute       from "./components/ProtectedRoute";
import Navbar               from "./components/Navbar";
import OfflineIndicator     from "./components/OfflineIndicator";
import LoginPage         from "./pages/LoginPage";
import RegisterPage      from "./pages/RegisterPage";
import ClientesPage      from "./pages/ClientesPage";
import VentasPage        from "./pages/VentasPage";
import PlanillaPage      from "./pages/PlanillaPage";
import LlenadosPage      from "./pages/LlenadosPage";
import GastosPage        from "./pages/GastosPage";
import DashboardPage     from "./pages/DashboardPage";
import ConfigPage        from "./pages/ConfigPage";
import BroadcastPage     from "./pages/BroadcastPage";
import SuspendedPage     from "./pages/SuspendedPage";
import SuperAdminPage    from "./pages/SuperAdminPage";

// Wrapper que aplica el layout (Navbar) + ProtectedRoute a una página
const Privada = ({ children }) => (
    <ProtectedRoute>
        <Navbar />
        <div className="pb-20 sm:pb-0">
            {children}
        </div>
    </ProtectedRoute>
);

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <OfflineIndicator />
            <Routes>
                {/* Rutas públicas */}
                <Route path="/login"       element={<LoginPage />} />
                <Route path="/register"    element={<RegisterPage />} />
                <Route path="/suspended"   element={<SuspendedPage />} />

                {/* Rutas privadas */}
                <Route path="/"          element={<Navigate to="/clientes" replace />} />
                <Route path="/clientes"     element={<Privada><ClientesPage /></Privada>} />
                <Route path="/ventas"       element={<Privada><VentasPage /></Privada>} />
                <Route path="/planilla"     element={<Privada><PlanillaPage /></Privada>} />
                <Route path="/llenados"     element={<Privada><LlenadosPage /></Privada>} />
                <Route path="/gastos"       element={<Privada><GastosPage /></Privada>} />
                <Route path="/estadisticas" element={<Privada><DashboardPage /></Privada>} />
                <Route path="/configuracion" element={<Privada><ConfigPage /></Privada>} />
                <Route path="/broadcast"     element={<Privada><BroadcastPage /></Privada>} />
                <Route path="/superadmin"    element={<Privada><SuperAdminPage /></Privada>} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
