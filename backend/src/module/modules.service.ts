import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Module } from '../entities/module.entity'
import { ModuleColumn } from '../entities/module-column.entity'
import { TemplateMapping } from '../entities/template-mapping.entity'

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private repo: Repository<Module>,

    @InjectRepository(ModuleColumn)
    private colRepo: Repository<ModuleColumn>
  ) {}

  // ================= CREATE =================
  async create(body: any) {
    const module = this.repo.create({
      name:               body.name,
      allowedProfilesRaw: JSON.stringify((body.allowedProfiles || []).map(Number)),
      userId:             body.userId,
    })
    const saved = await this.repo.save(module)

    const columns = (body.columns || []).map((col: any) =>
      this.colRepo.create({
        name:       col.name,
        type:       col.type,
        optionsRaw: JSON.stringify(Array.isArray(col.options) ? col.options : []),
        baseUrl:    col.baseUrl    ?? '',
        filterable: col.filterable ?? false,
        required:   col.required   ?? false,
        module:     { id: saved.id },
      })
    )
    if (columns.length) await this.colRepo.save(columns)

    return this.findOne(saved.id)
  }

  // ================= FIND ALL =================
  async findAll(userId: number) {
    const mods = await this.repo.find({
      where: { userId },
      relations: ['columns'],
    })
    return mods.map(m => ({
      ...m,
      allowedProfiles: (() => {
        try { return JSON.parse((m as any).allowedProfilesRaw || '[]') }
        catch { return [] }
      })(),
      columns: m.columns.map(c => ({
        ...c,
        options: (() => {
          try { return JSON.parse((c as any).optionsRaw || '[]') }
          catch { return [] }
        })()
      }))
    }))
  }

  // ================= FIND ONE =================
  async findOne(id: number) {
    const mod = await this.repo.findOne({
      where: { id },
      relations: ['columns'],
    })
    if (!mod) return null
    return {
      ...mod,
      allowedProfiles: (() => {
        try { return JSON.parse((mod as any).allowedProfilesRaw || '[]') }
        catch { return [] }
      })(),
      columns: mod.columns.map(c => ({
        ...c,
        options: (() => {
          try { return JSON.parse((c as any).optionsRaw || '[]') }
          catch { return [] }
        })()
      }))
    }
  }

  // ================= UPDATE =================
  async update(id: number, body: any) {
    const module = await this.repo.findOne({
      where: { id },
      relations: ['columns'],
    })
    if (!module) return null

    if (module.columns?.length) {
      await this.colRepo.delete(module.columns.map(c => c.id))
    }

    const newColumns = (body.columns || []).map((col: any) =>
      this.colRepo.create({
        name:       col.name,
        type:       col.type,
        optionsRaw: JSON.stringify(Array.isArray(col.options) ? col.options : []),
        baseUrl:    col.baseUrl    ?? '',
        filterable: col.filterable ?? false,
        required:   col.required   ?? false,
        module:     { id },
      })
    )

    if (newColumns.length) await this.colRepo.save(newColumns)

    await this.repo.update(id, {
      name:               body.name,
      allowedProfilesRaw: JSON.stringify((body.allowedProfiles || []).map(Number)),
    })

    return this.findOne(id)
  }

  // ================= DELETE =================
  async delete(id: number) {
    return this.repo.delete(id)
  }

  // ================= SAVE TEMPLATE =================
async saveTemplate(id: number, filename: string) {
  const module = await this.repo.findOne({
    where: { id },
  })

  if (!module) {
    throw new Error('Module not found')
  }

  module.templateFile = filename

  await this.repo.save(module)

  return {
    success: true,
    filename,
  }
}
}