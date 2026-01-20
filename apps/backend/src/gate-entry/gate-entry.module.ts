import { Module } from '@nestjs/common';
import { GateEntryController } from './gate-entry.controller';
import { GateEntryService } from './gate-entry.service';

@Module({
    controllers: [GateEntryController],
    providers: [GateEntryService],
    exports: [GateEntryService],
})
export class GateEntryModule { }
