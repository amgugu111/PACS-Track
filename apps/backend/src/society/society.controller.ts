import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SocietyService } from './society.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('societies')
@UseGuards(JwtAuthGuard)
export class SocietyController {
    constructor(private readonly societyService: SocietyService) { }

    @Get()
    async findAll(@CurrentUser() user: any, @Query('districtId') districtId?: string) {
        if (districtId) {
            return this.societyService.findByDistrict(districtId, user.riceMillId);
        }
        return this.societyService.findAll(user.riceMillId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
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
