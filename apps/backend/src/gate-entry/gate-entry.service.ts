import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGateEntryDto, UpdateGateEntryDto } from './dto/gate-entry.dto';

@Injectable()
export class GateEntryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Smart Gate Entry Creation with Farmer Upsert Logic
     * 
     * Process:
     * 1. Validate society exists and get its district
     * 2. Check if farmer exists by name within the society
     * 3. If farmer doesn't exist, create new farmer
     * 4. Create gate pass entry with all relationships
     */
    async createGateEntry(dto: CreateGateEntryDto, riceMillId: string) {
        // Step 1: Validate Society and get District
        const society = await this.prisma.society.findFirst({
            where: {
                id: dto.societyId,
                riceMillId: riceMillId,
            },
            include: { district: true },
        });

        if (!society) {
            throw new NotFoundException(`Society with ID ${dto.societyId} not found or access denied`);
        }

        // Step 2: Check for duplicate token number within the rice mill
        const existingToken = await this.prisma.gatePassEntry.findFirst({
            where: {
                tokenNo: dto.tokenNo,
                riceMillId: riceMillId,
            },
        });

        if (existingToken) {
            throw new ConflictException(`Gate pass with token number ${dto.tokenNo} already exists`);
        }

        // Step 3: Validate totalQty and totalBags
        if (dto.totalQty <= 0) {
            throw new BadRequestException('Total quantity must be greater than 0');
        }

        if (dto.totalBags <= 0) {
            throw new BadRequestException('Total bags must be greater than 0');
        }

        // Step 4: Smart Farmer Upsert - Check if farmer exists by name
        let farmer = await this.prisma.farmer.findFirst({
            where: {
                name: {
                    equals: dto.farmerName.trim(),
                    mode: 'insensitive', // Case-insensitive search
                },
                societyId: dto.societyId,
            },
        });

        // Step 5: If farmer doesn't exist, create new farmer
        if (!farmer) {
            console.log(`Creating new farmer: ${dto.farmerName}`);
            farmer = await this.prisma.farmer.create({
                data: {
                    name: dto.farmerName.trim(),
                    societyId: dto.societyId,
                },
            });
        } else {
            console.log(`Using existing farmer: ${farmer.name} (ID: ${farmer.id})`);
        }

        // Step 6: Create Gate Pass Entry
        const gateEntry = await this.prisma.gatePassEntry.create({
            data: {
                tokenNo: dto.tokenNo,
                challanNo: dto.challanNo,
                date: dto.date ? new Date(dto.date) : new Date(),
                truckNo: dto.truckNo,
                totalQty: dto.totalQty,
                totalBags: dto.totalBags,
                remarks: dto.remarks,
                riceMillId: riceMillId,
                societyId: dto.societyId,
                farmerId: farmer.id,
                districtId: society.districtId,
            },
            include: {
                society: {
                    include: {
                        district: true,
                    },
                },
                farmer: true,
                district: true,
            },
        });

        // Step 7: Calculate and add qtyPerBag
        return this.enrichWithCalculations(gateEntry);
    }

    /**
     * Get all gate entries with optional filters
     */
    async findAll(filters?: {
        riceMillId: string;
        societyId?: string;
        districtId?: string;
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = {
            riceMillId: filters.riceMillId,
        };

        if (filters?.societyId) {
            where.societyId = filters.societyId;
        }

        if (filters?.districtId) {
            where.districtId = filters.districtId;
        }

        if (filters?.fromDate || filters?.toDate) {
            where.date = {};
            if (filters.fromDate) {
                where.date.gte = new Date(filters.fromDate);
            }
            if (filters.toDate) {
                where.date.lte = new Date(filters.toDate);
            }
        }

        const [entries, total] = await Promise.all([
            this.prisma.gatePassEntry.findMany({
                where,
                include: {
                    society: {
                        include: { district: true },
                    },
                    farmer: true,
                    district: true,
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.gatePassEntry.count({ where }),
        ]);

        return {
            data: entries.map(entry => this.enrichWithCalculations(entry)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get single gate entry by ID
     */
    async findOne(id: string, riceMillId: string) {
        const entry = await this.prisma.gatePassEntry.findFirst({
            where: {
                id,
                riceMillId,
            },
            include: {
                society: {
                    include: { district: true },
                },
                farmer: true,
                district: true,
            },
        });

        if (!entry) {
            throw new NotFoundException(`Gate entry with ID ${id} not found`);
        }

        return this.enrichWithCalculations(entry);
    }

    /**
     * Update gate entry
     */
    async update(id: string, dto: UpdateGateEntryDto, riceMillId: string) {
        const existing = await this.prisma.gatePassEntry.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Gate entry with ID ${id} not found or access denied`);
        }

        // Check for duplicate token number if updating
        if (dto.tokenNo && dto.tokenNo !== existing.tokenNo) {
            const duplicateToken = await this.prisma.gatePassEntry.findFirst({
                where: {
                    tokenNo: dto.tokenNo,
                    riceMillId,
                },
            });

            if (duplicateToken) {
                throw new ConflictException(`Gate pass with token number ${dto.tokenNo} already exists`);
            }
        }

        const updated = await this.prisma.gatePassEntry.update({
            where: { id },
            data: {
                ...dto,
                date: dto.date ? new Date(dto.date) : undefined,
            },
            include: {
                society: {
                    include: { district: true },
                },
                farmer: true,
                district: true,
            },
        });

        return this.enrichWithCalculations(updated);
    }

    /**
     * Delete gate entry
     */
    async remove(id: string, riceMillId: string) {
        const existing = await this.prisma.gatePassEntry.findFirst({
            where: {
                id,
                riceMillId,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Gate entry with ID ${id} not found or access denied`);
        }

        await this.prisma.gatePassEntry.delete({
            where: { id },
        });

        return { message: 'Gate entry deleted successfully' };
    }

    /**
     * Helper: Add calculated fields to gate entry
     */
    private enrichWithCalculations(entry: any) {
        return {
            ...entry,
            qtyPerBag: entry.totalBags > 0 ? entry.totalQty / entry.totalBags : 0,
        };
    }
}
