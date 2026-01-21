'use client';

import React, { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGateEntries, deleteGateEntry, useSeasons, useActiveSeason, useSocieties, useDistricts } from '@/hooks/useApi';
import type { GateEntryResponse } from '@pacs-track/shared-types';
import { format } from 'date-fns';
import DataTable, { type Column } from './shared/DataTable';
import SearchBar from './shared/SearchBar';

interface GateEntryListOptimizedProps {
    onEdit?: (entry: GateEntryResponse) => void;
}

export default function GateEntryListOptimized({ onEdit }: GateEntryListOptimizedProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const [selectedSocietyId, setSelectedSocietyId] = useState<string>('');
    const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
    
    // Dialog states
    const [selectedEntry, setSelectedEntry] = useState<GateEntryResponse | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch data
    const { seasons } = useSeasons();
    const { activeSeason } = useActiveSeason();
    const { societies } = useSocieties({});
    const { districts } = useDistricts();

    // Fetch gate entries with all filters
    const { entries, total, isLoading, isError, mutate } = useGateEntries({
        search: searchTerm || undefined,
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        sortBy,
        sortOrder,
        seasonId: selectedSeasonId || undefined,
        societyId: selectedSocietyId || undefined,
        districtId: selectedDistrictId || undefined,
    });

    const handleSearch = useCallback((value: string) => {
        setSearchTerm(value);
        setPage(0); // Reset to first page on search
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

    const handleDeleteClick = (entry: GateEntryResponse) => {
        setSelectedEntry(entry);
        setDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedEntry) return;

        try {
            await deleteGateEntry(selectedEntry.id);
            setSuccess('Entry deleted successfully');
            setDeleteDialogOpen(false);
            setSelectedEntry(null);
            mutate();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete entry');
        }
    };

    const handleRefresh = () => {
        mutate();
    };

    const handleClearFilters = () => {
        setSelectedSeasonId('');
        setSelectedSocietyId('');
        setSelectedDistrictId('');
        setSearchTerm('');
        setPage(0);
    };

    // Define table columns
    const columns: Column[] = [
        {
            id: 'serialNumber',
            label: 'Serial No.',
            sortable: true,
            align: 'center',
            minWidth: 100,
        },
        {
            id: 'date',
            label: 'Date',
            sortable: true,
            minWidth: 120,
            format: (value) => format(new Date(value), 'dd/MM/yyyy'),
        },
        {
            id: 'tokenNo',
            label: 'Token Number',
            sortable: true,
            minWidth: 120,
            format: (value) => <Chip label={value} size="small" color="primary" variant="outlined" />,
        },
        {
            id: 'season',
            label: 'Season',
            minWidth: 150,
            format: (value) => value ? (
                <Chip
                    label={`${value.name} (${value.type})`}
                    size="small"
                    color={value.type === 'KHARIF' ? 'primary' : 'secondary'}
                />
            ) : 'N/A',
        },
        {
            id: 'partyName',
            label: 'Party Name',
            sortable: true,
            minWidth: 150,
        },
        {
            id: 'pacsName',
            label: 'PACS/PPC Name',
            sortable: true,
            minWidth: 150,
        },
        {
            id: 'vehicleNo',
            label: 'Vehicle No.',
            sortable: true,
            minWidth: 120,
        },
        {
            id: 'bags',
            label: 'Bags',
            sortable: true,
            align: 'right',
            minWidth: 80,
        },
        {
            id: 'quantity',
            label: 'Quantity',
            sortable: true,
            align: 'right',
            minWidth: 100,
            format: (value) => value.toFixed(2),
        },
        {
            id: 'actions',
            label: 'Actions',
            align: 'center',
            minWidth: 120,
            format: (_, row) => (
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Tooltip title="Edit">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEdit?.(row)}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(row)}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    if (isError) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">Failed to load gate entries</Alert>
            </Paper>
        );
    }

    const hasActiveFilters = selectedSeasonId || selectedSocietyId || selectedDistrictId || searchTerm;

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                        Gate Entry Records
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {hasActiveFilters && (
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={handleClearFilters}
                            >
                                Clear Filters
                            </Button>
                        )}
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} color="primary">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Filters */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                    <SearchBar
                        placeholder="Search by party name, vehicle number, token number, or PACS name..."
                        onSearch={handleSearch}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>Season</InputLabel>
                            <Select
                                value={selectedSeasonId}
                                onChange={(e) => {
                                    setSelectedSeasonId(e.target.value);
                                    setPage(0);
                                }}
                                label="Season"
                            >
                                <MenuItem value="">All Seasons</MenuItem>
                                {seasons?.map((season: any) => (
                                    <MenuItem key={season.id} value={season.id}>
                                        {season.name} - {season.type}
                                        {season.isActive && ' (Active)'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }}>
                            <InputLabel>District</InputLabel>
                            <Select
                                value={selectedDistrictId}
                                onChange={(e) => {
                                    setSelectedDistrictId(e.target.value);
                                    setSelectedSocietyId(''); // Clear society when district changes
                                    setPage(0);
                                }}
                                label="District"
                            >
                                <MenuItem value="">All Districts</MenuItem>
                                {districts?.map((district: any) => (
                                    <MenuItem key={district.id} value={district.id}>
                                        {district.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 250 }}>
                            <InputLabel>Society</InputLabel>
                            <Select
                                value={selectedSocietyId}
                                onChange={(e) => {
                                    setSelectedSocietyId(e.target.value);
                                    setPage(0);
                                }}
                                label="Society"
                                disabled={!societies || societies.length === 0}
                            >
                                <MenuItem value="">All Societies</MenuItem>
                                {societies
                                    ?.filter((society: any) => 
                                        !selectedDistrictId || society.districtId === selectedDistrictId
                                    )
                                    .map((society: any) => (
                                        <MenuItem key={society.id} value={society.id}>
                                            {society.name} ({society.code})
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Stack>

                {/* Results summary */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Showing {entries.length} of {total.toLocaleString()} entries
                    {hasActiveFilters && ' (filtered)'}
                </Typography>
            </Paper>

            {/* Data Table */}
            <DataTable
                columns={columns}
                rows={entries}
                total={total}
                page={page}
                rowsPerPage={rowsPerPage}
                isLoading={isLoading}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                onSortChange={handleSortChange}
                emptyMessage="No gate entries found. Try adjusting your filters."
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this gate entry?
                    </Typography>
                    {selectedEntry && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="body2">
                                <strong>Token:</strong> {selectedEntry.tokenNo}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Party:</strong> {selectedEntry.partyName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Vehicle:</strong> {selectedEntry.vehicleNo}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
