import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm'

import { ModuleColumn } from './module-column.entity'
import { Log } from './log.entity'
import { ModuleTemplate } from './module-template.entity'

export interface ExcelTemplateMapping {
  column: string
  cell: string
  repeating?: boolean
}

@Entity()
export class Module {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  userId!: number

  @Column({
    type: 'longtext',
    nullable: true,
  })
  allowedProfilesRaw: string = '[]'

  @Column({
    type: 'longtext',
    nullable: true,
  })
  monitoringConfigRaw: string = '{}'

  @Column({
    type: 'longtext',
    nullable: true,
  })
  upcomingConfigRaw: string = '{}'

  @OneToMany(() => ModuleColumn, col => col.module, {
    eager: true
  })
  columns!: ModuleColumn[]

  @OneToMany(() => Log, log => log.module)
  logs!: Log[]

  @OneToMany(() => ModuleTemplate, t => t.module, {
    cascade: true,
    eager: true
  })
  templates!: ModuleTemplate[]

  /*
   * Legacy/single Excel template.
   *
   * In the current print architecture this is the
   * BATCH / FILTERED RECORDS template.
   */
  @Column({
    type: 'longtext',
    nullable: true
  })
  templateFile!: string

  @Column({
    nullable: true
  })
  templateFileName!: string

  @Column({
    nullable: true
  })
  templateFileMime!: string

  /*
   * Excel cell mappings.
   *
   * Example:
   * Item Description -> F16
   * Serial Number    -> F17
   *
   * The frontend infers rows-per-record from the mapped row span.
   */
  @Column({
    type: 'json',
    nullable: true
  })
  templateMappings!: ExcelTemplateMapping[]

  /*
   * For batch Excel:
   * templateStartRow = first record row.
   * Example condemnation form: 16.
   */
  @Column({
    default: 8
  })
  templateStartRow!: number


  /*
   * For batch Excel:
   * number of spreadsheet rows used by ONE record.
   * Example condemnation form:
   *   row 16 = main item
   *   row 17 = SN line
   * so rows per record = 2.
   */
  @Column({
    default: 1
  })
  templateRowsPerRecord!: number

  /*
   * For batch Excel:
   * templateRowsPerPage now represents RECORDS PER COMPLETE FORM PAGE.
   * Example condemnation form: 10.
   *
   * The name is retained so the existing DB and frontend remain compatible.
   */
  @Column({
    default: 9
  })
  templateRowsPerPage!: number
}
