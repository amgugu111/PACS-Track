import { Module } from '@nestjs/common';
import { GateEntryController } from './gate-entry.controller';
import { GateEntryService } from './gate-entry.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [GateEntryController],
    providers: [GateEntryService],
    exports: [GateEntryService],
})
export class GateEntryModule { }
