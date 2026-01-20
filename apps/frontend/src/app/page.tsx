'use client';

import { Box, Container, Typography, AppBar, Toolbar, Button } from '@mui/material';
import GateEntryForm from '@/components/GateEntryForm';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
    const { user, logout } = useAuth();

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
                                    {user.riceMill.name}
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

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h3" gutterBottom fontWeight="bold">
                        Rice Miller PACS
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Gate Entry Management System
                    </Typography>
                </Box>

                <GateEntryForm
                    onSuccess={() => {
                        console.log('Gate entry created successfully!');
                    }}
                    onError={(error) => {
                        console.error('Error creating gate entry:', error);
                    }}
                />
            </Container>
        </ProtectedRoute>
    );
}
