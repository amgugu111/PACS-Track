import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { GateEntryModule } from './gate-entry/gate-entry.module';
import { SocietyModule } from './society/society.module';
import { PartyModule } from './party/party.module';
import { DistrictModule } from './district/district.module';
import { SeasonModule } from './season/season.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VehicleModule } from './vehicle/vehicle.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        GateEntryModule,
        SocietyModule,
        PartyModule,
        DistrictModule,
        SeasonModule,
        AnalyticsModule,
        VehicleModule,
    ],
})
export class AppModule { }
