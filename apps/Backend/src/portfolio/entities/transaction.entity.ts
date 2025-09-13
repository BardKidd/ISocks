import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Position } from './position.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  positionId: string;

  @ManyToOne(() => Position, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({
    type: 'enum',
    enum: ['BUY', 'SELL'],
  })
  type: 'BUY' | 'SELL';

  @Column({ type: 'decimal', precision: 20, scale: 5 })
  quantity: number; // 交易股數

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  price: number; // 交易價格

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number; // 交易金額

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  commission: number; // 手續費

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  tax: number; // 交易稅

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  otherFees: number; // 其他費用

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number; // 總成本 (包含所有費用)

  @Column({ type: 'date' })
  tradeDate: Date; // 交易日期

  @Column({ type: 'text', nullable: true })
  notes: string; // 交易備註

  @CreateDateColumn()
  createdAt: Date; // 記錄建立時間
}
