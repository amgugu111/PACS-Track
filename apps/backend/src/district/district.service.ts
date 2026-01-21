import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponse } from '../common/query-optimization.dto';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';

@Injectable()
export class DistrictService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find all districts with OPTIMIZED pagination
     */
    async findAll(
        riceMillId?: string,
        pagination?: PaginationDto
    ): Promise<PaginatedResponse<any>> {
        const where = riceMillId ? { riceMillId } : {};
        const page = pagination?.page || 1;
        const limit = Math.min(pagination?.limit || 50, 100);
        const skip = QueryOptimizationHelper.calculateSkip(page, limit);

        const orderBy = QueryOptimizationHelper.buildOrderBy(
            pagination?.sortBy || 'name',
            pagination?.sortOrder || 'asc'
        );

        const [districts, total] = await Promise.all([
            this.prisma.district.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    code: true,
                    state: true,
                    createdAt: true,
                    _count: {
                        select: {
                            societies: true,
                            gatePassEntries: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.district.count({ where }),
        ]);

        return QueryOptimizationHelper.buildPaginationMeta(
            districts,
            total,
            page,
            limit
        );
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
