import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendOtp(to: string, otp: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'IMISS — Your password reset code',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0c;border-radius:16px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:20px;font-weight:700;">I</span>
            </div>
            <span style="color:#f0f0f4;font-size:20px;font-weight:700;">IMISS</span>
          </div>
          <h2 style="color:#f0f0f4;font-size:18px;margin:0 0 8px;">Password Reset Code</h2>
          <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Use the code below to reset your password. It expires in 10 minutes.</p>
          <div style="background:#1c1c1f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#818cf8;">${otp}</span>
          </div>
          <p style="color:#4b5563;font-size:12px;margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })
  }
}