import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Module } from '../entities/module.entity'

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private repo: Repository<Module>,
  ) {}

  findAll() {
    return this.repo.find()
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } })
  }

  // ✅ ADD THIS (FIX)
  create(body: any) {
    const module = this.repo.create(body)
    return this.repo.save(module)
  }
}