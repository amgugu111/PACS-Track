'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Paper,
    Box,
    CircularProgress,
    Typography,
} from '@mui/material';

export interface Column {
    id: string;
    label: string;
    minWidth?: number;
    align?: 'left' | 'right' | 'center';
    format?: (value: any, row?: any, index?: number) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps {
    columns: Column[];
    rows: any[];
    total: number;
    page: number;
    rowsPerPage: number;
    isLoading?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    onSortChange?: (sortBy: string) => void;
    emptyMessage?: string;
}

export default function DataTable({
    columns,
    rows,
    total,
    page,
    rowsPerPage,
    isLoading = false,
    sortBy,
    sortOrder = 'asc',
    onPageChange,
    onRowsPerPageChange,
    onSortChange,
    emptyMessage = 'No data available',
}: DataTableProps) {
    const handleChangePage = (_: unknown, newPage: number) => {
        onPageChange(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        onRowsPerPageChange(parseInt(event.target.value, 10));
        onPageChange(0);
    };

    const handleSort = (columnId: string) => {
        if (onSortChange) {
            onSortChange(columnId);
        }
    };

    return (
        <Paper elevation={2}>
            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.sortable && onSortChange ? (
                                        <TableSortLabel
                                            active={sortBy === column.id}
                                            direction={sortBy === column.id ? sortOrder : 'asc'}
                                            onClick={() => handleSort(column.id)}
                                        >
                                            <strong>{column.label}</strong>
                                        </TableSortLabel>
                                    ) : (
                                        <strong>{column.label}</strong>
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">{emptyMessage}</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row, rowIndex) => (
                                <TableRow hover key={row.id || rowIndex}>
                                    {columns.map((column) => {
                                        const value = row[column.id];
                                        return (
                                            <TableCell key={column.id} align={column.align}>
                                                {column.format ? column.format(value, row, rowIndex) : value}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}
