import { Controller, Get, UseGuards } from '@nestjs/common';
import { DistrictService } from './district.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('districts')
@UseGuards(JwtAuthGuard)
export class DistrictController {
    constructor(private readonly districtService: DistrictService) { }

    @Get()
    async findAll(@CurrentUser() user: any) {
        return this.districtService.findAll(user.riceMillId);
    }
}
