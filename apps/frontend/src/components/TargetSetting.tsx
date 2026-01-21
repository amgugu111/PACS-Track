'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Alert,
    Snackbar,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Save } from '@mui/icons-material';
import { useSeasons, getSeasonTargets, setSeasonTargets } from '@/hooks/useApi';

export default function TargetSetting() {
    const { seasons, isLoading: loadingSeasons } = useSeasons();
    const [selectedSeason, setSelectedSeason] = useState<number | ''>('');
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    useEffect(() => {
        if (selectedSeason) {
            loadTargets();
        }
    }, [selectedSeason]);

    const loadTargets = async () => {
        if (!selectedSeason) return;
        setLoading(true);
        try {
            const data = await getSeasonTargets(selectedSeason as number);
            setTargets(data);
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Failed to load targets',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTargetChange = (societyId: number, value: string) => {
        setTargets(targets.map(t =>
            t.societyId === societyId
                ? { ...t, targetQuantity: value === '' ? 0 : parseInt(value) || 0 }
                : t
        ));
    };

    const handleSave = async () => {
        if (!selectedSeason) return;
        setLoading(true);
        try {
            const targetsData = targets.map(t => ({
                societyId: t.societyId,
                targetQuantity: t.targetQuantity,
            }));
            await setSeasonTargets(selectedSeason as number, { targets: targetsData });
            setSnackbar({
                open: true,
                message: 'Targets saved successfully',
                severity: 'success',
            });
            loadTargets();
        } catch (error: any) {
            setSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to save targets',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (loadingSeasons) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const totalTarget = targets.reduce((sum, t) => sum + (t.targetQuantity || 0), 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Set Season Targets
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Season</InputLabel>
                    <Select
                        value={selectedSeason}
                        onChange={(e) => setSelectedSeason(e.target.value as number)}
                        label="Select Season"
                    >
                        <MenuItem value="">-- Select Season --</MenuItem>
                        {seasons?.map((season: any) => (
                            <MenuItem key={season.id} value={season.id}>
                                {season.name} - {season.type}
                                {season.isActive && ' (Active)'}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedSeason && !loading && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Set procurement targets for each society in quintals.
                        Total Target: <strong>{totalTarget.toLocaleString()} quintal</strong>
                    </Alert>
                )}
            </Paper>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && selectedSeason && targets.length > 0 && (
                <>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>#</strong></TableCell>
                                    <TableCell><strong>Society Name</strong></TableCell>
                                    <TableCell><strong>District</strong></TableCell>
                                    <TableCell align="right"><strong>Target Quantity (quintal)</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {targets.map((target, index) => (
                                    <TableRow key={target.societyId}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{target.society?.name || 'Unknown'}</TableCell>
                                        <TableCell>{target.society?.district?.name || 'Unknown'}</TableCell>
                                        <TableCell align="right">
                                            <TextField
                                                type="number"
                                                value={target.targetQuantity}
                                                onChange={(e) => handleTargetChange(target.societyId, e.target.value)}
                                                inputProps={{ min: 0, step: 1000 }}
                                                size="small"
                                                sx={{ width: 150 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={loading}
                        >
                            Save Targets
                        </Button>
                    </Box>
                </>
            )}

            {!loading && selectedSeason && targets.length === 0 && (
                <Alert severity="warning">
                    No societies found. Please ensure societies are created in the system.
                </Alert>
            )}

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
