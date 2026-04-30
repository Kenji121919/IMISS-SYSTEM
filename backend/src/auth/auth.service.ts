import { Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // TEMP USER (replace with DB later)
  private users = [
  {
    id: 1,
    username: 'admin',
    password: bcrypt.hashSync('admin@123', 10),
    role: 'ADMIN'
  }
]

  async login(username: string, password: string) {
    const user = this.users.find(u => u.username === username)

    if (!user) throw new UnauthorizedException('Invalid credentials')

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) throw new UnauthorizedException('Invalid credentials')

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role
    }

    return {
  access_token: this.jwtService.sign(payload),
  user: {
    id: user.id,        // 🔥 ADD THIS
    username: user.username,
    role: user.role
  }
}
  }
}