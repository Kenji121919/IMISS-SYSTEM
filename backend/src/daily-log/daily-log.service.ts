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

  findAll() {
    return this.repo.find()
  }

  create(data: any) {
    return this.repo.save(data) // ✅ SAVES TO MYSQL
  }

  delete(id: number) {
    return this.repo.delete(id)
  }

  update(id: number, data: any) {
  return this.repo.update(id, data)
}
}