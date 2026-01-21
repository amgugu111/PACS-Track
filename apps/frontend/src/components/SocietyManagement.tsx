'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Typography,
    Alert,
    MenuItem,
    Paper,
    Chip,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useDistricts, useSocieties, createSociety, updateSociety, deleteSociety } from '@/hooks/useApi';
import DataTable, { type Column } from './shared/DataTable';
import SearchBar from './shared/SearchBar';

export default function SocietyManagementOptimized() {
    const { districts } = useDistricts();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDistrictId, setSelectedDistrictId] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { societies, total, isLoading, isError, mutate } = useSocieties({
        districtId: selectedDistrictId || undefined,
        search: searchTerm || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [editingSociety, setEditingSociety] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        districtId: '',
        address: '',
        contactNo: '',
        block: '',
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

    const handleOpenDialog = (society?: any) => {
        if (society) {
            setEditingSociety(society);
            setFormData({
                name: society.name,
                districtId: society.districtId,
                address: society.address || '',
                contactNo: society.contactNo || '',
                block: society.block || '',
            });
        } else {
            setEditingSociety(null);
            setFormData({
                name: '',
                districtId: '',
                address: '',
                contactNo: '',
                block: '',
            });
        }
        setOpenDialog(true);
        setError(null);
        setSuccess(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSociety(null);
        setFormData({ name: '', districtId: '', address: '', contactNo: '', block: '' });
        setError(null);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name.trim()) {
                setError('Society name is required');
                return;
            }

            if (!formData.districtId) {
                setError('District is required');
                return;
            }

            if (editingSociety) {
                await updateSociety(editingSociety.id, formData);
                setSuccess('Society updated successfully');
            } else {
                await createSociety(formData);
                setSuccess('Society created successfully (PACS code auto-generated)');
            }

            await mutate();
            handleCloseDialog();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async (society: any) => {
        if (!confirm(`Are you sure you want to delete ${society.name}?`)) {
            return;
        }

        try {
            await deleteSociety(society.id);
            setSuccess('Society deleted successfully');
            await mutate();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete society');
            setTimeout(() => setError(null), 3000);
        }
    };

    const columns: Column[] = [
        {
            id: 'code',
            label: 'PACS Code',
            sortable: true,
            minWidth: 120,
            format: (value) => <Chip label={value} size="small" color="primary" />,
        },
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            minWidth: 200,
        },
        {
            id: 'district',
            label: 'District',
            sortable: true,
            minWidth: 150,
            format: (value) => value?.name || '-',
        },
        {
            id: 'block',
            label: 'Block',
            sortable: true,
            minWidth: 120,
            format: (value) => value ? <Chip label={value} size="small" variant="outlined" /> : '-',
        },
        {
            id: 'contactNo',
            label: 'Contact No',
            minWidth: 130,
            format: (value) => value || '-',
        },
        {
            id: 'address',
            label: 'Address',
            minWidth: 200,
            format: (value) => value || '-',
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            minWidth: 120,
            format: (_, row) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(row)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    if (isError) {
        return <Alert severity="error">Failed to load societies</Alert>;
    }

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">Society (PACS) Management</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        disabled={!districts || districts.length === 0}
                    >
                        Add Society
                    </Button>
                </Box>

                {!districts || districts.length === 0 ? (
                    <Alert severity="info">Please add at least one district before creating societies.</Alert>
                ) : null}

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

                {/* Filters */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <SearchBar
                            placeholder="Search by society name, code, or contact..."
                            onSearch={handleSearch}
                        />
                    </Box>
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by District</InputLabel>
                        <Select
                            value={selectedDistrictId}
                            onChange={(e) => {
                                setSelectedDistrictId(e.target.value);
                                setPage(0);
                            }}
                            label="Filter by District"
                        >
                            <MenuItem value="">All Districts</MenuItem>
                            {districts?.map((district: any) => (
                                <MenuItem key={district.id} value={district.id}>
                                    {district.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Showing {societies.length} of {total.toLocaleString()} societies
                </Typography>
            </Paper>

            <DataTable
                columns={columns}
                rows={societies}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onSortChange={handleSortChange}
                emptyMessage="No societies found"
            />

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingSociety ? 'Edit Society' : 'Add New Society'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            select
                            label="District"
                            value={formData.districtId}
                            onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                            fullWidth
                            required
                        >
                            {districts?.map((district: any) => (
                                <MenuItem key={district.id} value={district.id}>
                                    {district.name} ({district.code})
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Society Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                            helperText="PACS code will be auto-generated (e.g., PACS-PURI-001)"
                        />
                        <TextField
                            label="Contact Number"
                            value={formData.contactNo}
                            onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Block"
                            value={formData.block}
                            onChange={(e) => setFormData({ ...formData, block: e.target.value.toUpperCase() })}
                            fullWidth
                            helperText="Block name (optional)"
                            inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                        <TextField
                            label="Address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {editingSociety ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
