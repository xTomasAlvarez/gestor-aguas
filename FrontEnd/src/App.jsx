import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider }     from "./context/AuthContext";
import { ConfigProvider }   from "./context/ConfigContext";
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
import OnboardingPage    from "./pages/OnboardingPage";
import InventarioPage    from "./pages/InventarioPage";
import { useAuth }       from "./context/AuthContext";
import { useConfig }     from "./context/ConfigContext";

// Protege rutas públicas (login/register) repeliendo usuarios ya logueados hacia la app
const PublicRoute = ({ children }) => {
    const { usuario, cargandoAuth } = useAuth();
    if (cargandoAuth) return null; // Esperar a saber el estado real
    return usuario ? <Navigate to="/" replace /> : children;
};

// Evalúa si la empresa necesita el Onboarding o puede seguir normal
const OnboardingGuard = ({ children }) => {
    const { config } = useConfig();
    const { usuario, cargandoAuth } = useAuth();

    if (cargandoAuth || config?.cargando) return null; // Bloquea evaluación hasta estar seguros

    // Si es superadmin o empleado, u onboarding ya está completo -> Pasa
    if (usuario?.rol === "admin" && config && !config.onboardingCompletado) {
        return <Navigate to="/onboarding" replace />;
    }

    return children;
};

// Wrapper que aplica el layout (Navbar) + ProtectedRoute a una página regular
const Privada = ({ children }) => (
    <ProtectedRoute>
        <ConfigProvider>
            <OnboardingGuard>
                <Navbar />
                <div className="pb-20 sm:pb-0">
                    {children}
                </div>
            </OnboardingGuard>
        </ConfigProvider>
    </ProtectedRoute>
);

// Wrapper especial sin layout para el Wizard
const OnboardingRoute = () => (
    <ProtectedRoute>
        <ConfigProvider>
            <OnboardingPage />
        </ConfigProvider>
    </ProtectedRoute>
);

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <OfflineIndicator />
            <Routes>
                {/* Rutas públicas protegidas contra re-ingreso */}
                <Route path="/login"       element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/register"    element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/suspended"   element={<SuspendedPage />} />

                {/* Rutas Privadas / Onboarding */}
                <Route path="/onboarding"    element={<OnboardingRoute />} />
                
                {/* Rutas Aplicación Principal */}
                <Route path="/"             element={<Navigate to="/clientes" replace />} />
                <Route path="/clientes"     element={<Privada><ClientesPage /></Privada>} />
                <Route path="/ventas"       element={<Privada><VentasPage /></Privada>} />
                <Route path="/planilla"     element={<Privada><PlanillaPage /></Privada>} />
                <Route path="/llenados"     element={<Privada><LlenadosPage /></Privada>} />
                <Route path="/gastos"       element={<Privada><GastosPage /></Privada>} />
                <Route path="/estadisticas" element={<Privada><DashboardPage /></Privada>} />
                <Route path="/inventario"    element={<Privada><InventarioPage /></Privada>} />
                <Route path="/configuracion" element={<Privada><ConfigPage /></Privada>} />
                <Route path="/broadcast"     element={<Privada><BroadcastPage /></Privada>} />
                <Route path="/superadmin"    element={<Privada><SuperAdminPage /></Privada>} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
