import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { ProfilesService } from './profiles.service'

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('single/:id')
  findOne(@Param('id') id: number) {
    return this.profilesService.findOne(Number(id))
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: number) {
    return this.profilesService.findByUser(Number(userId))
  }

  /* =========================
     CREATE PROFILE
  ========================= */
  @Post()
  create(@Body() body: any) {
    return this.profilesService.create(body)
  }

  /* =========================
     UPDATE PIN (🔥 THIS IS WHAT YOU'RE MISSING)
  ========================= */
  @Put(':id/pin')
  updatePin(@Param('id') id: number, @Body() body: any) {
    return this.profilesService.updatePin(Number(id), body.pin)
  }

  /* =========================
     DELETE PROFILE
  ========================= */
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.profilesService.delete(Number(id))
  }
}