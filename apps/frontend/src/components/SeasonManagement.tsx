'use client';

import { activateSeason, createSeason, deleteSeason, updateSeason, useSeasons } from '@/hooks/useApi';
import { Add, CheckCircle, Delete, Edit } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { useState } from 'react';

interface SeasonFormData {
    year: string;
    type: 'KHARIF' | 'RABI';
}

export default function SeasonManagement() {
    const { seasons, isLoading, mutate } = useSeasons();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSeason, setEditingSeason] = useState<any>(null);
    const [formData, setFormData] = useState<SeasonFormData>({
        year: '',
        type: 'KHARIF',
    });
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const handleOpenDialog = (season?: any) => {
        if (season) {
            setEditingSeason(season);
            setFormData({
                year: season.name, // name is the year like "2025-2026"
                type: season.type,
            });
        } else {
            setEditingSeason(null);
            const currentYear = new Date().getFullYear();
            setFormData({
                year: `${currentYear}-${currentYear + 1}`,
                type: 'KHARIF',
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSeason(null);
    };

    const generateYearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years: string[] = [];
        // Generate from 2020 to current year + 1
        for (let year = 2020; year <= currentYear + 1; year++) {
            years.push(`${year}-${year + 1}`);
        }
        return years.reverse(); // Most recent first
    };

    const handleSubmit = async () => {
        try {
            if (editingSeason) {
                await updateSeason(editingSeason.id, formData);
                setSnackbar({ open: true, message: 'Season updated successfully', severity: 'success' });
            } else {
                await createSeason(formData);
                setSnackbar({ open: true, message: 'Season created successfully', severity: 'success' });
            }
            mutate();
            handleCloseDialog();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to save season',
                severity: 'error',
            });
        }
    };

    const handleActivate = async (seasonId: number) => {
        try {
            await activateSeason(seasonId);
            setSnackbar({ open: true, message: 'Season activated successfully', severity: 'success' });
            mutate();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to activate season',
                severity: 'error',
            });
        }
    };

    const handleDelete = async (seasonId: number) => {
        if (!confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
            return;
        }
        try {
            await deleteSeason(seasonId);
            setSnackbar({ open: true, message: 'Season deleted successfully', severity: 'success' });
            mutate();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to delete season',
                severity: 'error',
            });
        }
    };

    if (isLoading) {
        return <Typography>Loading seasons...</Typography>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Season Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                >
                    Create Season
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>#</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {seasons?.map((season: any, index: number) => (
                            <TableRow key={season.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{season.name}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={season.type}
                                        color={season.type === 'KHARIF' ? 'primary' : 'secondary'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {season.isActive ? (
                                        <Chip label="Active" color="success" size="small" icon={<CheckCircle />} />
                                    ) : (
                                        <Chip label="Inactive" size="small" />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {!season.isActive && (
                                        <Button
                                            size="small"
                                            onClick={() => handleActivate(season.id)}
                                            sx={{ mr: 1 }}
                                        >
                                            Activate
                                        </Button>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(season)}
                                        color="primary"
                                    >
                                        <Edit />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(season.id)}
                                        color="error"
                                        disabled={season.isActive}
                                    >
                                        <Delete />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
                <DialogTitle>{editingSeason ? 'Edit Season' : 'Create New Season'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={12}>
                            <FormControl fullWidth>
                                <InputLabel>Year</InputLabel>
                                <Select
                                    value={formData.year}
                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                    label="Year"
                                >
                                    {generateYearOptions().map((year) => (
                                        <MenuItem key={year} value={year}>
                                            {year}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <FormControl fullWidth>
                                <InputLabel>Season Type</InputLabel>
                                <Select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'KHARIF' | 'RABI' })}
                                    label="Season Type"
                                >
                                    <MenuItem value="KHARIF">Kharif</MenuItem>
                                    <MenuItem value="RABI">Rabi</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.year}
                    >
                        {editingSeason ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
