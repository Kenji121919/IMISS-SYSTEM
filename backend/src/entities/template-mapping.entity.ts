import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne
} from 'typeorm'

import { Module } from './module.entity'

@Entity()
export class TemplateMapping {

  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Module, module => module.id,{
    onDelete:'CASCADE'
  })
  module!: Module

  @Column()
  fieldName!: string

  @Column()
  cell!: string

}