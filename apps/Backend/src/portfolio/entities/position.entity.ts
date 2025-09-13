import { Portfolio } from './portfolio.entity';
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
import { Transaction } from './transaction.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 200 })
  stockName: string;

  @Column({ length: 50, default: 'US' })
  market: string;

  @Column('uuid')
  portfolioId: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @Column({ type: 'decimal', precision: 20, scale: 5 })
  quantity: number; // 持有張數

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  averageCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fees: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  currentPrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unrealizedReturn: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  returnPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  dayChange: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  dayChangePercent: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  priceUpdatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.position)
  transactions: Transaction[];
}