import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Module } from '../entities/module.entity'
import { ModuleColumn } from '../entities/module-column.entity'
import { ModuleTemplate, TemplateKind } from '../entities/module-template.entity'

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private repo: Repository<Module>,

    @InjectRepository(ModuleTemplate)
    private templateRepo: Repository<ModuleTemplate>,

    @InjectRepository(ModuleColumn)
    private colRepo: Repository<ModuleColumn>
  ) {}

  // ================= CREATE =================
  async create(body: any) {
    const module = this.repo.create({
      name:               body.name,
      allowedProfilesRaw: JSON.stringify((body.allowedProfiles || []).map(Number)),
      userId:             body.userId,
      templateStartRow:    body.templateStartRow ?? 8,
      templateRowsPerPage: body.templateRowsPerPage ?? 9,
    })

    module.templateMappings = body.templateMappings ?? []

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
      relations: ['columns', 'templates'],
    })
    return mods.map(m => ({
      ...m,
      allowedProfiles: (() => {
        try { return JSON.parse((m as any).allowedProfilesRaw || '[]') }
        catch { return [] }
      })(),
      templateMappings: m.templateMappings,
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
      relations: ['columns', 'templates'],
    })
    if (!mod) return null
    return {
      ...mod,
      allowedProfiles: (() => {
        try { return JSON.parse((mod as any).allowedProfilesRaw || '[]') }
        catch { return [] }
      })(),
      templateMappings: mod.templateMappings,
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

    module.name               = body.name
    module.allowedProfilesRaw = JSON.stringify((body.allowedProfiles || []).map(Number))
    module.templateStartRow    = body.templateStartRow ?? 8
    module.templateRowsPerPage = body.templateRowsPerPage ?? 9
    module.templateMappings    = body.templateMappings ?? module.templateMappings

    await this.repo.save(module)

    return this.findOne(id)
  }

  // ================= DELETE =================
  async delete(id: number) {
    return this.repo.delete(id)
  }

  // ================= SAVE TEMPLATE (legacy single-Excel-template flow) =================
  async saveTemplate(
    id: number,
    filename: string,
    originalName: string,
    mimetype: string,
  ) {
    const module = await this.repo.findOne({ where: { id } })

    if (!module) {
      throw new Error('Module not found')
    }

    module.templateFile     = filename
    module.templateFileName = originalName
    module.templateFileMime = mimetype

    await this.repo.save(module)

    return {
      success: true,
      filename,
      originalName,
    }
  }

  // ================= MULTI-TEMPLATE SUPPORT (docx / additional templates) =================
  async listTemplates(moduleId: number) {
    return this.templateRepo.find({ where: { moduleId } })
  }

  async saveNewTemplate(
    moduleId: number,
    name: string,
    kind: TemplateKind,
    file: Express.Multer.File,
  ) {
    const tpl = this.templateRepo.create({
      moduleId,
      name,
      kind,
      file: file.filename,
      fileName: file.originalname,
      fileMime: file.mimetype,
      mappings: [],
    })
    return this.templateRepo.save(tpl)
  }

  async getTemplateById(templateId: number) {
    return this.templateRepo.findOne({ where: { id: templateId } })
  }

  async updateTemplateMappings(templateId: number, mappings: any[]) {
    const tpl = await this.templateRepo.findOne({ where: { id: templateId } })
    if (!tpl) return null
    tpl.mappings = mappings
    return this.templateRepo.save(tpl)
  }

  async deleteTemplate(templateId: number) {
    return this.templateRepo.delete(templateId)
  }
}