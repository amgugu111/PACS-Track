import { Module } from '@nestjs/common';
import { DistrictController } from './district.controller';
import { DistrictService } from './district.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [DistrictController],
    providers: [DistrictService],
    exports: [DistrictService],
})
export class DistrictModule { }
