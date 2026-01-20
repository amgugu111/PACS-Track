import { Module } from '@nestjs/common';
import { SocietyController } from './society.controller';
import { SocietyService } from './society.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [SocietyController],
    providers: [SocietyService],
    exports: [SocietyService],
})
export class SocietyModule { }
