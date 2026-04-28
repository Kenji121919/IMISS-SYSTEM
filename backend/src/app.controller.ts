import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

@Controller('auth') // 🔥 THIS IS CRITICAL
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // 🔥 THIS MAKES /auth/login
  login(@Body() body: any) {
    return this.authService.login(body.username, body.password);
  }
}