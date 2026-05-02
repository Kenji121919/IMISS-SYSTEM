import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  avatar!: string;

  @Column({ nullable: true })
  pin!: string;

@ManyToOne(() => User, user => user.profiles, { eager: false })
user!: User;
}