import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthGuard } from '@nestjs/passport'
import { GoogleAuthGuard } from './google-auth.guard' 

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /* ================= LOGIN ================= */
  @Post('login')
  login(@Body() body: { identifier: string; password: string }) {
    return this.authService.login(body.identifier, body.password)
  }

  /* ================= ME ================= */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req) {
    return this.authService.getMe(req.user.sub)
  }

  /* ================= REGISTER ================= */
  @Post('register')
  register(
    @Body() body: {
      username: string
      email: string
      password: string
      mobile: string
      organizationName: string
    },
  ) {
    return this.authService.register(
      body.username,
      body.email,
      body.password,
      body.mobile,
      body.organizationName,
    )
  }

  /* ================= FORGOT PASSWORD ================= */
  @Post('forgot-password')
forgotPassword(@Body() body: { identifier: string; method: 'email' | 'sms' }) {
  return this.authService.forgotPassword(body.identifier, body.method)
}

@Post('verify-otp')
verifyOtp(@Body() body: { identifier: string; otp: string }) {
  return this.authService.verifyOtp(body.identifier, body.otp)
}

@Post('reset-password')
resetPassword(@Body() body: { identifier: string; otp: string; password: string }) {
  return this.authService.resetPassword(body.identifier, body.otp, body.password)
}

  /* ================= GOOGLE LOGIN ================= */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req, @Res() res) {
    if (!req.user) {
      return res.redirect('http://172.16.2.31:1234/?error=cancelled')
    }

    const result = await this.authService.googleLogin(req.user)
    return res.redirect(
      `http://172.16.2.31:1234/auth/callback?token=${result.access_token}&user=${encodeURIComponent(JSON.stringify(result.user))}`
    )
  }
}