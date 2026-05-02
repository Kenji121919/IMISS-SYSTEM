import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Module } from './module.entity'

@Entity()
export class ModuleColumn {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  type!: string

  @ManyToOne(() => Module, module => module.columns, {
    onDelete: 'CASCADE'
  })
  module!: Module
}