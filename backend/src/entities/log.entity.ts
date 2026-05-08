import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
  Index
} from 'typeorm'

import { Module } from './module.entity'

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Module, module => module.logs, { onDelete: 'CASCADE' })
  module!: Module

  @Index()
  @Column({ nullable: true })
  date!: string

  @Index()
  @Column({ nullable: true })
  time!: string

  @Index()
  @Column({ nullable: true })
  concern!: string

  @Column('json')
  data!: Record<string, any>

  @CreateDateColumn()
  createdAt!: Date
}