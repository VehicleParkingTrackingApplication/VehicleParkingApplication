import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authInterceptor } from '../services/authInterceptor';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = () => {
            const authenticated = authInterceptor.isAuthenticated();
            setIsAuthenticated(authenticated);
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        // Still checking authentication
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is authenticated, render the protected content
    return <>{children}</>;
} 