import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { GateEntryService } from './gate-entry.service';
import { CreateGateEntryDto, UpdateGateEntryDto } from './dto/gate-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('gate-entries')
@UseGuards(JwtAuthGuard)
export class GateEntryController {
    constructor(private readonly gateEntryService: GateEntryService) { }

    @Post()
    async create(@Body() createDto: CreateGateEntryDto, @CurrentUser() user: any) {
        return this.gateEntryService.createGateEntry(createDto, user.riceMillId);
    }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query('societyId') societyId?: string,
        @Query('districtId') districtId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.gateEntryService.findAll({
            riceMillId: user.riceMillId,
            societyId,
            districtId,
            fromDate,
            toDate,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.gateEntryService.findOne(id, user.riceMillId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateGateEntryDto, @CurrentUser() user: any) {
        return this.gateEntryService.update(id, updateDto, user.riceMillId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.gateEntryService.remove(id, user.riceMillId);
    }
}
