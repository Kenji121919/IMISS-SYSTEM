// audit.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common'
import { AuditService } from './audit.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
@UseGuards(JwtAuthGuard)
async findAll(@Req() req, @Query('moduleIds') moduleIds?: string) {
  if (moduleIds) {
    const ids = moduleIds.split(',').map(Number)
    return this.auditService.findAllByModules(ids)
  }
  return []  
}

  @Get('module/:moduleId')
  byModule(@Param('moduleId') moduleId: string) {
    return this.auditService.findByModule(+moduleId)
  }

  @Get('log/:logId')
  byLog(@Param('logId') logId: string) {
    return this.auditService.findByLog(+logId)
  }
}