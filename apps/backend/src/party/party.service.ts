import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartyService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(societyId: string | undefined, riceMillId: string) {
        const where: any = {
            society: {
                riceMillId,
            },
        };

        if (societyId) {
            where.societyId = societyId;
        }

        return this.prisma.party.findMany({
            where,
            include: {
                society: {
                    include: { district: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

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
            include: {
                society: true,
            },
            orderBy: { name: 'asc' },
            take: 20, // Limit for autocomplete
        });
    }
}
