'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    console.log('LoginPage: Rendering');

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            console.log('Login successful, waiting for state update...');
            // Wait a bit for state to propagate
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log('Redirecting to dashboard...');
            // Use replace instead of push to prevent back button issues
            router.replace('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return null;
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#1976d2',
                        marginBottom: '8px'
                    }}>
                        PACS Track
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Rice Mill Gate Entry System
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#333'
                            }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: '#333'
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            borderRadius: '4px',
                            marginBottom: '20px',
                            fontSize: '14px'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: isLoading ? '#90caf9' : '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = '#1565c0';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isLoading) {
                                e.currentTarget.style.backgroundColor = '#1976d2';
                            }
                        }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: '1px solid #eee',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    <p>Demo Credentials:</p>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
                        Create a rice mill via API first
                    </p>
                </div>
            </div>
        </div>
    );
}
