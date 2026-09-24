import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AlarmController } from './alarm.controller'
import { AlarmService } from './alarm.service'

import { ModuleAlarmConfig } from '../entities/module-alarm-config.entity'
import { LogAlarm } from '../entities/log-alarm.entity'
import { Module as ModuleEntity } from '../entities/module.entity'
import { Log } from '../entities/log.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleAlarmConfig,
      LogAlarm,
      ModuleEntity,
      Log,
    ]),
  ],
  controllers: [AlarmController],
  providers: [AlarmService],
  exports: [AlarmService],
})
export class AlarmModule {}
