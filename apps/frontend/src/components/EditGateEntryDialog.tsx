'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Alert,
    CircularProgress,
    MenuItem,
    Autocomplete,
    Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { updateGateEntry, useSocieties, useParties, searchParties, useVehicles } from '@/hooks/useApi';
import type { GateEntryResponse, SocietyResponse, PartyResponse } from '@pacs-track/shared-types';

interface EditGateEntryDialogProps {
    open: boolean;
    entry: GateEntryResponse | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditGateEntryDialog({ open, entry, onClose, onSuccess }: EditGateEntryDialogProps) {
    const [tokenNo, setTokenNo] = useState('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [partyName, setPartyName] = useState('');
    const [vehicleType, setVehicleType] = useState<'TRACTOR' | 'TRUCK' | 'TATA_ACE'>('TRUCK');
    const [vehicleNo, setVehicleNo] = useState('');
    const [bags, setBags] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [selectedSociety, setSelectedSociety] = useState<SocietyResponse | null>(null);
    const [partyInputValue, setPartyInputValue] = useState('');
    const [partyOptions, setPartyOptions] = useState<PartyResponse[]>([]);
    const [vehicleNoError, setVehicleNoError] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { societies } = useSocieties({});
    const { parties } = useParties({ societyId: selectedSociety?.id });
    const { vehicles } = useVehicles({ limit: 1000 });

    // Populate form when entry changes
    useEffect(() => {
        if (entry && open && societies.length > 0) {
            setTokenNo(entry.tokenNo);
            setDate(new Date(entry.date));
            setPartyName(entry.partyName);
            setVehicleType(entry.vehicleType as 'TRACTOR' | 'TRUCK' | 'TATA_ACE');
            setVehicleNo(entry.vehicleNo || '');
            setBags(entry.bags);
            setQuantity(entry.quantity);

            // Find and set the society - prefer the society from entry if available with district
            let society: SocietyResponse | undefined;
            if (entry.society) {
                society = entry.society;
            } else {
                society = societies.find(s => s.id === entry.societyId);
            }

            if (society) {
                setSelectedSociety(society);
            }
        }
    }, [entry, open, societies]);

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
            }, 3000);

            return () => clearTimeout(delayDebounceFn);
        } else if (parties) {
            setPartyOptions(parties);
        }
    }, [partyInputValue, selectedSociety?.id, parties]);

    const validateVehicleNumber = (value: string): boolean => {
        const indianVehicleRegex = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;
        return indianVehicleRegex.test(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!entry) return;

        setError('');
        setVehicleNoError('');

        // Validation
        if (!tokenNo.trim() || !partyName.trim() || !bags || !quantity || !selectedSociety) {
            setError('Please fill in all required fields');
            return;
        }

        // Vehicle number validation (optional for tractor, required for others)
        if (vehicleType !== 'TRACTOR' && vehicleNo) {
            if (!validateVehicleNumber(vehicleNo.toUpperCase())) {
                setVehicleNoError('Invalid vehicle number format (e.g., OD01AB1234)');
                return;
            }
        }

        setLoading(true);

        try {
            const dto = {
                tokenNo: tokenNo.trim(),
                date: date?.toISOString() || new Date().toISOString(),
                partyName: partyName.trim(),
                vehicleType: vehicleType,
                vehicleNo: vehicleNo ? vehicleNo.trim().toUpperCase() : undefined,
                bags: Number(bags),
                quantity: Number(quantity),
                societyId: selectedSociety.id,
            };

            await updateGateEntry(entry.id, dto);
            onSuccess();
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update gate entry';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setError('');
            setVehicleNoError('');
            onClose();
        }
    };

    const qtyPerBag = bags && quantity ? (Number(quantity) / Number(bags)).toFixed(2) : '0.00';
    const selectedDistrict = selectedSociety?.district?.name || '';

    // Check if vehicle is managed
    const isManagedVehicle = vehicles.some(v =>
        v.vehicleNo === vehicleNo.toUpperCase()
    );
    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>Edit Gate Entry</DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            {/* Token Number */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Token Number"
                                    value={tokenNo}
                                    onChange={(e) => setTokenNo(e.target.value.toUpperCase())}
                                    inputProps={{ style: { textTransform: 'uppercase' } }}
                                />
                            </Grid>

                            {/* Date */}
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
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Society */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    value={selectedSociety}
                                    onChange={(_, newValue) => setSelectedSociety(newValue)}
                                    options={societies}
                                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Society (PACS/PPC)"
                                            required
                                        />
                                    )}
                                />
                            </Grid>

                            {/* District (Auto-filled) */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="District"
                                    value={selectedDistrict}
                                    disabled
                                    helperText="Auto-filled based on society"
                                />
                            </Grid>

                            {/* Party Name */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    freeSolo
                                    value={partyName}
                                    onChange={(_, newValue) => setPartyName(newValue || '')}
                                    inputValue={partyInputValue}
                                    onInputChange={(_, newInputValue) => {
                                        setPartyInputValue(newInputValue);
                                        setPartyName(newInputValue.toUpperCase());
                                    }}
                                    options={partyOptions.map(p => p.name)}
                                    disabled={!selectedSociety}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Party Name"
                                            required
                                            helperText={!selectedSociety ? "Select a society first" : "Type to search or enter new name"}
                                            inputProps={{
                                                ...params.inputProps,
                                                style: { textTransform: 'uppercase' }
                                            }}
                                        />
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
                                    onChange={(e) => setVehicleType(e.target.value as 'TRACTOR' | 'TRUCK' | 'TATA_ACE')}
                                >
                                    <MenuItem value="TRACTOR">TRACTOR</MenuItem>
                                    <MenuItem value="TRUCK">TRUCK</MenuItem>
                                    <MenuItem value="TATA_ACE">TATA ACE</MenuItem>
                                </TextField>
                            </Grid>

                            {/* Vehicle Number */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Autocomplete
                                    freeSolo
                                    value={vehicleNo}
                                    onChange={(_, newValue) => {
                                        setVehicleNo(newValue || '');
                                        setVehicleNoError('');
                                    }}
                                    options={vehicles.map(v => v.vehicleNo)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Vehicle Number"
                                            required={vehicleType !== 'TRACTOR'}
                                            error={!!vehicleNoError}
                                            helperText={vehicleNoError || (vehicleType === 'TRACTOR' ? 'Optional for tractor' : 'Format: OD01AB1234')}
                                            onChange={(e) => {
                                                setVehicleNo(e.target.value.toUpperCase());
                                                setVehicleNoError('');
                                            }}
                                            inputProps={{
                                                ...params.inputProps,
                                                style: { textTransform: 'uppercase' },
                                                maxLength: 10,
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Number of Bags */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Number of Bags"
                                    value={bags}
                                    onChange={(e) => setBags(e.target.value === '' ? '' : Number(e.target.value))}
                                    inputProps={{ min: 1, step: 1 }}
                                />
                            </Grid>

                            {/* Quantity */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Quantity (Quintals)"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                    inputProps={{ min: 0.01, step: 0.01 }}
                                />
                            </Grid>

                            {/* Qty Per Bag (Calculated) */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Qty Per Bag"
                                    value={qtyPerBag}
                                    disabled
                                    helperText="Auto-calculated"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : null}
                        >
                            {loading ? 'Updating...' : 'Update Entry'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </LocalizationProvider>
    );
}
