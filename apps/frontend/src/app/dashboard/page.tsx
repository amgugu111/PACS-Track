'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Typography, AppBar, Toolbar, Button, Tabs, Tab } from '@mui/material';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import GateEntryForm from '@/components/GateEntryForm';
import GateEntryList from '@/components/GateEntryList';
import Reports from '@/components/Reports';
import SeasonManagement from '@/components/SeasonManagement';
import TargetSetting from '@/components/TargetSetting';
import SocietyManagement from '@/components/SocietyManagement';
import PartyManagement from '@/components/PartyManagement';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

function DashboardContent() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(0);

    // Tab ID mapping
    const tabMap: Record<string, number> = {
        'analytics': 0,
        'new-entry': 1,
        'entries': 2,
        'seasons': 3,
        'targets': 4,
        'societies': 5,
        'parties': 6,
        'reports': 7,
    };

    const tabIdMap: Record<number, string> = {
        0: 'analytics',
        1: 'new-entry',
        2: 'entries',
        3: 'seasons',
        4: 'targets',
        5: 'societies',
        6: 'parties',
        7: 'reports',
    };

    // Initialize tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && tabMap[tab] !== undefined) {
            setActiveTab(tabMap[tab]);
        }
    }, [searchParams]);

    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        // Update URL without page reload
        router.push(`/dashboard?tab=${tabIdMap[newValue]}`, { scroll: false });
    };

    return (
        <ProtectedRoute>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        PACS Track - Gate Entry System
                    </Typography>
                    {user && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {user.riceMill?.name || 'Super Admin'}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    {user.name} ({user.role})
                                </Typography>
                            </Box>
                            <Button
                                color="inherit"
                                variant="outlined"
                                onClick={logout}
                                size="small"
                            >
                                Logout
                            </Button>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                        <Tab label="Analytics Dashboard" />
                        <Tab label="New Entry" />
                        <Tab label="View All Entries" />
                        <Tab label="Season Management" />
                        <Tab label="Set Targets" />
                        <Tab label="Societies (PACS)" />
                        <Tab label="Parties" />
                        <Tab label="Reports" />
                    </Tabs>
                </Box>

                {activeTab === 0 && <AnalyticsDashboard />}

                {activeTab === 1 && (
                    <GateEntryForm
                        onSuccess={() => {
                            // Switch to list view after successful creation
                            setActiveTab(2);
                        }}
                    />
                )}

                {activeTab === 2 && <GateEntryList />}

                {activeTab === 3 && <SeasonManagement />}

                {activeTab === 4 && <TargetSetting />}

                {activeTab === 5 && <SocietyManagement />}

                {activeTab === 6 && <PartyManagement />}

                {activeTab === 7 && <Reports />}
            </Container>
        </ProtectedRoute>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
