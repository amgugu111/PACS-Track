'use client';

import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, Box } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

interface SearchBarProps {
    placeholder?: string;
    onSearch: (value: string) => void;
    debounceMs?: number;
    fullWidth?: boolean;
}

export default function SearchBar({
    placeholder = 'Search...',
    onSearch,
    debounceMs = 3000,
    fullWidth = true,
}: SearchBarProps) {
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs, onSearch]);

    return (
        <TextField
            fullWidth={fullWidth}
            placeholder={placeholder}
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
    );
}
