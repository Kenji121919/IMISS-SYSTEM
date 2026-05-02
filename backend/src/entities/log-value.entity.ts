import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from 'typeorm'

import { Log } from './log.entity'
import { ModuleColumn } from './module-column.entity'

@Entity()
export class LogValue {
  @PrimaryGeneratedColumn()
  id!: number

  // ✅ FIX: real relation instead of string
  @ManyToOne(() => ModuleColumn, {
    eager: true,
    onDelete: 'CASCADE'
  })
  column!: ModuleColumn

  @Column('text')
  value!: string

  @ManyToOne(() => Log, log => log.values, {
    onDelete: 'CASCADE'
  })
  log!: Log
}