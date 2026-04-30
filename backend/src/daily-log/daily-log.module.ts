import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyLog } from '../entities/daily-log.entity';
import { DailyLogsController } from './daily-log.controller';
import { DailyLogService } from './daily-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyLog])],
  controllers: [DailyLogsController],
  providers: [DailyLogService],
})
export class DailyLogModule {}