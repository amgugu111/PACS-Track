import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min, Matches, IsInt, IsEnum } from 'class-validator';
import { SearchFilterDto } from '../../common/query-optimization.dto';

export enum VehicleType {
    TRACTOR = 'TRACTOR',
    TRUCK = 'TRUCK',
    TATA_ACE = 'TATA_ACE'
}

export class CreateGateEntryDto {
    @IsString()
    @IsNotEmpty()
    tokenNo: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsNotEmpty()
    partyName: string; // Name of the Party

    @IsEnum(VehicleType, { message: 'Vehicle type must be TRACTOR, TRUCK, or TATA_ACE' })
    @IsNotEmpty()
    vehicleType: VehicleType;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, {
        message: 'Vehicle number must be in Indian format (e.g., OD01AB1234, MH12DE5678)'
    })
    vehicleNo?: string; // Vehicle Number (optional for tractor)

    @IsInt({ message: 'Number of bags must be a whole number' })
    @Min(1, { message: 'Number of bags must be at least 1' })
    bags: number;

    @IsNumber({}, { message: 'Quantity must be a valid number' })
    @Min(0.01, { message: 'Quantity must be greater than 0 kg' })
    quantity: number; // Quantity in kg

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsNotEmpty()
    societyId: string;

    @IsString()
    @IsOptional()
    seasonId?: string; // Optional - will use active season if not provided
}

export class UpdateGateEntryDto {
    @IsString()
    @IsOptional()
    tokenNo?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    partyName?: string;

    @IsEnum(VehicleType)
    @IsOptional()
    vehicleType?: VehicleType;

    @IsString()
    @IsOptional()
    @Matches(/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, {
        message: 'Vehicle number must be in Indian format (e.g., OD01AB1234, MH12DE5678)'
    })
    vehicleNo?: string;

    @IsInt({ message: 'Number of bags must be a whole number' })
    @Min(1)
    @IsOptional()
    bags?: number;

    @IsNumber({}, { message: 'Quantity must be a valid number' })
    @Min(0.01)
    @IsOptional()
    quantity?: number;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsOptional()
    societyId?: string;
}

/**
 * DTO for gate entry filtering and pagination
 */
export class GateEntryFilterDto extends SearchFilterDto {
    @IsString()
    @IsOptional()
    societyId?: string;

    @IsString()
    @IsOptional()
    districtId?: string;

    @IsString()
    @IsOptional()
    seasonId?: string;

    @IsString()
    @IsOptional()
    partyId?: string;

    @IsEnum(VehicleType)
    @IsOptional()
    vehicleType?: VehicleType;
}

