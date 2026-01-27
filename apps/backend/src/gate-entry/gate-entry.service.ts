import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGateEntryDto, UpdateGateEntryDto, GateEntryFilterDto } from './dto/gate-entry.dto';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';
import { PaginatedResponse } from '../common/query-optimization.dto';

@Injectable()
export class GateEntryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Smart Gate Entry Creation with Party Upsert Logic - OPTIMIZED
     * 
     * Process:
     * 1. Get or validate active season
     * 2. Validate society exists and get its district
     * 3. Check if party exists by name within the society
     * 4. If party doesn't exist, create new party
     * 5. Create gate pass entry with all relationships
     */
    async createGateEntry(dto: CreateGateEntryDto, riceMillId: string) {
        // Parallel query optimization: Fetch active season and validate society in parallel
        const [activeSeason, society] = await Promise.all([
            dto.seasonId
                ? this.prisma.season.findFirst({
                    where: { id: dto.seasonId, riceMillId },
                    select: { id: true, isActive: true }, // Select only needed fields
                })
                : this.prisma.season.findFirst({
                    where: { riceMillId, isActive: true },
                    select: { id: true, isActive: true },
                }),
            this.prisma.society.findFirst({
                where: {
                    id: dto.societyId,
                    riceMillId: riceMillId,
                },
                select: {
                    id: true,
                    name: true,
                    districtId: true,
                }, // Select only needed fields
            }),
        ]);

        // Validate season
        if (!activeSeason) {
            throw new BadRequestException(
                dto.seasonId ? 'Season not found' : 'No active season found. Please activate a season first.'
            );
        }
        if (!activeSeason.isActive) {
            throw new BadRequestException('Cannot add entries to inactive season');
        }

        // Validate society
        if (!society) {
            throw new NotFoundException(`Society with ID ${dto.societyId} not found or access denied`);
        }

        // Parallel validation: Check duplicate token and validate inputs
        const [existingToken] = await Promise.all([
            this.prisma.gatePassEntry.findFirst({
                where: {
                    tokenNo: dto.tokenNo,
                    riceMillId: riceMillId,
                },
                select: { id: true }, // Only select id for existence check
            }),
        ]);

        if (existingToken) {
            throw new ConflictException(`Gate pass with token number ${dto.tokenNo} already exists`);
        }

        // Validate quantity and bags
        if (dto.quantity <= 0) {
            throw new BadRequestException('Quantity must be greater than 0');
        }

        if (dto.bags <= 0) {
            throw new BadRequestException('Number of bags must be greater than 0');
        }

        // Smart Party Upsert - Check if party exists by name (case-insensitive)
        let party = await this.prisma.party.findFirst({
            where: {
                name: {
                    equals: dto.partyName.trim(),
                    mode: 'insensitive',
                },
                societyId: dto.societyId,
            },
            select: { id: true, name: true },
        });

        // If party doesn't exist, create new party
        if (!party) {
            console.log(`Creating new party: ${dto.partyName}`);
            party = await this.prisma.party.create({
                data: {
                    name: dto.partyName.trim(),
                    societyId: dto.societyId,
                },
                select: { id: true, name: true },
            });
        } else {
            console.log(`Using existing party: ${party.name} (ID: ${party.id})`);
        }

        // Step 6: Create Gate Pass Entry with optimized select
        const gateEntry = await this.prisma.gatePassEntry.create({
            data: {
                tokenNo: dto.tokenNo,
                date: dto.date ? new Date(dto.date) : new Date(),
                partyName: dto.partyName.trim(),
                pacsName: society.name, // Denormalized for search
                vehicleType: dto.vehicleType,
                vehicleNo: dto.vehicleNo ? dto.vehicleNo.trim().toUpperCase() : null,
                bags: dto.bags,
                quantity: dto.quantity,
                riceMillId: riceMillId,
                societyId: dto.societyId,
                partyId: party.id,
                districtId: society.districtId,
                seasonId: activeSeason.id,
            },
            include: {
                society: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        district: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
                party: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                district: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                season: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        // Step 7: Calculate and add qtyPerBag
        return this.enrichWithCalculations(gateEntry);
    }

    /**
     * Get all gate entries with OPTIMIZED filters, search, and pagination
     */
    async findAll(filters: GateEntryFilterDto & { riceMillId: string }): Promise<PaginatedResponse<any>> {
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100); // Max 100 per page
        const skip = QueryOptimizationHelper.calculateSkip(page, limit);

        // Build WHERE clause efficiently
        const where: any = {
            riceMillId: filters.riceMillId,
        };

        // Add optional filters
        if (filters.seasonId) where.seasonId = filters.seasonId;
        if (filters.societyId) where.societyId = filters.societyId;
        if (filters.districtId) where.districtId = filters.districtId;
        if (filters.partyId) where.partyId = filters.partyId;
        if (filters.vehicleType) where.vehicleType = filters.vehicleType;

        // Add date range filter
        const dateFilter = QueryOptimizationHelper.buildDateRangeFilter(
            filters.fromDate,
            filters.toDate,
            'date'
        );
        if (dateFilter) {
            Object.assign(where, dateFilter);
        }

        // Add search functionality across multiple fields
        if (filters.search) {
            const searchConditions = QueryOptimizationHelper.buildSearchCondition(
                filters.search,
                ['partyName', 'pacsName', 'vehicleNo', 'tokenNo', 'challanNo']
            );
            if (searchConditions) {
                where.OR = searchConditions;
            }
        }

        // Build orderBy clause
        const orderBy = QueryOptimizationHelper.buildOrderBy(
            filters.sortBy || 'date',
            filters.sortOrder || 'desc'
        );

        // Execute query and count in parallel
        const [entries, total] = await Promise.all([
            this.prisma.gatePassEntry.findMany({
                where,
                // Use selective includes to prevent over-fetching
                select: {
                    id: true,
                    serialNumber: true,
                    tokenNo: true,
                    date: true,
                    partyName: true,
                    pacsName: true,
                    vehicleType: true,
                    vehicleNo: true,
                    bags: true,
                    quantity: true,
                    challanNo: true,
                    societyId: true,
                    districtId: true,
                    seasonId: true,
                    society: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            district: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true,
                                },
                            },
                        },
                    },
                    party: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                    district: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    season: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            this.prisma.gatePassEntry.count({ where }),
        ]);

        const enrichedData = entries.map(entry => this.enrichWithCalculations(entry));

        return QueryOptimizationHelper.buildPaginationMeta(
            enrichedData,
            total,
            page,
            limit
        );
    }

    /**
     * Get single gate entry by ID - OPTIMIZED
     */
    async findOne(id: string, riceMillId: string) {
        const entry = await this.prisma.gatePassEntry.findFirst({
            where: {
                id,
                riceMillId,
            },
            select: {
                id: true,
                serialNumber: true,
                tokenNo: true,
                date: true,
                partyName: true,
                pacsName: true,
                vehicleType: true,
                vehicleNo: true,
                bags: true,
                quantity: true,
                challanNo: true,
                societyId: true,
                districtId: true,
                seasonId: true,
                society: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        district: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                            },
                        },
                    },
                },
                party: {
                    select: {
                        id: true,
                        name: true,
                        fatherName: true,
                        phone: true,
                        address: true,
                    },
                },
                district: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                season: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
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
                party: true,
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
            qtyPerBag: entry.bags > 0 ? entry.quantity / entry.bags : 0,
        };
    }

    /**
     * Generate Report Data - OPTIMIZED with database aggregations
     * Uses selective queries based on report type to minimize data transfer
     */
    async generateReport(filters: {
        riceMillId: string;
        fromDate: string;
        toDate: string;
        reportType: string;
        societyId?: string;
        districtId?: string;
        seasonId?: string;
    }) {
        // Fetch rice mill name
        const riceMill = await this.prisma.riceMill.findUnique({
            where: { id: filters.riceMillId },
            select: { name: true },
        });

        const dateFilter = {
            gte: new Date(filters.fromDate),
            lte: new Date(filters.toDate + 'T23:59:59.999Z'),
        };

        // Route to optimized report methods based on type
        let reportData;
        switch (filters.reportType) {
            case 'daily':
                reportData = await this.generateDailyReportOptimized(filters, dateFilter);
                break;
            case 'society':
                reportData = await this.generateSocietyReportOptimized(filters, dateFilter);
                break;
            case 'society-daywise':
                reportData = await this.generateSocietyDaywiseReport(filters, dateFilter);
                break;
            case 'district':
                reportData = await this.generateDistrictReportOptimized(filters, dateFilter);
                break;
            case 'party':
                reportData = await this.generatePartyReportOptimized(filters, dateFilter);
                break;
            case 'summary':
                reportData = await this.generateSummaryReportOptimized(filters, dateFilter);
                break;
            default:
                // Fallback to fetching entries with selective fields
                reportData = await this.fetchEntriesForReport(filters, dateFilter);
        }

        // Add rice mill name to the report metadata
        return {
            riceMillName: riceMill?.name || 'Unknown Rice Mill',
            data: reportData,
        };
    }

    /**
     * Fetch entries for reports with selective fields only
     */
    private async fetchEntriesForReport(filters: any, dateFilter: any) {
        const where: any = {
            riceMillId: filters.riceMillId,
            date: dateFilter,
        };

        if (filters.societyId) where.societyId = filters.societyId;
        if (filters.districtId) where.districtId = filters.districtId;
        if (filters.seasonId) where.seasonId = filters.seasonId;

        return this.prisma.gatePassEntry.findMany({
            where,
            select: {
                id: true,
                tokenNo: true,
                date: true,
                partyName: true,
                pacsName: true,
                vehicleNo: true,
                vehicleType: true,
                bags: true,
                quantity: true,
                society: {
                    select: {
                        name: true,
                    },
                },
                district: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    /**
     * OPTIMIZED: Daily report with selective fields
     */
    private async generateDailyReportOptimized(filters: any, dateFilter: any) {
        const entries = await this.fetchEntriesForReport(filters, dateFilter);

        const reportData = entries.map((entry, index) => ({
            'S.No': index + 1,
            'Token No': entry.tokenNo,
            'Date': new Date(entry.date).toLocaleDateString('en-GB'),
            'Society': entry.society?.name || entry.pacsName,
            'District': entry.district?.name || '',
            'Party Name': entry.partyName,
            'Vehicle No': entry.vehicleNo || '',
            'Bags': entry.bags,
            'Quantity (qtl)': entry.quantity,
            'Qty Per Bag': (entry.quantity / entry.bags).toFixed(2),
        }));

        // Add total row
        const totalBags = entries.reduce((sum, entry) => sum + entry.bags, 0);
        const totalQuantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);

        reportData.push({
            'S.No': null as any,
            'Token No': '',
            'Date': '',
            'Society': '',
            'District': '',
            'Party Name': 'TOTAL',
            'Vehicle No': '',
            'Bags': totalBags,
            'Quantity (qtl)': totalQuantity,
            'Qty Per Bag': totalBags > 0 ? (totalQuantity / totalBags).toFixed(2) : '0.00',
        });

        return reportData;
    }

    /**
     * OPTIMIZED: Society report using database aggregation
     */
    private async generateSocietyReportOptimized(filters: any, dateFilter: any) {
        const where: any = {
            riceMillId: filters.riceMillId,
            date: dateFilter,
        };

        if (filters.districtId) where.districtId = filters.districtId;
        if (filters.seasonId) where.seasonId = filters.seasonId;

        // Build query parts conditionally
        const queryParts = [
            `SELECT 
                s.name as society,
                COUNT(gpe.id) as entries,
                SUM(gpe.bags)::int as total_bags,
                SUM(gpe.quantity)::numeric as total_quantity
            FROM gate_pass_entries gpe
            LEFT JOIN societies s ON gpe."societyId" = s.id
            WHERE gpe."riceMillId" = $1
                AND gpe.date >= $2
                AND gpe.date <= $3`
        ];

        const params: any[] = [filters.riceMillId, dateFilter.gte, dateFilter.lte];
        let paramIndex = 4;

        if (filters.seasonId) {
            queryParts.push(`AND gpe."seasonId" = $${paramIndex}`);
            params.push(filters.seasonId);
            paramIndex++;
        }

        if (filters.districtId) {
            queryParts.push(`AND gpe."districtId" = $${paramIndex}`);
            params.push(filters.districtId);
            paramIndex++;
        }

        queryParts.push(`GROUP BY s.name ORDER BY s.name ASC`);

        const query = queryParts.join(' ');
        const results = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

        const reportData = results.map((row, index) => ({
            'S.No': index + 1,
            'Society': row.society || 'Unknown',
            'Total Entries': Number(row.entries),
            'Total Bags': Number(row.total_bags),
            'Total Quantity (qtl)': Number(row.total_quantity).toFixed(2),
            'Average Qty Per Entry': Number(row.entries) > 0
                ? (Number(row.total_quantity) / Number(row.entries)).toFixed(2)
                : '0.00',
        }));

        // Add total row
        const totalEntries = results.reduce((sum, row) => sum + Number(row.entries), 0);
        const totalBags = results.reduce((sum, row) => sum + Number(row.total_bags), 0);
        const totalQuantity = results.reduce((sum, row) => sum + Number(row.total_quantity), 0);

        reportData.push({
            'S.No': null as any,
            'Society': 'TOTAL',
            'Total Entries': totalEntries,
            'Total Bags': totalBags,
            'Total Quantity (qtl)': totalQuantity.toFixed(2),
            'Average Qty Per Entry': totalEntries > 0 ? (totalQuantity / totalEntries).toFixed(2) : '0.00',
        });

        return reportData;
    }

    /**
     * OPTIMIZED: District report using database aggregation
     */
    private async generateDistrictReportOptimized(filters: any, dateFilter: any) {
        const where: any = {
            riceMillId: filters.riceMillId,
            date: dateFilter,
        };

        if (filters.seasonId) where.seasonId = filters.seasonId;

        // Build query parts conditionally
        const queryParts = [
            `SELECT 
                d.name as district,
                COUNT(gpe.id) as entries,
                COUNT(DISTINCT gpe."societyId") as societies,
                SUM(gpe.bags)::int as total_bags,
                SUM(gpe.quantity)::numeric as total_quantity
            FROM gate_pass_entries gpe
            LEFT JOIN districts d ON gpe."districtId" = d.id
            WHERE gpe."riceMillId" = $1
                AND gpe.date >= $2
                AND gpe.date <= $3`
        ];

        const params: any[] = [filters.riceMillId, dateFilter.gte, dateFilter.lte];
        let paramIndex = 4;

        if (filters.seasonId) {
            queryParts.push(`AND gpe."seasonId" = $${paramIndex}`);
            params.push(filters.seasonId);
            paramIndex++;
        }

        queryParts.push(`GROUP BY d.name ORDER BY d.name ASC`);

        const query = queryParts.join(' ');
        const results = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

        const reportData = results.map((row, index) => ({
            'S.No': index + 1,
            'District': row.district || 'Unknown',
            'Total Entries': Number(row.entries),
            'Total Societies': Number(row.societies),
            'Total Bags': Number(row.total_bags),
            'Total Quantity (qtl)': Number(row.total_quantity).toFixed(2),
            'Average Qty Per Entry': Number(row.entries) > 0
                ? (Number(row.total_quantity) / Number(row.entries)).toFixed(2)
                : '0.00',
        }));

        // Add total row
        const totalEntries = results.reduce((sum, row) => sum + Number(row.entries), 0);
        const totalSocieties = results.reduce((sum, row) => sum + Number(row.societies), 0);
        const totalBags = results.reduce((sum, row) => sum + Number(row.total_bags), 0);
        const totalQuantity = results.reduce((sum, row) => sum + Number(row.total_quantity), 0);

        reportData.push({
            'S.No': null as any,
            'District': 'TOTAL',
            'Total Entries': totalEntries,
            'Total Societies': totalSocieties,
            'Total Bags': totalBags,
            'Total Quantity (qtl)': totalQuantity.toFixed(2),
            'Average Qty Per Entry': totalEntries > 0 ? (totalQuantity / totalEntries).toFixed(2) : '0.00',
        });

        return reportData;
    }

    /**
     * OPTIMIZED: Party report using database aggregation
     */
    private async generatePartyReportOptimized(filters: any, dateFilter: any) {
        const where: any = {
            riceMillId: filters.riceMillId,
            date: dateFilter,
        };

        if (filters.societyId) where.societyId = filters.societyId;
        if (filters.districtId) where.districtId = filters.districtId;
        if (filters.seasonId) where.seasonId = filters.seasonId;

        // Build query parts conditionally
        const queryParts = [
            `SELECT 
                gpe."partyName" as party,
                COUNT(gpe.id) as entries,
                SUM(gpe.bags)::int as total_bags,
                SUM(gpe.quantity)::numeric as total_quantity
            FROM gate_pass_entries gpe
            WHERE gpe."riceMillId" = $1
                AND gpe.date >= $2
                AND gpe.date <= $3`
        ];

        const params: any[] = [filters.riceMillId, dateFilter.gte, dateFilter.lte];
        let paramIndex = 4;

        if (filters.seasonId) {
            queryParts.push(`AND gpe."seasonId" = $${paramIndex}`);
            params.push(filters.seasonId);
            paramIndex++;
        }

        if (filters.societyId) {
            queryParts.push(`AND gpe."societyId" = $${paramIndex}`);
            params.push(filters.societyId);
            paramIndex++;
        }

        if (filters.districtId) {
            queryParts.push(`AND gpe."districtId" = $${paramIndex}`);
            params.push(filters.districtId);
            paramIndex++;
        }

        queryParts.push(`GROUP BY gpe."partyName" ORDER BY gpe."partyName" ASC`);

        const query = queryParts.join(' ');
        const results = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

        const reportData = results.map((row, index) => ({
            'S.No': index + 1,
            'Party Name': row.party,
            'Total Entries': Number(row.entries),
            'Total Bags': Number(row.total_bags),
            'Total Quantity (qtl)': Number(row.total_quantity).toFixed(2),
            'Average Qty Per Entry': Number(row.entries) > 0
                ? (Number(row.total_quantity) / Number(row.entries)).toFixed(2)
                : '0.00',
        }));

        // Add total row
        const totalEntries = results.reduce((sum, row) => sum + Number(row.entries), 0);
        const totalBags = results.reduce((sum, row) => sum + Number(row.total_bags), 0);
        const totalQuantity = results.reduce((sum, row) => sum + Number(row.total_quantity), 0);

        reportData.push({
            'S.No': null as any,
            'Party Name': 'TOTAL',
            'Total Entries': totalEntries,
            'Total Bags': totalBags,
            'Total Quantity (qtl)': totalQuantity.toFixed(2),
            'Average Qty Per Entry': totalEntries > 0 ? (totalQuantity / totalEntries).toFixed(2) : '0.00',
        });

        return reportData;
    }

    /**
     * OPTIMIZED: Summary report using database aggregation
     */
    private async generateSummaryReportOptimized(filters: any, dateFilter: any) {
        const where: any = {
            riceMillId: filters.riceMillId,
            date: dateFilter,
        };

        if (filters.societyId) where.societyId = filters.societyId;
        if (filters.districtId) where.districtId = filters.districtId;
        if (filters.seasonId) where.seasonId = filters.seasonId;

        // Build query parts conditionally
        const queryParts = [
            `SELECT 
                COUNT(gpe.id) as total_entries,
                SUM(gpe.bags)::int as total_bags,
                SUM(gpe.quantity)::numeric as total_quantity,
                COUNT(DISTINCT gpe."societyId") as unique_societies,
                COUNT(DISTINCT gpe."districtId") as unique_districts,
                COUNT(DISTINCT gpe."partyName") as unique_parties,
                COUNT(DISTINCT gpe."vehicleNo") as unique_vehicles
            FROM gate_pass_entries gpe
            WHERE gpe."riceMillId" = $1
                AND gpe.date >= $2
                AND gpe.date <= $3`
        ];

        const params: any[] = [filters.riceMillId, dateFilter.gte, dateFilter.lte];
        let paramIndex = 4;

        if (filters.seasonId) {
            queryParts.push(`AND gpe."seasonId" = $${paramIndex}`);
            params.push(filters.seasonId);
            paramIndex++;
        }

        if (filters.societyId) {
            queryParts.push(`AND gpe."societyId" = $${paramIndex}`);
            params.push(filters.societyId);
            paramIndex++;
        }

        if (filters.districtId) {
            queryParts.push(`AND gpe."districtId" = $${paramIndex}`);
            params.push(filters.districtId);
            paramIndex++;
        }

        const query = queryParts.join(' ');
        const [result] = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

        const totalEntries = Number(result.total_entries);
        const totalBags = Number(result.total_bags);
        const totalQuantity = Number(result.total_quantity);

        return [{
            'Metric': 'Summary',
            'Total Entries': totalEntries,
            'Total Bags': totalBags,
            'Total Quantity (qtl)': totalQuantity.toFixed(2),
            'Average Bags Per Entry': totalEntries > 0 ? (totalBags / totalEntries).toFixed(2) : '0',
            'Average Quantity Per Entry': totalEntries > 0 ? (totalQuantity / totalEntries).toFixed(2) : '0',
            'Unique Societies': Number(result.unique_societies),
            'Unique Districts': Number(result.unique_districts),
            'Unique Parties': Number(result.unique_parties),
            'Unique Vehicles': Number(result.unique_vehicles),
        }];
    }

    /**
     * Society daywise report - Optimized version
     */
    private async generateSocietyDaywiseReport(filters: any, dateFilter: any) {
        const riceMillId = filters.riceMillId;
        const seasonId = filters.seasonId;

        // Get all societies with targets efficiently
        const societies = await this.prisma.society.findMany({
            where: { riceMillId },
            select: {
                id: true,
                name: true,
                targets: seasonId ? {
                    where: { seasonId },
                    select: { targetQuantity: true },
                } : {
                    select: { targetQuantity: true },
                },
            },
            orderBy: { name: 'asc' }
        });

        // Get all entries within date range
        const entries = await this.prisma.gatePassEntry.findMany({
            where: {
                riceMillId,
                date: dateFilter,
                ...(seasonId && { seasonId }),
            },
            select: {
                societyId: true,
                date: true,
                quantity: true,
            },
            orderBy: { date: 'asc' },
        });

        // Get unique dates and sort them
        const dates: string[] = [...new Set(entries.map(e => new Date(e.date).toISOString().split('T')[0]))].sort();

        // Get cumulative quantities before the date range for all societies in one query
        const cumulativeData = await this.prisma.gatePassEntry.groupBy({
            by: ['societyId'],
            where: {
                riceMillId,
                date: {
                    lt: dateFilter.gte
                },
                ...(seasonId && { seasonId }),
            },
            _sum: {
                quantity: true,
            },
        });

        const cumulativeMap = new Map<string, number>(
            cumulativeData.map(item => [item.societyId, Number(item._sum.quantity) || 0])
        );

        // Process each society
        const reportData = societies.map((society, index) => {
            const target = society.targets && society.targets.length > 0
                ? society.targets[0].targetQuantity
                : 0;

            const cumulativeQty: number = cumulativeMap.get(society.id) || 0;

            // Group entries by date for this society
            const societyEntries = entries.filter(e => e.societyId === society.id);
            const dailyData: Record<string, number> = {};

            dates.forEach(date => {
                const dayEntries = societyEntries.filter(e =>
                    new Date(e.date).toISOString().split('T')[0] === date
                );
                dailyData[date] = dayEntries.reduce((sum, e) => sum + Number(e.quantity), 0);
            });

            // Calculate total
            const dailyTotal = Object.values(dailyData).reduce((sum: number, qty: number) => sum + qty, 0);
            const totalReceived = cumulativeQty + dailyTotal;
            const variance = totalReceived - target;

            const result: any = {
                'S.No': index + 1,
                'Society Name': society.name,
                'Miller Target': target.toFixed(2),
            };

            // Only add "Up To" column if there's cumulative data before the date range
            if (cumulativeQty > 0 && dates.length > 0) {
                result[`Up To ${new Date(dates[0]).toLocaleDateString('en-GB')}`] = cumulativeQty.toFixed(2);
            }

            // Add daily columns
            dates.forEach(date => {
                const displayDate = new Date(date).toLocaleDateString('en-GB');
                result[displayDate] = (dailyData[date] || 0).toFixed(2);
            });

            result['Total Paddy Received'] = totalReceived.toFixed(2);
            result['Less and Excess Paddy Received Against Target'] = variance.toFixed(2);

            return result;
        });

        // Add total row
        const totalRow: any = {
            'S.No': null as any,
            'Society Name': 'TOTAL',
            'Miller Target': societies.reduce((sum, s) =>
                sum + (s.targets && s.targets.length > 0 ? s.targets[0].targetQuantity : 0), 0
            ).toFixed(2),
        };

        // Calculate total cumulative if applicable
        if (reportData.length > 0 && reportData[0][`Up To ${new Date(dates[0]).toLocaleDateString('en-GB')}`]) {
            totalRow[`Up To ${new Date(dates[0]).toLocaleDateString('en-GB')}`] = Array.from(cumulativeMap.values())
                .reduce((sum, val) => sum + val, 0).toFixed(2);
        }

        // Calculate totals for each date
        dates.forEach(date => {
            const displayDate = new Date(date).toLocaleDateString('en-GB');
            const dateTotal = reportData.reduce((sum, row) => sum + parseFloat(row[displayDate] || 0), 0);
            totalRow[displayDate] = dateTotal.toFixed(2);
        });

        totalRow['Total Paddy Received'] = reportData.reduce((sum, row) =>
            sum + parseFloat(row['Total Paddy Received']), 0
        ).toFixed(2);

        totalRow['Less and Excess Paddy Received Against Target'] = reportData.reduce((sum, row) =>
            sum + parseFloat(row['Less and Excess Paddy Received Against Target']), 0
        ).toFixed(2);

        reportData.push(totalRow);

        return reportData;
    }
}
