import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const token = authService.getToken();
        if (token) {
            setIsAuthenticated(true);
            setUser({ email: localStorage.getItem('userEmail') || 'User' });
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
        setIsLoading(false);
    };

    const login = (email) => {
        setIsAuthenticated(true);
        if (email) {
            localStorage.setItem('userEmail', email);
            setUser({ email });
        }
    };

    const logout = () => {
        authService.signOut();
        localStorage.removeItem('userEmail');
        setIsAuthenticated(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
