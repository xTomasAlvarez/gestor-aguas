import { Navigate } from "react-router-dom";
import { useAuth }   from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { usuario, cargandoAuth } = useAuth();
    
    if (cargandoAuth) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin shadow-lg"></div>
                <p className="mt-4 text-slate-500 font-semibold text-sm animate-pulse tracking-wide">Autenticando...</p>
            </div>
        );
    }

    return usuario ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
