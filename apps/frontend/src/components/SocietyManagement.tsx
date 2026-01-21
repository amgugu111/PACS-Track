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
import { useDistricts, useSocieties, createSociety, updateSociety, deleteSociety } from '@/hooks/useApi';
import { mutate } from 'swr';

export default function SocietyManagement() {
    const { districts } = useDistricts();
    const { societies, isLoading, isError } = useSocieties();
    const [openDialog, setOpenDialog] = useState(false);
    const [editingSociety, setEditingSociety] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        districtId: '',
        address: '',
        contactNo: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleOpenDialog = (society?: any) => {
        if (society) {
            setEditingSociety(society);
            setFormData({
                name: society.name,
                districtId: society.districtId,
                address: society.address || '',
                contactNo: society.contactNo || '',
            });
        } else {
            setEditingSociety(null);
            setFormData({
                name: '',
                districtId: '',
                address: '',
                contactNo: '',
            });
        }
        setOpenDialog(true);
        setError(null);
        setSuccess(null);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingSociety(null);
        setFormData({ name: '', districtId: '', address: '', contactNo: '' });
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

            await mutate('/societies');
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
            await mutate('/societies');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete society');
            setTimeout(() => setError(null), 3000);
        }
    };

    if (isLoading) {
        return <Typography>Loading societies...</Typography>;
    }

    if (isError) {
        return <Alert severity="error">Failed to load societies</Alert>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Society (PACS) Management</Typography>
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>#</strong></TableCell>
                            <TableCell>PACS Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>District</TableCell>
                            <TableCell>Contact No</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {societies?.map((society: any, index: number) => (
                            <TableRow key={society.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{society.code}</TableCell>
                                <TableCell>{society.name}</TableCell>
                                <TableCell>{society.district?.name || '-'}</TableCell>
                                <TableCell>{society.contactNo || '-'}</TableCell>
                                <TableCell>{society.address || '-'}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleOpenDialog(society)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(society)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!societies || societies.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    No societies found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

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
