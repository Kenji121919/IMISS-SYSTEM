import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm'
import { Log } from './log.entity'

@Entity()
export class LogValue {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  column!: string

  @Column()
  value!: string

  @ManyToOne(() => Log, log => log.values, { onDelete: 'CASCADE' })
  log!: Log
}