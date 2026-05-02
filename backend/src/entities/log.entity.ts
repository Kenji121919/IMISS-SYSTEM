import { Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne } from 'typeorm'
import { LogValue } from './log-value.entity'
import { Module } from './module.entity'

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Module, module => module.logs, { onDelete: 'CASCADE' })
  module!: Module

  @OneToMany(() => LogValue, v => v.log, {
    cascade: true,
    eager: true,
  })
  values!: LogValue[]
}