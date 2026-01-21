import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { SeasonService } from './season.service';
import { CreateSeasonDto, UpdateSeasonDto, SetTargetDto } from './dto/season.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('seasons')
@UseGuards(JwtAuthGuard)
export class SeasonController {
    constructor(private readonly seasonService: SeasonService) { }

    @Post()
    async create(@Body() createDto: CreateSeasonDto, @CurrentUser() user: any) {
        return this.seasonService.create(createDto, user.riceMillId);
    }

    @Get()
    async findAll(@CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get no seasons
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return [];
        }
        return this.seasonService.findAll(user.riceMillId);
    }

    @Get('active')
    async findActive(@CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get no active season
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return null;
        }
        return this.seasonService.findActive(user.riceMillId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get nothing
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return null;
        }
        return this.seasonService.findOne(id, user.riceMillId);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateSeasonDto, @CurrentUser() user: any) {
        return this.seasonService.update(id, updateDto, user.riceMillId);
    }

    @Patch(':id/activate')
    async setActive(@Param('id') id: string, @CurrentUser() user: any) {
        return this.seasonService.setActive(id, user.riceMillId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.seasonService.remove(id, user.riceMillId);
    }

    @Post(':id/targets')
    async setTargets(
        @Param('id') id: string,
        @Body() body: { targets: SetTargetDto[] },
        @CurrentUser() user: any
    ) {
        return this.seasonService.setTargets(id, body.targets, user.riceMillId);
    }

    @Get(':id/targets')
    async getTargets(@Param('id') id: string, @CurrentUser() user: any) {
        // Non-super-admin users without a rice mill should get no targets
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return [];
        }
        return this.seasonService.getTargets(id, user.riceMillId);
    }
}
