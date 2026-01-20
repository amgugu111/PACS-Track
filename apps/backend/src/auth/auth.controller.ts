import { Controller, Post, Body, UseGuards, Get, Param, Put, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, CreateRiceMillDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // SUPER ADMIN ONLY - Create Rice Mill
    @Post('admin/rice-mills')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async createRiceMill(@Body() dto: CreateRiceMillDto) {
        return this.authService.createRiceMill(dto);
    }

    // SUPER ADMIN ONLY - Get All Rice Mills
    @Get('admin/rice-mills')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async getAllRiceMills() {
        return this.authService.getAllRiceMills();
    }

    // SUPER ADMIN ONLY - Get Rice Mill Details
    @Get('admin/rice-mills/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async getRiceMill(@Param('id') id: string) {
        return this.authService.getRiceMillById(id);
    }

    // SUPER ADMIN ONLY - Toggle Rice Mill Status
    @Patch('admin/rice-mills/:id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async toggleRiceMillStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.authService.toggleRiceMillStatus(id, isActive);
    }

    // SUPER ADMIN ONLY - Update Rice Mill
    @Put('admin/rice-mills/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async updateRiceMill(@Param('id') id: string, @Body() dto: CreateRiceMillDto) {
        return this.authService.updateRiceMill(id, dto);
    }

    // PUBLIC - Login (for both super admin and rice mill users)
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // ADMIN ONLY - Register new users within rice mill
    @Post('register')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async register(
        @Body() dto: RegisterDto,
        @CurrentUser() user: any,
    ) {
        return this.authService.register(dto, user.riceMillId, user.userId);
    }

    // Get current user profile
    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: any) {
        return user;
    }
}
