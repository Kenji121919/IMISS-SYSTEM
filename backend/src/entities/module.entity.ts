import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm'

import { ModuleColumn } from './module-column.entity'
import { Log } from './log.entity'
import { ModuleTemplate } from './module-template.entity'


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

  @OneToMany(() => ModuleColumn, col => col.module, {
    cascade: true,
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

  @Column({ type: 'json', nullable: true })
  templateMappings!: { column: string; cell: string }[]

  @Column({
    default: 8
  })
  templateStartRow!: number

  @Column({
    default: 9
  })
  templateRowsPerPage!: number

}