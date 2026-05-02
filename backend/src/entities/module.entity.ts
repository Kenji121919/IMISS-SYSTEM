import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Log } from './log.entity'
import { ModuleColumn } from './module-column.entity'

@Entity()
export class Module {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  // ✅ FIX: use relational columns instead of JSON
  @OneToMany(() => ModuleColumn, col => col.module, {
    cascade: true,
    eager: true
  })
  columns!: ModuleColumn[]

  @Column('json')
  allowedProfiles!: number[]

  @Column()
  userId!: number

  @OneToMany(() => Log, log => log.module)
  logs!: Log[]
}