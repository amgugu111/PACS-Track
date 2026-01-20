import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
    console.log('🔧 Environment check:');
    console.log('   JWT_SECRET length:', process.env.JWT_SECRET?.length || 'NOT SET');
    console.log('   JWT_SECRET preview:', process.env.JWT_SECRET?.substring(0, 20) + '...' || 'NOT SET');
    console.log('   DATABASE_URL set:', !!process.env.DATABASE_URL);
    console.log('');

    const app = await NestFactory.create(AppModule);

    // Enable request/response logging
    app.useGlobalInterceptors(new LoggingInterceptor());

    // Enable CORS for frontend
    const allowedOrigins = [
        'http://localhost:3000',
        process.env.FRONTEND_URL,
        ...(process.env.ADDITIONAL_ORIGINS?.split(',') || [])
    ].filter(Boolean);

    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Health check endpoint
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/health', (req: any, res: any) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
        });
    });

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📊 Health check available at http://localhost:${port}/health`);
}

bootstrap();
