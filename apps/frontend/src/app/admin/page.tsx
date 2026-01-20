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
    Card,
    CardContent,
    Grid,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { apiClient } from '@/lib/api-client';

interface RiceMill {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    licenseNo?: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        users: number;
        gatePassEntries: number;
    };
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [riceMills, setRiceMills] = useState<RiceMill[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        licenseNo: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });

    useEffect(() => {
        if (user && user.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else if (user) {
            loadRiceMills();
        }
    }, [user]);

    const loadRiceMills = async () => {
        try {
            const response = await apiClient.get('/auth/admin/rice-mills');
            setRiceMills(response.data);
        } catch (error) {
            console.error('Error loading rice mills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            await apiClient.post('/auth/admin/rice-mills', formData);
            setOpenDialog(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                address: '',
                licenseNo: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
            });
            loadRiceMills();
            alert('Rice mill created successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create rice mill');
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        try {
            await apiClient.patch(`/auth/admin/rice-mills/${id}/toggle`, { isActive: !isActive });
            loadRiceMills();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    if (!user || user.role !== 'SUPER_ADMIN') {
        return null;
    }

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        PACS Track - Super Admin Dashboard
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">{user.name}</Typography>
                        <Button color="inherit" variant="outlined" onClick={logout} size="small">
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold">
                        Rice Mills Management
                    </Typography>
                    <Button variant="contained" onClick={() => setOpenDialog(true)}>
                        Create Rice Mill
                    </Button>
                </Box>

                {loading ? (
                    <Typography>Loading...</Typography>
                ) : (
                    <Grid container spacing={3}>
                        {riceMills.map((mill) => (
                            <Grid item xs={12} md={6} key={mill.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                                            <Typography variant="h6" fontWeight="bold">
                                                {mill.name}
                                            </Typography>
                                            <Chip
                                                label={mill.isActive ? 'Active' : 'Inactive'}
                                                color={mill.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            📧 {mill.email}
                                        </Typography>
                                        {mill.phone && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                📱 {mill.phone}
                                            </Typography>
                                        )}
                                        {mill.licenseNo && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                🔖 License: {mill.licenseNo}
                                            </Typography>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Chip label={`${mill._count.users} Users`} size="small" />
                                            <Chip label={`${mill._count.gatePassEntries} Entries`} size="small" />
                                        </Box>

                                        <Box sx={{ mt: 2 }}>
                                            <Button
                                                size="small"
                                                onClick={() => handleToggleStatus(mill.id, mill.isActive)}
                                            >
                                                {mill.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Create Rice Mill Dialog */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Create New Rice Mill</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Rice Mill Details
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Rice Mill Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="License Number"
                                    value={formData.licenseNo}
                                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Address"
                                    multiline
                                    rows={2}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Admin User Details
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Admin Name"
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Admin Email"
                                    type="email"
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Admin Password"
                                    type="password"
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate} variant="contained">
                            Create
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
}
