import { Module } from '@nestjs/common';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SeasonController],
    providers: [SeasonService],
    exports: [SeasonService],
})
export class SeasonModule { }
