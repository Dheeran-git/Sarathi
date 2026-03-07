import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function PrivateRoute({ children, requiredRole }) {
    const location = useLocation();
    const { isAuthenticated, isLoading, isCitizen, isPanchayat, isAdmin } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-off-white flex items-center justify-center">
                <Loader2 className="animate-spin text-saffron" size={32} />
            </div>
        );
    }

    if (requiredRole === 'citizen' && !isCitizen) {
        return <Navigate to="/citizen/login" state={{ from: location }} replace />;
    }

    if (requiredRole === 'panchayat' && !isPanchayat) {
        return <Navigate to="/panchayat/login" state={{ from: location }} replace />;
    }

    if (requiredRole === 'admin' && !isAdmin) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (!requiredRole && !isAuthenticated) {
        return <Navigate to="/citizen/login" state={{ from: location }} replace />;
    }

    return children;
}
