import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Log } from '../entities/log.entity'
import { Module } from '../entities/module.entity'
import { AuditService } from '../audit/audit.service'
import * as ExcelJS from 'exceljs'
import * as path from 'path'
import * as fs from 'fs'
import { NotFoundException } from '@nestjs/common'

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
    relations: ['module'], 
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

async exportExcel(moduleId: number, filters: any) {
  // Load the module so we know which template to use
  const module = await this.moduleRepo.findOne({
    where: { id: moduleId },
  })

  if (!module) {
    throw new NotFoundException('Module not found')
  }

  if (!module.templateFile) {
    throw new NotFoundException('No Excel template uploaded for this module.')
  }

  const templatePath = path.join(
    process.cwd(),
    'uploads',
    'templates',
    module.templateFile,
  )

  if (!fs.existsSync(templatePath)) {
    throw new NotFoundException('Template file does not exist.')
  }

  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.readFile(templatePath)

  const worksheet = workbook.worksheets[0]

  // TEMPORARY
  // Just verify the template loads correctly
  worksheet.getCell('A1').value = 'IMISS DAILY LOGS EXPORT'

  return workbook.xlsx.writeBuffer()
}
}