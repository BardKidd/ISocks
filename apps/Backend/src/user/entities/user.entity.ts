import { Exclude } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Portfolio } from '@/portfolio/entities/portfolio.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false }) // 預設查詢時不會返回密碼
  @Exclude()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 50, nullable: true })
  firstName: string;

  @Column({ length: 50, nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 10, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  })
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';

  @Column({ length: 3, default: 'USD' })
  preferredCurrency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPortfolioValue: number;

  @Column({})
  totalInvestment: number;

  totalReturn: number;

  returnPercentage: number;

  isActive: boolean;

  isEmailVerified: boolean;

  refreshToken: string;

  // 使用 () => Portfolio 可以避免在檔案載入時，因為 User 和 Portfolio 互相引用造成循環依賴的問題。
  // 參數一用於關聯 Portfolio，第二個參數用來告訴 portfolio.user 欄位需要關聯到這個人。
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
