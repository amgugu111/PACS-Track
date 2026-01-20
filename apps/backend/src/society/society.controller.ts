import { Controller, Get, Param, Query } from '@nestjs/common';
import { SocietyService } from './society.service';

@Controller('societies')
export class SocietyController {
    constructor(private readonly societyService: SocietyService) { }

    @Get()
    async findAll(@Query('districtId') districtId?: string) {
        if (districtId) {
            return this.societyService.findByDistrict(districtId);
        }
        return this.societyService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.societyService.findOne(id);
    }
}
