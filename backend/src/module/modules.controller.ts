import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { ModulesService } from './modules.service'

@Controller('modules')
export class ModulesController {
  constructor(private service: ModulesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  @Get(':userId')                           // GET /modules/2
  findAll(@Param('userId') userId: number) {
    return this.service.findAll(Number(userId))
  }

  @Get('single/:id')                        // GET /modules/single/5
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id))
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