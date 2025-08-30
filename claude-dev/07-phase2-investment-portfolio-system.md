# Phase 2: 投資組合系統設計 - 基於現有認證系統擴展

## 📋 現有系統分析

### ✅ 已有的認證功能

```typescript
// 現有 User Entity
export class User {
  id: string;           // UUID
  name: string;         // 用戶姓名
  email: string;        // 電子信箱 (unique)
  password: string;     // bcrypt 加密密碼
  createdAt: Date;      // 註冊時間
}

// 現有 Auth 功能
- POST /auth/login     - 登入取得 JWT token
- POST /auth/register  - 用戶註冊
- JWT payload: { sub: user.id, email: user.email }
```

## 🎯 Phase 2 增強設計

### 📊 資料庫關聯架構圖

```
┌─────────────────┐    1:N    ┌─────────────────┐    1:N    ┌─────────────────┐    1:N    ┌─────────────────┐
│      User       │ ────────▶ │   Portfolio     │ ────────▶ │    Position     │ ────────▶ │   Transaction   │
│                 │           │                 │           │                 │           │                 │
│ • id (UUID)     │           │ • id (UUID)     │           │ • id (UUID)     │           │ • id (UUID)     │
│ • name          │           │ • name          │           │ • symbol        │           │ • type (BUY/SELL)│
│ • email         │           │ • description   │           │ • stockName     │           │ • quantity      │
│ • password      │           │ • totalValue    │           │ • quantity      │           │ • price         │
│ • firstName     │           │ • totalCost     │           │ • averageCost   │           │ • commission    │
│ • lastName      │           │ • totalReturn   │           │ • totalCost     │           │ • tax           │
│ • riskTolerance │           │ • currency      │           │ • currentPrice  │           │ • totalCost     │
│ • preferredCurr │           │ • isActive      │           │ • currentValue  │           │ • tradeDate     │
│ • totalPortVal  │           │ • userId (FK)   │           │ • unrealizedRet │           │ • positionId (FK)│
│ • isActive      │           │ • createdAt     │           │ • portfolioId(FK)│           │ • createdAt     │
│ • createdAt     │           │ • updatedAt     │           │ • createdAt     │           │                 │
└─────────────────┘           └─────────────────┘           └─────────────────┘           └─────────────────┘

關聯說明：
• User ↔ Portfolio: 一個用戶可以建立多個投資組合 (如：長期投資、短線交易)
• Portfolio ↔ Position: 一個投資組合包含多個股票持倉
• Position ↔ Transaction: 一個持倉包含多筆交易記錄 (買入/賣出歷史)

CASCADE 刪除策略：
User 刪除 → 自動刪除所有 Portfolio → 自動刪除所有 Position → 自動刪除所有 Transaction
```

### 💡 TypeORM 關聯詳解

#### **一對多關聯 (@OneToMany)**

```typescript
// 在 User entity 中
@OneToMany(() => Portfolio, (portfolio) => portfolio.user)
portfolios: Portfolio[];

// 意思：一個 User 擁有多個 Portfolio
// 效果：可以使用 user.portfolios 存取所有投資組合
```

#### **多對一關聯 (@ManyToOne)**

```typescript
// 在 Portfolio entity 中
@ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'userId' })
user: User;

// 意思：多個 Portfolio 屬於一個 User
// CASCADE：當 User 被刪除時，相關 Portfolio 也會自動刪除
// JoinColumn：在資料庫建立 userId 外鍵欄位
```

#### **DECIMAL 精度設定**

```typescript
@Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
totalPortfolioValue: number;

// precision: 15 → 總共 15 位數字
// scale: 2 → 小數點後 2 位
// 範例：999,999,999,999.99 (13位整數 + 2位小數)
// 用於金錢計算，避免浮點數精度問題
```

### 1. **增強 User Entity - 投資者個人資料**

```typescript
// apps/Backend/src/user/entities/user.entity.ts (增強版)
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Portfolio } from '../../portfolio/entities/portfolio.entity';

@Entity('users')
export class User {
  // === 現有欄位 ===
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

  @Column({ length: 10, nullable: true })
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

### 2. **投資組合 Portfolio Entity**

```typescript
// apps/Backend/src/portfolio/entities/portfolio.entity.ts
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

  // 關聯到用戶
  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // 投資組合統計 (快取欄位，定期更新)
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

  // 投資組合設定
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 關聯到持倉
  @OneToMany(() => Position, (position) => position.portfolio)
  positions: Position[];
}
```

### 3. **持倉明細 Position Entity**

```typescript
// apps/Backend/src/portfolio/entities/position.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 股票資訊
  @Column({ length: 20 })
  symbol: string; // 股票代碼，如 "AAPL", "TSM"

  @Column({ length: 200 })
  stockName: string; // 股票名稱，如 "Apple Inc."

  @Column({ length: 50, default: 'US' })
  market: string; // 市場，如 "US", "TW"

  // 關聯到投資組合
  @Column('uuid')
  portfolioId: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  // 交易資訊
  @Column({ type: 'int' })
  quantity: number; // 持有股數

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  averageCost: number; // 平均成本

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number; // 總成本

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fees: number; // 手續費和其他費用

  // 當前市價資訊 (快取，定期更新)
  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  currentPrice: number; // 當前股價

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number; // 當前總價值

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unrealizedReturn: number; // 未實現收益

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  returnPercentage: number; // 收益率

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  dayChange: number; // 當日股價變動

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  dayChangePercent: number; // 當日變動百分比

  // 時間戳記
  @CreateDateColumn()
  createdAt: Date; // 建立持倉的時間

  @UpdateDateColumn()
  updatedAt: Date; // 最後更新價格的時間

  @Column({ type: 'datetime', nullable: true })
  priceUpdatedAt: Date; // 價格最後更新時間
}
```

### 4. **交易記錄 Transaction Entity**

```typescript
// apps/Backend/src/portfolio/entities/transaction.entity.ts
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

  // 關聯到持倉
  @Column('uuid')
  positionId: string;

  @ManyToOne(() => Position, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  // 交易詳情
  @Column({
    type: 'enum',
    enum: ['BUY', 'SELL'],
  })
  type: 'BUY' | 'SELL';

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  quantity: number; // 交易股數 (支援碎股)

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
```

### 5. **增強的 JWT Token 結構**

```typescript
// JWT Payload 增強版
interface JWTPayload {
  sub: string;              // user.id
  email: string;            // user.email
  name: string;             // user.name
  firstName?: string;       // user.firstName
  lastName?: string;        // user.lastName
  riskTolerance: string;    // user.riskTolerance
  preferredCurrency: string; // user.preferredCurrency
  isEmailVerified: boolean; // user.isEmailVerified
  totalPortfolioValue: number; // user.totalPortfolioValue
  iat: number;              // issued at
  exp: number;              // expires at
}

// Auth Service 更新
async signIn(email: string, password: string) {
  const user = await this.userService.findUserForAuth(email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedException('帳號或密碼錯誤');
  }

  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    riskTolerance: user.riskTolerance,
    preferredCurrency: user.preferredCurrency,
    isEmailVerified: user.isEmailVerified,
    totalPortfolioValue: user.totalPortfolioValue,
  };

  const tokens = await this.generateTokens(payload);

  return {
    user: { ...user, password: undefined },
    ...tokens,
  };
}
```

### 6. **DTO 設計**

```typescript
// 建立持倉 DTO
export class CreatePositionDto {
  @IsString()
  symbol: string;

  @IsString()
  stockName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherFees?: number;

  @IsDateString()
  tradeDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

// 更新持倉 DTO
export class UpdatePositionDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageCost?: number;
}

// 投資組合 DTO
export class CreatePortfolioDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string = 'USD';
}
```

## 🎯 API 端點規劃

### Portfolio Management

```typescript
// Portfolio routes
POST   /api/portfolios              // 建立投資組合
GET    /api/portfolios              // 取得用戶所有投資組合
GET    /api/portfolios/:id          // 取得特定投資組合詳情
PUT    /api/portfolios/:id          // 更新投資組合
DELETE /api/portfolios/:id          // 刪除投資組合

// Position routes
POST   /api/portfolios/:id/positions     // 在投資組合中新增持倉
GET    /api/portfolios/:id/positions     // 取得投資組合所有持倉
GET    /api/positions/:id               // 取得特定持倉詳情
PUT    /api/positions/:id               // 更新持倉
DELETE /api/positions/:id              // 刪除持倉

// Transaction routes
POST   /api/positions/:id/transactions  // 新增交易記錄
GET    /api/positions/:id/transactions  // 取得持倉交易記錄
GET    /api/transactions/:id           // 取得特定交易記錄

// Analytics routes
GET    /api/portfolios/:id/performance  // 投資組合績效分析
GET    /api/portfolios/:id/summary      // 投資組合總覽
GET    /api/users/dashboard             // 用戶投資總覽
```

## 🔧 核心功能邏輯

### 平均成本計算

```typescript
// 當新增交易時自動計算平均成本
async addTransaction(positionId: string, transaction: CreateTransactionDto) {
  const position = await this.positionRepository.findOne({
    where: { id: positionId },
    relations: ['transactions']
  });

  if (transaction.type === 'BUY') {
    const newTotalQuantity = position.quantity + transaction.quantity;
    const newTotalCost = position.totalCost + transaction.totalCost;
    const newAverageCost = newTotalCost / newTotalQuantity;

    await this.positionRepository.update(positionId, {
      quantity: newTotalQuantity,
      totalCost: newTotalCost,
      averageCost: newAverageCost,
    });
  }
  // SELL 邏輯...
}
```

### 即時價格更新服務

```typescript
// 定期更新持倉當前價格
@Cron('0 */5 * * * *') // 每5分鐘更新一次
async updatePositionPrices() {
  const activePositions = await this.positionRepository.find({
    where: { portfolio: { isActive: true } }
  });

  for (const position of activePositions) {
    const currentPrice = await this.alphaVantageService.getCurrentQuote(position.symbol);

    await this.positionRepository.update(position.id, {
      currentPrice: currentPrice.currentPrice,
      currentValue: position.quantity * currentPrice.currentPrice,
      unrealizedReturn: (position.quantity * currentPrice.currentPrice) - position.totalCost,
      returnPercentage: ((position.quantity * currentPrice.currentPrice) - position.totalCost) / position.totalCost * 100,
      dayChange: currentPrice.change,
      dayChangePercent: currentPrice.changePercent,
      priceUpdatedAt: new Date(),
    });
  }
}
```

## 🎯 下一步實作順序

1. **Migration 建立資料表** - Portfolio, Position, Transaction
2. **增強 User Entity** - 新增投資相關欄位
3. **建立 Portfolio Module** - Service, Controller, DTOs
4. **增強 Auth Service** - 更豐富的 JWT payload
5. **實作核心功能** - CRUD 操作和計算邏輯
6. **價格更新服務** - 定期同步股價
7. **測試覆蓋** - 完整的單元和整合測試

準備開始實作哪個部分？
