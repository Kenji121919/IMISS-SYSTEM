import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete
} from '@nestjs/common'
import { ModulesService } from './modules.service'

@Controller('modules')
export class ModulesController {
  constructor(private service: ModulesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body)
  }

  // ⚠️ IMPORTANT ORDER
  @Get('single/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id))
  }

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.service.findAll(Number(userId))
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(Number(id), body)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(Number(id))
  }
}