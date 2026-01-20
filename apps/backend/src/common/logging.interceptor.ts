import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, query, params } = request;
        const userAgent = request.get('user-agent') || '';
        const ip = request.ip;

        const now = Date.now();

        this.logger.log(
            `📥 ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 50)}...`
        );

        if (Object.keys(query).length > 0) {
            this.logger.debug(`Query: ${JSON.stringify(query)}`);
        }

        if (Object.keys(params).length > 0) {
            this.logger.debug(`Params: ${JSON.stringify(params)}`);
        }

        if (body && Object.keys(body).length > 0) {
            // Hide sensitive data
            const sanitizedBody = { ...body };
            if (sanitizedBody.password) sanitizedBody.password = '***';
            this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`);
        }

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const responseTime = Date.now() - now;

                    this.logger.log(
                        `📤 ${method} ${url} - Status: ${statusCode} - ${responseTime}ms`
                    );

                    if (data && process.env.NODE_ENV === 'development') {
                        const responsePreview = JSON.stringify(data).substring(0, 200);
                        this.logger.debug(`Response: ${responsePreview}...`);
                    }
                },
                error: (error) => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const responseTime = Date.now() - now;

                    this.logger.error(
                        `❌ ${method} ${url} - Status: ${statusCode} - ${responseTime}ms - Error: ${error.message}`
                    );
                },
            })
        );
    }
}
