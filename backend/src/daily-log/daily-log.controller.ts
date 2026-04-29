import { Controller, Get, Post, Body, Delete, Param, Patch } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';

@Controller('daily-logs')
export class DailyLogController {
  constructor(private readonly service: DailyLogService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }

  @Patch(':id')
update(@Param('id') id: number, @Body() data: any) {
  return this.service.update(id, data)
}
}