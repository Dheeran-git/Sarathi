import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import { authService } from '../services/authService';

const AuthContext = createContext();

const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
const citizenClientId = import.meta.env.VITE_CITIZEN_CLIENT_ID || import.meta.env.VITE_CLIENT_ID;
const panchayatClientId = import.meta.env.VITE_PANCHAYAT_CLIENT_ID;
const cognitoClient = new CognitoIdentityProviderClient({ region });

function decodeJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return {};
    }
}

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [userType, setUserType] = useState(null); // 'citizen' | 'panchayat' | null

    const refreshTimerRef = useRef(null);
    const panchayatRefreshTimerRef = useRef(null);

    // Token refresh for citizen sessions (45-min interval)
    const refreshSession = useCallback(async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return;
        try {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: citizenClientId,
                AuthParameters: { REFRESH_TOKEN: refreshToken },
            }));
            if (response.AuthenticationResult) {
                const { AccessToken, IdToken } = response.AuthenticationResult;
                if (AccessToken) localStorage.setItem('accessToken', AccessToken);
                if (IdToken) localStorage.setItem('idToken', IdToken);
            }
        } catch {
            logout();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Token refresh for panchayat sessions (45-min interval)
    const refreshPanchayatSession = useCallback(async () => {
        const refreshToken = localStorage.getItem('panchayatRefreshToken');
        if (!refreshToken) return;
        try {
            const response = await cognitoClient.send(new InitiateAuthCommand({
                AuthFlow: 'REFRESH_TOKEN_AUTH',
                ClientId: panchayatClientId,
                AuthParameters: { REFRESH_TOKEN: refreshToken },
            }));
            if (response.AuthenticationResult) {
                const { AccessToken, IdToken } = response.AuthenticationResult;
                if (AccessToken) localStorage.setItem('panchayatAccessToken', AccessToken);
                if (IdToken) localStorage.setItem('panchayatIdToken', IdToken);
            }
        } catch {
            logout();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        checkAuth();
        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
            if (panchayatRefreshTimerRef.current) clearInterval(panchayatRefreshTimerRef.current);
        };
    }, []);

    const checkAuth = () => {
        const citizenToken = authService.getToken();
        const panchayatToken = authService.getPanchayatToken();
        const storedType = localStorage.getItem('userType');
        const email = localStorage.getItem('userEmail') || '';

        if (storedType === 'citizen' && citizenToken) {
            setIsAuthenticated(true);
            setUserType('citizen');
            setUser({ email });
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = setInterval(refreshSession, 45 * 60 * 1000);
        } else if (storedType === 'panchayat' && panchayatToken) {
            const idToken = localStorage.getItem('panchayatIdToken');
            const payload = idToken ? decodeJwt(idToken) : {};
            const panchayatId = payload['custom:panchayatId'] || '';
            setIsAuthenticated(true);
            setUserType('panchayat');
            setUser({ email, panchayatId });
            if (panchayatRefreshTimerRef.current) clearInterval(panchayatRefreshTimerRef.current);
            panchayatRefreshTimerRef.current = setInterval(refreshPanchayatSession, 45 * 60 * 1000);
        } else {
            setIsAuthenticated(false);
            setUserType(null);
            setUser(null);
        }
        setIsLoading(false);
    };

    const login = (email, type) => {
        setIsAuthenticated(true);
        setUserType(type);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userType', type);

        if (type === 'citizen') {
            setUser({ email });
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = setInterval(refreshSession, 45 * 60 * 1000);
        } else if (type === 'panchayat') {
            const idToken = localStorage.getItem('panchayatIdToken');
            const payload = idToken ? decodeJwt(idToken) : {};
            const panchayatId = payload['custom:panchayatId'] || '';
            setUser({ email, panchayatId });
            if (panchayatRefreshTimerRef.current) clearInterval(panchayatRefreshTimerRef.current);
            panchayatRefreshTimerRef.current = setInterval(refreshPanchayatSession, 45 * 60 * 1000);
        }
    };

    const logout = () => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
        if (panchayatRefreshTimerRef.current) {
            clearInterval(panchayatRefreshTimerRef.current);
            panchayatRefreshTimerRef.current = null;
        }
        authService.signOut();
        localStorage.removeItem('userEmail');
        setIsAuthenticated(false);
        setUserType(null);
        setUser(null);
    };

    const isCitizen = userType === 'citizen';
    const isPanchayat = userType === 'panchayat';

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, userType, isCitizen, isPanchayat, login, logout, checkAuth }}>
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
