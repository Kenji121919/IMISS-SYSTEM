import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DailyLog } from '../entities/daily-log.entity'

@Injectable()
export class DailyLogService {
  constructor(
    @InjectRepository(DailyLog)
    private repo: Repository<DailyLog>,
  ) {}

  findAll(team?: string) {
    const query = this.repo.createQueryBuilder('log')

    if (team && team !== 'All') {
      query.where(
        'LOWER(TRIM(log.team)) = LOWER(TRIM(:team))',
        { team: team.trim() }
      )
    }

    return query.getMany()
  }

  

  create(data: any) {
    return this.repo.save(data)
  }

  delete(id: number) {
    return this.repo.delete(id)
  }

  update(id: number, data: any) {
    return this.repo.update(id, data)
  }
}