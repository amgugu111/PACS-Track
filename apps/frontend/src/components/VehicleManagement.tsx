'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    MenuItem,
    Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/hooks/useApi';
import DataTable, { type Column } from './shared/DataTable';
import SearchBar from './shared/SearchBar';

export default function VehicleManagement() {
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortBy, setSortBy] = useState('vehicleNo');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { vehicles, total, isLoading, isError, mutate } = useVehicles({
        vehicleType: selectedType || undefined,
        search: searchTerm || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<any>(null);
    const [formData, setFormData] = useState({
        vehicleNo: '',
        vehicleType: 'TRUCK' as 'TRACTOR' | 'TRUCK' | 'TATA_ACE',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
        setPage(0);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0);
    }, []);

    const handleSortChange = useCallback((columnId: string) => {
        if (sortBy === columnId) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(columnId);
            setSortOrder('asc');
        }
    }, [sortBy, sortOrder]);

    const handleOpenDialog = (vehicle?: any) => {
        if (vehicle) {
            setEditingVehicle(vehicle);
            setFormData({
                vehicleNo: vehicle.vehicleNo,
                vehicleType: vehicle.vehicleType,
            });
        } else {
            setEditingVehicle(null);
            setFormData({
                vehicleNo: '',
                vehicleType: 'TRUCK',
            });
        }
        setOpenDialog(true);
        setError(null);
        setSuccess(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingVehicle(null);
        setFormData({ vehicleNo: '', vehicleType: 'TRUCK' });
        setError(null);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.vehicleNo.trim()) {
                setError('Vehicle number is required');
                return;
            }

            if (editingVehicle) {
                await updateVehicle(editingVehicle.id, formData);
                setSuccess('Vehicle updated successfully');
            } else {
                await createVehicle(formData);
                setSuccess('Vehicle created successfully');
            }

            handleCloseDialog();
            mutate();
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async (vehicle: any) => {
        if (confirm(`Are you sure you want to delete vehicle ${vehicle.vehicleNo}?`)) {
            try {
                await deleteVehicle(vehicle.id);
                setSuccess('Vehicle deleted successfully');
                mutate();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete vehicle');
            }
        }
    };

    const columns: Column[] = [
        {
            id: 'vehicleNo',
            label: 'Vehicle Number',
            sortable: true,
            minWidth: 150,
        },
        {
            id: 'vehicleType',
            label: 'Vehicle Type',
            sortable: true,
            minWidth: 130,
            format: (value) => (
                <Chip
                    label={value}
                    size="small"
                    color={value === 'TRACTOR' ? 'success' : value === 'TRUCK' ? 'primary' : 'warning'}
                />
            ),
        },
        {
            id: 'isActive',
            label: 'Status',
            sortable: true,
            minWidth: 100,
            format: (value) => (
                <Chip
                    label={value ? 'Active' : 'Inactive'}
                    size="small"
                    color={value ? 'success' : 'default'}
                />
            ),
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            minWidth: 120,
            format: (_, row) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenDialog(row)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(row)}
                    >
                        Delete
                    </Button>
                </Box>
            ),
        },
    ];

    if (isError) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">Failed to load vehicles</Alert>
            </Paper>
        );
    }

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Vehicle Management
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Vehicle
                    </Button>
                </Box>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <SearchBar
                            placeholder="Search by vehicle number..."
                            onSearch={handleSearch}
                        />
                    </Box>
                    <TextField
                        select
                        label="Filter by Type"
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                            setPage(0);
                        }}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="TRACTOR">Tractor</MenuItem>
                        <MenuItem value="TRUCK">Truck</MenuItem>
                        <MenuItem value="TATA_ACE">Tata Ace</MenuItem>
                    </TextField>
                </Box>
            </Paper>

            <DataTable
                columns={columns}
                rows={vehicles}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onSortChange={handleSortChange}
                emptyMessage="No vehicles found. Add your first vehicle!"
            />

            {/* Add/Edit Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                        <TextField
                            label="Vehicle Number"
                            value={formData.vehicleNo}
                            onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                            fullWidth
                            required
                            placeholder="e.g., OD01AB1234"
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                        <TextField
                            select
                            label="Vehicle Type"
                            value={formData.vehicleType}
                            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                            fullWidth
                            required
                        >
                            <MenuItem value="TRACTOR">Tractor</MenuItem>
                            <MenuItem value="TRUCK">Truck</MenuItem>
                            <MenuItem value="TATA_ACE">Tata Ace</MenuItem>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingVehicle ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
