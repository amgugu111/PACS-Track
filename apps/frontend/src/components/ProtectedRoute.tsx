'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    console.log('ProtectedRoute: Render -', { isLoading, hasUser: !!user, userEmail: user?.email });

    useEffect(() => {
        console.log('ProtectedRoute: useEffect triggered -', { isLoading, hasUser: !!user, userEmail: user?.email });
        if (!isLoading && !user) {
            console.log('ProtectedRoute: No user found, redirecting to login');
            router.push('/login');
        } else if (!isLoading && user) {
            console.log('ProtectedRoute: User authenticated, showing content');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                Loading...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
