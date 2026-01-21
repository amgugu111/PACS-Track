import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeasonDto, UpdateSeasonDto, SetTargetDto } from './dto/season.dto';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';

@Injectable()
export class SeasonService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateSeasonDto, riceMillId: string) {
        // If setting as active, deactivate all other seasons
        if (dto.isActive) {
            await this.prisma.season.updateMany({
                where: { riceMillId, isActive: true },
                data: { isActive: false },
            });
        }

        return this.prisma.season.create({
            data: {
                name: dto.year,
                type: dto.type,
                isActive: dto.isActive ?? false,
                riceMillId,
            },
        });
    }

    /**
     * Find all seasons with OPTIMIZED counts
     */
    async findAll(riceMillId: string) {
        return this.prisma.season.findMany({
            where: { riceMillId },
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        gatePassEntries: true,
                        targets: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Find active season - OPTIMIZED with index usage
     */
    async findActive(riceMillId: string) {
        const activeSeason = await this.prisma.season.findFirst({
            where: { riceMillId, isActive: true },
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!activeSeason) {
            throw new NotFoundException('No active season found. Please activate a season first.');
        }

        return activeSeason;
    }

    /**
     * Find one season by ID - OPTIMIZED with selective includes
     */
    async findOne(id: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id, riceMillId },
            select: {
                id: true,
                name: true,
                type: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                targets: {
                    select: {
                        id: true,
                        targetQuantity: true,
                        society: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                    orderBy: {
                        society: {
                            name: 'asc',
                        },
                    },
                },
                _count: {
                    select: {
                        gatePassEntries: true,
                    },
                },
            },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        return season;
    }

    async update(id: string, dto: UpdateSeasonDto, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Generate name from year if year is being updated
        const name = dto.year || season.name;

        // If setting as active, deactivate all other seasons
        if (dto.isActive) {
            await this.prisma.season.updateMany({
                where: { riceMillId, isActive: true, id: { not: id } },
                data: { isActive: false },
            });
        }

        return this.prisma.season.update({
            where: { id },
            data: {
                ...(dto.type && { type: dto.type }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
                ...(dto.year && { name }),
            },
        });
    }

    async setActive(id: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Deactivate all other seasons
        await this.prisma.season.updateMany({
            where: { riceMillId, isActive: true },
            data: { isActive: false },
        });

        // Activate this season
        return this.prisma.season.update({
            where: { id },
            data: { isActive: true },
        });
    }

    async remove(id: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        if (season.isActive) {
            throw new BadRequestException('Cannot delete active season');
        }

        const hasEntries = await this.prisma.gatePassEntry.count({
            where: { seasonId: id },
        });

        if (hasEntries > 0) {
            throw new BadRequestException('Cannot delete season with gate entries');
        }

        await this.prisma.season.delete({ where: { id } });
        return { message: 'Season deleted successfully' };
    }

    async setTargets(seasonId: string, targets: SetTargetDto[], riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Upsert all targets
        const results = await Promise.all(
            targets.map(target =>
                this.prisma.societyTarget.upsert({
                    where: {
                        seasonId_societyId: {
                            seasonId,
                            societyId: target.societyId,
                        },
                    },
                    update: {
                        targetQuantity: target.targetQuantity,
                    },
                    create: {
                        seasonId,
                        societyId: target.societyId,
                        targetQuantity: target.targetQuantity,
                    },
                })
            )
        );

        return { message: 'Targets set successfully', count: results.length };
    }

    async getTargets(seasonId: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Get all societies for this rice mill
        const allSocieties = await this.prisma.society.findMany({
            where: { riceMillId },
            include: {
                district: true,
            },
            orderBy: { name: 'asc' },
        });

        // Get existing targets for this season
        const existingTargets = await this.prisma.societyTarget.findMany({
            where: { seasonId },
        });

        // Create a map of societyId -> target
        const targetMap = new Map(
            existingTargets.map(t => [t.societyId, t.targetQuantity])
        );

        // Return all societies with their targets (0 if not set)
        return allSocieties.map(society => ({
            id: targetMap.has(society.id) ? existingTargets.find(t => t.societyId === society.id)?.id : null,
            seasonId,
            societyId: society.id,
            targetQuantity: targetMap.get(society.id) || 0,
            society: {
                id: society.id,
                name: society.name,
                code: society.code,
                district: society.district,
            },
        }));
    }
}
