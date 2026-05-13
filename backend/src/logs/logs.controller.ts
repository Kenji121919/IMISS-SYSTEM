import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
  constructor(private service: LogsService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }...

  @Get('module/:moduleId')
  findByModule(@Param('moduleId') moduleId: number) {
    return this.service.findByModule(Number(moduleId))
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(Number(id))
  }
}