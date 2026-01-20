'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Box,
    Container,
    Typography,
    Button,
    AppBar,
    Toolbar,
    Tabs,
    Tab,
} from '@mui/material';
import DistrictManagement from '@/components/DistrictManagement';
import SocietyManagement from '@/components/SocietyManagement';
import PartyManagement from '@/components/PartyManagement';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`management-tabpanel-${index}`}
            aria-labelledby={`management-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ManagementPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (!user) {
            console.log('ManagementPage: No user, would redirect to login');
            // router.push('/login');
        }
    }, [user, router]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    if (!user) {
        return null;
    }

    return (
        <Box>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        PACS Management
                    </Typography>
                    <Button color="inherit" onClick={() => router.push('/dashboard')}>
                        Dashboard
                    </Button>
                    <Button color="inherit" onClick={logout}>
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="management tabs">
                        <Tab label="Districts" id="management-tab-0" />
                        <Tab label="Societies (PACS)" id="management-tab-1" />
                        <Tab label="Parties" id="management-tab-2" />
                    </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                    <DistrictManagement />
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <SocietyManagement />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <PartyManagement />
                </TabPanel>
            </Container>
        </Box>
    );
}
