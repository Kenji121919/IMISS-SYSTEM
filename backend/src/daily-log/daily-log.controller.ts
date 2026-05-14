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
  create(@Body() data: any) {
    return this.service.create(data)
  }

  // =========================
  // UPDATE LOG
  // =========================
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(+id, data)
  }

  // =========================
  // DELETE LOG
  // =========================
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.delete(+id)
  }

 @Get('department/:department')
@UseGuards(JwtAuthGuard)
findByDepartment(@Param('department') department: string) {
  return this.service.findByModule(department)
}
}