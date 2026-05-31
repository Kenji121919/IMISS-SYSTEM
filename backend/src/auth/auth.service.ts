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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Profile)              // ← add this
    private profileRepo: Repository<Profile>,
    private jwtService: JwtService,
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

    if (!user) throw new UnauthorizedException('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new UnauthorizedException('Invalid credentials')

    return {
      access_token: this.sign(user),
      user: this.safeUser(user),
    }
  }

  /* ─── REGISTER ─── */
 // auth.service.ts

async register(
  username: string,
  email: string,
  password: string,
  mobile: string,          // ← add these
  organizationName: string // ← add these
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
    mobile,              // ← pass through
    organizationName,    // ← pass through
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
  async forgotPassword(identifier: string) {
    const user = await this.userRepo.findOne({
      where: [{ username: identifier }, { email: identifier }],
    })
    // Silently succeed to avoid leaking account existence
    if (!user) return { message: 'If that account exists, a reset link has been sent.' }

    // TODO: generate a reset token and email it
    return { message: 'If that account exists, a reset link has been sent.' }
  }

  /* ─── RESET PASSWORD ─── */
  async resetPassword(token: string, newPassword: string) {
    // TODO: validate token, look up user, update password
    throw new BadRequestException('Reset not yet implemented')
  }

  /* ─── GOOGLE LOGIN ─── */
  async googleLogin(googleUser: { email: string; name: string; picture: string }) {
    if (!googleUser) throw new UnauthorizedException('No user from Google')

    let user = await this.userRepo.findOne({ where: { email: googleUser.email } })

    if (!user) {
      // Auto-create account for new Google users
      user = this.userRepo.create({
        email: googleUser.email,
        username: googleUser.email.split('@')[0],
        password: await bcrypt.hash(Math.random().toString(36), 10),
      })
      await this.userRepo.save(user)
    }

    return {
      access_token: this.sign(user),
      user: this.safeUser(user),
    }
  }
}