import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardStats(seasonId: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        // Get total targets
        const targets = await this.prisma.societyTarget.aggregate({
            where: { seasonId },
            _sum: { targetQuantity: true },
        });

        // Get total achieved
        const achieved = await this.prisma.gatePassEntry.aggregate({
            where: { seasonId, riceMillId },
            _sum: { quantity: true },
            _count: true,
        });

        // Get society-wise data
        const societyData = await this.prisma.societyTarget.findMany({
            where: { seasonId },
            include: {
                society: {
                    include: {
                        district: true,
                        gatePassEntries: {
                            where: { seasonId },
                        },
                    },
                },
            },
        });

        const societyStats = societyData.map(target => {
            const achieved = target.society.gatePassEntries.reduce(
                (sum, entry) => sum + entry.quantity,
                0
            );
            const percentage = target.targetQuantity > 0
                ? (achieved / target.targetQuantity) * 100
                : 0;

            return {
                societyId: target.society.id,
                societyName: target.society.name,
                societyCode: target.society.code,
                district: target.society.district.name,
                target: target.targetQuantity,
                achieved,
                remaining: Math.max(0, target.targetQuantity - achieved),
                percentage: Math.round(percentage * 100) / 100,
                entries: target.society.gatePassEntries.length,
            };
        });

        // Get district-wise aggregation
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

        // Recent entries
        const recentEntries = await this.prisma.gatePassEntry.findMany({
            where: { seasonId, riceMillId },
            orderBy: { date: 'desc' },
            take: 10,
            include: {
                society: true,
                district: true,
            },
        });

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

    async getTargetVsActualChart(seasonId: string, riceMillId: string, groupBy: 'society' | 'district' = 'society') {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        if (groupBy === 'society') {
            const data = await this.prisma.societyTarget.findMany({
                where: { seasonId },
                include: {
                    society: {
                        include: {
                            gatePassEntries: {
                                where: { seasonId },
                            },
                        },
                    },
                },
            });

            return data.map(target => ({
                name: target.society.name,
                target: target.targetQuantity,
                achieved: target.society.gatePassEntries.reduce((sum, e) => sum + e.quantity, 0),
            }));
        } else {
            // Group by district
            const targets = await this.prisma.societyTarget.findMany({
                where: { seasonId },
                include: {
                    society: {
                        include: {
                            district: true,
                            gatePassEntries: {
                                where: { seasonId },
                            },
                        },
                    },
                },
            });

            const districtMap = new Map<string, any>();
            targets.forEach(target => {
                const districtName = target.society.district.name;
                if (!districtMap.has(districtName)) {
                    districtMap.set(districtName, { name: districtName, target: 0, achieved: 0 });
                }
                const data = districtMap.get(districtName);
                data.target += target.targetQuantity;
                data.achieved += target.society.gatePassEntries.reduce((sum, e) => sum + e.quantity, 0);
            });

            return Array.from(districtMap.values());
        }
    }

    async getTrendData(seasonId: string, riceMillId: string) {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, riceMillId },
        });

        if (!season) {
            throw new NotFoundException('Season not found');
        }

        const entries = await this.prisma.gatePassEntry.findMany({
            where: { seasonId, riceMillId },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                quantity: true,
            },
        });

        // Group by date
        const dateMap = new Map<string, number>();
        entries.forEach(entry => {
            const dateKey = entry.date.toISOString().split('T')[0];
            dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + entry.quantity);
        });

        // Calculate cumulative
        const dates = Array.from(dateMap.keys()).sort();
        let cumulative = 0;
        return dates.map(date => {
            cumulative += dateMap.get(date) || 0;
            return {
                date,
                daily: dateMap.get(date) || 0,
                cumulative,
            };
        });
    }
}
