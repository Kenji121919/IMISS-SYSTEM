import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DailyLogService } from './daily-log.service'

@Controller('daily-logs')
export class DailyLogsController {
  constructor(private readonly service: DailyLogService) {}

  // =========================
  // GET LOGS (FILTER BY TEAM)
  // =========================
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('team') team: string) {
    return this.service.findAll(team)
  }

  // =========================
  // CREATE LOG
  // =========================
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: any) {
    const { _profileName, _moduleId, ...data } = body
    return this.service.create(data, {
      profileName: _profileName,
      moduleId:    _moduleId,
    })
  }

  // =========================
  // UPDATE LOG
  // =========================
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any) {
    const { _profileName, _moduleId, ...data } = body
    return this.service.update(+id, data, {
      profileName: _profileName,
      moduleId:    _moduleId,
    })
  }

  // =========================
  // DELETE LOG
  // =========================
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Body() body: any) {
    return this.service.delete(+id, {
      profileName: body?._profileName,
      moduleId:    body?._moduleId,
    })
  }

  // =========================
  // GET BY DEPARTMENT
  // =========================
  @Get('department/:department')
  @UseGuards(JwtAuthGuard)
  findByDepartment(@Param('department') department: string) {
    return this.service.findByModule(department)
  }
}