'use client';

import { useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Alert,
    MenuItem,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSocieties, useParties, createParty, updateParty, deleteParty } from '@/hooks/useApi';
import { mutate } from 'swr';

export default function PartyManagement() {
    const { societies } = useSocieties();
    const { parties, isLoading, isError } = useParties();
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

            await mutate('/parties');
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
            await mutate('/parties');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete party');
            setTimeout(() => setError(null), 3000);
        }
    };

    if (isLoading) {
        return <Typography>Loading parties...</Typography>;
    }

    if (isError) {
        return <Alert severity="error">Failed to load parties</Alert>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Party Management</Typography>
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Father's Name</TableCell>
                            <TableCell>Phone Number</TableCell>
                            <TableCell>Society</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {parties?.map((party: any) => (
                            <TableRow key={party.id}>
                                <TableCell>{party.name}</TableCell>
                                <TableCell>{party.fatherName || '-'}</TableCell>
                                <TableCell>{party.phoneNumber || '-'}</TableCell>
                                <TableCell>{party.society?.name || '-'}</TableCell>
                                <TableCell>{party.address || '-'}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenDialog(party)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(party)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!parties || parties.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No parties found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
