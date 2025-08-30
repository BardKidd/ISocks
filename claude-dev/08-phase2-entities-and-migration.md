# Phase 2, Step 1: 建立資料庫實體 (Entities) 與遷移 (Migration)

## 📋 概述

本文件為 IStocks 專案第二階段的第一個實作步驟提供詳細指引。目標是建立投資組合管理功能所需的資料庫基礎。

我們將會：
1.  **擴展 `User` Entity**：新增投資相關的個人資料欄位。
2.  **建立 `Portfolio`, `Position`, `Transaction` Entities**：定義新的資料庫資料表。
3.  **產生並執行資料庫遷移**：將這些變更應用到您的 MySQL 資料庫。

---

## 1. 擴展 User Entity

請使用以下程式碼**完整替換**掉 `apps/Backend/src/user/entities/user.entity.ts` 檔案的現有內容。

**檔案路徑**: `apps/Backend/src/user/entities/user.entity.ts`

```typescript
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
  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
```

---

## 2. 建立新的 Entities

請在 `apps/Backend/src/` 路徑下建立一個新的資料夾 `portfolio`，並在其中建立 `entities` 子資料夾。然後，建立以下三個檔案。

### a. Portfolio Entity

**檔案路徑**: `apps/Backend/src/portfolio/entities/portfolio.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Position } from './position.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string; // 投資組合名稱，如 "長期投資組合", "短線交易"

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

  @Column({ length: 3, default: 'USD' })
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
```

### b. Position Entity

**檔案路徑**: `apps/Backend/src/portfolio/entities/position.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Transaction } from './transaction.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  symbol: string; // 股票代碼，如 "AAPL", "TSM"

  @Column({ length: 200 })
  stockName: string; // 股票名稱，如 "Apple Inc."

  @Column('uuid')
  portfolioId: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  quantity: number; // 持有股數

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  averageCost: number; // 平均成本

  @Column({ type: 'decimal', precision: 20, scale: 8, default: 0 })
  totalCost: number; // 總成本

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.position)
  transactions: Transaction[];
}
```

### c. Transaction Entity

**檔案路徑**: `apps/Backend/src/portfolio/entities/transaction.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Position } from './position.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  positionId: string;

  @ManyToOne(() => Position, (position) => position.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({
    type: 'enum',
    enum: ['BUY', 'SELL'],
  })
  type: 'BUY' | 'SELL';

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  quantity: number; // 交易股數

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number; // 交易價格

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  commission: number; // 手續費

  @Column({ type: 'date' })
  tradeDate: Date; // 交易日期

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## 3. 產生資料庫遷移 (Migration)

在您完成上述所有 Entity 檔案的建立和更新之後，請在終端機中執行以下指令來產生資料庫遷移檔案。

1.  **確保您位於後端專案目錄下**:
    ```bash
    cd apps/Backend
    ```

2.  **執行遷移產生指令**:
    ```bash
    pnpm migration:generate src/migrations/AddPortfolioSystem
    ```
    *   `AddPortfolioSystem` 是這次遷移的名稱，您可以自行更換。
    *   這個指令會比較您目前的 Entity 設計與資料庫的實際狀態，然後在 `src/migrations` 資料夾中自動產生一個新的 `.ts` 檔案，其中包含了所有必要的 `CREATE TABLE` 和 `ALTER TABLE` 的 SQL 指令。

3.  **檢查產生的遷移檔案** (可選但建議)
    *   打開新產生的遷移檔案，檢查其中的 SQL 指令是否符合您的預期。

4.  **執行資料庫遷移**:
    ```bash
    pnpm migration:run
    ```
    *   這個指令會執行所有尚未執行的遷移，將變更實際應用到您的資料庫中。

---

## ✅ 完成後

當您完成以上所有步驟後，請通知我。我將會：
1.  檢查您的實作是否正確。
2.  在 `TODO.md` 中將這些項目標記為完成。
3.  為您準備第二階段的下一個步驟：**更新 Auth Service 和建立 Portfolio 的 CRUD API**。
