import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, PaginatedResponse } from '../common/query-optimization.dto';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';

@Injectable()
export class VehicleService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find all vehicles with pagination
     */
    async findAll(
        riceMillId: string,
        vehicleType?: string,
        pagination?: PaginationDto
    ): Promise<PaginatedResponse<any>> {
        const where: any = { riceMillId };

        if (vehicleType) {
            where.vehicleType = vehicleType;
        }

        // Add search filter if provided
        if (pagination?.search) {
            const searchConditions = QueryOptimizationHelper.buildSearchCondition(
                pagination.search,
                ['vehicleNo']
            );
            if (searchConditions) {
                where.OR = searchConditions;
            }
        }

        const page = pagination?.page || 1;
        const limit = Math.min(pagination?.limit || 50, 100);
        const skip = QueryOptimizationHelper.calculateSkip(page, limit);

        const orderBy = QueryOptimizationHelper.buildOrderBy(
            pagination?.sortBy || 'vehicleNo',
            pagination?.sortOrder || 'asc'
        );

        const [vehicles, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                select: {
                    id: true,
                    vehicleNo: true,
                    vehicleType: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.vehicle.count({ where }),
        ]);

        return QueryOptimizationHelper.buildPaginationMeta(
            vehicles,
            total,
            page,
            limit
        );
    }

    /**
     * Find one vehicle
     */
    async findOne(id: string, riceMillId: string) {
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id, riceMillId },
        });

        if (!vehicle) {
            throw new NotFoundException('Vehicle not found');
        }

        return vehicle;
    }

    /**
     * Create a new vehicle
     */
    async create(data: { vehicleNo: string; vehicleType: string }, riceMillId: string) {
        // Check if vehicle already exists
        const existing = await this.prisma.vehicle.findUnique({
            where: {
                vehicleNo_riceMillId: {
                    vehicleNo: data.vehicleNo.toUpperCase(),
                    riceMillId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Vehicle number already exists');
        }

        return this.prisma.vehicle.create({
            data: {
                vehicleNo: data.vehicleNo.toUpperCase(),
                vehicleType: data.vehicleType,
                riceMillId,
            },
        });
    }

    /**
     * Update a vehicle
     */
    async update(
        id: string,
        data: { vehicleNo?: string; vehicleType?: string; isActive?: boolean },
        riceMillId: string
    ) {
        const vehicle = await this.findOne(id, riceMillId);

        // If updating vehicle number, check for duplicates
        if (data.vehicleNo && data.vehicleNo !== vehicle.vehicleNo) {
            const existing = await this.prisma.vehicle.findUnique({
                where: {
                    vehicleNo_riceMillId: {
                        vehicleNo: data.vehicleNo.toUpperCase(),
                        riceMillId,
                    },
                },
            });

            if (existing) {
                throw new BadRequestException('Vehicle number already exists');
            }
        }

        return this.prisma.vehicle.update({
            where: { id },
            data: {
                ...(data.vehicleNo && { vehicleNo: data.vehicleNo.toUpperCase() }),
                ...(data.vehicleType && { vehicleType: data.vehicleType }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    }

    /**
     * Delete a vehicle
     */
    async delete(id: string, riceMillId: string) {
        await this.findOne(id, riceMillId);

        return this.prisma.vehicle.delete({
            where: { id },
        });
    }
}
