import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { User } from '../entities/user.entity'
import { Profile } from '../entities/profile.entity'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,

    private jwtService: JwtService,
  ) {}

  /* ================= REGISTER ================= */
  async register(username: string, email: string, password: string) {
    const existingUser = await this.userRepo.findOne({
      where: [{ username }, { email }],
    })

    if (existingUser) {
      throw new ConflictException('Username or email already exists')
    }

    const hashed = await bcrypt.hash(password, 10)

    // 1. create user
    const user = this.userRepo.create({
      username,
      email,
      password: hashed,
      role: 'USER',
    })

    const savedUser = await this.userRepo.save(user)

    // 2. AUTO CREATE ADMIN PROFILE (PIN = 0000)
    const adminProfile = this.profileRepo.create({
      name: 'Admin',
      pin: '0000',
      user: savedUser,
    })

    await this.profileRepo.save(adminProfile)

    return {
      message: 'Account successfully created',
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
      },
    }
  }

  /* ================= LOGIN ================= */
  async login(identifier: string, password: string) {
    const user = await this.userRepo.findOne({
      where: [{ username: identifier }, { email: identifier }],
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }
  }

  /* ================= FORGOT PASSWORD ================= */
  async forgotPassword(identifier: string) {
    const user = await this.userRepo.findOne({
      where: [{ email: identifier }, { username: identifier }],
    })

    if (!user) {
      return { message: 'If account exists, reset link sent' }
    }

    const token = Math.random().toString(36) + Date.now()

    user.resetToken = token
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000)

    await this.userRepo.save(user)

    console.log(
      `RESET LINK: http://localhost:5173/reset-password/${token}`,
    )

    return { message: 'If account exists, reset link sent' }
  }

  /* ================= RESET PASSWORD ================= */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { resetToken: token },
    })

    if (!user || !user.resetTokenExpiry) {
      throw new UnauthorizedException('Invalid token')
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Token expired')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    user.resetToken = null
    user.resetTokenExpiry = null

    await this.userRepo.save(user)

    return { message: 'Password reset successful' }
  }

  /* ================= GOOGLE LOGIN ================= */
  async googleLogin(googleUser: any) {
    let user = await this.userRepo.findOne({
      where: { email: googleUser.email },
    })

    if (!user) {
      user = this.userRepo.create({
        username: googleUser.email,
        email: googleUser.email,
        password: '',
        role: 'USER',
      })

      user = await this.userRepo.save(user)

      // also create default profile
      const profile = this.profileRepo.create({
        name: 'Admin',
        pin: '0000',
        user,
      })

      await this.profileRepo.save(profile)
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      access_token: token,
      user,
    }
  }
}