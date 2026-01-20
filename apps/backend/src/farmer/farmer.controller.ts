import { Controller, Get, Query } from '@nestjs/common';
import { FarmerService } from './farmer.service';

@Controller('farmers')
export class FarmerController {
    constructor(private readonly farmerService: FarmerService) { }

    @Get()
    async findAll(@Query('societyId') societyId?: string) {
        return this.farmerService.findAll(societyId);
    }

    @Get('search')
    async search(
        @Query('q') query: string,
        @Query('societyId') societyId?: string,
    ) {
        return this.farmerService.searchByName(query, societyId);
    }
}
