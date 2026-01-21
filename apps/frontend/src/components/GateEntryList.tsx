'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    InputAdornment,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGateEntries, deleteGateEntry, updateGateEntry, useSeasons, useActiveSeason } from '@/hooks/useApi';
import type { GateEntryResponse, UpdateGateEntryDto } from '@pacs-track/shared-types';
import { format } from 'date-fns';

interface GateEntryListProps {
    onEdit?: (entry: GateEntryResponse) => void;
}

export default function GateEntryList({ onEdit }: GateEntryListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedEntry, setSelectedEntry] = useState<GateEntryResponse | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [selectedSeasonId, setSelectedSeasonId] = useState<number | 'all'>('all');

    const { seasons } = useSeasons();
    const { activeSeason } = useActiveSeason();
    const [success, setSuccess] = useState('');

    // Preselect active season
    useEffect(() => {
        if (activeSeason && selectedSeasonId === 'all') {
            setSelectedSeasonId(Number(activeSeason.id));
        }
    }, [activeSeason, selectedSeasonId]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0); // Reset to first page on new search
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch entries with search filter
    const { entries, total, isLoading, isError, mutate } = useGateEntries({
        search: debouncedSearch || undefined,
    });

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleEditClick = (entry: GateEntryResponse) => {
        setSelectedEntry(entry);
        setEditDialogOpen(true);
    };

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
            mutate(); // Refresh the list
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete entry');
        }
    };

    const handleRefresh = () => {
        mutate();
    };

    // Filter entries by season if selected
    const filteredEntries = selectedSeasonId === 'all'
        ? entries
        : entries.filter((entry: any) => entry.seasonId === selectedSeasonId);

    // Get paginated entries
    const paginatedEntries = filteredEntries.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    if (isError) {
        return (
            <Paper sx={{ p: 3 }}>
                <Alert severity="error">Failed to load gate entries</Alert>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight="bold" color="primary">
                    Gate Entry Records
                </Typography>
                <Tooltip title="Refresh">
                    <IconButton onClick={handleRefresh} color="primary">
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
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

            {/* Search Bar and Season Filter */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    fullWidth
                    placeholder="Search by party name, vehicle number, token number, or PACS name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Season</InputLabel>
                    <Select
                        value={selectedSeasonId}
                        onChange={(e) => setSelectedSeasonId(e.target.value as number | 'all')}
                        label="Season"
                    >
                        <MenuItem value="all">All Seasons</MenuItem>
                        {seasons?.map((season: any) => (
                            <MenuItem key={season.id} value={season.id}>
                                {season.name} - {season.type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Table */}
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Serial No.</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Token Number</strong></TableCell>
                            <TableCell><strong>Season</strong></TableCell>
                            <TableCell><strong>Party Name</strong></TableCell>
                            <TableCell><strong>PACS/PPC Name</strong></TableCell>
                            <TableCell><strong>Vehicle No.</strong></TableCell>
                            <TableCell><strong>Bags</strong></TableCell>
                            <TableCell><strong>Quantity</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : paginatedEntries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No entries found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedEntries.map((entry) => (
                                <TableRow key={entry.id} hover>
                                    <TableCell>{entry.serialNumber}</TableCell>
                                    <TableCell>
                                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={entry.tokenNo} size="small" color="primary" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        {entry.season ? (
                                            <Chip
                                                label={`${entry.season.name} (${entry.season.type})`}
                                                size="small"
                                                color={entry.season.type === 'KHARIF' ? 'primary' : 'secondary'}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{entry.partyName}</TableCell>
                                    <TableCell>{entry.pacsName}</TableCell>
                                    <TableCell>{entry.vehicleNo}</TableCell>
                                    <TableCell>{entry.bags}</TableCell>
                                    <TableCell>{entry.quantity.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleEditClick(entry)}
                                                >
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(entry)}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredEntries.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Edit Dialog */}
            <EditEntryDialog
                open={editDialogOpen}
                entry={selectedEntry}
                onClose={() => {
                    setEditDialogOpen(false);
                    setSelectedEntry(null);
                }}
                onSuccess={() => {
                    setSuccess('Entry updated successfully');
                    setEditDialogOpen(false);
                    setSelectedEntry(null);
                    mutate();
                }}
                onError={(msg) => setError(msg)}
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
        </Paper>
    );
}

// Edit Entry Dialog Component
interface EditEntryDialogProps {
    open: boolean;
    entry: GateEntryResponse | null;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

function EditEntryDialog({ open, entry, onClose, onSuccess, onError }: EditEntryDialogProps) {
    const [tokenNo, setTokenNo] = useState('');
    const [partyName, setPartyName] = useState('');
    const [vehicleNo, setVehicleNo] = useState('');
    const [bags, setBags] = useState<number>(0);
    const [quantity, setQuantity] = useState<number>(0);
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (entry) {
            setTokenNo(entry.tokenNo);
            setPartyName(entry.partyName);
            setVehicleNo(entry.vehicleNo);
            setBags(entry.bags);
            setQuantity(entry.quantity);
            setRemarks(entry.remarks || '');
        }
    }, [entry]);

    const handleSubmit = async () => {
        if (!entry) return;

        setLoading(true);
        try {
            const dto: UpdateGateEntryDto = {
                tokenNo,
                partyName,
                vehicleNo,
                bags,
                quantity,
                remarks: remarks || undefined,
            };

            await updateGateEntry(entry.id, dto);
            onSuccess();
        } catch (err: any) {
            onError(err.response?.data?.message || 'Failed to update entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Gate Entry</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Token Number"
                        value={tokenNo}
                        onChange={(e) => setTokenNo(e.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Party Name"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Vehicle Number"
                        value={vehicleNo}
                        onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Bags"
                        type="number"
                        value={bags}
                        onChange={(e) => setBags(Number(e.target.value))}
                        fullWidth
                        required
                        inputProps={{ min: 1 }}
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        fullWidth
                        required
                        inputProps={{ min: 0.01, step: 0.01 }}
                    />
                    <TextField
                        label="Remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
