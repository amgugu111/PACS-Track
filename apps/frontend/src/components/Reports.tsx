'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    TextField,
    MenuItem,
    Divider,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
    Download as DownloadIcon,
    Assessment as AssessmentIcon,
    CalendarMonth as CalendarIcon,
    LocationOn as LocationIcon,
    LocalShipping as VehicleIcon,
    TableChart as TableIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSocieties, useDistricts, useSeasons, useActiveSeason } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export default function Reports() {
    const [fromDate, setFromDate] = useState<Date | null>(new Date());
    const [toDate, setToDate] = useState<Date | null>(new Date());
    const [selectedSociety, setSelectedSociety] = useState<string>('all');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
    const [selectedSeason, setSelectedSeason] = useState<string>('all');
    const [selectedFormat, setSelectedFormat] = useState<string>('excel');
    const [loadingReport, setLoadingReport] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { societies } = useSocieties();
    const { districts } = useDistricts();
    const { seasons } = useSeasons();
    const { activeSeason } = useActiveSeason();
    const { token } = useAuth();

    // Filter districts that have societies
    const districtsWithSocieties = districts.filter(district =>
        societies.some(society => society.districtId === district.id)
    );

    // Preselect active season
    useEffect(() => {
        if (activeSeason && selectedSeason === 'all') {
            setSelectedSeason(String(activeSeason.id));
        }
    }, [activeSeason, selectedSeason]);

    const handleDownloadReport = async (reportType: string) => {
        if (!fromDate || !toDate) {
            setError('Please select both from and to dates');
            return;
        }

        setLoadingReport(reportType);
        setError('');

        try {
            const params = new URLSearchParams({
                fromDate: format(fromDate, 'yyyy-MM-dd'),
                toDate: format(toDate, 'yyyy-MM-dd'),
                reportType,
                format: selectedFormat,
            });

            if (selectedSociety !== 'all') {
                params.append('societyId', selectedSociety);
            }

            if (selectedDistrict !== 'all') {
                params.append('districtId', selectedDistrict);
            }

            if (selectedSeason !== 'all') {
                params.append('seasonId', selectedSeason);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gate-entries/reports/download?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Server error: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const extension = selectedFormat === 'excel' ? 'xlsx' : selectedFormat === 'pdf' ? 'pdf' : 'csv';
            a.download = `${reportType}_report_${format(fromDate, 'yyyy-MM-dd')}_to_${format(toDate, 'yyyy-MM-dd')}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSuccess('Report downloaded successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to download report');
        } finally {
            setLoadingReport(null);
        }
    };

    const reportCards = [
        {
            title: 'Daily Entry Report',
            description: 'Download all gate entries for the selected date range',
            icon: <CalendarIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
            reportType: 'daily',
        },
        {
            title: 'Society-wise Report',
            description: 'Gate entries grouped by PACS/PPC societies',
            icon: <LocationIcon sx={{ fontSize: 40, color: 'success.main' }} />,
            reportType: 'society',
        },
        {
            title: 'District-wise Report',
            description: 'Gate entries aggregated by districts',
            icon: <AssessmentIcon sx={{ fontSize: 40, color: 'info.main' }} />,
            reportType: 'district',
        },
        {
            title: 'Party-wise Report',
            description: 'All entries grouped by party names',
            icon: <TableIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
            reportType: 'party',
        },
        {
            title: 'Vehicle-wise Report',
            description: 'Track all entries by vehicle numbers',
            icon: <VehicleIcon sx={{ fontSize: 40, color: 'error.main' }} />,
            reportType: 'vehicle',
        },
        {
            title: 'Summary Report',
            description: 'Consolidated summary with totals and averages',
            icon: <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
            reportType: 'summary',
        },
    ];

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box>
                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold" color="primary">
                        Report Filters
                    </Typography>
                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={3}>
                        {/* Date Range */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="From Date"
                                value={fromDate}
                                onChange={(newValue) => setFromDate(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <DatePicker
                                label="To Date"
                                value={toDate}
                                onChange={(newValue) => setToDate(newValue)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                    },
                                }}
                            />
                        </Grid>

                        {/* Society Filter */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="Society"
                                value={selectedSociety}
                                onChange={(e) => setSelectedSociety(e.target.value)}
                            >
                                <MenuItem value="all">All Societies</MenuItem>
                                {societies.map((society) => (
                                    <MenuItem key={society.id} value={society.id}>
                                        {society.name} ({society.code})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* District Filter */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="District"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                            >
                                <MenuItem value="all">All Districts</MenuItem>
                                {districtsWithSocieties.map((district) => (
                                    <MenuItem key={district.id} value={district.id}>
                                        {district.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Season Filter */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="Season"
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(e.target.value)}
                            >
                                <MenuItem value="all">All Seasons</MenuItem>
                                {seasons?.map((season: any) => (
                                    <MenuItem key={season.id} value={season.id}>
                                        {season.name} - {season.type}
                                        {season.isActive && ' (Active)'}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* Export Format */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                select
                                fullWidth
                                label="Export Format"
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                            >
                                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                                <MenuItem value="pdf">PDF (.pdf)</MenuItem>
                                <MenuItem value="csv">CSV (.csv)</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Report Cards */}
                <Typography variant="h5" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 3 }}>
                    Available Reports
                </Typography>

                <Grid container spacing={3}>
                    {reportCards.map((report) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}
                            key={report.reportType}>
                            <Card
                                elevation={2}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                                    <Box sx={{ mb: 2 }}>{report.icon}</Box>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        {report.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {report.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={loadingReport === report.reportType ? <CircularProgress size={20} /> : <DownloadIcon />}
                                        onClick={() => handleDownloadReport(report.reportType)}
                                        disabled={loadingReport !== null || !fromDate || !toDate}
                                        fullWidth
                                        sx={{ mx: 2 }}
                                    >
                                        Download
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Success Snackbar */}
                <Snackbar
                    open={!!success}
                    autoHideDuration={4000}
                    onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                        {success}
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
            </Box>
        </LocalizationProvider>
    );
}
