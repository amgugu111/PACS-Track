'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Grid,
    Paper,
    Typography,
    Autocomplete,
    Alert,
    CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSocieties, useFarmers, createGateEntry, searchFarmers } from '@/hooks/useApi';
import type { CreateGateEntryDto, SocietyResponse, FarmerResponse } from '@pacs-track/shared-types';

interface GateEntryFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function GateEntryForm({ onSuccess, onError }: GateEntryFormProps) {
    // Form state
    const [tokenNo, setTokenNo] = useState('');
    const [challanNo, setChallanNo] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [truckNo, setTruckNo] = useState('');
    const [totalQty, setTotalQty] = useState<number | ''>('');
    const [totalBags, setTotalBags] = useState<number | ''>('');
    const [remarks, setRemarks] = useState('');
    const [selectedSociety, setSelectedSociety] = useState<SocietyResponse | null>(null);
    const [farmerName, setFarmerName] = useState('');
    const [farmerInputValue, setFarmerInputValue] = useState('');
    const [farmerOptions, setFarmerOptions] = useState<FarmerResponse[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // API hooks
    const { societies, isLoading: loadingSocieties } = useSocieties();
    const { farmers } = useFarmers(selectedSociety?.id);

    // Calculated field: Qty Per Bag
    const qtyPerBag = totalBags && totalQty ? (Number(totalQty) / Number(totalBags)).toFixed(2) : '0.00';

    // Auto-fill district when society is selected
    const selectedDistrict = selectedSociety?.district?.name || '';

    // Farmer autocomplete search
    useEffect(() => {
        if (farmerInputValue.trim().length > 0 && selectedSociety) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const results = await searchFarmers(farmerInputValue, selectedSociety.id);
                    setFarmerOptions(results);
                } catch (err) {
                    console.error('Error searching farmers:', err);
                    setFarmerOptions(farmers);
                }
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        } else {
            setFarmerOptions(farmers);
        }
    }, [farmerInputValue, selectedSociety, farmers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!tokenNo.trim()) {
            setError('Token number is required');
            return;
        }
        if (!challanNo.trim()) {
            setError('Challan number is required');
            return;
        }
        if (!truckNo.trim()) {
            setError('Truck number is required');
            return;
        }
        if (!selectedSociety) {
            setError('Please select a society');
            return;
        }
        if (!farmerName.trim()) {
            setError('Farmer name is required');
            return;
        }
        if (!totalQty || Number(totalQty) <= 0) {
            setError('Total quantity must be greater than 0');
            return;
        }
        if (!totalBags || Number(totalBags) <= 0) {
            setError('Total bags must be at least 1');
            return;
        }

        setLoading(true);

        try {
            const dto: CreateGateEntryDto = {
                tokenNo: tokenNo.trim(),
                challanNo: challanNo.trim(),
                date: date?.toISOString() || new Date().toISOString(),
                truckNo: truckNo.trim(),
                totalQty: Number(totalQty),
                totalBags: Number(totalBags),
                remarks: remarks.trim() || undefined,
                societyId: selectedSociety.id,
                farmerName: farmerName.trim(),
            };

            await createGateEntry(dto);
            setSuccess(true);

            // Reset form
            resetForm();

            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to create gate entry';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTokenNo('');
        setChallanNo('');
        setDate(new Date());
        setTruckNo('');
        setTotalQty('');
        setTotalBags('');
        setRemarks('');
        setSelectedSociety(null);
        setFarmerName('');
        setFarmerInputValue('');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                    Gate Entry Form
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Register new paddy truck arrival
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(false)}>
                        Gate entry created successfully!
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Token Number */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Token Number"
                                value={tokenNo}
                                onChange={(e) => setTokenNo(e.target.value)}
                                placeholder="e.g., GP-2026-001"
                                helperText="Unique manual gatepass number"
                            />
                        </Grid>

                        {/* Challan Number */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Challan Number"
                                value={challanNo}
                                onChange={(e) => setChallanNo(e.target.value)}
                                placeholder="e.g., CH-12345"
                            />
                        </Grid>

                        {/* Date Picker */}
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        helperText: 'Defaults to today',
                                    },
                                }}
                            />
                        </Grid>

                        {/* Truck Number */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                required
                                label="Truck Number"
                                value={truckNo}
                                onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                                placeholder="e.g., OD-01-AB-1234"
                            />
                        </Grid>

                        {/* Society Selection */}
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={societies}
                                getOptionLabel={(option) => `${option.name} (${option.code})`}
                                value={selectedSociety}
                                onChange={(_, newValue) => {
                                    setSelectedSociety(newValue);
                                    setFarmerName('');
                                    setFarmerInputValue('');
                                }}
                                loading={loadingSocieties}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        label="Society (PACS)"
                                        helperText="Select the society"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {loadingSocieties ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Grid>

                        {/* District (Auto-filled, Read-only) */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="District"
                                value={selectedDistrict}
                                InputProps={{
                                    readOnly: true,
                                }}
                                helperText="Auto-filled from society"
                                disabled={!selectedSociety}
                            />
                        </Grid>

                        {/* Farmer Search (Smart Autocomplete with freeSolo) */}
                        <Grid item xs={12}>
                            <Autocomplete
                                freeSolo
                                options={farmerOptions}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') {
                                        return option;
                                    }
                                    return option.name;
                                }}
                                value={farmerName}
                                onChange={(_, newValue) => {
                                    if (typeof newValue === 'string') {
                                        setFarmerName(newValue);
                                    } else if (newValue) {
                                        setFarmerName(newValue.name);
                                    } else {
                                        setFarmerName('');
                                    }
                                }}
                                inputValue={farmerInputValue}
                                onInputChange={(_, newInputValue) => {
                                    setFarmerInputValue(newInputValue);
                                    setFarmerName(newInputValue);
                                }}
                                disabled={!selectedSociety}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        label="Farmer Name"
                                        helperText="Search existing or enter new farmer name"
                                        placeholder="Type to search or enter new name"
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box>
                                            <Typography variant="body1">{option.name}</Typography>
                                            {option.fatherName && (
                                                <Typography variant="caption" color="text.secondary">
                                                    S/o: {option.fatherName}
                                                </Typography>
                                            )}
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* Total Quantity */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Total Quantity"
                                value={totalQty}
                                onChange={(e) => setTotalQty(e.target.value ? Number(e.target.value) : '')}
                                inputProps={{ min: 0, step: 0.01 }}
                                helperText="In Quintals/Kg"
                            />
                        </Grid>

                        {/* Total Bags */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Total Bags"
                                value={totalBags}
                                onChange={(e) => setTotalBags(e.target.value ? Number(e.target.value) : '')}
                                inputProps={{ min: 1, step: 1 }}
                            />
                        </Grid>

                        {/* Qty Per Bag (Calculated, Read-only) */}
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Qty Per Bag"
                                value={qtyPerBag}
                                InputProps={{
                                    readOnly: true,
                                }}
                                helperText="Auto-calculated"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                    },
                                }}
                            />
                        </Grid>

                        {/* Remarks */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Any additional information..."
                                helperText="Optional"
                            />
                        </Grid>

                        {/* Submit Button */}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={resetForm}
                                    disabled={loading}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ minWidth: 150 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Submit Entry'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </LocalizationProvider>
    );
}
