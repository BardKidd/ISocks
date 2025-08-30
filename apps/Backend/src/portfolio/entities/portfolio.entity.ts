import { User } from '@/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Position } from './position.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // 投資組合名稱

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number; // 當前總價值

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost: number; // 總成本

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalReturn: number; // 總收益

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  returnPercentage: number; // 收益率

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  dayChange: number; // 當日漲跌幅

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dayChangeAmount: number; // 當日漲跌金額

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Position, (position) => position.portfolio)
  positions: Position[];
}