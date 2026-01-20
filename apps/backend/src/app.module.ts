import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GateEntryModule } from './gate-entry/gate-entry.module';
import { SocietyModule } from './society/society.module';
import { FarmerModule } from './farmer/farmer.module';
import { DistrictModule } from './district/district.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        GateEntryModule,
        SocietyModule,
        FarmerModule,
        DistrictModule,
    ],
})
export class AppModule { }
