// audit.controller.ts
import { Controller, Get, Param } from '@nestjs/common'
import { AuditService } from './audit.service'

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  findAll() {
    return this.auditService.findAll()
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