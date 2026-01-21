// ============ Gate Entry DTOs ============

export interface CreateGateEntryDto {
    tokenNo: string;
    date?: Date | string;
    partyName: string; // Name of the Party
    vehicleType: 'TRACTOR' | 'TRUCK' | 'TATA_ACE'; // Type of Vehicle
    vehicleNo?: string; // Vehicle Number (optional for tractor)
    bags: number; // Number of Bags
    quantity: number; // Quantity in Quintals/Kg
    remarks?: string;
    societyId: string;
    seasonId?: string; // Optional - will use active season if not provided
}

export interface UpdateGateEntryDto {
    tokenNo?: string;
    date?: Date | string;
    partyName?: string;
    vehicleType?: 'TRACTOR' | 'TRUCK' | 'TATA_ACE';
    vehicleNo?: string;
    bags?: number;
    quantity?: number;
    remarks?: string;
    societyId?: string;
}

export interface GateEntryResponse {
    id: string;
    serialNumber: number; // Auto-incrementing serial number
    tokenNo: string;
    date: Date | string;
    partyName: string; // Name of the Party
    pacsName: string; // PACS/PPC Name
    vehicleType: string; // Type of Vehicle
    vehicleNo?: string; // Vehicle Number (optional for tractor)
    bags: number; // Number of Bags
    quantity: number; // Quantity
    qtyPerBag: number; // Calculated field
    remarks?: string;
    societyId: string;
    partyId: string;
    districtId: string;
    seasonId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    society?: SocietyResponse;
    party?: PartyResponse;
    district?: DistrictResponse;
    season?: SeasonResponse;
}

// ============ Society DTOs ============

export interface CreateSocietyDto {
    name: string;
    code: string;
    districtId: string;
    address?: string;
    contactNo?: string;
}

export interface SocietyResponse {
    id: string;
    name: string;
    code: string;
    districtId: string;
    address?: string;
    contactNo?: string;
    district?: DistrictResponse;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ============ Party DTOs ============

export interface CreatePartyDto {
    name: string;
    fatherName?: string;
    phone?: string;
    address?: string;
    societyId: string;
}

export interface PartyResponse {
    id: string;
    name: string;
    fatherName?: string;
    phone?: string;
    address?: string;
    societyId: string;
    society?: SocietyResponse;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ============ District DTOs ============

export interface CreateDistrictDto {
    name: string;
    code?: string;
    state?: string;
}

export interface DistrictResponse {
    id: string;
    name: string;
    code?: string;
    state?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

// ============ API Response Wrappers ============

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============ Query Params ============

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface GateEntryQueryParams extends PaginationParams {
    societyId?: string;
    districtId?: string;
    seasonId?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
}

// ============ Season DTOs ============

export enum SeasonType {
    KHARIF = 'KHARIF',
    RABI = 'RABI',
}

export interface CreateSeasonDto {
    year: string; // e.g., "2025-2026"
    type: 'KHARIF' | 'RABI';
    isActive?: boolean;
}

export interface SeasonResponse {
    id: string;
    name: string;
    type: 'KHARIF' | 'RABI';
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface SocietyTargetResponse {
    id: string;
    seasonId: string;
    societyId: string;
    targetQuantity: number;
    society?: SocietyResponse;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface SetTargetDto {
    societyId: string;
    targetQuantity: number;
}

// ============ Analytics DTOs ============

export interface DashboardStats {
    season: {
        id: string;
        name: string;
        type: SeasonType;
        startDate: Date | string;
        endDate: Date | string;
    };
    overall: {
        totalTarget: number;
        totalAchieved: number;
        totalRemaining: number;
        percentage: number;
        totalEntries: number;
    };
    societyStats: SocietyStatItem[];
    districtStats: DistrictStatItem[];
    recentEntries: RecentEntryItem[];
}

export interface SocietyStatItem {
    societyId: string;
    societyName: string;
    societyCode: string;
    district: string;
    target: number;
    achieved: number;
    remaining: number;
    percentage: number;
    entries: number;
}

export interface DistrictStatItem {
    district: string;
    target: number;
    achieved: number;
    remaining: number;
    percentage: number;
    societies: number;
    entries: number;
}

export interface RecentEntryItem {
    id: string;
    tokenNo: string;
    date: Date | string;
    society: string;
    district: string;
    quantity: number;
    bags: number;
}
