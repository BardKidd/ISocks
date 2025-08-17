# Redis 快取機制實作 - TODO 3.1

## 📋 概述

實作 TODO 3.1：建立 Redis 快取機制，優化 Alpha Vantage API 呼叫頻率，減少重複請求並提升系統效能。

## 🎯 實作目標

1. **整合 Redis 快取服務** - 設定 Redis 連線和配置
2. **實作智能快取策略** - 針對不同 API 端點設定適當的快取時間
3. **優化 Alpha Vantage 服務** - 加入快取邏輯避免重複 API 呼叫
4. **快取失效管理** - 設定合理的過期時間和更新策略
5. **環境配置管理** - 支援開發/生產環境的不同快取設定

## 🎯 快取策略設計

### 基於 Alpha Vantage API 特性的快取策略

根據現有實作的三個主要功能設計不同快取策略：

#### 1. **股票搜尋 (`searchStocks`)**

- **快取鍵**: `stock_search:{query}`
- **快取時間**: **1小時** (3600秒)
- **理由**: 搜尋結果相對穩定，公司基本資訊不常變動

#### 2. **歷史價格 (`getStockPrice`)**

- **快取鍵**: `stock_price:{symbol}:{date}`
- **快取時間**: **24小時** (86400秒)
- **理由**: 歷史價格不會變更，可長時間快取

#### 3. **即時價格 (`getCurrentQuote`)**

- **快取鍵**: `stock_current:{symbol}`
- **動態快取時間**:
  - 開盤時間: **1分鐘** (60秒) - 需要較新的價格資訊
  - 收盤時間: **15分鐘** (900秒) - 配合 Alpha Vantage 延遲時間
- **理由**: 根據市場狀態調整快取，開盤時需要更頻繁更新

## 🏗️ 需要修改的檔案

```
apps/Backend/
├── package.json                      # 新增 Redis 相關依賴
├── src/
│   ├── cache/
│   │   ├── cache.module.ts           # 新建 - Redis 快取模組
│   │   ├── cache.service.ts          # 新建 - 快取服務抽象層
│   │   └── redis-cache.service.ts    # 新建 - Redis 實作
│   ├── stock/
│   │   ├── services/
│   │   │   └── alpha-vantage.service.ts # 修改 - 整合快取邏輯
│   │   └── stock.module.ts           # 修改 - 導入快取模組
│   └── app.module.ts                 # 修改 - 全域註冊快取模組
```

## 💡 實作內容

### 1. 安裝 Redis 相關依賴

**修改檔案**: `apps/Backend/package.json`

```bash
# 在 Backend 目錄執行
cd apps/Backend
pnpm install redis @nestjs/cache-manager cache-manager cache-manager-redis-store
```

**新增的依賴說明**:

- `redis`: Redis 客戶端 (最新版本 5.8.0)
- `@nestjs/cache-manager`: NestJS 快取管理器
- `cache-manager`: 快取管理抽象層
- `cache-manager-redis-store`: Redis 快取存儲

**⚠️ Redis 客戶端配置更新 (2024)**:

- 使用最新的 `redis` v5 客戶端
- 配置選項已驗證：`socketTimeout` 取代了舊版的 `commandTimeout`
- 新增效能優化選項：`noDelay`, `keepAlive` 等

### 2. 快取服務抽象介面

**新建檔案**: `apps/Backend/src/cache/cache.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

/**
 * 快取服務抽象介面
 * 提供統一的快取操作介面，方便測試和切換不同快取實作
 */
@Injectable()
export abstract class CacheService {
  /**
   * 設定快取
   * @param key 快取鍵
   * @param value 快取值
   * @param ttl 過期時間 (秒)
   */
  abstract set(key: string, value: any, ttl: number): Promise<void>;

  /**
   * 取得快取
   * @param key 快取鍵
   * @returns 快取值或 null
   */
  abstract get<T>(key: string): Promise<T | null>;

  /**
   * 刪除快取
   * @param key 快取鍵
   */
  abstract delete(key: string): Promise<void>;

  /**
   * 清除所有快取
   */
  abstract clear(): Promise<void>;

  /**
   * 檢查快取是否存在
   * @param key 快取鍵
   */
  abstract exists(key: string): Promise<boolean>;

  /**
   * 設定快取過期時間
   * @param key 快取鍵
   * @param ttl 過期時間 (秒)
   */
  abstract expire(key: string, ttl: number): Promise<void>;
}
```

### 3. Redis 快取服務實作

**新建檔案**: `apps/Backend/src/cache/redis-cache.service.ts`

```typescript
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { CacheService } from './cache.service';

@Injectable()
export class RedisCacheService extends CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 連線
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000, // 10秒連線超時
          socketTimeout: 30000, // 30秒 Socket 閒置超時
          noDelay: true, // 禁用 Nagle 算法，優化延遲
          keepAlive: true, // 保持連線活動
          keepAliveInitialDelay: 5000, // Keep-alive 初始延遲
        },
      });

      // 錯誤處理
      this.client.on('error', (error) => {
        this.logger.error(`Redis 連線錯誤: ${error.message}`, error.stack);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.logger.log('Redis 連線建立成功');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('Redis 連線中斷');
        this.isConnected = false;
      });

      await this.client.connect();
      this.logger.log('Redis 快取服務初始化完成');
    } catch (error) {
      this.logger.error(`Redis 初始化失敗: ${error.message}`, error.stack);
      this.isConnected = false;
    }
  }

  /**
   * 設定快取
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取設定: ${key}`);
        return;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);

      this.logger.debug(`快取已設定: ${key} (TTL: ${ttl}秒)`);
    } catch (error) {
      this.logger.error(`設定快取失敗 [${key}]: ${error.message}`, error.stack);
    }
  }

  /**
   * 取得快取
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取讀取: ${key}`);
        return null;
      }

      const cachedValue = await this.client.get(key);

      if (cachedValue === null) {
        this.logger.debug(`快取未命中: ${key}`);
        return null;
      }

      const parsedValue = JSON.parse(cachedValue);
      this.logger.debug(`快取命中: ${key}`);
      return parsedValue as T;
    } catch (error) {
      this.logger.error(`讀取快取失敗 [${key}]: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 刪除快取
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取刪除: ${key}`);
        return;
      }

      await this.client.del(key);
      this.logger.debug(`快取已刪除: ${key}`);
    } catch (error) {
      this.logger.error(`刪除快取失敗 [${key}]: ${error.message}`, error.stack);
    }
  }

  /**
   * 清除所有快取
   */
  async clear(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis 未連線，跳過快取清除');
        return;
      }

      await this.client.flushDb();
      this.logger.log('所有快取已清除');
    } catch (error) {
      this.logger.error(`清除快取失敗: ${error.message}`, error.stack);
    }
  }

  /**
   * 檢查快取是否存在
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(
        `檢查快取存在失敗 [${key}]: ${error.message}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * 設定快取過期時間
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過設定過期時間: ${key}`);
        return;
      }

      await this.client.expire(key, ttl);
      this.logger.debug(`快取過期時間已設定: ${key} (TTL: ${ttl}秒)`);
    } catch (error) {
      this.logger.error(
        `設定快取過期時間失敗 [${key}]: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 模組銷毀時清理資源
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.logger.log('Redis 連線已關閉');
      }
    } catch (error) {
      this.logger.error(`關閉 Redis 連線失敗: ${error.message}`, error.stack);
    }
  }

  /**
   * 獲取 Redis 連線狀態
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }
}
```

### 4. 快取模組

**新建檔案**: `apps/Backend/src/cache/cache.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global() // 全域模組，所有模組都可以使用
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: CacheService,
      useClass: RedisCacheService,
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
```

### 5. 修改 Alpha Vantage 服務整合快取

**修改檔案**: `apps/Backend/src/stock/services/alpha-vantage.service.ts`

在現有的 AlphaVantageService 中新增快取邏輯：

```typescript
// 在現有的 imports 中新增
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly config: AlphaVantageConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly cacheService: CacheService // 新增快取服務
  ) {
    // ... 現有的構造函數邏輯保持不變
  }

  /**
   * 搜尋股票 - 支援公司名稱或股票代碼 (加入快取)
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const cacheKey = `stock_search:${query.toLowerCase()}`;

    try {
      // 嘗試從快取獲取
      const cachedResults =
        await this.cacheService.get<StockSearchResult[]>(cacheKey);
      if (cachedResults) {
        this.logger.log(`Stock search cache hit: ${query}`);
        return cachedResults;
      }

      this.logger.log(`Searching stocks with query: ${query} (cache miss)`);

      // 呼叫原有的 API 邏輯
      const url = this.buildUrl('SYMBOL_SEARCH', { keywords: query });
      const response = await this.makeRequest<AlphaVantageSearchResponse>(url);

      this.checkForErrors(response.data);

      const results: StockSearchResult[] =
        response.data.bestMatches?.map((match) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          marketOpen: match['5. marketOpen'],
          marketClose: match['6. marketClose'],
          timezone: match['7. timezone'],
          currency: match['8. currency'],
          matchScore: parseFloat(match['9. matchScore']),
        })) || [];

      // 設定快取 (1小時)
      await this.cacheService.set(cacheKey, results, 3600);

      this.logger.log(
        `Found ${results.length} stocks for query: ${query} (cached)`
      );
      return results;
    } catch (error) {
      this.logger.error(
        `Error searching stocks: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to search stocks',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * 取得特定日期的股票價格 (加入快取)
   */
  async getStockPrice(
    symbol: string,
    date: string
  ): Promise<StockPrice | null> {
    const cacheKey = `stock_price:${symbol.toUpperCase()}:${date}`;

    try {
      // 嘗試從快取獲取
      const cachedPrice = await this.cacheService.get<StockPrice>(cacheKey);
      if (cachedPrice) {
        this.logger.log(`Stock price cache hit: ${symbol} on ${date}`);
        return cachedPrice;
      }

      this.logger.log(
        `Getting stock price for ${symbol} on ${date} (cache miss)`
      );

      // 呼叫原有的 API 邏輯
      const url = this.buildUrl('TIME_SERIES_DAILY', {
        symbol: symbol.toUpperCase(),
        outputsize: 'compact',
      });

      const response = await this.makeRequest<AlphaVantageDailyResponse>(url);
      this.checkForErrors(response.data);

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No time series data found');
      }

      const targetDate = this.findClosestTradingDate(timeSeries, date);
      if (!targetDate) {
        return null;
      }

      const priceData = timeSeries[targetDate];
      const metadata = response.data['Meta Data'];
      const timezone = metadata['5. Time Zone'];

      const result: StockPrice = {
        symbol: symbol.toUpperCase(),
        date: targetDate,
        open: parseFloat(priceData['1. open']),
        high: parseFloat(priceData['2. high']),
        low: parseFloat(priceData['3. low']),
        close: parseFloat(priceData['4. close']),
        volume: parseInt(priceData['5. volume']),
        timezone,
      };

      // 設定快取 (24小時)
      await this.cacheService.set(cacheKey, result, 86400);

      this.logger.log(
        `Found price for ${symbol} on ${targetDate}: $${result.close} (cached)`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting stock price: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to get stock price',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * 取得即時股票報價 (加入智能快取)
   */
  async getCurrentQuote(symbol: string): Promise<StockQuote> {
    const cacheKey = `stock_current:${symbol.toUpperCase()}`;

    try {
      // 嘗試從快取獲取
      const cachedQuote = await this.cacheService.get<StockQuote>(cacheKey);
      if (cachedQuote) {
        this.logger.log(`Current quote cache hit: ${symbol}`);
        return cachedQuote;
      }

      this.logger.log(`Getting current quote for ${symbol} (cache miss)`);

      // 呼叫原有的 API 邏輯
      const url = this.buildUrl('GLOBAL_QUOTE', {
        symbol: symbol.toUpperCase(),
      });
      const response = await this.makeRequest<AlphaVantageQuoteResponse>(url);

      this.checkForErrors(response.data);

      const quote = response.data['Global Quote'];
      if (!quote || !quote['01. symbol']) {
        throw new Error('No quote data found');
      }

      const result: StockQuote = {
        symbol: quote['01. symbol'],
        currentPrice: parseFloat(quote['05. price']),
        openPrice: parseFloat(quote['02. open']),
        highPrice: parseFloat(quote['03. high']),
        lowPrice: parseFloat(quote['04. low']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseFloat(quote['06. volume']),
        lastTradingDay: quote['07. latest trading day'],
      };

      // 智能快取策略
      const cacheTtl = this.getCurrentQuoteCacheTtl();
      await this.cacheService.set(cacheKey, result, cacheTtl);

      this.logger.log(
        `Current quote for ${symbol}: $${result.currentPrice} (cached for ${cacheTtl}s)`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting current quote: ${error.message}`,
        error.stack
      );
      throw new HttpException(
        'Failed to get current quote',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  /**
   * 根據市場狀態決定即時報價的快取時間
   * @returns 快取時間 (秒)
   */
  private getCurrentQuoteCacheTtl(): number {
    const now = new Date();
    const currentHour = now.getUTCHours();

    // 美東時間 9:30-16:00 為開盤時間 (UTC: 14:30-21:00)
    const easternHour = (currentHour - 5 + 24) % 24;

    if (easternHour >= 9.5 && easternHour < 16) {
      // 開盤時間: 1分鐘快取
      return 60;
    } else {
      // 收盤時間: 15分鐘快取 (配合 Alpha Vantage 延遲)
      return 900;
    }
  }

  // ... 其他現有方法保持不變
}
```

### 6. 修改 Stock Module 導入快取

**修改檔案**: `apps/Backend/src/stock/stock.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { StockController } from './controllers/stock.controller';
import { CacheModule } from '../cache/cache.module'; // 新增

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    CacheModule, // 新增快取模組
  ],
  controllers: [StockController],
  providers: [AlphaVantageService],
  exports: [AlphaVantageService],
})
export class StockModule {}
```

### 7. 修改主應用模組

**修改檔案**: `apps/Backend/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... 其他現有 imports
import { CacheModule } from './cache/cache.module'; // 新增
import { StockModule } from './stock/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ... 現有的 TypeORM 和其他模組設定
    CacheModule, // 新增快取模組 (全域)
    StockModule,
    // ... 其他模組
  ],
  // ... 其餘設定保持不變
})
export class AppModule {}
```

### 8. 環境變數設定

**新增到**: `apps/Backend/.env`

```env
# Redis 快取設定
REDIS_URL=redis://localhost:6379
# 或指定更詳細的設定
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=your_password
# REDIS_DB=0
```

## 🔧 部署前準備

### 1. 本地開發環境 Redis 安裝

```bash
# macOS (使用 Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu)
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Docker 方式
docker run -d --name redis-cache -p 6379:6379 redis:alpine
```

### 2. Redis 連線測試

```bash
# 測試 Redis 連線
redis-cli ping
# 應該回應: PONG
```

### 3. 使用 Another Redis Desktop Manager (GUI 工具)

**Another Redis Desktop Manager** 是一個優秀的 Redis GUI 管理工具，讓你可以視覺化地管理和監控 Redis 資料。

#### 安裝 Another Redis Desktop Manager (macOS)

**從 GitHub 直接下載**:
1. 訪問 [GitHub Releases](https://github.com/qishibo/AnotherRedisDesktopManager/releases)
2. 下載最新版本的 `.dmg` 檔案
3. 雙擊 `.dmg` 檔案並將應用程式拖拉到 Applications 資料夾
4. 如果遇到 macOS 安全性警告，請前往「系統偏好設定」→「安全性與隱私權」→ 點擊「仍要開啟」

#### 連接本地 Redis

1. **啟動 Another Redis Desktop Manager**

2. **新建連接**:
   - 點擊主畫面的 "New Connection" 按鈕
   - 或點擊左上角的 "+" 圖示

3. **填寫連接資訊**:
   ```
   Name: IStocks Local Redis
   Host: 127.0.0.1
   Port: 6379
   Password: (通常留空，除非您有設定 Redis 密碼)
   Username: (留空，Redis 6.0+ 才需要)
   ```

4. **測試並保存連接**:
   - 點擊 "Test Connection" 按鈕確認連接成功
   - 顯示綠色 "Success" 後，點擊 "OK" 保存連接

#### 快取監控和管理

**查看快取鍵值**:
- 連接成功後，左側會顯示連接名稱，點擊展開可看到資料庫列表
- 點擊 "db0" 展開查看所有快取鍵值
- 您會看到類似這樣的鍵：
  ```
  📄 stock_search:aapl
  📄 stock_price:AAPL:2024-01-15  
  📄 stock_current:AAPL
  ```

**查看快取內容**:
- 點擊任意鍵值，右側面板會顯示詳細內容
- 支援多種格式檢視：Text、JSON、Binary 等
- 可以看到完整的 JSON 格式快取資料
- 右上角會顯示 TTL 剩餘時間

**快取管理操作**:
- **查看 TTL**: 選中鍵值後，右側會顯示剩餘過期時間
- **刪除快取**: 右鍵點擊鍵值選擇 "Delete Key"
- **編輯快取**: 點擊右側的 "Edit" 按鈕修改內容
- **重新整理**: 右鍵點擊資料庫選擇 "Refresh" 或使用快捷鍵

**監控快取使用情況**:
- 右鍵點擊連接名稱選擇 "Server Info" 查看 Redis 狀態
- 監控記憶體使用量、連接數等關鍵指標
- 使用 "Console" 頁籤執行 Redis 命令進行詳細分析

#### 開發除錯技巧

**即時監控 API 呼叫**:
1. 右鍵點擊連接名稱，選擇 "Console"
2. 在命令列輸入 `MONITOR` 並按 Enter
3. 即時查看所有 Redis 操作（包括您的 API 呼叫產生的快取讀寫）
4. 按 Ctrl+C 停止監控

**檢查特定快取**:
在 Console 中執行以下命令：
```redis
# 查看所有股票相關的快取鍵
KEYS stock_*

# 檢查特定快取內容
GET stock_search:aapl

# 查看快取剩餘時間
TTL stock_current:AAPL

# 查看快取是否存在
EXISTS stock_price:AAPL:2024-01-15
```

**清除測試快取**:
```redis
# 清除所有 stock_ 開頭的快取
DEL stock_search:aapl stock_current:AAPL

# 或使用模式刪除（謹慎使用）
EVAL "local keys = redis.call('keys', ARGV[1]) for i=1,#keys,5000 do redis.call('del', unpack(keys, i, math.min(i+4999, #keys))) end return #keys" 0 stock_*

# 清除整個資料庫 (非常謹慎使用)
FLUSHDB
```

## 🧪 快取功能驗證

### 1. 手動測試快取效果

```bash
# 第一次呼叫 (cache miss)
GET /api/stocks/search?query=AAPL
# 日誌應顯示: "Searching stocks with query: AAPL (cache miss)"

# 第二次呼叫 (cache hit)
GET /api/stocks/search?query=AAPL
# 日誌應顯示: "Stock search cache hit: AAPL"
```

### 2. Redis 資料檢查

**方式一: 使用 Redis CLI**

```bash
# 連接 Redis CLI
redis-cli

# 查看所有快取鍵
KEYS *

# 查看特定快取
GET stock_search:aapl
GET stock_price:AAPL:2024-01-15
GET stock_current:AAPL

# 查看快取過期時間
TTL stock_current:AAPL
```

**方式二: 使用 Another Redis Desktop Manager (推薦)**

1. 開啟 Another Redis Desktop Manager
2. 連接到本地 Redis (127.0.0.1:6379)
3. 在左側資料庫樹狀列表中查看所有快取鍵
4. 點擊任意鍵值查看詳細內容和 TTL
5. 可以視覺化地監控快取使用情況

**快取鍵值範例**:

```
📁 db0
  📄 stock_search:aapl
  📄 stock_search:apple
  📄 stock_price:AAPL:2024-01-15
  📄 stock_price:MSFT:2024-01-20
  📄 stock_current:AAPL
  📄 stock_current:TSLA
```

## ✅ 實作檢查清單

### 📝 需要建立的新檔案

- [x] `cache/cache.service.ts` - 快取服務抽象介面 ✅
- [x] `cache/redis-cache.service.ts` - Redis 快取實作 ✅
- [x] `cache/cache.module.ts` - 快取模組定義 ✅

### 🔧 需要修改的現有檔案

- [x] `stock/services/alpha-vantage.service.ts` - 整合快取邏輯 ✅
- [x] `stock/stock.module.ts` - 導入快取模組 ✅
- [x] `app.module.ts` - 註冊全域快取模組 ✅
- [x] `package.json` - 新增 Redis 依賴 ✅
- [x] 修正 TypeScript 型別錯誤 ✅

### 🧪 功能驗證項目

- [x] Redis 服務正常啟動和連線 ✅
- [x] 快取服務成功初始化 ✅
- [ ] 股票搜尋快取生效測試 (1小時)
- [ ] 歷史價格快取生效測試 (24小時)
- [ ] 即時價格智能快取 (開盤1分鐘/收盤15分鐘)
- [ ] 快取命中/未命中日誌正確顯示
- [ ] API 響應時間明顯改善
- [ ] Redis 連線異常時的降級處理

## 🎯 實作重點

### 1. 智能快取策略

- **股票搜尋**: 長時間快取，因為公司基本資訊變動較少
- **歷史價格**: 最長快取，因為歷史資料不會變更
- **即時價格**: 動態快取，根據市場開盤狀態調整頻率

### 2. 錯誤處理和降級

- Redis 連線失敗時自動降級為無快取模式
- 快取操作失敗時不影響主要業務邏輯
- 完整的錯誤日誌記錄

### 3. 效能優化

- 減少對 Alpha Vantage API 的重複呼叫
- 符合 API 頻率限制 (每分鐘5次)
- 改善用戶端回應速度

## ⚠️ 注意事項

1. **Redis 記憶體管理**: 設定適當的記憶體限制和淘汰策略
2. **快取一致性**: 確保快取的資料與實際資料保持同步
3. **環境配置**: 開發、測試、生產環境使用不同的 Redis 實例
4. **監控和日誌**: 監控快取命中率和 Redis 效能指標
5. **資料序列化**: 確保複雜物件正確序列化/反序列化

## 🧪 測試建議

### 單元測試

- 快取服務的 set/get/delete 操作
- Alpha Vantage 服務的快取邏輯
- Redis 連線失敗時的降級行為

### 整合測試

- 端到端的 API 快取流程
- 不同快取策略的驗證
- 快取過期時間的準確性

### 效能測試

- 快取命中時的回應時間
- 快取未命中時的回應時間
- 大量並發請求的快取效能

## 🎯 下一步

完成此快取機制後，可以繼續進行：

- **TODO 5.1**: 建立單元測試覆蓋快取功能
- **TODO 5.2**: 整合測試驗證快取效果
- **效能監控**: 實作快取命中率監控和報表

這個快取機制將大幅提升 IStocks API 的效能和可靠性，同時減少對 Alpha Vantage API 的依賴！
