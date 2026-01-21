'use client';

import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Alert,
} from '@mui/material';
import { useDistricts } from '@/hooks/useApi';

export default function DistrictManagement() {
    const { districts, isLoading, isError } = useDistricts();

    if (isLoading) {
        return <Typography>Loading districts...</Typography>;
    }

    if (isError) {
        return <Alert severity="error">Failed to load districts</Alert>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Districts (Odisha)</Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
                All 30 districts of Odisha are pre-loaded. You can use them when creating societies.
            </Alert>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>#</strong></TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>State</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {districts?.map((district: any, index: number) => (
                            <TableRow key={district.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{district.code}</TableCell>
                                <TableCell>{district.name}</TableCell>
                                <TableCell>{district.state || '-'}</TableCell>
                            </TableRow>
                        ))}
                        {(!districts || districts.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No districts found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
