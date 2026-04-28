import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth') // 🔥 MUST EXIST
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // 🔥 THIS CREATES /auth/login
  login(@Body() body: any) {
    return this.authService.login(body.username, body.password);
  }
}