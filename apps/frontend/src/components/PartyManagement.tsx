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
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSocieties, useParties, createParty, updateParty, deleteParty } from '@/hooks/useApi';
import DataTable, { type Column } from './shared/DataTable';
import SearchBar from './shared/SearchBar';

export default function PartyManagementOptimized() {
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSocietyId, setSelectedSocietyId] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const { societies } = useSocieties({});
    const { parties, total, isLoading, isError, mutate } = useParties({
        societyId: selectedSocietyId || undefined,
        search: searchTerm || undefined,
        page: page + 1,
        limit: rowsPerPage,
        sortBy,
        sortOrder,
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [editingParty, setEditingParty] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        phoneNumber: '',
        address: '',
        societyId: '',
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

    const handleOpenDialog = (party?: any) => {
        if (party) {
            setEditingParty(party);
            setFormData({
                name: party.name,
                fatherName: party.fatherName || '',
                phoneNumber: party.phoneNumber || '',
                address: party.address || '',
                societyId: party.societyId,
            });
        } else {
            setEditingParty(null);
            setFormData({
                name: '',
                fatherName: '',
                phoneNumber: '',
                address: '',
                societyId: '',
            });
        }
        setOpenDialog(true);
        setError(null);
        setSuccess(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingParty(null);
        setFormData({ name: '', fatherName: '', phoneNumber: '', address: '', societyId: '' });
        setError(null);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name.trim()) {
                setError('Party name is required');
                return;
            }

            if (!formData.societyId) {
                setError('Society is required');
                return;
            }

            if (editingParty) {
                await updateParty(editingParty.id, formData);
                setSuccess('Party updated successfully');
            } else {
                await createParty(formData);
                setSuccess('Party created successfully');
            }

            await mutate();
            handleCloseDialog();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    const handleDelete = async (party: any) => {
        if (!confirm(`Are you sure you want to delete ${party.name}?`)) {
            return;
        }

        try {
            await deleteParty(party.id);
            setSuccess('Party deleted successfully');
            await mutate();

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete party');
            setTimeout(() => setError(null), 3000);
        }
    };

    const columns: Column[] = [
        {
            id: 'name',
            label: 'Name',
            sortable: true,
            minWidth: 180,
        },
        {
            id: 'fatherName',
            label: "Father's Name",
            sortable: true,
            minWidth: 180,
            format: (value) => value || '-',
        },
        {
            id: 'phoneNumber',
            label: 'Phone Number',
            sortable: true,
            minWidth: 130,
            format: (value) => value || '-',
        },
        {
            id: 'society',
            label: 'Society',
            sortable: true,
            minWidth: 200,
            format: (value) => value ? `${value.name} (${value.code})` : '-',
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
        return <Alert severity="error">Failed to load parties</Alert>;
    }

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">Party Management</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                        disabled={!societies || societies.length === 0}
                    >
                        Add Party
                    </Button>
                </Box>

                {!societies || societies.length === 0 ? (
                    <Alert severity="info">Please add at least one society before creating parties.</Alert>
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
                            placeholder="Search by party name, father's name, or phone number..."
                            onSearch={handleSearch}
                        />
                    </Box>
                    <FormControl sx={{ minWidth: 250 }}>
                        <InputLabel>Filter by Society</InputLabel>
                        <Select
                            value={selectedSocietyId}
                            onChange={(e) => {
                                setSelectedSocietyId(e.target.value);
                                setPage(0);
                            }}
                            label="Filter by Society"
                        >
                            <MenuItem value="">All Societies</MenuItem>
                            {societies?.map((society: any) => (
                                <MenuItem key={society.id} value={society.id}>
                                    {society.name} ({society.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Showing {parties.length} of {total.toLocaleString()} parties
                </Typography>
            </Paper>

            <DataTable
                columns={columns}
                rows={parties}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onSortChange={handleSortChange}
                emptyMessage="No parties found"
            />

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingParty ? 'Edit Party' : 'Add New Party'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            label="Party Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Father's Name"
                            value={formData.fatherName}
                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="Phone Number"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            select
                            label="Society (PACS)"
                            value={formData.societyId}
                            onChange={(e) => setFormData({ ...formData, societyId: e.target.value })}
                            fullWidth
                            required
                        >
                            {societies?.map((society: any) => (
                                <MenuItem key={society.id} value={society.id}>
                                    {society.name} ({society.code})
                                </MenuItem>
                            ))}
                        </TextField>
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
                        {editingParty ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
