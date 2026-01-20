import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private authService: AuthService,
        private configService: ConfigService,
    ) {
        const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
        console.log('🔐 JwtStrategy initialized with secret length:', secret.length);
        console.log('🔐 JwtStrategy secret preview:', secret.substring(0, 20) + '...');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: any) {
        try {
            console.log('🔍 JWT validate called with payload:', { sub: payload.sub, email: payload.email, role: payload.role });

            const user = await this.authService.validateUser(payload.sub);

            if (!user) {
                console.log('❌ User validation failed - user not found or inactive');
                throw new UnauthorizedException('User not found or inactive');
            }

            console.log('✅ User validated:', user.email);

            return {
                userId: payload.sub,
                email: payload.email,
                riceMillId: payload.riceMillId,
                role: payload.role,
            };
        } catch (error) {
            console.error('❌ JWT validation error:', error.message);
            console.error('   Error stack:', error.stack);
            throw error;
        }
    }
}
