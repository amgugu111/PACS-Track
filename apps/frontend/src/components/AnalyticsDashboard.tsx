'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    CircularProgress,
    Alert,
    ToggleButton,
    ToggleButtonGroup,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    TrendingUp,
    CheckCircle,
    Pending,
    Agriculture,
    LocationOn,
} from '@mui/icons-material';
import { useDashboardStats, useActiveSeason, useSeasons } from '@/hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#2196f3', '#9c27b0', '#00bcd4'];

export default function AnalyticsDashboard() {
    const { activeSeason, isLoading: loadingSeason } = useActiveSeason();
    const { seasons } = useSeasons();
    const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
    const { stats, isLoading: loadingStats, mutate } = useDashboardStats(selectedSeasonId || activeSeason?.id);
    const [chartView, setChartView] = useState<'society' | 'district'>('society');

    // Set active season as default when loaded
    useEffect(() => {
        if (activeSeason && !selectedSeasonId) {
            setSelectedSeasonId(activeSeason.id);
        }
    }, [activeSeason, selectedSeasonId]);

    if (loadingSeason) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!activeSeason) {
        return (
            <Alert severity="warning">
                No active season found. Please create and activate a season first.
            </Alert>
        );
    }

    if (loadingStats) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) {
        return <Alert severity="error">Failed to load dashboard stats</Alert>;
    }

    // Check if there's any data to display
    const hasData = stats.recentEntries && stats.recentEntries.length > 0;

    if (!hasData) {
        return (
            <Box>
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h5" fontWeight="bold">
                            {stats.season.name} - {stats.season.type}
                        </Typography>
                        <FormControl sx={{ minWidth: 250 }}>
                            <Select
                                value={selectedSeasonId}
                                onChange={(e) => setSelectedSeasonId(e.target.value)}
                                size="small"
                                sx={{ bgcolor: 'white' }}
                            >
                                {seasons?.map((season: any) => (
                                    <MenuItem key={season.id} value={season.id}>
                                        {season.name} - {season.type}
                                        {season.isActive && ' (Active)'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>
                <Alert severity="info" sx={{ mb: 2 }}>
                    No gate entries found for this season yet. Start adding entries to see analytics and statistics.
                </Alert>
            </Box>
        );
    }

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return 'success';
        if (percentage >= 50) return 'warning';
        return 'error';
    };

    return (
        <Box>
            {/* Season Info with Selector */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">
                        {stats.season.name} - {stats.season.type}
                    </Typography>
                    <FormControl sx={{ minWidth: 250 }}>
                        <Select
                            value={selectedSeasonId}
                            onChange={(e) => setSelectedSeasonId(e.target.value)}
                            size="small"
                            sx={{ bgcolor: 'white' }}
                        >
                            {seasons?.map((season: any) => (
                                <MenuItem key={season.id} value={season.id}>
                                    {season.name} - {season.type}
                                    {season.isActive && ' (Active)'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Paper>

            {/* Overall Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Agriculture sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" color="text.secondary">
                                    Target
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {(stats.overall.totalTarget / 1000).toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tonnes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                                <Typography variant="h6" color="text.secondary">
                                    Achieved
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {(stats.overall.totalAchieved / 1000).toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tonnes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Pending sx={{ mr: 1, color: 'warning.main' }} />
                                <Typography variant="h6" color="text.secondary">
                                    Remaining
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {(stats.overall.totalRemaining / 1000).toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Tonnes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <TrendingUp sx={{ mr: 1, color: 'info.main' }} />
                                <Typography variant="h6" color="text.secondary">
                                    Progress
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="info.main">
                                {stats.overall.percentage.toFixed(1)}%
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(stats.overall.percentage, 100)}
                                color={getProgressColor(stats.overall.percentage)}
                                sx={{ mt: 1, height: 8, borderRadius: 1 }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Chart View Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <ToggleButtonGroup
                    value={chartView}
                    exclusive
                    onChange={(_, newView) => newView && setChartView(newView)}
                >
                    <ToggleButton value="society">Society-wise</ToggleButton>
                    <ToggleButton value="district">District-wise</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {/* Target vs Actual Chart */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    Target vs Achieved - {chartView === 'society' ? 'Society-wise' : 'District-wise'}
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={chartView === 'society' ? stats.societyStats.slice(0, 10) : stats.districtStats}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey={chartView === 'society' ? 'societyName' : 'district'}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                        />
                        <YAxis label={{ value: 'Quantity (kg)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="target" fill="#2196f3" name="Target" />
                        <Bar dataKey="achieved" fill="#4caf50" name="Achieved" />
                    </BarChart>
                </ResponsiveContainer>
            </Paper>

            {/* Society Performance Table */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    Society Performance
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Society</strong></TableCell>
                                <TableCell><strong>District</strong></TableCell>
                                <TableCell align="right"><strong>Target (kg)</strong></TableCell>
                                <TableCell align="right"><strong>Achieved (kg)</strong></TableCell>
                                <TableCell align="right"><strong>Progress</strong></TableCell>
                                <TableCell align="right"><strong>Entries</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.societyStats.slice(0, 15).map((society: any) => (
                                <TableRow key={society.societyId}>
                                    <TableCell>{society.societyName}</TableCell>
                                    <TableCell>{society.district}</TableCell>
                                    <TableCell align="right">{society.target.toLocaleString()}</TableCell>
                                    <TableCell align="right">{society.achieved.toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={Math.min(society.percentage, 100)}
                                                color={getProgressColor(society.percentage)}
                                                sx={{ flex: 1, height: 6, borderRadius: 1 }}
                                            />
                                            <Typography variant="body2" sx={{ minWidth: 45 }}>
                                                {society.percentage.toFixed(1)}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip label={society.entries} size="small" color="primary" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Recent Entries */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                    Recent Entries
                </Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Token No</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Society</strong></TableCell>
                                <TableCell><strong>District</strong></TableCell>
                                <TableCell align="right"><strong>Quantity (kg)</strong></TableCell>
                                <TableCell align="right"><strong>Bags</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.recentEntries.map((entry: any) => (
                                <TableRow key={entry.id}>
                                    <TableCell>{entry.tokenNo}</TableCell>
                                    <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{entry.society}</TableCell>
                                    <TableCell>{entry.district}</TableCell>
                                    <TableCell align="right">{entry.quantity.toLocaleString()}</TableCell>
                                    <TableCell align="right">{entry.bags}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
