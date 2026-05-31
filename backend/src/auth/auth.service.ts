import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { User } from '../entities/user.entity'
import { Profile } from '../entities/profile.entity'
import { MailService } from '../mail/mail.service'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Profile)             
    private profileRepo: Repository<Profile>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /* ─── helpers ─── */
  private sign(user: User) {
    return this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    })
  }

  private safeUser(user: User) {
  const { password, refreshToken, resetToken, resetTokenExpiry, ...rest } = user as any
  return rest
}

  /* ─── LOGIN ─── */
  async login(identifier: string, password: string) {
    const user = await this.userRepo.findOne({
      where: [{ username: identifier }, { email: identifier }],
    })
    console.log('User found:', user?.id, '| email:', user?.email, '| username:', user?.username)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new UnauthorizedException('Invalid credentials')

    return {
      access_token: this.sign(user),
      user: this.safeUser(user),
    }
  }

  /* ─── REGISTER ─── */

async register(
  username: string,
  email: string,
  password: string,
  mobile: string,          
  organizationName: string
) {
  const exists = await this.userRepo.findOne({
    where: [{ username }, { email }],
  })
  if (exists) throw new BadRequestException('Username or email already taken')

  const hashed = await bcrypt.hash(password, 10)
  const user = this.userRepo.create({
    username,
    email,
    password: hashed,
    mobile,              
    organizationName,   
  })
  await this.userRepo.save(user)

  const adminProfile = this.profileRepo.create({
    user: { id: user.id },
    name: 'Admin',
    team: 'admin',
    pin: '0000',
  })
  await this.profileRepo.save(adminProfile)

  return {
    access_token: this.sign(user),
    user: this.safeUser(user),
  }
}

  /* ─── FORGOT PASSWORD ─── */
async forgotPassword(identifier: string, method: 'email' | 'sms') {
  const user = await this.userRepo.findOne({
    where: [{ username: identifier }, { email: identifier }],
  })
  if (!user) return { message: 'If that account exists, a code has been sent.' }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  user.resetToken = otp
  user.resetTokenExpiry = expiry
  await this.userRepo.save(user)

  if (method === 'email') {
    if (!user.email) throw new BadRequestException('No email on this account')
    await this.mailService.sendOtp(user.email, otp)
    // Mask email: j***@gmail.com
    const [name, domain] = user.email.split('@')
    const masked = name[0] + '***@' + domain
    return { message: `Code sent to ${masked}` }
  }

  if (method === 'sms') {
    if (!user.mobile) throw new BadRequestException('No mobile number on this account')
    // TODO: plug in Twilio here later if needed
    // For now return a dev-only response
    return { message: `SMS to ${user.mobile.slice(0, -4).replace(/\d/g, '*') + user.mobile.slice(-4)}`, dev_otp: otp }
  }
}

/* ─── VERIFY OTP ─── */
async verifyOtp(identifier: string, otp: string) {
  const user = await this.userRepo.findOne({
    where: [{ username: identifier }, { email: identifier }],
  })
  if (!user) throw new BadRequestException('Account not found')
  if (!user.resetToken || user.resetToken !== otp) {
  throw new BadRequestException('Invalid or expired code')
}
if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
  throw new BadRequestException('Code has expired')
}
  return { message: 'OTP verified' }
}

/* ─── RESET PASSWORD ─── */
async resetPassword(identifier: string, otp: string, newPassword: string) {
  const user = await this.userRepo.findOne({
    where: [{ username: identifier }, { email: identifier }],
  })
  if (!user) throw new BadRequestException('Account not found')
  if (!user.resetToken || user.resetToken !== otp) {
  throw new BadRequestException('Invalid or expired code')
}
if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
  throw new BadRequestException('Code has expired')
}

  user.password = await bcrypt.hash(newPassword, 10)
  user.resetToken = null
  user.resetTokenExpiry = null
  await this.userRepo.save(user)

  return { message: 'Password reset successfully' }
}
  /* ─── GOOGLE LOGIN ─── */
  async googleLogin(googleUser: { email: string; name: string; picture: string }) {
  if (!googleUser) throw new UnauthorizedException('No user from Google')

  let user = await this.userRepo.findOne({ where: { email: googleUser.email } })

  if (!user) {
    user = this.userRepo.create({
      email: googleUser.email,
      username: googleUser.email.split('@')[0],
      password: await bcrypt.hash(Math.random().toString(36), 10),
      organizationName: googleUser.name || googleUser.email.split('@')[0],
    })
    await this.userRepo.save(user)

    const adminProfile = this.profileRepo.create({
      name: 'Admin',
      team: 'admin',
      pin: '0000',
      user: { id: user.id },
    })
    await this.profileRepo.save(adminProfile)
  }

  return {
    access_token: this.sign(user),
    user: this.safeUser(user),
  }
}

  /* ─── GET ME ─── */
async getMe(userId: number) {
  const user = await this.userRepo.findOne({ where: { id: userId } })
  if (!user) throw new UnauthorizedException('User not found')
  return this.safeUser(user)
}
}