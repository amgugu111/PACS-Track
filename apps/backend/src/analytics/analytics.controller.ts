import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    async getDashboardStats(
        @Query('seasonId') seasonId: string,
        @CurrentUser() user: any
    ) {
        return this.analyticsService.getDashboardStats(seasonId, user.riceMillId);
    }

    @Get('chart/target-vs-actual')
    async getTargetVsActualChart(
        @Query('seasonId') seasonId: string,
        @Query('groupBy') groupBy: 'society' | 'district',
        @CurrentUser() user: any
    ) {
        return this.analyticsService.getTargetVsActualChart(seasonId, user.riceMillId, groupBy);
    }

    @Get('trend')
    async getTrendData(
        @Query('seasonId') seasonId: string,
        @CurrentUser() user: any
    ) {
        return this.analyticsService.getTrendData(seasonId, user.riceMillId);
    }
}
