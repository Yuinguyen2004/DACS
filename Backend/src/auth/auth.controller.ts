import { Body, Controller, Post, UnauthorizedException, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login-dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @UsePipes(new ValidationPipe())
    async login(@Body() dto: LoginDto) {
        try {
            return await this.authService.login(dto.email, dto.password);
        } catch (error) {
            throw new UnauthorizedException(error.message);
        }
    }
}
