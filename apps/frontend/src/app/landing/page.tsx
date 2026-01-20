'use client';

import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';

export default function LandingPage() {
    const router = useRouter();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 12,
                }}
            >
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h2" fontWeight="bold" gutterBottom>
                                PACS Track
                            </Typography>
                            <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                                Modern Rice Mill Management System
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                                Streamline your rice mill operations with our comprehensive gate entry management,
                                farmer tracking, and society management system.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={() => router.push('/login')}
                                    sx={{
                                        bgcolor: 'white',
                                        color: 'primary.main',
                                        '&:hover': { bgcolor: 'grey.100' },
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    sx={{
                                        borderColor: 'white',
                                        color: 'white',
                                        '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                                    }}
                                    onClick={() => {
                                        const element = document.getElementById('features');
                                        element?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                >
                                    Learn More
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    p: 4,
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <Typography variant="h4" gutterBottom>
                                    🌾 SaaS Platform
                                </Typography>
                                <Typography variant="body1">
                                    Multi-tenant architecture designed for rice mills across India. Secure, scalable,
                                    and easy to use.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Features Section */}
            <Container maxWidth="lg" sx={{ py: 10 }} id="features">
                <Typography variant="h3" textAlign="center" fontWeight="bold" gutterBottom>
                    Key Features
                </Typography>
                <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
                    Everything you need to manage your rice mill operations efficiently
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    🚪
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Gate Entry Management
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Track all paddy entries with farmer details, vehicle numbers, weight measurements,
                                    and quality parameters in real-time.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    👨‍🌾
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Farmer Management
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Maintain comprehensive farmer database with token numbers, contact information,
                                    and transaction history.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    🏛️
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Society & District Tracking
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Organize operations by societies and districts for better administration and
                                    reporting.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    🔐
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Role-Based Access
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Secure multi-user system with Admin, Manager, and Operator roles with
                                    appropriate permissions.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    🏢
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Multi-Tenant Architecture
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Complete data isolation between rice mills. Each organization operates
                                    independently with their own data.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: '100%', boxShadow: 3 }}>
                            <CardContent>
                                <Typography variant="h4" gutterBottom>
                                    📊
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Reports & Analytics
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Generate comprehensive reports on entries, farmers, and operations for better
                                    decision making.
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>

            {/* CTA Section */}
            <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
                <Container maxWidth="md">
                    <Box textAlign="center">
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Ready to modernize your rice mill?
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            Join rice mills across India using PACS Track to streamline their operations
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => router.push('/login')}
                            sx={{ px: 6 }}
                        >
                            Get Started
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Footer */}
            <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                PACS Track
                            </Typography>
                            <Typography variant="body2" color="grey.400">
                                Professional rice mill management system for the digital age.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6} textAlign={{ xs: 'left', md: 'right' }}>
                            <Typography variant="body2" color="grey.400">
                                © 2026 PACS Track. All rights reserved.
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}
