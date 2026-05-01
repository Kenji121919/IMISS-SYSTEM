import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Profile } from './profile.entity'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  username!: string

  @Column({ unique: true, nullable: true })
  email!: string

  @Column()
  password!: string

  @Column({ default: 'USER' })
  role!: string

  @Column({ default: false })
  isVerified!: boolean

  @Column({ nullable: true, type: 'text' })
  refreshToken!: string | null

  @Column({ nullable: true, type: 'varchar', length: 255 })
  resetToken!: string | null

  @Column({ nullable: true, type: 'datetime' })
  resetTokenExpiry!: Date | null

  @OneToMany(() => Profile, profile => profile.user)
  profiles!: Profile[]
}