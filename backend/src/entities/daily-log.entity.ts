import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class DailyLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  date!: string;

  @Column()
  time!: string;

  @Column('text')
  concern!: string;

  @Column()
  department!: string;

  @Column()
  ticketNumber!: string;

  @Column()
  receivedBy!: string;

  @Column()
  assignedTo!: string;

  @Column()
  team!: string;

  @Column()
  status!: string;

  @Column('text')
  remarks!: string;
}