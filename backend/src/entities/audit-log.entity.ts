// src/entities/audit-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user.entity'
import { Module } from './module.entity'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  action!: 'CREATE' | 'UPDATE' | 'DELETE'

  @Column({ nullable: true })
  logId!: number   

  @Column({ type: 'json', nullable: true })
  before!: Record<string, any>   

  @Column({ type: 'json', nullable: true })
  after!: Record<string, any>   

  @Column({ type: 'json', nullable: true })
  diff!: Record<string, { from: any; to: any }>  

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ nullable: true })
  userId!: number

  @Column({ nullable: true })
  profileName!: string   

  @ManyToOne(() => Module, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'moduleId' })
  module!: Module

  @Column({ nullable: true })
  moduleId!: number

  @CreateDateColumn()
  createdAt!: Date
}