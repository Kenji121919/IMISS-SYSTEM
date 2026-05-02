import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ModulesService } from './modules.service'

@Controller('modules')
export class ModulesController {
  constructor(private readonly service: ModulesService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get('single/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id))
  }

  // ✅ ONLY KEEP IF YOU REALLY NEED CREATE MODULE
  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }
}