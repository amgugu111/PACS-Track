import useSWR, { mutate as globalMutate } from 'swr';
import { apiClient } from '../lib/api-client';
import { staticDataConfig, dynamicDataConfig } from '../lib/swr-config';
import type {
    CreateGateEntryDto,
    GateEntryResponse,
    SocietyResponse,
    PartyResponse,
    DistrictResponse,
    SeasonResponse,
    CreateSeasonDto,
    SetTargetDto,
    DashboardStats,
    PaginatedResponse
} from '@pacs-track/shared-types';

// Fetcher function for SWR
const fetcher = (url: string) => apiClient.get(url).then((res) => res.data);

// ============ Gate Entry Hooks ============

export function useGateEntries(filters?: {
    societyId?: string;
    districtId?: string;
    seasonId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const params = new URLSearchParams();
    if (filters?.societyId) params.append('societyId', filters.societyId);
    if (filters?.districtId) params.append('districtId', filters.districtId);
    if (filters?.seasonId) params.append('seasonId', filters.seasonId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `/gate-entries${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate } = useSWR<PaginatedResponse<GateEntryResponse>>(
        url,
        fetcher,
        dynamicDataConfig
    );

    return {
        entries: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 0,
        limit: data?.limit || 10,
        totalPages: data?.totalPages || 0,
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
    // Invalidate gate entries and analytics
    await globalMutate((key) => typeof key === 'string' && (key.startsWith('/gate-entries') || key.startsWith('/analytics')));
    return response.data;
}

export async function updateGateEntry(id: string, dto: Partial<CreateGateEntryDto>) {
    const response = await apiClient.put<GateEntryResponse>(`/gate-entries/${id}`, dto);
    await globalMutate((key) => typeof key === 'string' && (key.startsWith('/gate-entries') || key.startsWith('/analytics')));
    return response.data;
}

export async function deleteGateEntry(id: string) {
    const response = await apiClient.delete(`/gate-entries/${id}`);
    await globalMutate((key) => typeof key === 'string' && (key.startsWith('/gate-entries') || key.startsWith('/analytics')));
    return response.data;
}

// ============ Society Hooks ============

export function useSocieties(filters?: {
    districtId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const params = new URLSearchParams();
    if (filters?.districtId) params.append('districtId', filters.districtId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `/societies${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate } = useSWR<PaginatedResponse<SocietyResponse>>(
        url,
        fetcher,
        staticDataConfig
    );

    return {
        societies: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 0,
        limit: data?.limit || 10,
        totalPages: data?.totalPages || 0,
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

export async function createSociety(data: {
    name: string;
    districtId: string;
    address?: string;
    contactNo?: string;
}) {
    const response = await apiClient.post('/societies', data);
    // Invalidate all societies cache
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/societies'));
    return response.data;
}

export async function updateSociety(id: string, data: {
    name?: string;
    districtId?: string;
    address?: string;
    contactNo?: string;
}) {
    const response = await apiClient.put(`/societies/${id}`, data);
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/societies'));
    return response.data;
}

export async function deleteSociety(id: string) {
    const response = await apiClient.delete(`/societies/${id}`);
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/societies'));
    return response.data;
}

// ============ Party Hooks ============

export function useParties(filters?: {
    societyId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}) {
    const params = new URLSearchParams();
    if (filters?.societyId) params.append('societyId', filters.societyId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = `/parties${queryString ? `?${queryString}` : ''}`;

    const { data, error, mutate } = useSWR<PaginatedResponse<PartyResponse>>(
        url,
        fetcher
    );

    return {
        parties: data?.data || [],
        total: data?.total || 0,
        page: data?.page || 0,
        limit: data?.limit || 10,
        totalPages: data?.totalPages || 0,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function searchParties(query: string, societyId?: string) {
    const params = new URLSearchParams({ q: query });
    if (societyId) params.append('societyId', societyId);

    const response = await apiClient.get<PartyResponse[]>(`/parties/search?${params.toString()}`);
    return response.data;
}

export async function createParty(data: {
    name: string;
    fatherName?: string;
    phone?: string;
    address?: string;
    societyId: string;
}) {
    const response = await apiClient.post('/parties', data);
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/parties'));
    return response.data;
}

export async function updateParty(id: string, data: {
    name?: string;
    fatherName?: string;
    phone?: string;
    address?: string;
    societyId?: string;
}) {
    const response = await apiClient.put(`/parties/${id}`, data);
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/parties'));
    return response.data;
}

export async function deleteParty(id: string) {
    const response = await apiClient.delete(`/parties/${id}`);
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/parties'));
    return response.data;
}

// ============ District Hooks ============

export function useDistricts() {
    const { data, error, mutate } = useSWR<PaginatedResponse<DistrictResponse>>('/districts', fetcher, staticDataConfig);

    return {
        districts: data?.data || [],
        total: data?.total || 0,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function createDistrict(data: { name: string; state?: string }) {
    const response = await apiClient.post('/districts', data);
    await globalMutate('/districts');
    return response.data;
}

export async function updateDistrict(id: string, data: { name?: string; state?: string }) {
    const response = await apiClient.put(`/districts/${id}`, data);
    await globalMutate('/districts');
    return response.data;
}

export async function deleteDistrict(id: string) {
    const response = await apiClient.delete(`/districts/${id}`);
    await globalMutate('/districts');
    return response.data;
}

// ============ Season Hooks ============

export function useSeasons() {
    const { data, error, mutate } = useSWR<SeasonResponse[]>('/seasons', fetcher, staticDataConfig);

    return {
        seasons: data || [],
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export function useActiveSeason() {
    const { data, error, mutate } = useSWR<SeasonResponse>('/seasons/active', fetcher, staticDataConfig);

    return {
        activeSeason: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function createSeason(data: CreateSeasonDto) {
    const response = await apiClient.post('/seasons', data);
    await globalMutate('/seasons');
    await globalMutate('/seasons/active');
    return response.data;
}

export async function updateSeason(id: string, data: Partial<CreateSeasonDto>) {
    const response = await apiClient.put(`/seasons/${id}`, data);
    await globalMutate('/seasons');
    await globalMutate('/seasons/active');
    return response.data;
}

export async function activateSeason(id: number | string) {
    const response = await apiClient.patch(`/seasons/${id}/activate`);
    await globalMutate('/seasons');
    await globalMutate('/seasons/active');
    // Also refresh analytics since active season changed
    await globalMutate((key) => typeof key === 'string' && key.startsWith('/analytics'));
    return response.data;
}

export async function deleteSeason(id: number | string) {
    const response = await apiClient.delete(`/seasons/${id}`);
    await globalMutate('/seasons');
    await globalMutate('/seasons/active');
    return response.data;
}

export async function setSeasonTargets(seasonId: number | string, targets: { targets: SetTargetDto[] }) {
    const response = await apiClient.post(`/seasons/${seasonId}/targets`, targets);
    return response.data;
}

export async function getSeasonTargets(seasonId: number | string) {
    const response = await apiClient.get(`/seasons/${seasonId}/targets`);
    return response.data;
}

// ============ Analytics Hooks ============

export function useDashboardStats(seasonId?: string | number) {
    const url = seasonId ? `/analytics/dashboard?seasonId=${seasonId}` : null;
    const { data, error, mutate } = useSWR<DashboardStats>(url, fetcher, dynamicDataConfig);

    return {
        stats: data,
        isLoading: !error && !data,
        isError: error,
        mutate,
    };
}

export async function getTargetVsActualChart(seasonId: string, groupBy: 'society' | 'district') {
    const response = await apiClient.get(`/analytics/chart/target-vs-actual?seasonId=${seasonId}&groupBy=${groupBy}`);
    return response.data;
}

export async function getTrendData(seasonId: string) {
    const response = await apiClient.get(`/analytics/trend?seasonId=${seasonId}`);
    return response.data;
}
