import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocietyService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(riceMillId?: string) {
        const where = riceMillId ? { riceMillId } : {};
        return this.prisma.society.findMany({
            where,
            include: {
                district: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string, riceMillId?: string) {
        const where: any = { id };
        if (riceMillId) {
            where.riceMillId = riceMillId;
        }

        const society = await this.prisma.society.findFirst({
            where,
            include: {
                district: true,
                parties: true,
            },
        });

        if (!society) {
            throw new NotFoundException(`Society with ID ${id} not found or access denied`);
        }

        return society;
    }

    async findByDistrict(districtId: string, riceMillId?: string) {
        const where: any = { districtId };
        if (riceMillId) {
            where.riceMillId = riceMillId;
        }

        return this.prisma.society.findMany({
            where,
            include: {
                district: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async create(data: {
        name: string;
        districtId: string;
        address?: string;
        contactNo?: string;
    }, riceMillId: string) {
        // Validate district exists and belongs to rice mill
        const district = await this.prisma.district.findFirst({
            where: {
                id: data.districtId,
                riceMillId,
            },
        });

        if (!district) {
            throw new NotFoundException(`District not found or access denied`);
        }

        // Auto-generate society code
        // Format: PACS-{DISTRICT_CODE}-{SEQUENTIAL_NUMBER}
        const existingSocieties = await this.prisma.society.findMany({
            where: {
                districtId: data.districtId,
                riceMillId,
            },
            orderBy: { code: 'desc' },
            take: 1,
        });

        let nextNumber = 1;
        if (existingSocieties.length > 0) {
            const lastCode = existingSocieties[0].code;
            // Extract number from code like "PACS-PURI-001"
            const match = lastCode.match(/-([0-9]+)$/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const code = `PACS-${district.code}-${String(nextNumber).padStart(3, '0')}`;

        // Check if code already exists (just in case)
        const existingCode = await this.prisma.society.findFirst({
            where: {
                code,
                riceMillId,
            },
        });

        if (existingCode) {
            throw new BadRequestException(`Society code ${code} already exists`);
        }

        // Create society
        return this.prisma.society.create({
            data: {
                name: data.name,
                code,
                districtId: data.districtId,
                riceMillId,
                address: data.address,
                contactNo: data.contactNo,
            },
            include: {
                district: true,
            },
        });
    }

    async update(id: string, data: {
        name?: string;
        districtId?: string;
        address?: string;
        contactNo?: string;
    }, riceMillId: string) {
        // Verify society exists and belongs to rice mill
        const existingSociety = await this.prisma.society.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existingSociety) {
            throw new NotFoundException(`Society not found or access denied`);
        }

        // If districtId is being updated, validate it
        if (data.districtId) {
            const district = await this.prisma.district.findFirst({
                where: {
                    id: data.districtId,
                    riceMillId,
                },
            });

            if (!district) {
                throw new NotFoundException(`District not found or access denied`);
            }
        }

        return this.prisma.society.update({
            where: { id },
            data,
            include: {
                district: true,
            },
        });
    }

    async delete(id: string, riceMillId: string) {
        // Verify society exists and belongs to rice mill
        const existingSociety = await this.prisma.society.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existingSociety) {
            throw new NotFoundException(`Society not found or access denied`);
        }

        // Check if society has associated parties
        const partyCount = await this.prisma.party.count({
            where: { societyId: id },
        });

        if (partyCount > 0) {
            throw new BadRequestException(`Cannot delete society with ${partyCount} associated parties`);
        }

        return this.prisma.society.delete({
            where: { id },
        });
    }
}
