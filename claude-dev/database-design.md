# IStocks Phase 2: Database Schema & Entity Design

## 📋 Overview
This document details the core database schema for Phase 2 of the IStocks project, including the four main entities and their relationships. This design is fundamental to the portfolio management functionality.

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────┐    1:N    ┌─────────────────┐    1:N    ┌─────────────────┐    1:N    ┌─────────────────┐
│      User       │ ────────▶ │   Portfolio     │ ────────▶ │    Position     │ ────────▶ │   Transaction   │
│ (使用者)        │           │ (投資組合)      │           │ (持倉)          │           │ (交易紀錄)      │
├─────────────────┤           ├─────────────────┤           ├─────────────────┤           ├─────────────────┤
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
```

### Relationship Explanation

*   **User ↔ Portfolio**: A user can have multiple portfolios (e.g., one for long-term investment, one for short-term trading). This is a one-to-many (1:N) relationship.
*   **Portfolio ↔ Position**: A portfolio can contain multiple different stock positions (e.g., positions in AAPL, TSLA, NVDA). This is a one-to-many (1:N) relationship.
*   **Position ↔ Transaction**: A position can consist of multiple transaction histories (e.g., multiple buys and sells of the same stock). This is a one-to-many (1:N) relationship.

### Deletion Strategy (CASCADE)

We have set the `onDelete: 'CASCADE'` strategy, which means:
*   When a `User` is deleted, all associated `Portfolio`s are also automatically deleted.
*   When a `Portfolio` is deleted, all associated `Position`s are also automatically deleted.
*   When a `Position` is deleted, all associated `Transaction`s are also automatically deleted.

This ensures data integrity and consistency, preventing orphaned records.

## 💡 TypeORM Relationship Decorator Details

#### 1. **`@OneToMany`**
*   **Purpose**: Defines the relationship on the "one" side, indicating that one entity can be associated with multiple other entities.
*   **Example**: Used in the `User` entity.
    ```typescript
    // In User entity
    @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
    portfolios: Portfolio[];
    ```
*   **Explanation**:
    *   `() => Portfolio`: Specifies that the target entity of the relation is `Portfolio`.
    *   `(portfolio) => portfolio.user`: This is an inverse relation definition, pointing to the `user` property in the `Portfolio` entity, which uses `@ManyToOne` to define the other side of the relationship.

#### 2. **`@ManyToOne`**
*   **Purpose**: Defines the relationship on the "many" side, indicating that multiple entities can be associated with one other entity. This is the side that holds the "foreign key".
*   **Example**: Used in the `Portfolio` entity.
    ```typescript
    // In Portfolio entity
    @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
    ```
*   **Explanation**:
    *   `() => User`: Specifies that the target entity of the relation is `User`.
    *   `(user) => user.portfolios`: The inverse relation, pointing to the `portfolios` property in the `User` entity.
    *   `{ onDelete: 'CASCADE' }`: Sets the cascade delete strategy.
    *   `@JoinColumn({ name: 'userId' })`: Explicitly specifies that a foreign key column named `userId` should be created in the `portfolios` table.

#### 3. **`@Column({ type: 'decimal' })` (Precision Numeric Type)**
*   **Purpose**: Used to store numbers that require high precision, especially financial amounts, effectively avoiding the precision issues of the standard JavaScript `number` type (floating-point).
*   **Example**:
    ```typescript
    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalPortfolioValue: number;
    ```
*   **Explanation**:
    *   `type: 'decimal'`: Specifies the database column type as `DECIMAL`.
    *   `precision: 15`: The total number of digits (integer part + decimal part) is 15.
    *   `scale: 2`: The number of digits after the decimal point is 2.
    *   **Result**: This field can store a maximum value of `999,999,999,999.99` (13 integer digits + 2 decimal digits), which is sufficient for most financial scenarios.

---

## 🏛️ Four Core Entity Structures

### 1. **User Entity (Enhanced)**
*   **Path**: `apps/Backend/src/user/entities/user.entity.ts`
*   **Responsibility**: Stores basic user data and investment preferences.
*   **New Fields**: `firstName`, `lastName`, `riskTolerance`, `preferredCurrency`, `totalPortfolioValue`, etc.

### 2. **Portfolio Entity**
*   **Path**: `apps/Backend/src/portfolio/entities/portfolio.entity.ts`
*   **Responsibility**: Represents an independent investment portfolio, such as "My US Stocks" or "Retirement Fund".
*   **Core Fields**: `name`, `description`, `totalValue`, `totalCost`, `userId` (foreign key).

### 3. **Position Entity**
*   **Path**: `apps/Backend/src/portfolio/entities/position.entity.ts`
*   **Responsibility**: Represents a single asset (a stock) held within a portfolio.
*   **Core Fields**: `symbol`, `stockName`, `quantity`, `averageCost`, `currentValue`, `portfolioId` (foreign key).

### 4. **Transaction Entity**
*   **Path**: `apps/Backend/src/portfolio/entities/transaction.entity.ts`
*   **Responsibility**: Records the details of each buy or sell operation.
*   **Core Fields**: `type` ('BUY'/'SELL'), `quantity`, `price`, `tradeDate`, `positionId` (foreign key).
