import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from 'typeorm'
import { Module } from './module.entity'

@Entity()
export class ModuleColumn {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  type!: string

  @Column({ default: false })
  filterable!: boolean

  @Column({ default: false })
  required!: boolean

 @Column({
  name: 'options_raw',
  type: 'longtext',
  nullable: true,
})
optionsRaw: string = '[]'

  get options(): { label: string; color: string }[] {
    try {
      return JSON.parse(this.optionsRaw || '[]')
    } catch {
      return []
    }
  }

  set options(val: { label: string; color: string }[]) {
    this.optionsRaw = JSON.stringify(val || [])
  }

  @Column({
    name: 'base_url',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: '',
  })
  baseUrl!: string

  @ManyToOne(() => Module, module => module.columns, {
    onDelete: 'CASCADE'
  })
  module!: Module
}