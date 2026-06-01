// src/audit/audit.service.ts
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { AuditLog } from '../entities/audit-log.entity'

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>
  ) {}

  async record(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  logId: number
  before?: Record<string, any>
  after?: Record<string, any>
  userId?: number
  profileName?: string
  moduleId?: number
}) {
  const diff: Record<string, { from: any; to: any }> = {}

  const { before, after } = params
  if (before && after) {
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
    allKeys.forEach(key => {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        diff[key] = { from: before[key], to: after[key] }
      }
    })
  }


  const entry = this.auditRepo.create({
    action: params.action,
    logId: params.logId,
    before: params.before,
    after: params.after,
    diff: Object.keys(diff).length ? diff : undefined,
    userId: params.userId,
    profileName: params.profileName,
    moduleId: params.moduleId,
  })


  try {
    const saved = await this.auditRepo.save(entry)
  } catch (err) {
  }
}
  async findByModule(moduleId: number) {
    return this.auditRepo.find({
      where: { moduleId },
      order: { createdAt: 'DESC' },
      take: 500,
    })
  }

  async findByLog(logId: number) {
    return this.auditRepo.find({
      where: { logId },
      order: { createdAt: 'DESC' },
    })
  }
 async findAllByModules(moduleIds: number[]) {
  return this.auditRepo.find({
    where: { moduleId: In(moduleIds) },  // import In from typeorm
    order: { createdAt: 'DESC' },
    take: 1000,
  })
}
}