import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ThemeRegistry from './ThemeRegistry';
import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/swr-config';

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
                    <SWRConfig value={swrConfig}>
                        <AuthProvider>
                            {children}
                        </AuthProvider>
                    </SWRConfig>
                </ThemeRegistry>
            </body>
        </html>
    );
}
