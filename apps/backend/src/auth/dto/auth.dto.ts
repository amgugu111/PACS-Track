import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export enum UserRole {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    OPERATOR = 'OPERATOR',
}

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    name: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class CreateRiceMillDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    licenseNo?: string;

    // Admin user for the rice mill
    @IsString()
    adminName: string;

    @IsEmail()
    adminEmail: string;

    @IsString()
    @MinLength(6)
    adminPassword: string;
}

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}
