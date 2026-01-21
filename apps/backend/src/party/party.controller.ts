import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PartyService } from './party.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaginationDto, SortOrder } from '../common/query-optimization.dto';

@Controller('parties')
@UseGuards(JwtAuthGuard)
export class PartyController {
    constructor(private readonly partyService: PartyService) { }

    @Get()
    async findAll(
        @CurrentUser() user: any,
        @Query('societyId') societyId?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        // Non-super-admin users without a rice mill should get no parties
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

        return this.partyService.findAll(societyId, user.riceMillId, pagination);
    }

    @Get('search')
    async search(
        @CurrentUser() user: any,
        @Query('q') query: string,
        @Query('societyId') societyId?: string,
    ) {
        // Non-super-admin users without a rice mill should get no parties
        if (user.role !== 'SUPER_ADMIN' && !user.riceMillId) {
            return [];
        }
        return this.partyService.searchByName(query, societyId, user.riceMillId);
    }
}
