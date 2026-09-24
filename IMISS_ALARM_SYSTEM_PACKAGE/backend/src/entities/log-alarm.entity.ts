import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'

import { Module } from './module.entity'
import { Log } from './log.entity'
import {
  AlarmLeadUnit,
  AlarmRepeatMode,
} from './module-alarm-config.entity'

export type LogAlarmStatus =
  | 'ACTIVE'
  | 'TRIGGERED'
  | 'SNOOZED'
  | 'DISMISSED'
  | 'CANCELLED'

@Entity('log_alarm')
@Index(['moduleId', 'logId'], { unique: true })
export class LogAlarm {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  @ManyToOne(() => Module, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'moduleId' })
  module!: Module

  @Column()
  logId!: number

  @ManyToOne(() => Log, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'logId' })
  log!: Log

  @Column({ type: 'datetime' })
  dueAt!: Date

  @Column({ type: 'datetime' })
  alarmAt!: Date

  @Column({ type: 'int', default: 0 })
  leadValue!: number

  @Column({ type: 'varchar', length: 20, default: 'minutes' })
  leadUnit!: AlarmLeadUnit

  @Column({ type: 'text', nullable: true })
  message!: string | null

  @Column({ type: 'varchar', length: 24, nullable: true })
  repeatMode!: AlarmRepeatMode | null

  @Column({ type: 'int', nullable: true })
  repeatCount!: number | null

  @Column({ type: 'varchar', length: 16, default: 'ACTIVE' })
  status!: LogAlarmStatus

  @Column({ type: 'datetime', nullable: true })
  triggeredAt!: Date | null

  @Column({ type: 'datetime', nullable: true })
  snoozedUntil!: Date | null

  @Column({ type: 'datetime', nullable: true })
  dismissedAt!: Date | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
