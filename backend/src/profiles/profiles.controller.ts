import { Controller, Get, Param } from '@nestjs/common'
import { ProfilesService } from './profiles.service'
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  // ✅ FIRST: specific route
  @Get('single/:id')
  findOne(@Param('id') id: number) {
    return this.profilesService.findOne(id)
  }

  // ✅ SECOND: generic route
  @Get(':userId')
  findByUser(@Param('userId') userId: number) {
    return this.profilesService.findByUser(userId)
  }

}