import { IsString, IsNotEmpty, IsEnum, IsDateString, IsBoolean, IsOptional, IsNumber, Min, IsArray } from 'class-validator';

export enum SeasonType {
    KHARIF = 'KHARIF',
    RABI = 'RABI',
}

export class CreateSeasonDto {
    @IsString()
    @IsNotEmpty()
    year: string; // e.g., "2025-2026"

    @IsEnum(SeasonType)
    type: SeasonType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateSeasonDto {
    @IsString()
    @IsOptional()
    year?: string; // e.g., "2025-2026"

    @IsEnum(SeasonType)
    @IsOptional()
    type?: SeasonType;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class SetTargetDto {
    @IsString()
    @IsNotEmpty()
    societyId: string;

    @IsNumber()
    @Min(0)
    targetQuantity: number;
}
