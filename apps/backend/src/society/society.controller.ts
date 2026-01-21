import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SocietyService } from './society.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationDto, SortOrder } from '../common/query-optimization.dto';

@Controller('societies')
@UseGuards(JwtAuthGuard)
export class SocietyController {
    constructor(private readonly societyService: SocietyService) { }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query('districtId') districtId?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        // Non-super-admin users without a rice mill should get no societies
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return {
                data: [],
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            };
        }

        const pagination: PaginationDto = {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy,
            sortOrder: sortOrder as SortOrder,
            search,
        };

        if (districtId) {
            return this.societyService.findByDistrict(districtId, user.riceMillId, pagination);
        }
        return this.societyService.findAll(user.riceMillId, pagination);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get nothing
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return null;
        }
        return this.societyService.findOne(id, user.riceMillId);
    }

    @Post()
    async create(
        @Body() data: {
            name: string;
            districtId: string;
            address?: string;
            contactNo?: string;
        },
        @CurrentUser() user: any
    ) {
        return this.societyService.create(data, user.riceMillId);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            districtId?: string;
            address?: string;
            contactNo?: string;
        },
        @CurrentUser() user: any
    ) {
        return this.societyService.update(id, data, user.riceMillId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.societyService.delete(id, user.riceMillId);
    }
}
