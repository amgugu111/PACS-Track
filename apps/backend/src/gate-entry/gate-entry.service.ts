import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGateEntryDto, UpdateGateEntryDto } from './dto/gate-entry.dto';

@Injectable()
export class GateEntryService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Smart Gate Entry Creation with Party Upsert Logic
     * 
     * Process:
     * 1. Get or validate active season
     * 2. Validate society exists and get its district
     * 3. Check if party exists by name within the society
     * 4. If party doesn't exist, create new party
     * 5. Create gate pass entry with all relationships
     */
    async createGateEntry(dto: CreateGateEntryDto, riceMillId: string) {
        // Step 1: Get active season if not provided
        let seasonId = dto.seasonId;
        if (!seasonId) {
            const activeSeason = await this.prisma.season.findFirst({
                where: { riceMillId, isActive: true },
            });
            if (!activeSeason) {
                throw new BadRequestException('No active season found. Please activate a season first.');
            }
            seasonId = activeSeason.id;
        } else {
            // Validate provided season
            const season = await this.prisma.season.findFirst({
                where: { id: seasonId, riceMillId },
            });
            if (!season) {
                throw new NotFoundException('Season not found');
            }
            if (!season.isActive) {
                throw new BadRequestException('Cannot add entries to inactive season');
            }
        }

        // Step 2: Validate Society and get District
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

        // Step 3: Validate quantity and bags
        if (dto.quantity <= 0) {
            throw new BadRequestException('Quantity must be greater than 0');
        }

        if (dto.bags <= 0) {
            throw new BadRequestException('Number of bags must be greater than 0');
        }

        // Step 4: Smart Party Upsert - Check if party exists by name
        let party = await this.prisma.party.findFirst({
            where: {
                name: {
                    equals: dto.partyName.trim(),
                    mode: 'insensitive', // Case-insensitive search
                },
                societyId: dto.societyId,
            },
        });

        // Step 5: If party doesn't exist, create new party
        if (!party) {
            console.log(`Creating new party: ${dto.partyName}`);
            party = await this.prisma.party.create({
                data: {
                    name: dto.partyName.trim(),
                    societyId: dto.societyId,
                },
            });
        } else {
            console.log(`Using existing party: ${party.name} (ID: ${party.id})`);
        }

        // Step 6: Create Gate Pass Entry
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
                remarks: dto.remarks,
                riceMillId: riceMillId,
                societyId: dto.societyId,
                partyId: party.id,
                districtId: society.districtId,
                seasonId: seasonId,
            },
            include: {
                society: {
                    include: {
                        district: true,
                    },
                },
                party: true,
                district: true,
                season: true,
            },
        });

        // Step 7: Calculate and add qtyPerBag
        return this.enrichWithCalculations(gateEntry);
    }

    /**
     * Get all gate entries with optional filters and search
     */
    async findAll(filters?: {
        riceMillId: string;
        societyId?: string;
        districtId?: string;
        seasonId?: string;
        fromDate?: string;
        toDate?: string;
        search?: string; // Search term for party name, vehicle no, token no, PACS name
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = {
            riceMillId: filters.riceMillId,
        };

        if (filters?.seasonId) {
            where.seasonId = filters.seasonId;
        }

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

        // Add search functionality
        if (filters?.search) {
            const searchTerm = filters.search.trim();
            where.OR = [
                { partyName: { contains: searchTerm, mode: 'insensitive' } },
                { pacsName: { contains: searchTerm, mode: 'insensitive' } },
                { vehicleNo: { contains: searchTerm, mode: 'insensitive' } },
                { tokenNo: { contains: searchTerm, mode: 'insensitive' } },
            ];
        }

        const [entries, total] = await Promise.all([
            this.prisma.gatePassEntry.findMany({
                where,
                include: {
                    society: {
                        include: { district: true },
                    },
                    party: true,
                    district: true,
                    season: true,
                },
                orderBy: { serialNumber: 'desc' }, // Order by serial number (most recent first)
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
                party: true,
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
     * Generate Report Data
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
        const where: any = {
            riceMillId: filters.riceMillId,
            date: {
                gte: new Date(filters.fromDate),
                lte: new Date(filters.toDate + 'T23:59:59.999Z'),
            },
        };

        if (filters.societyId) {
            where.societyId = filters.societyId;
        }

        if (filters.districtId) {
            where.districtId = filters.districtId;
        }

        if (filters.seasonId) {
            where.seasonId = filters.seasonId;
        }

        const entries = await this.prisma.gatePassEntry.findMany({
            where,
            include: {
                society: true,
                district: true,
                party: true,
            },
            orderBy: { date: 'desc' },
        });

        switch (filters.reportType) {
            case 'daily':
                return this.generateDailyReport(entries);
            case 'society':
                return this.generateSocietyReport(entries);
            case 'society-daywise':
                return this.generateSocietyDaywiseReport(entries, filters.riceMillId, filters.seasonId);
            case 'district':
                return this.generateDistrictReport(entries);
            case 'party':
                return this.generatePartyReport(entries);
            case 'vehicle':
                return this.generateVehicleReport(entries);
            case 'summary':
                return this.generateSummaryReport(entries);
            default:
                return entries;
        }
    }

    private generateDailyReport(entries: any[]) {
        return entries.map(entry => ({
            'Token No': entry.tokenNo,
            'Date': new Date(entry.date).toLocaleDateString(),
            'Society': entry.society?.name || entry.pacsName,
            'District': entry.district?.name || '',
            'Party Name': entry.partyName,
            'Vehicle No': entry.vehicleNo,
            'Bags': entry.bags,
            'Quantity (kg)': entry.quantity,
            'Qty Per Bag': (entry.quantity / entry.bags).toFixed(2),
            'Remarks': entry.remarks || '',
        }));
    }

    private generateSocietyReport(entries: any[]) {
        const grouped = entries.reduce((acc: any, entry) => {
            const society = entry.society?.name || entry.pacsName;
            if (!acc[society]) {
                acc[society] = {
                    society,
                    entries: 0,
                    totalBags: 0,
                    totalQuantity: 0,
                };
            }
            acc[society].entries++;
            acc[society].totalBags += entry.bags;
            acc[society].totalQuantity += entry.quantity;
            return acc;
        }, {});

        return Object.values(grouped).map((item: any) => ({
            'Society': item.society,
            'Total Entries': item.entries,
            'Total Bags': item.totalBags,
            'Total Quantity (kg)': item.totalQuantity.toFixed(2),
            'Average Qty Per Entry': (item.totalQuantity / item.entries).toFixed(2),
        }));
    }

    private async generateSocietyDaywiseReport(entries: any[], riceMillId: string, seasonId?: string) {
        // Get all societies with targets
        const societies = await this.prisma.society.findMany({
            where: { riceMillId },
            include: {
                targets: seasonId ? {
                    where: { seasonId }
                } : true,
            },
            orderBy: { name: 'asc' }
        });

        // Get unique dates from entries and sort them
        const dates = [...new Set(entries.map(e => new Date(e.date).toISOString().split('T')[0]))].sort();

        // Get date range from filters
        const reportData = await Promise.all(societies.map(async (society) => {
            const target = society.targets && society.targets.length > 0 ? society.targets[0].targetQuantity : 0;

            // Calculate cumulative quantity up to the first date
            const cumulativeQuery = await this.prisma.gatePassEntry.aggregate({
                where: {
                    societyId: society.id,
                    date: {
                        lt: dates.length > 0 ? new Date(dates[0]) : new Date()
                    },
                    ...(seasonId && { seasonId })
                },
                _sum: {
                    quantity: true
                }
            });

            const cumulativeQty = Number(cumulativeQuery._sum.quantity) || 0;

            // Group entries by date for this society
            const societyEntries = entries.filter(e => (e.society?.id || e.societyId) === society.id);
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
        }));

        return reportData;
    }

    private generateDistrictReport(entries: any[]) {
        const grouped = entries.reduce((acc: any, entry) => {
            const district = entry.district?.name || 'Unknown';
            if (!acc[district]) {
                acc[district] = {
                    district,
                    entries: 0,
                    totalBags: 0,
                    totalQuantity: 0,
                    societies: new Set(),
                };
            }
            acc[district].entries++;
            acc[district].totalBags += entry.bags;
            acc[district].totalQuantity += entry.quantity;
            acc[district].societies.add(entry.society?.name || entry.pacsName);
            return acc;
        }, {});

        return Object.values(grouped).map((item: any) => ({
            'District': item.district,
            'Total Entries': item.entries,
            'Total Societies': item.societies.size,
            'Total Bags': item.totalBags,
            'Total Quantity (kg)': item.totalQuantity.toFixed(2),
            'Average Qty Per Entry': (item.totalQuantity / item.entries).toFixed(2),
        }));
    }

    private generatePartyReport(entries: any[]) {
        const grouped = entries.reduce((acc: any, entry) => {
            const party = entry.partyName;
            if (!acc[party]) {
                acc[party] = {
                    party,
                    entries: 0,
                    totalBags: 0,
                    totalQuantity: 0,
                };
            }
            acc[party].entries++;
            acc[party].totalBags += entry.bags;
            acc[party].totalQuantity += entry.quantity;
            return acc;
        }, {});

        return Object.values(grouped).map((item: any) => ({
            'Party Name': item.party,
            'Total Entries': item.entries,
            'Total Bags': item.totalBags,
            'Total Quantity (kg)': item.totalQuantity.toFixed(2),
            'Average Qty Per Entry': (item.totalQuantity / item.entries).toFixed(2),
        }));
    }

    private generateVehicleReport(entries: any[]) {
        const grouped = entries.reduce((acc: any, entry) => {
            const vehicle = entry.vehicleNo;
            if (!acc[vehicle]) {
                acc[vehicle] = {
                    vehicle,
                    entries: 0,
                    totalBags: 0,
                    totalQuantity: 0,
                    parties: new Set(),
                };
            }
            acc[vehicle].entries++;
            acc[vehicle].totalBags += entry.bags;
            acc[vehicle].totalQuantity += entry.quantity;
            acc[vehicle].parties.add(entry.partyName);
            return acc;
        }, {});

        return Object.values(grouped).map((item: any) => ({
            'Vehicle No': item.vehicle,
            'Total Trips': item.entries,
            'Different Parties': item.parties.size,
            'Total Bags': item.totalBags,
            'Total Quantity (kg)': item.totalQuantity.toFixed(2),
            'Average Qty Per Trip': (item.totalQuantity / item.entries).toFixed(2),
        }));
    }

    private generateSummaryReport(entries: any[]) {
        const totalEntries = entries.length;
        const totalBags = entries.reduce((sum, e) => sum + e.bags, 0);
        const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);
        const uniqueSocieties = new Set(entries.map(e => e.society?.name || e.pacsName)).size;
        const uniqueDistricts = new Set(entries.map(e => e.district?.name)).size;
        const uniqueParties = new Set(entries.map(e => e.partyName)).size;
        const uniqueVehicles = new Set(entries.map(e => e.vehicleNo)).size;

        return [{
            'Metric': 'Summary',
            'Total Entries': totalEntries,
            'Total Bags': totalBags,
            'Total Quantity (kg)': totalQuantity.toFixed(2),
            'Average Bags Per Entry': totalEntries > 0 ? (totalBags / totalEntries).toFixed(2) : '0',
            'Average Quantity Per Entry': totalEntries > 0 ? (totalQuantity / totalEntries).toFixed(2) : '0',
            'Unique Societies': uniqueSocieties,
            'Unique Districts': uniqueDistricts,
            'Unique Parties': uniqueParties,
            'Unique Vehicles': uniqueVehicles,
        }];
    }
}

