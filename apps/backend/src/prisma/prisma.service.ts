import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@pacs-track/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        // Retry connection with exponential backoff for reliability
        let retries = 5;
        let delay = 1000;
        
        for (let i = 0; i < retries; i++) {
            try {
                await this.$connect();
                console.log('✅ Database connected');
                return;
            } catch (error) {
                console.log(`⚠️  Database connection attempt ${i + 1}/${retries} failed`);
                if (i === retries - 1) {
                    console.error('❌ Failed to connect to database after all retries');
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
