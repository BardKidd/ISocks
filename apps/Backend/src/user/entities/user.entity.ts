import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  // === 新增投資相關欄位 ===
  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ length: 50, nullable: true })
  firstName: string;

  @Column({ length: 50, nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ length: 20, nullable: true })
  phone: string;

  // 投資偏好設定
  @Column({
    type: 'enum',
    enum: ['conservative', 'moderate', 'aggressive'],
    default: 'moderate',
  })
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';

  @Column({ length: 3, default: 'USD' })
  preferredCurrency: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPortfolioValue: number; // 總投資組合價值 (快取)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalInvestment: number; // 總投入金額 (快取)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalReturn: number; // 總收益 (快取)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  returnPercentage: number; // 總收益率 (快取)

  // 帳戶狀態
  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  // 關聯
  // 使用 () => Portfolio 可以避免在檔案載入時，因為 User 和 Portfolio 互相引用造成循環依賴的問題。
  // 參數一用於關聯 Portfolio，第二個參數用來告訴 portfolio.user 欄位需要關聯到這個人。
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
