import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DailyLog } from '../entities/daily-log.entity'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class DailyLogService {
  constructor(
    @InjectRepository(DailyLog)
    private repo: Repository<DailyLog>,
    private auditService: AuditService,
  ) {}

  // =========================
  // GET ALL (FILTER BY TEAM)
  // =========================
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

  // =========================
  // CREATE LOG
  // =========================
  async create(data: any, meta?: { profileName?: string; moduleId?: number }) {
    const saved = await this.repo.save(data)

    await this.auditService.record({
      action:      'CREATE',
      logId:       saved.id,
      after:       data,
      profileName: meta?.profileName,
      moduleId:    meta?.moduleId,
    })

    return saved
  }

  // =========================
  // UPDATE LOG
  // =========================
  async update(id: number, data: any, meta?: { profileName?: string; moduleId?: number }) {
    const before = await this.repo.findOne({ where: { id } })

    await this.repo.update(id, data)

    const after = await this.repo.findOne({ where: { id } })

    await this.auditService.record({
      action:      'UPDATE',
      logId:       id,
      before:      before  ? { ...before  } : undefined,
      after:       after   ? { ...after   } : undefined,
      profileName: meta?.profileName,
      moduleId:    meta?.moduleId,
    })

    return after
  }

  // =========================
  // DELETE LOG
  // =========================
  async delete(id: number, meta?: { profileName?: string; moduleId?: number }) {
    const before = await this.repo.findOne({ where: { id } })

    await this.repo.delete(id)

    await this.auditService.record({
      action:      'DELETE',
      logId:       id,
      before:      before ? { ...before } : undefined,
      profileName: meta?.profileName,
      moduleId:    meta?.moduleId,
    })
  }

  // =========================
  // GET BY DEPARTMENT
  // =========================
  async findByModule(department: string) {
    return this.repo.find({
      where: { department },
    })
  }
}