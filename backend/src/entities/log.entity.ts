import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn
} from 'typeorm'

import { Module } from './module.entity'
import { LogValue } from './log-value.entity'

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Module, module => module.logs, {
    onDelete: 'CASCADE'
  })
  module!: Module

  @OneToMany(() => LogValue, value => value.log, {
    cascade: true,
    eager: true
  })
  values!: LogValue[]

  @CreateDateColumn()
  createdAt!: Date
}