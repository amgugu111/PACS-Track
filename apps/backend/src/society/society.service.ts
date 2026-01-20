import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocietyService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.society.findMany({
            include: {
                district: true,
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const society = await this.prisma.society.findUnique({
            where: { id },
            include: {
                district: true,
                farmers: true,
            },
        });

        if (!society) {
            throw new NotFoundException(`Society with ID ${id} not found`);
        }

        return society;
    }

    async findByDistrict(districtId: string) {
        return this.prisma.society.findMany({
            where: { districtId },
            include: {
                district: true,
            },
            orderBy: { name: 'asc' },
        });
    }
}
