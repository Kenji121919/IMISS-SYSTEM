import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Module as ModuleEntity } from '../entities/module.entity'
import { ModuleColumn } from '../entities/module-column.entity'

import { ModulesService } from './modules.service'
import { ModulesController } from './modules.controller'
import { TemplateMapping } from '../entities/template-mapping.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      ModuleColumn,
    
    ]),
  ],
  controllers: [ModulesController],
  providers: [ModulesService],
})
export class ModulesModule {}