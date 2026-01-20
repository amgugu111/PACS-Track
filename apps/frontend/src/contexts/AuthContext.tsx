'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    riceMill: {
        id: string;
        name: string;
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        console.log('AuthProvider: Loading auth from cookies...');
        const storedToken = Cookies.get('token');
        const storedUser = Cookies.get('user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                console.log('AuthProvider: User found in cookies:', parsedUser.email);
                setToken(storedToken);
                setUser(parsedUser);
            } catch (error) {
                console.error('AuthProvider: Error parsing user from cookies', error);
                Cookies.remove('token');
                Cookies.remove('user');
            }
        } else {
            console.log('AuthProvider: No auth in cookies');
        }
        setIsLoading(false);
    }, []);

    // Debug: Log whenever user state changes
    useEffect(() => {
        console.log('AuthProvider: User state changed to:', user?.email || 'null');
    }, [user]);

    const login = async (email: string, password: string) => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const data = await response.json();

        console.log('Login response received:', { hasToken: !!data.access_token, user: data.user });

        // Store token and user in cookies (expires in 7 days)
        Cookies.set('token', data.access_token, { expires: 7, sameSite: 'lax', path: '/' });
        Cookies.set('user', JSON.stringify(data.user), { expires: 7, sameSite: 'lax', path: '/' });
        console.log('AuthContext: Saved to cookies');
        // Verify cookies were saved
        console.log('AuthContext: Verify - token in cookies:', Cookies.get('token') ? 'YES' : 'NO');

        setToken(data.access_token);
        setUser(data.user);
        console.log('AuthContext: State updated with user:', data.user.email);

        // Don't redirect here - let the calling component handle it
    };

    const logout = () => {
        Cookies.remove('token');
        Cookies.remove('user');
        setToken(null);
        setUser(null);
        console.log('Logout: Cookies cleared, redirecting to login');
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
