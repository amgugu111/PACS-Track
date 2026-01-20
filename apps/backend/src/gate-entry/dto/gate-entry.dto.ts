import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateGateEntryDto {
    @IsString()
    @IsNotEmpty()
    tokenNo: string;

    @IsString()
    @IsNotEmpty()
    challanNo: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsNotEmpty()
    truckNo: string;

    @IsNumber()
    @Min(0.01, { message: 'Total quantity must be greater than 0' })
    totalQty: number;

    @IsNumber()
    @Min(1, { message: 'Total bags must be at least 1' })
    totalBags: number;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsNotEmpty()
    societyId: string;

    @IsString()
    @IsNotEmpty()
    farmerName: string; // Smart entry - accepts name instead of ID
}

export class UpdateGateEntryDto {
    @IsString()
    @IsOptional()
    tokenNo?: string;

    @IsString()
    @IsOptional()
    challanNo?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    truckNo?: string;

    @IsNumber()
    @Min(0.01)
    @IsOptional()
    totalQty?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    totalBags?: number;

    @IsString()
    @IsOptional()
    remarks?: string;

    @IsString()
    @IsOptional()
    societyId?: string;

    @IsString()
    @IsOptional()
    farmerId?: string;
}
