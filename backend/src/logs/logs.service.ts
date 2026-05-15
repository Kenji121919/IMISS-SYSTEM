import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Log } from '../entities/log.entity'
import { Module } from '../entities/module.entity'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class LogsService {
  constructor(
     @InjectRepository(Log) private logRepo: Repository<Log>,
     private auditService: AuditService,

    @InjectRepository(Module)
    private moduleRepo: Repository<Module>

   
  ) {}

  
  /* =========================
     CREATE
  ========================= */
 async create(
  dto: { moduleId: number; data: Record<string, any> },
  userId?: number,
  profileName?: string,
) {
  // ✅ TypeORM relation field is `module: { id }`, not `moduleId`
  const log = this.logRepo.create({
    module: { id: dto.moduleId },
    data: dto.data,
  })
  // ✅ Cast to single entity — save(entity) returns T, not T[]
  const saved = await this.logRepo.save(log) as Log

  await this.auditService.record({
    action: 'CREATE',
    logId: saved.id,
    after: dto.data,
    userId,
    profileName,
    moduleId: dto.moduleId,
  })

  return saved
}

  /* =========================
     GET LOGS BY MODULE
  ========================= */
  async findByModule(moduleId: number) {
    return this.logRepo.find({
      where: { module: { id: moduleId } },
      order: { createdAt: 'DESC' }
    })
  }

  /* =========================
     UPDATE
  ========================= */
 async update(
  id: number,
  dto: { data: Record<string, any> },
  userId?: number,
  profileName?: string,
) {
  const existing = await this.logRepo.findOne({
    where: { id },
    relations: ['module'], // ✅ load relation so we can read moduleId
  })
  const before = existing?.data ?? {}

  await this.logRepo.update(id, { data: dto.data })

  await this.auditService.record({
    action: 'UPDATE',
    logId: id,
    before,
    after: dto.data,
    userId,
    profileName,
    moduleId: existing?.module?.id, // ✅ read from the loaded relation
  })

  return this.logRepo.findOne({ where: { id } })
}

  /* =========================
     DELETE
  ========================= */
 async remove(id: number, userId?: number, profileName?: string) {
  const existing = await this.logRepo.findOne({
    where: { id },
    relations: ['module'], // ✅ same here
  })

  await this.auditService.record({
    action: 'DELETE',
    logId: id,
    before: existing?.data ?? {},
    userId,
    profileName,
    moduleId: existing?.module?.id, // ✅
  })

  return this.logRepo.delete(id)
}
}