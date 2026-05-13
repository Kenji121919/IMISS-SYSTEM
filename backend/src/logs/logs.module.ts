import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LogsService } from './logs.service'
import { LogsController } from './logs.controller'
import { Log } from '../entities/log.entity'
import { Module as ModuleEntity } from '../entities/module.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Log, ModuleEntity])],
  providers: [LogsService],
  controllers: [LogsController]
})
export class LogsModule {}