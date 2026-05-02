import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Log } from './log.entity'

@Entity()
export class Module {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  // dynamic columns (IMPORTANT)
  @Column('json', { nullable: true })
  columns!: any

  @Column('json', { nullable: true })
  allowedProfiles!: any

  @OneToMany(() => Log, log => log.module)
  logs!: Log[]
}