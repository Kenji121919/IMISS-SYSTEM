import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Module } from '../entities/module.entity'

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private repo: Repository<Module>
  ) {}

  // ================= CREATE =================
  async create(body: any) {
    const module = this.repo.create({
      name: body.name,
      columns: body.columns,
      allowedProfiles: body.allowedProfiles,
      userId: body.userId
    })

    return this.repo.save(module)
  }

  // ================= FIND ALL =================
  async findAll(userId: number) {
    return this.repo.find({
      where: { userId }
    })
  }

  // ================= FIND ONE =================
  async findOne(id: number) {
    return this.repo.findOne({
      where: { id }
    })
  }

  // ================= UPDATE =================
  async update(id: number, body: any) {
    await this.repo.update(id, body)
    return this.findOne(id)
  }

  // ================= DELETE =================
  async delete(id: number) {
    return this.repo.delete(id)
  }
}