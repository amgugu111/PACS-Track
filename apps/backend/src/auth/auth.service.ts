import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, CreateRiceMillDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async createRiceMill(dto: CreateRiceMillDto) {
        // Check if rice mill email already exists
        const existingMill = await this.prisma.riceMill.findUnique({
            where: { email: dto.email },
        });

        if (existingMill) {
            throw new ConflictException('Rice mill with this email already exists');
        }

        // Check if admin email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.adminEmail },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

        // Create rice mill with admin user
        const riceMill = await this.prisma.riceMill.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                licenseNo: dto.licenseNo,
                users: {
                    create: {
                        email: dto.adminEmail,
                        password: hashedPassword,
                        name: dto.adminName,
                        role: 'ADMIN',
                    },
                },
            },
            include: {
                users: true,
            },
        });

        return {
            riceMill: {
                id: riceMill.id,
                name: riceMill.name,
                email: riceMill.email,
            },
            admin: {
                id: riceMill.users[0].id,
                email: riceMill.users[0].email,
                name: riceMill.users[0].name,
            },
        };
    }

    async register(dto: RegisterDto, riceMillId: string, requestingUserId: string) {
        // Verify requesting user is an admin
        const requestingUser = await this.prisma.user.findUnique({
            where: { id: requestingUserId },
        });

        if (!requestingUser || requestingUser.role !== 'ADMIN') {
            throw new UnauthorizedException('Only admins can create new users');
        }

        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || 'OPERATOR',
                riceMillId: riceMillId,
            },
        });

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }

    async login(dto: LoginDto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: {
                riceMill: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Super admin doesn't need a rice mill
        if (user.role !== 'SUPER_ADMIN' && (!user.riceMill || !user.riceMill.isActive)) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate JWT
        const payload = {
            sub: user.id,
            email: user.email,
            riceMillId: user.riceMillId,
            role: user.role,
        };

        const response: any = {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };

        // Add rice mill info if not super admin
        if (user.role !== 'SUPER_ADMIN' && user.riceMill) {
            response.user.riceMill = {
                id: user.riceMill.id,
                name: user.riceMill.name,
            };
        }

        return response;
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                riceMill: true,
            },
        });

        if (!user || !user.isActive) {
            return null;
        }

        // Super admin doesn't need rice mill
        if (user.role !== 'SUPER_ADMIN' && (!user.riceMill || !user.riceMill.isActive)) {
            return null;
        }

        return user;
    }

    // Super Admin Methods
    async getAllRiceMills() {
        return this.prisma.riceMill.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        gatePassEntries: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRiceMillById(id: string) {
        return this.prisma.riceMill.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        districts: true,
                        societies: true,
                        gatePassEntries: true,
                    },
                },
            },
        });
    }

    async toggleRiceMillStatus(id: string, isActive: boolean) {
        return this.prisma.riceMill.update({
            where: { id },
            data: { isActive },
        });
    }

    async updateRiceMill(id: string, data: Partial<CreateRiceMillDto>) {
        return this.prisma.riceMill.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                licenseNo: data.licenseNo,
            },
        });
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string) {
        // Get user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Verify old password
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password changed successfully' };
    }
}
