import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogsService } from './logs.service'
import { LogsController } from './logs.controller'
import { Log } from '../entities/log.entity'
import { Module as ModuleEntity } from '../entities/module.entity'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Log, ModuleEntity]), 
    AuditModule,                                   
  ],
  providers: [LogsService],
  controllers: [LogsController]
})
export class LogsModule {}