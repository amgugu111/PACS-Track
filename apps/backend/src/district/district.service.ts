import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DistrictService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(riceMillId?: string) {
        const where = riceMillId ? { riceMillId } : {};
        return this.prisma.district.findMany({
            where,
            orderBy: { name: 'asc' },
        });
    }

    async create(data: {
        name: string;
        state?: string;
    }, riceMillId: string) {
        // Auto-generate district code from name
        // Convert to uppercase and take first 4-6 characters
        let baseCode = data.name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 6);

        if (baseCode.length < 2) {
            throw new BadRequestException('District name must contain at least 2 letters');
        }

        // Check if code exists and increment if needed
        let code = baseCode;
        let counter = 1;

        while (true) {
            const existing = await this.prisma.district.findFirst({
                where: {
                    code,
                    riceMillId,
                },
            });

            if (!existing) {
                break;
            }

            code = `${baseCode}${counter}`;
            counter++;
        }

        // Create district
        return this.prisma.district.create({
            data: {
                name: data.name,
                code,
                state: data.state,
                riceMillId,
            },
        });
    }

    async update(id: string, data: {
        name?: string;
        state?: string;
    }, riceMillId: string) {
        // Verify district exists and belongs to rice mill
        const existingDistrict = await this.prisma.district.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existingDistrict) {
            throw new NotFoundException(`District not found or access denied`);
        }

        return this.prisma.district.update({
            where: { id },
            data,
        });
    }

    async delete(id: string, riceMillId: string) {
        // Verify district exists and belongs to rice mill
        const existingDistrict = await this.prisma.district.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existingDistrict) {
            throw new NotFoundException(`District not found or access denied`);
        }

        // Check if district has associated societies
        const societyCount = await this.prisma.society.count({
            where: { districtId: id },
        });

        if (societyCount > 0) {
            throw new BadRequestException(`Cannot delete district with ${societyCount} associated societies`);
        }

        return this.prisma.district.delete({
            where: { id },
        });
    }
}
