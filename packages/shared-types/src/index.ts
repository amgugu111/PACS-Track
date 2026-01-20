// ============ Gate Entry DTOs ============

export interface CreateGateEntryDto {
    tokenNo: string;
    challanNo: string;
    date: Date | string;
    truckNo: string;
    totalQty: number;
    totalBags: number;
    remarks?: string;
    societyId: string;
    farmerName: string; // Smart entry - accepts name instead of ID
}

export interface UpdateGateEntryDto {
    tokenNo?: string;
    challanNo?: string;
    date?: Date | string;
    truckNo?: string;
    totalQty?: number;
    totalBags?: number;
    remarks?: string;
    societyId?: string;
    farmerId?: string;
}

export interface GateEntryResponse {
    id: string;
    tokenNo: string;
    challanNo: string;
    date: Date | string;
    truckNo: string;
    totalQty: number;
    totalBags: number;
    qtyPerBag: number; // Calculated field
    remarks?: string;
    societyId: string;
    farmerId: string;
    districtId: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    society?: SocietyResponse;
    farmer?: FarmerResponse;
    district?: DistrictResponse;
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

// ============ Farmer DTOs ============

export interface CreateFarmerDto {
    name: string;
    fatherName?: string;
    phone?: string;
    address?: string;
    societyId: string;
}

export interface FarmerResponse {
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
    fromDate?: string;
    toDate?: string;
    search?: string;
}
