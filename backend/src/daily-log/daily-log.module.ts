import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DailyLog } from '../entities/daily-log.entity';
import { DailyLogController } from './daily-log.controller';
import { DailyLogService } from './daily-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([DailyLog])],
  controllers: [DailyLogController],
  providers: [DailyLogService],
})
export class DailyLogModule {}