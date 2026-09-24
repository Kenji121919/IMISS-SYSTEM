import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm'

import { Module } from './module.entity'

export type AlarmAssignmentMode = 'individual' | 'batch' | 'both'
export type AlarmLeadUnit = 'minutes' | 'hours' | 'days'
export type AlarmRepeatMode = 'count' | 'untilDismissed'

@Entity('module_alarm_config')
@Index(['moduleId'], { unique: true })
export class ModuleAlarmConfig {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  @OneToOne(() => Module, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module!: Module

  @Column({ default: false })
  enabled!: boolean

  @Column({ type: 'varchar', length: 20, default: 'both' })
  mode!: AlarmAssignmentMode

  @Column({ type: 'int', default: 1 })
  defaultLeadValue!: number

  @Column({ type: 'varchar', length: 20, default: 'hours' })
  defaultLeadUnit!: AlarmLeadUnit

  @Column({ type: 'text', nullable: true })
  defaultMessage!: string | null

  @Column({ nullable: true })
  mediaFile!: string | null

  @Column({ nullable: true })
  mediaFileName!: string | null

  @Column({ nullable: true })
  mediaMime!: string | null

  @Column({ type: 'float', default: 0 })
  mediaStartSeconds!: number

  @Column({ type: 'float', default: 10 })
  mediaEndSeconds!: number

  @Column({ type: 'varchar', length: 24, default: 'untilDismissed' })
  repeatMode!: AlarmRepeatMode

  @Column({ type: 'int', default: 5 })
  repeatCount!: number

  @Column({ type: 'int', default: 3 })
  repeatDelaySeconds!: number

  @Column({ type: 'int', default: 120 })
  maxAudibleSeconds!: number

  @Column({ default: true })
  inAppPopup!: boolean

  @Column({ default: true })
  browserNotification!: boolean

  @Column({ default: true })
  allowSnooze!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
