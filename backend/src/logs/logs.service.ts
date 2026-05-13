import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Log } from '../entities/log.entity'
import { Module } from '../entities/module.entity'

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logRepo: Repository<Log>,

    @InjectRepository(Module)
    private moduleRepo: Repository<Module>
  ) {}

  /* =========================
     CREATE
  ========================= */
  async create(body: any) {
    const module = await this.moduleRepo.findOne({
      where: { id: body.moduleId }
    })

    if (!module) throw new Error('Module not found')

    const data = body.data || {}

    return this.logRepo.save({
      module,
      data,

      // ✅ extract important fields (case-sensitive!)
      date: data.Date || data.date || null,
      time: data.Time || data.time || null,
      concern: data.Concern || data.concern || null
    })
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
  async update(id: number, body: any) {
    const data = body.data || {}

    await this.logRepo.update(id, {
      data,
      date: data.Date || data.date || null,
      time: data.Time || data.time || null,
      concern: data.Concern || data.concern || null
    })

    return this.logRepo.findOne({ where: { id } })
  }

  /* =========================
     DELETE
  ========================= */
  async delete(id: number) {
    return this.logRepo.delete(id)
  }
}