import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationDto, SortOrder } from '../common/query-optimization.dto';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehicleController {
    constructor(private readonly vehicleService: VehicleService) { }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query('search') search?: string,
        @Query('vehicleType') vehicleType?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        // Non-super-admin users without a rice mill should get no vehicles
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

        return this.vehicleService.findAll(user.riceMillId, vehicleType, pagination);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get nothing
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return null;
        }
        return this.vehicleService.findOne(id, user.riceMillId);
    }

    @Post()
    async create(@Body() data: any, @CurrentUser() user: any) {
        return this.vehicleService.create(data, user.riceMillId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
        return this.vehicleService.update(id, data, user.riceMillId);
    }

    @Delete(':id')
    async delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.vehicleService.delete(id, user.riceMillId);
    }
}
