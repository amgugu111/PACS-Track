import useSWR from 'swr';
import { apiClient } from '../lib/api-client';
import type { CreateGateEntryDto, GateEntryResponse, SocietyResponse, FarmerResponse, DistrictResponse } from '@pacs-track/shared-types';

// Fetcher function for SWR
const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

// ============ Gate Entry Hooks ============

export function useGateEntries(filters?: {
    societyId?: string;
    districtId?: string;
    fromDate?: string;
    toDate?: string;
}) {
    const params = new URLSearchParams();
    if (filters?.societyId) params.append('societyId', filters.societyId);
    if (filters?.districtId) params.append('districtId', filters.districtId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);

    const queryString = params.toString();
    const url = `/gate-entries${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate } = useSWR<{
        data: GateEntryResponse[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>(url, fetcher);

    return {
        entries: data?.data || [],
        total: data?.total || 0,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export function useGateEntry(id: string) {
    const { data, error, mutate } = useSWR<GateEntryResponse>(
        id ? `/gate-entries/${id}` : null,
        fetcher
    );

    return {
        entry: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function createGateEntry(dto: CreateGateEntryDto) {
    const response = await apiClient.post<GateEntryResponse>('/gate-entries', dto);
    return response.data;
}

export async function updateGateEntry(id: string, dto: Partial<CreateGateEntryDto>) {
    const response = await apiClient.put<GateEntryResponse>(`/gate-entries/${id}`, dto);
    return response.data;
}

export async function deleteGateEntry(id: string) {
    const response = await apiClient.delete(`/gate-entries/${id}`);
    return response.data;
}

// ============ Society Hooks ============

export function useSocieties(districtId?: string) {
    const url = districtId ? `/societies?districtId=${districtId}` : '/societies';
    const { data, error, mutate } = useSWR<SocietyResponse[]>(url, fetcher);

    return {
        societies: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export function useSociety(id: string) {
    const { data, error } = useSWR<SocietyResponse>(
        id ? `/societies/${id}` : null,
        fetcher
    );

    return {
        society: data,
        isLoading: !error && !data,
        isError: error,
    };
}

// ============ Farmer Hooks ============

export function useFarmers(societyId?: string) {
    const url = societyId ? `/farmers?societyId=${societyId}` : '/farmers';
    const { data, error, mutate } = useSWR<FarmerResponse[]>(url, fetcher);

    return {
        farmers: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function searchFarmers(query: string, societyId?: string) {
    const params = new URLSearchParams({ q: query });
    if (societyId) params.append('societyId', societyId);

    const response = await apiClient.get<FarmerResponse[]>(`/farmers/search?${params.toString()}`);
    return response.data;
}

// ============ District Hooks ============

export function useDistricts() {
    const { data, error, mutate } = useSWR<DistrictResponse[]>('/districts', fetcher);

    return {
        districts: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}
