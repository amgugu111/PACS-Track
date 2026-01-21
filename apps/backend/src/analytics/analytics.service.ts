import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryOptimizationHelper } from '../common/query-optimization.helper';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get dashboard stats with OPTIMIZED queries
     * Uses database aggregations instead of fetching all data
     */
    async getDashboardStats(seasonId: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
            select: { id: true, name: true, type: true },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Execute all aggregation queries in parallel for maximum efficiency
        const [targets, achieved, societyData, recentEntries] = await Promise.all([
            // Get total targets using aggregation
            this.prisma.societyTarget.aggregate({
                where: { seasonId },
                _sum: { targetQuantity: true },
            }),
            // Get total achieved using aggregation
            this.prisma.gatePassEntry.aggregate({
                where: { seasonId, riceMillId },
                _sum: { quantity: true },
                _count: true,
            }),
            // Get society-wise aggregated data using groupBy for efficiency
            this.getSocietyAggregatedData(seasonId, riceMillId),
            // Get recent entries with selective fields
            this.prisma.gatePassEntry.findMany({
                where: { seasonId, riceMillId },
                orderBy: { date: 'desc' },
                take: 10,
                select: {
                    id: true,
                    tokenNo: true,
                    date: true,
                    quantity: true,
                    bags: true,
                    society: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    district: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
        ]);

        // Process society stats from pre-aggregated data
        const societyStats = societyData.map(data => {
            const percentage = data.target > 0
                ? (data.achieved / data.target) * 100
                : 0;

            return {
                societyId: data.societyId,
                societyName: data.societyName,
                societyCode: data.societyCode,
                district: data.districtName,
                target: data.target,
                achieved: data.achieved,
                remaining: Math.max(0, data.target - data.achieved),
                percentage: Math.round(percentage * 100) / 100,
                entries: data.entries,
            };
        });

        // Aggregate district stats efficiently using in-memory grouping
        const districtMap = new Map<string, any>();
        societyStats.forEach(stat => {
            if (!districtMap.has(stat.district)) {
                districtMap.set(stat.district, {
                    district: stat.district,
                    target: 0,
                    achieved: 0,
                    societies: 0,
                    entries: 0,
                });
            }
            const districtData = districtMap.get(stat.district);
            districtData.target += stat.target;
            districtData.achieved += stat.achieved;
            districtData.societies += 1;
            districtData.entries += stat.entries;
        });

        const districtStats = Array.from(districtMap.values()).map(d => ({
            ...d,
            remaining: Math.max(0, d.target - d.achieved),
            percentage: d.target > 0 ? Math.round((d.achieved / d.target) * 10000) / 100 : 0,
        }));

        return {
            season: {
                id: season.id,
                name: season.name,
                type: season.type,
            },
            overall: {
                totalTarget: targets._sum.targetQuantity || 0,
                totalAchieved: achieved._sum.quantity || 0,
                totalRemaining: Math.max(0, (targets._sum.targetQuantity || 0) - (achieved._sum.quantity || 0)),
                percentage: targets._sum.targetQuantity > 0
                    ? Math.round(((achieved._sum.quantity || 0) / targets._sum.targetQuantity) * 10000) / 100
                    : 0,
                totalEntries: achieved._count,
            },
            societyStats: societyStats.sort((a, b) => b.percentage - a.percentage),
            districtStats: districtStats.sort((a, b) => b.percentage - a.percentage),
            recentEntries: recentEntries.map(entry => ({
                id: entry.id,
                tokenNo: entry.tokenNo,
                date: entry.date,
                society: entry.society.name,
                district: entry.district.name,
                quantity: entry.quantity,
                bags: entry.bags,
            })),
        };
    }

    /**
     * Helper method to get society aggregated data efficiently
     * Uses single query with joins instead of N+1 queries
     */
    private async getSocietyAggregatedData(seasonId: string, riceMillId: string) {
        // Use raw SQL for maximum efficiency with complex aggregations
        const result = await this.prisma.$queryRaw<any[]>`
            SELECT 
                s.id as "societyId",
                s.name as "societyName",
                s.code as "societyCode",
                d.name as "districtName",
                COALESCE(st."targetQuantity", 0) as target,
                COALESCE(SUM(gpe.quantity), 0) as achieved,
                COALESCE(COUNT(gpe.id), 0) as entries
            FROM societies s
            LEFT JOIN districts d ON s."districtId" = d.id
            LEFT JOIN society_targets st ON s.id = st."societyId" AND st."seasonId" = ${seasonId}
            LEFT JOIN gate_pass_entries gpe ON s.id = gpe."societyId" AND gpe."seasonId" = ${seasonId}
            WHERE s."riceMillId" = ${riceMillId}
            GROUP BY s.id, s.name, s.code, d.name, st."targetQuantity"
            ORDER BY s.name ASC
        `;

        return result.map(row => ({
            societyId: row.societyId,
            societyName: row.societyName,
            societyCode: row.societyCode,
            districtName: row.districtName || 'Unknown',
            target: Number(row.target),
            achieved: Number(row.achieved),
            entries: Number(row.entries),
        }));
    }
    /**
     * Get target vs actual chart data - OPTIMIZED with groupBy
     */
    async getTargetVsActualChart(seasonId: string, riceMillId: string, groupBy: 'society' | 'district' = 'society') {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
            select: { id: true },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        if (groupBy === 'society') {
            // Use efficient raw SQL query for society aggregation
            const data = await this.prisma.$queryRaw<any[]>`
                SELECT 
                    s.name,
                    COALESCE(st."targetQuantity", 0) as target,
                    COALESCE(SUM(gpe.quantity), 0) as achieved
                FROM societies s
                LEFT JOIN society_targets st ON s.id = st."societyId" AND st."seasonId" = ${seasonId}
                LEFT JOIN gate_pass_entries gpe ON s.id = gpe."societyId" AND gpe."seasonId" = ${seasonId}
                WHERE s."riceMillId" = ${riceMillId}
                GROUP BY s.id, s.name, st."targetQuantity"
                ORDER BY s.name ASC
            `;

            return data.map(row => ({
                name: row.name,
                target: Number(row.target),
                achieved: Number(row.achieved),
            }));
        } else {
            // Group by district using efficient SQL
            const data = await this.prisma.$queryRaw<any[]>`
                SELECT 
                    d.name,
                    COALESCE(SUM(st."targetQuantity"), 0) as target,
                    COALESCE(SUM(gpe.quantity), 0) as achieved
                FROM districts d
                LEFT JOIN societies s ON d.id = s."districtId"
                LEFT JOIN society_targets st ON s.id = st."societyId" AND st."seasonId" = ${seasonId}
                LEFT JOIN gate_pass_entries gpe ON s.id = gpe."societyId" AND gpe."seasonId" = ${seasonId}
                WHERE d."riceMillId" = ${riceMillId}
                GROUP BY d.id, d.name
                ORDER BY d.name ASC
            `;

            return data.map(row => ({
                name: row.name,
                target: Number(row.target),
                achieved: Number(row.achieved),
            }));
        }
    }

    /**
     * Get trend data - OPTIMIZED with database grouping
     */
    async getTrendData(seasonId: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
            select: { id: true },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Use database-level grouping by date for efficiency
        const dailyData = await this.prisma.$queryRaw<any[]>`
            SELECT 
                DATE(date) as date,
                SUM(quantity) as daily
            FROM gate_pass_entries
            WHERE "seasonId" = ${seasonId} AND "riceMillId" = ${riceMillId}
            GROUP BY DATE(date)
            ORDER BY DATE(date) ASC
        `;

        // Calculate cumulative efficiently
        let cumulative = 0;
        return dailyData.map(row => {
            cumulative += Number(row.daily);
            return {
                date: row.date instanceof Date
                    ? row.date.toISOString().split('T')[0]
                    : String(row.date),
                daily: Number(row.daily),
                cumulative,
            };
        });
    }
}
