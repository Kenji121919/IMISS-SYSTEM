import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private role: string) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const user = req.user

    return user.role === this.role
  }
}