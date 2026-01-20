import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        console.log('🔒 JwtAuthGuard: canActivate called');
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        console.log('🔒 JwtAuthGuard: handleRequest called');
        console.log('   Error:', err?.message || 'none');
        console.log('   User:', user?.email || 'none');
        console.log('   Info:', info?.message || info?.name || 'none');

        if (err || !user) {
            console.error('❌ JwtAuthGuard: Authentication failed');
            if (info) {
                console.error('   Info details:', info);
            }
            throw err || new UnauthorizedException(info?.message || 'Unauthorized');
        }

        console.log('✅ JwtAuthGuard: User authenticated');
        return user;
    }
}
