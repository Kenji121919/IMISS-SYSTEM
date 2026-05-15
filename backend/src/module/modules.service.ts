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

    columns: body.columns || [],

    allowedProfiles: body.allowedProfiles || [],

    userId: body.userId
  })

  return await this.repo.save(module)
}

  // ================= FIND ALL =================
  async findAll(userId: number) {
    return this.repo.find({
      where: { userId },
      //relations: ['columns'] 
    })
  }

  // ================= FIND ONE =================
  async findOne(id: number) {
    return this.repo.findOne({
      where: { id },
      //relations: ['columns'] 
    })
  }

  // ================= UPDATE =================
  async update(id: number, body: any) {
  const module = await this.repo.findOne({
    where: { id },
    relations: ['columns']
  })

  if (!module) return null

  module.name = body.name
  module.columns = body.columns
   module.allowedProfiles = (body.allowedProfiles || []).map(Number)  

  return this.repo.save(module)
}

  // ================= DELETE =================
  async delete(id: number) {
    return this.repo.delete(id)
  }
}