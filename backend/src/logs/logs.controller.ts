import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common'
import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
  constructor(private service: LogsService) {}

  @Post()
  create(@Body() body: any) {
    const { _profileName, _moduleId, ...rest } = body
    return this.service.create(rest, undefined, _profileName)
  }

  @Get('module/:moduleId')
  findByModule(@Param('moduleId') moduleId: number) {
    return this.service.findByModule(Number(moduleId))
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    const { _profileName, _moduleId, ...rest } = body
    return this.service.update(Number(id), rest, undefined, _profileName)
  }

  @Delete(':id')
  delete(@Param('id') id: number, @Body() body: any) {
    return this.service.remove(Number(id), undefined, body?._profileName)
  }

 @Get('module/:moduleId/export')
async exportExcel(
  @Param('moduleId') moduleId: number,
  @Query() query: any,
  @Res() res,
) {
  const buffer = await this.service.exportExcel(
    Number(moduleId),
    query,
  )

  res.set({
    'Content-Type':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition':
      'attachment; filename="export.xlsx"',
  })

  res.send(buffer)
}
}