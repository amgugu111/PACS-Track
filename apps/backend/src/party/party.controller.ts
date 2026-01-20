import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PartyService } from './party.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('parties')
@UseGuards(JwtAuthGuard)
export class PartyController {
    constructor(private readonly partyService: PartyService) { }

    @Get()
    async findAll(@CurrentUser() user: any, @Query('societyId') societyId?: string) {
        return this.partyService.findAll(societyId, user.riceMillId);
    }

    @Get('search')
    async search(
        @CurrentUser() user: any,
        @Query('q') query: string,
        @Query('societyId') societyId?: string,
    ) {
        return this.partyService.searchByName(query, societyId, user.riceMillId);
    }
}
