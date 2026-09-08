import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'

import { Module } from './module.entity'

export type TemplateKind =
  | 'excel'
  | 'docx'
  | 'pdf'

export type TemplatePrintMode =
  | 'row'
  | 'batch'

export interface PdfTemplatePoint {
  x: number
  y: number
}

export interface PdfTemplateField {
  id?: string

  sourceType:
    | 'column'
    | 'fixed'
    | 'printDate'

  column?: string
  fixedValue?: string
  prefix?: string

  fontSize?: number
  width?: number
  height?: number

  align?:
    | 'left'
    | 'center'
    | 'right'

  repeatPerRecord?: boolean

  boxMode?:
    | 'topLeft'
    | 'baseline'

  x: number
  y: number
}

export interface TemplateBatchConfig {
  source?: 'filtered'

  /*
   * DOCX batch
   */
  loopName?: string

  /*
   * PDF batch / visual mapper
   */
  recordsPerPage?: number
  recordGapY?: number
  templatePage?: number

  firstAnchor?:
    PdfTemplatePoint |
    null

  secondAnchor?:
    PdfTemplatePoint |
    null

  fields?:
    PdfTemplateField[]
}

@Entity()
export class ModuleTemplate {

  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(
    () => Module,
    module => module.templates,
    {
      onDelete: 'CASCADE'
    }
  )
  @JoinColumn({
    name: 'moduleId'
  })
  module!: Module

  @Column()
  moduleId!: number

  @Column()
  name!: string

  @Column({
    type: 'varchar',
    length: 20
  })
  kind!: TemplateKind

  /*
   * row   = one selected log fills one template
   * batch = current filtered logs fill one template
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: 'row'
  })
  printMode!: TemplatePrintMode

  @Column({
    type: 'json',
    nullable: true
  })
  batchConfig!: TemplateBatchConfig | null

  @Column({
    type: 'longtext',
    nullable: true
  })
  file!: string

  @Column({
    nullable: true
  })
  fileName!: string

  @Column({
    nullable: true
  })
  fileMime!: string

  @Column({
    type: 'json',
    nullable: true
  })
  mappings!: {
    column: string
    cell: string
    repeating?: boolean
  }[]

  @Column({
    default: 8
  })
  templateStartRow!: number

  @Column({
    default: 9
  })
  templateRowsPerPage!: number
}
