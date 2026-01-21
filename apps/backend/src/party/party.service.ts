import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponse } from '../common/query-optimization.dto';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';

@Injectable()
export class PartyService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find all parties with OPTIMIZED pagination
     */
    async findAll(
        societyId: string | undefined,
        riceMillId: string,
        pagination?: PaginationDto
    ): Promise<PaginatedResponse<any>> {
        const where: any = {
            society: {
                riceMillId,
            },
        };

        if (societyId) {
            where.societyId = societyId;
        }

        // Add search filter if provided
        if (pagination?.search) {
            const searchConditions = QueryOptimizationHelper.buildSearchCondition(
                pagination.search,
                ['name', 'fatherName', 'phone', 'address']
            );
            if (searchConditions) {
                where.OR = searchConditions;
            }
        }

        const page = pagination?.page || 1;
        const limit = Math.min(pagination?.limit || 50, 100);
        const skip = QueryOptimizationHelper.calculateSkip(page, limit);

        const orderBy = QueryOptimizationHelper.buildOrderBy(
            pagination?.sortBy || 'name',
            pagination?.sortOrder || 'asc'
        );

        const [parties, total] = await Promise.all([
            this.prisma.party.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    fatherName: true,
                    phone: true,
                    address: true,
                    createdAt: true,
                    society: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            district: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            gatePassEntries: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.party.count({ where }),
        ]);

        return QueryOptimizationHelper.buildPaginationMeta(
            parties,
            total,
            page,
            limit
        );
    }

    /**
     * Search parties by name with OPTIMIZED query - for autocomplete
     */
    async searchByName(query: string, societyId: string | undefined, riceMillId: string) {
        const where: any = {
            name: {
                contains: query,
                mode: 'insensitive',
            },
            society: {
                riceMillId,
            },
        };

        if (societyId) {
            where.societyId = societyId;
        }

        return this.prisma.party.findMany({
            where,
            select: {
                id: true,
                name: true,
                phone: true,
                society: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            take: 20, // Limit for autocomplete
        });
    }
}
