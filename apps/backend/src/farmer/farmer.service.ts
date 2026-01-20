import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FarmerService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(societyId?: string) {
        const where = societyId ? { societyId } : {};

        return this.prisma.farmer.findMany({
            where,
            include: {
                society: {
                    include: { district: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async searchByName(query: string, societyId?: string) {
        const where: any = {
            name: {
                contains: query,
                mode: 'insensitive',
            },
        };

        if (societyId) {
            where.societyId = societyId;
        }

        return this.prisma.farmer.findMany({
            where,
            include: {
                society: true,
            },
            orderBy: { name: 'asc' },
            take: 20, // Limit for autocomplete
        });
    }
}
