import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Module as ModuleEntity } from '../entities/module.entity'
import { ModuleColumn } from '../entities/module-column.entity'
import { ModuleTemplate } from '../entities/module-template.entity'

import { ModulesService } from './modules.service'
import { ModulesController } from './modules.controller'
import { PdfTemplateService } from './services/pdf-template.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModuleEntity,
      ModuleColumn,
      ModuleTemplate,
    ]),
  ],
  controllers: [ModulesController],
  providers: [
    ModulesService,
    PdfTemplateService,
  ],
})
export class ModulesModule {}
