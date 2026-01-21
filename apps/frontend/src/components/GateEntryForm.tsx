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
    Snackbar,
    Chip,
    MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CheckCircle, CalendarMonth } from '@mui/icons-material';
import { useSocieties, useParties, createGateEntry, searchParties, useActiveSeason } from '@/hooks/useApi';
import type { CreateGateEntryDto, SocietyResponse, PartyResponse } from '@pacs-track/shared-types';

interface GateEntryFormProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function GateEntryForm({ onSuccess, onError }: GateEntryFormProps) {
    // Form state
    const [tokenNo, setTokenNo] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [partyName, setPartyName] = useState(''); // Name of the Party
    const [vehicleType, setVehicleType] = useState<'TRACTOR' | 'TRUCK' | 'TATA_ACE'>('TRUCK');
    const [vehicleNo, setVehicleNo] = useState(''); // Vehicle Number
    const [bags, setBags] = useState<number | ''>(''); // Number of Bags
    const [quantity, setQuantity] = useState<number | ''>(''); // Quantity in quintal
    const [remarks, setRemarks] = useState('');
    const [vehicleNoError, setVehicleNoError] = useState('');
    const [selectedSociety, setSelectedSociety] = useState<SocietyResponse | null>(null);
    const [partyInputValue, setPartyInputValue] = useState('');
    const [partyOptions, setPartyOptions] = useState<PartyResponse[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // API hooks
    const { societies, isLoading: loadingSocieties } = useSocieties({});
    const { parties } = useParties({ societyId: selectedSociety?.id });
    const { activeSeason, isLoading: loadingActiveSeason } = useActiveSeason();

    // Calculated field: Qty Per Bag
    const qtyPerBag = bags && quantity ? (Number(quantity) / Number(bags)).toFixed(2) : '0.00';

    // Auto-fill district when society is selected
    const selectedDistrict = selectedSociety?.district?.name || '';

    // Party autocomplete search
    useEffect(() => {
        if (partyInputValue.trim().length > 0 && selectedSociety) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    const results = await searchParties(partyInputValue, selectedSociety.id);
                    setPartyOptions(results);
                } catch (err) {
                    console.error('Error searching parties:', err);
                    setPartyOptions(parties || []);
                }
            }, 300);

            return () => clearTimeout(delayDebounceFn);
        } else if (parties) {
            setPartyOptions(parties);
        }
    }, [partyInputValue, selectedSociety?.id]);

    // Update party options when parties data changes
    useEffect(() => {
        if (parties && partyInputValue.trim().length === 0) {
            setPartyOptions(parties);
        }
    }, [parties]);

    // Validate Indian vehicle number format
    const validateVehicleNumber = (value: string): boolean => {
        const indianVehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
        return indianVehicleRegex.test(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setVehicleNoError('');

        // Validation
        if (!tokenNo.trim()) {
            setError('Token number is required');
            return;
        }

        // Vehicle number is required for truck and tata ace, optional for tractor
        if (vehicleType !== 'TRACTOR' && !vehicleNo.trim()) {
            setError('Vehicle number is required for truck and tata ace');
            setLoading(false);
            return;
        }

        if (vehicleNo && !validateVehicleNumber(vehicleNo.trim())) {
            setError('Vehicle number must be in Indian format (e.g., OD01AB1234, MH12DE5678)');
            setVehicleNoError('Invalid Indian vehicle number format');
            return;
        }
        if (!selectedSociety) {
            setError('Please select a society');
            return;
        }
        if (!partyName.trim()) {
            setError('Party name is required');
            return;
        }
        if (!bags || Number(bags) <= 0 || !Number.isInteger(Number(bags))) {
            setError('Number of bags must be a whole number and at least 1');
            return;
        }
        if (!quantity || Number(quantity) <= 0) {
            setError('Quantity must be greater than 0 quintal');
            return;
        }

        setLoading(true);

        try {
            const dto: CreateGateEntryDto = {
                tokenNo: tokenNo.trim(),
                date: date?.toISOString() || new Date().toISOString(),
                partyName: partyName.trim(),
                vehicleType: vehicleType,
                vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : undefined,
                bags: Number(bags),
                quantity: Number(quantity),
                remarks: remarks.trim() || undefined,
                societyId: selectedSociety.id,
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
        setDate(new Date());
        setPartyName('');
        setVehicleType('TRUCK');
        setVehicleNo('');
        setBags('');
        setQuantity('');
        setRemarks('');
        setSelectedSociety(null);
        setPartyInputValue('');
        setVehicleNoError('');
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Paper elevation={3} sx={{ p: 4, maxWidth: 900, mx: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                    Gate Entry Form
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Register new paddy truck arrival
                </Typography>

                {/* Active Season Info */}
                {loadingActiveSeason ? (
                    <CircularProgress size={20} />
                ) : activeSeason ? (
                    <Alert severity="info" sx={{ mb: 3 }} icon={<CheckCircle />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarMonth fontSize="small" />
                            <Typography variant="body2">
                                <strong>Active Season:</strong> {activeSeason.name} - {activeSeason.type}
                            </Typography>
                        </Box>
                    </Alert>
                ) : (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        No active season found. Please activate a season before creating entries.
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        {/* Token Number */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label="Token Number"
                                value={tokenNo}
                                onChange={(e) => setTokenNo(e.target.value)}
                                placeholder="e.g., GP-2026-001"
                                helperText="Unique token number"
                            />
                        </Grid>

                        {/* Date Picker */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="Date"
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                                format="dd/MM/yyyy"
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        helperText: 'Defaults to today',
                                    },
                                }}
                            />
                        </Grid>

                        {/* Society Selection */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Autocomplete
                                options={societies}
                                getOptionLabel={(option) => `${option.name} (${option.code})`}
                                value={selectedSociety}
                                onChange={(_, newValue) => {
                                    setSelectedSociety(newValue);
                                    setPartyName('');
                                    setPartyInputValue('');
                                }}
                                loading={loadingSocieties}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        label="PACS/PPC Name"
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
                        <Grid size={{ xs: 12, md: 6 }}>
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

                        {/* Name of the Party (Party Search with freeSolo) */}
                        <Grid size={{ xs: 12 }}>
                            <Autocomplete
                                freeSolo
                                options={partyOptions}
                                getOptionLabel={(option) => {
                                    if (typeof option === 'string') {
                                        return option;
                                    }
                                    return option.name;
                                }}
                                value={partyName}
                                onChange={(_, newValue) => {
                                    if (typeof newValue === 'string') {
                                        setPartyName(newValue);
                                    } else if (newValue) {
                                        setPartyName(newValue.name);
                                    } else {
                                        setPartyName('');
                                    }
                                }}
                                inputValue={partyInputValue}
                                onInputChange={(_, newInputValue) => {
                                    setPartyInputValue(newInputValue);
                                    setPartyName(newInputValue);
                                }}
                                disabled={!selectedSociety}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        label="Name of the Party"
                                        helperText="Search existing or enter new party name"
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

                        {/* Vehicle Type */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                required
                                label="Vehicle Type"
                                value={vehicleType}
                                onChange={(e) => {
                                    setVehicleType(e.target.value as 'TRACTOR' | 'TRUCK' | 'TATA_ACE');
                                    // Clear vehicle number and error when switching to tractor
                                    if (e.target.value === 'TRACTOR') {
                                        setVehicleNo('');
                                        setVehicleNoError('');
                                    }
                                }}
                            >
                                <MenuItem value="TRUCK">Truck</MenuItem>
                                <MenuItem value="TRACTOR">Tractor</MenuItem>
                                <MenuItem value="TATA_ACE">Tata Ace</MenuItem>
                            </TextField>
                        </Grid>

                        {/* Vehicle Number */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required={vehicleType !== 'TRACTOR'}
                                label="Vehicle Number"
                                value={vehicleNo}
                                onChange={(e) => {
                                    const value = e.target.value.toUpperCase().replace(/-/g, '');
                                    setVehicleNo(value);
                                    if (value && !validateVehicleNumber(value)) {
                                        setVehicleNoError('Format: XX00XX0000');
                                    } else {
                                        setVehicleNoError('');
                                    }
                                }}
                                placeholder="e.g., OD01AB1234"
                                error={!!vehicleNoError}
                                helperText={vehicleNoError || (vehicleType === 'TRACTOR' ? 'Optional for tractor' : 'Indian vehicle number format')}
                            />
                        </Grid>

                        {/* Bags */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Bag"
                                value={bags}
                                onChange={(e) => {
                                    const value = e.target.value ? parseInt(e.target.value) : '';
                                    setBags(value);
                                }}
                                inputProps={{ min: 1, step: 1 }}
                                helperText="Number of bags (whole number)"
                            />
                        </Grid>

                        {/* Quantity */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                required
                                type="number"
                                label="Quantity (quintal)"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                                inputProps={{ min: 0.01, step: 0.01 }}
                                helperText="Quantity in quintals"
                            />
                        </Grid>

                        {/* Qty Per Bag (Calculated, Read-only) */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Qty Per Bag (quintal)"
                                value={qtyPerBag}
                                InputProps={{
                                    readOnly: true,
                                }}
                                helperText="Auto-calculated (quintal per bag)"
                                sx={{
                                    '& .MuiInputBase-input': {
                                        fontWeight: 'bold',
                                        color: 'primary.main',
                                    },
                                }}
                            />
                        </Grid>

                        {/* Remarks */}
                        <Grid size={{ xs: 12 }}>
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
                        <Grid size={{ xs: 12 }}>
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
                                    disabled={loading || !activeSeason}
                                    sx={{ minWidth: 150 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Submit Entry'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* Success Snackbar */}
                <Snackbar
                    open={success}
                    autoHideDuration={6000}
                    onClose={() => setSuccess(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
                        Gate entry created successfully!
                    </Alert>
                </Snackbar>

                {/* Error Snackbar */}
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                </Snackbar>
            </Paper>
        </LocalizationProvider>
    );
}
