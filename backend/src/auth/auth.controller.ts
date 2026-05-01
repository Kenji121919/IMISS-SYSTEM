import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthGuard } from '@nestjs/passport'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ================= LOGIN ================= */
  @Post('login')
  login(
    @Body() body: { identifier: string; password: string },
  ) {
    return this.authService.login(body.identifier, body.password)
  }

  /* ================= REGISTER ================= */
  @Post('register')
  register(
    @Body()
    body: { username: string; email: string; password: string },
  ) {
    return this.authService.register(
      body.username,
      body.email,
      body.password,
    )
  }

  /* ================= FORGOT PASSWORD ================= */
  @Post('forgot-password')
  forgotPassword(@Body() body: { identifier: string }) {
    return this.authService.forgotPassword(body.identifier)
  }

  /* ================= RESET PASSWORD ================= */
  @Post('reset-password')
  resetPassword(
    @Body() body: { token: string; password: string },
  ) {
    return this.authService.resetPassword(
      body.token,
      body.password,
    )
  }

  /* ================= GOOGLE LOGIN ================= */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req) {
    return this.authService.googleLogin(req.user)
  }
}