import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ThemeRegistry from './ThemeRegistry';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PACS Track - Gate Entry Management',
    description: 'Rice Miller PACS SaaS - Gate Entry Management System',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ThemeRegistry>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </ThemeRegistry>
            </body>
        </html>
    );
}
