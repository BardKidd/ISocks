# 完整測試覆蓋率實作 - TODO 5.1 & 5.2

## 📋 概述

實作 IStocks 專案的完整測試覆蓋率，確保 Redis 快取機制和股票 API 系統的穩定性與可靠性。

## 🎯 測試目標

### 1. **單元測試 (Unit Tests)**

- Cache Service 測試
- Alpha Vantage Service 測試
- 模擬外部依賴 (Mock Redis, HTTP calls)

### 2. **整合測試 (Integration Tests)**

- API 端點測試
- 完整請求/回應週期測試
- 資料庫和快取整合測試

### 3. **效能測試 (Performance Tests)**

- 快取命中/未命中效能
- API 回應時間測試
- 並發請求處理測試

### 4. **錯誤處理測試 (Error Handling Tests)**

- Redis 連線失敗處理
- Alpha Vantage API 錯誤處理
- 網路異常處理

## 🏗️ 測試架構

### **測試技術棧**

- **測試框架**: Jest (NestJS 預設)
- **測試工具**: @nestjs/testing
- **Mock 工具**: jest.mock, @golevelup/ts-jest
- **測試資料庫**: SQLite (記憶體模式)
- **Mock Redis**: ioredis-mock

### **測試檔案結構**

```
apps/Backend/
├── src/
│   ├── cache/
│   │   ├── __tests__/
│   │   │   ├── cache.service.spec.ts
│   │   │   └── redis-cache.service.spec.ts
│   │   └── cache.module.ts
│   ├── stock/
│   │   ├── __tests__/
│   │   │   ├── alpha-vantage.service.spec.ts
│   │   │   └── stock.controller.spec.ts
│   │   └── services/
│   └── test/
│       ├── __mocks__/
│       │   ├── redis.mock.ts
│       │   └── alpha-vantage.mock.ts
│       ├── helpers/
│       │   └── test-utils.ts
│       └── integration/
│           ├── stock-api.e2e.spec.ts
│           └── cache-performance.e2e.spec.ts
└── package.json
```

## 💡 實作內容

### 1. **安裝測試依賴**

```bash
cd apps/Backend
pnpm install -D @golevelup/ts-jest ioredis-mock @types/ioredis-mock supertest @types/supertest
```

**新增的依賴說明**:

- `@golevelup/ts-jest`: 進階 Jest Mock 工具
- `ioredis-mock`: Redis Mock 工具
- `@types/ioredis-mock`: ioredis-mock 的 TypeScript 類型定義
- `supertest`: HTTP 端點測試
- `@types/supertest`: SuperTest 型別定義

### 2. **Jest 配置更新**

**修改檔案**: `apps/Backend/jest.config.js`

```javascript
module.exports = {
  // === 基本配置 (現有配置保持不變) ===
  moduleFileExtensions: ['js', 'json', 'ts'], // 支援的檔案副檔名
  rootDir: 'src', // 測試根目錄
  testRegex: '.*\\.spec\\.ts$', // 測試檔案命名規則 (*.spec.ts)
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest', // TypeScript 編譯器設定
  },

  // === 測試覆蓋率設定 ===
  collectCoverageFrom: [
    '**/*.(t|j)s', // 包含所有 TypeScript/JavaScript 檔案
    '!**/*.spec.ts', // 排除測試檔案本身
    '!**/*.interface.ts', // 排除型別定義檔案
    '!**/node_modules/**', // 排除依賴套件
  ],
  coverageDirectory: '../coverage', // 覆蓋率報告輸出目錄
  testEnvironment: 'node', // 測試環境 (Node.js)

  // === 新增進階配置 ===
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'], // 測試環境初始化檔案 (全域設定、Mock 配置)
  moduleNameMapping: {
    '^src/(.*)$': '<rootDir>/$1', // 路徑別名對應 (支援 src/ 絕對路徑 import)
  },
  coverageThreshold: {
    // 測試覆蓋率門檻設定
    global: {
      branches: 80, // 分支覆蓋率需達 80%
      functions: 80, // 函數覆蓋率需達 80%
      lines: 80, // 程式碼行覆蓋率需達 80%
      statements: 80, // 陳述句覆蓋率需達 80%
    },
  },
  testTimeout: 10000, // 單個測試超時時間 (10 秒)
};
```

### 3. **測試設定檔案**

**新建檔案**: `apps/Backend/src/test/setup.ts`

```typescript
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// 全域測試設定
beforeAll(async () => {
  // 設定測試環境變數
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.ALPHA_VANTAGE_API_KEY = 'TEST_API_KEY';
});

// 全域清理
afterAll(async () => {
  // 清理測試環境
});

// Mock ConfigService
export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      REDIS_URL: 'redis://localhost:6379',
      ALPHA_VANTAGE_API_KEY: 'TEST_API_KEY',
    };
    return config[key] || defaultValue;
  }),
};
```

### 4. **Redis Mock 設定**

**新建檔案**: `apps/Backend/src/test/__mocks__/redis.mock.ts`

```typescript
import Redis from 'ioredis-mock';

export class MockRedisService {
  private redis = new Redis();
  private connected = true;

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    return this.redis.get(key);
  }

  async setEx(key: string, ttl: number, value: string): Promise<'OK'> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.redis.setex(key, ttl, value);
  }

  async del(key: string): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.expire(key, ttl);
  }

  async flushDb(): Promise<'OK'> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.redis.flushdb();
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async quit(): Promise<'OK'> {
    this.connected = false;
    return 'OK';
  }

  // 測試用方法
  setConnectionStatus(status: boolean): void {
    this.connected = status;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
```

### 5. **Alpha Vantage Mock 資料**

**新建檔案**: `apps/Backend/src/test/__mocks__/alpha-vantage.mock.ts`

```typescript
export const mockSearchResponse = {
  bestMatches: [
    {
      '1. symbol': 'AAPL',
      '2. name': 'Apple Inc.',
      '3. type': 'Equity',
      '4. region': 'United States',
      '5. marketOpen': '09:30',
      '6. marketClose': '16:00',
      '7. timezone': 'UTC-04',
      '8. currency': 'USD',
      '9. matchScore': '1.0000',
    },
    {
      '1. symbol': 'APPL',
      '2. name': 'Appleton Partners Inc.',
      '3. type': 'Equity',
      '4. region': 'United States',
      '5. marketOpen': '09:30',
      '6. marketClose': '16:00',
      '7. timezone': 'UTC-04',
      '8. currency': 'USD',
      '9. matchScore': '0.8000',
    },
  ],
};

export const mockDailyResponse = {
  'Meta Data': {
    '1. Information': 'Daily Prices (open, high, low, close) and Volumes',
    '2. Symbol': 'AAPL',
    '3. Last Refreshed': '2024-01-15',
    '4. Output Size': 'Compact',
    '5. Time Zone': 'US/Eastern',
  },
  'Time Series (Daily)': {
    '2024-01-15': {
      '1. open': '185.92',
      '2. high': '186.40',
      '3. low': '183.43',
      '4. close': '185.85',
      '5. volume': '47471600',
    },
    '2024-01-12': {
      '1. open': '187.13',
      '2. high': '189.11',
      '3. low': '185.83',
      '4. close': '186.29',
      '5. volume': '54010000',
    },
  },
};

export const mockQuoteResponse = {
  'Global Quote': {
    '01. symbol': 'AAPL',
    '02. open': '185.92',
    '03. high': '186.40',
    '04. low': '183.43',
    '05. price': '185.85',
    '06. volume': '47471600',
    '07. latest trading day': '2024-01-15',
    '08. previous close': '186.29',
    '09. change': '-0.44',
    '10. change percent': '-0.2362%',
  },
};

export const mockHttpService = {
  get: jest.fn(),
};
```

### 6. **Cache Service 單元測試**

**新建檔案**: `apps/Backend/src/cache/__tests__/redis-cache.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisCacheService } from '../redis-cache.service';
import { MockRedisService } from '../../test/__mocks__/redis.mock';
import { mockConfigService } from '../../test/setup';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => new MockRedisService()),
}));

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let mockRedis: MockRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);

    // 取得 Mock Redis 實例
    mockRedis = (service as any).client;
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('快取基本操作', () => {
    it('應該能設定和取得快取', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };
      const ttl = 3600;

      await service.set(key, value, ttl);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it('應該在 TTL 過期後返回 null', async () => {
      const key = 'test:expire';
      const value = { data: 'expire test' };

      await service.set(key, value, 1); // 1秒過期

      // 模擬時間過期
      jest.advanceTimersByTime(1100);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該能刪除快取', async () => {
      const key = 'test:delete';
      const value = { data: 'delete test' };

      await service.set(key, value, 3600);
      await service.delete(key);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該能檢查快取是否存在', async () => {
      const key = 'test:exists';
      const value = { data: 'exists test' };

      expect(await service.exists(key)).toBe(false);

      await service.set(key, value, 3600);
      expect(await service.exists(key)).toBe(true);
    });
  });

  describe('錯誤處理', () => {
    it('Redis 連線失敗時應該降級處理', async () => {
      // 模擬 Redis 連線中斷
      mockRedis.setConnectionStatus(false);

      const key = 'test:error';
      const value = { data: 'error test' };

      // 設定快取時不應該拋出錯誤
      await expect(service.set(key, value, 3600)).resolves.not.toThrow();

      // 讀取快取時應該返回 null
      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該正確記錄錯誤日誌', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'error');

      // 模擬 Redis 錯誤
      mockRedis.setConnectionStatus(false);

      await service.set('test:log', 'test', 3600);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });

  describe('連線狀態管理', () => {
    it('應該正確回報連線狀態', () => {
      expect(service.isRedisConnected()).toBe(true);

      mockRedis.setConnectionStatus(false);
      expect(service.isRedisConnected()).toBe(false);
    });
  });
});
```

### 7. **Alpha Vantage Service 單元測試**

**新建檔案**: `apps/Backend/src/stock/__tests__/alpha-vantage.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

import { AlphaVantageService } from '../services/alpha-vantage.service';
import { CacheService } from '../../cache/cache.service';
import {
  mockSearchResponse,
  mockDailyResponse,
  mockQuoteResponse,
} from '../../test/__mocks__/alpha-vantage.mock';
import { mockConfigService } from '../../test/setup';

describe('AlphaVantageService', () => {
  let service: AlphaVantageService;
  let httpService: HttpService;
  let cacheService: CacheService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    clear: jest.fn(),
    expire: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlphaVantageService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AlphaVantageService>(AlphaVantageService);
    httpService = module.get<HttpService>(HttpService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchStocks', () => {
    it('應該返回格式化的搜尋結果', async () => {
      const query = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockSearchResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null); // 快取未命中
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchStocks(query);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'Equity',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-04',
        currency: 'USD',
        matchScore: 1.0,
      });

      // 驗證快取設定
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_search:aapl',
        result,
        3600
      );
    });

    it('應該在快取命中時返回快取結果', async () => {
      const query = 'AAPL';
      const cachedResult = [{ symbol: 'AAPL', name: 'Apple Inc.' }];

      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.searchStocks(query);

      expect(result).toEqual(cachedResult);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('應該處理 API 錯誤', async () => {
      const query = 'INVALID';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      await expect(service.searchStocks(query)).rejects.toThrow();
    });
  });

  describe('getStockPrice', () => {
    it('應該返回特定日期的股票價格', async () => {
      const symbol = 'AAPL';
      const date = '2024-01-15';
      const mockResponse: AxiosResponse = {
        data: mockDailyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getStockPrice(symbol, date);

      expect(result).toEqual({
        symbol: 'AAPL',
        date: '2024-01-15',
        open: 185.92,
        high: 186.4,
        low: 183.43,
        close: 185.85,
        volume: 47471600,
        timezone: 'US/Eastern',
      });

      // 驗證快取設定 (24小時)
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_price:AAPL:2024-01-15',
        result,
        86400
      );
    });

    it('應該處理非交易日查詢', async () => {
      const symbol = 'AAPL';
      const date = '2024-01-13'; // 假設是週末
      const mockResponse: AxiosResponse = {
        data: mockDailyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getStockPrice(symbol, date);

      // 應該返回最近的交易日資料
      expect(result?.date).toBe('2024-01-12');
    });
  });

  describe('getCurrentQuote', () => {
    it('應該返回即時報價', async () => {
      const symbol = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCurrentQuote(symbol);

      expect(result).toEqual({
        symbol: 'AAPL',
        currentPrice: 185.85,
        openPrice: 185.92,
        highPrice: 186.4,
        lowPrice: 183.43,
        previousClose: 186.29,
        change: -0.44,
        changePercent: -0.2362,
        volume: 47471600,
        lastTradingDay: '2024-01-15',
      });
    });

    it('應該根據市場狀態使用不同的快取時間', async () => {
      const symbol = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      // Mock 開盤時間
      jest.spyOn(Date, 'now').mockReturnValue(
        new Date('2024-01-15T14:30:00Z').getTime() // 美東 9:30 AM
      );

      await service.getCurrentQuote(symbol);

      // 驗證開盤時間使用短快取 (60秒)
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_current:AAPL',
        expect.any(Object),
        60
      );
    });
  });

  describe('錯誤處理和重試機制', () => {
    it('應該重試失敗的 API 呼叫', async () => {
      const query = 'AAPL';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get
        .mockReturnValueOnce(throwError(() => new Error('Network Error')))
        .mockReturnValueOnce(throwError(() => new Error('Network Error')))
        .mockReturnValueOnce(
          of({
            data: mockSearchResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          })
        );

      const result = await service.searchStocks(query);

      expect(result).toHaveLength(2);
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });

    it('應該在最大重試次數後拋出錯誤', async () => {
      const query = 'AAPL';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Persistent Error'))
      );

      await expect(service.searchStocks(query)).rejects.toThrow();
      expect(mockHttpService.get).toHaveBeenCalledTimes(3); // 原始呼叫 + 2次重試
    });
  });
});
```

### 8. **測試執行指令更新**

**更新檔案**: `apps/Backend/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:unit": "jest --testPathPattern='.*\\.spec\\.ts$'",
    "test:integration": "jest --testPathPattern='.*\\.e2e\\.spec\\.ts$'",
    "test:all": "npm run test:unit && npm run test:integration"
  }
}
```

## 🎯 測試執行指南

### **本地開發測試**
```bash
# 進入後端目錄
cd apps/Backend

# 執行全部測試
pnpm test:all

# 執行單元測試
pnpm test:unit

# 執行整合測試  
pnpm test:integration

# 執行測試覆蓋率
pnpm test:cov

# 監視模式執行測試
pnpm test:watch
```

### **測試檔案結構 (已完成)**
```
apps/Backend/src/
├── cache/
│   └── __tests__/
│       └── redis-cache.service.spec.ts ✅
├── stock/
│   └── __tests__/
│       ├── alpha-vantage.service.spec.ts ✅
│       └── stock.controller.spec.ts ✅
└── test/
    ├── __mocks__/
    │   ├── redis.mock.ts ✅
    │   └── alpha-vantage.mock.ts ✅
    ├── integration/
    │   └── stock-api.e2e.spec.ts ✅
    └── setup.ts ✅
```

### **完成的測試覆蓋範圍**

#### ✅ **單元測試** (已完成)
- **RedisCacheService**: 快取基本操作、TTL 管理、錯誤處理、連線狀態
- **AlphaVantageService**: 股票搜尋、歷史價格、即時報價、重試機制、快取整合
- **StockController**: API 端點邏輯、參數驗證、錯誤處理

#### ✅ **整合測試** (已完成) 
- **Stock API E2E**: 完整 API 端點測試
- **搜尋功能**: 參數驗證、快取行為、效能測試
- **價格查詢**: 歷史價格、即時報價、錯誤處理
- **CORS 和錯誤格式**: API 安全性和一致性

#### ✅ **Mock 服務** (已完成)
- **Redis Mock**: 完整 Redis 行為模擬，包含連線狀態管理
- **Alpha Vantage Mock**: 真實 API 回應格式的完整模擬數據
- **HTTP Service Mock**: RxJS Observable 模擬

## ✅ **測試實作完成檢查清單**

- [x] Jest 配置和測試環境設定 (`jest.config.js`)
- [x] 全域測試設定 (`setup.ts`)
- [x] Mock 服務建立 (`redis.mock.ts`, `alpha-vantage.mock.ts`)
- [x] Redis Cache Service 單元測試 (`redis-cache.service.spec.ts`)
- [x] Alpha Vantage Service 單元測試 (`alpha-vantage.service.spec.ts`)
- [x] Stock Controller 單元測試 (`stock.controller.spec.ts`)
- [x] Stock API 整合測試 (`stock-api.e2e.spec.ts`)
- [x] 測試執行指令設定 (`package.json` scripts)
- [x] 錯誤處理和重試機制測試
- [x] 快取行為和效能測試

## 🚀 **預期測試結果**

執行完整測試套件後，應該達到：
- **單元測試覆蓋率**: 80%+ (branches, functions, lines, statements)
- **整合測試**: 所有 API 端點正常運作
- **快取測試**: Redis 快取機制正確運行
- **錯誤處理**: 所有錯誤場景正確處理
- **效能測試**: API 回應時間在合理範圍內

## 🎉 **Phase 1 完整測試實作完成！**

### **執行測試驗證**
```bash
# 確保所有測試通過
cd apps/Backend
pnpm test:all

# 檢查測試覆蓋率
pnpm test:cov
```

**🎯 TODO 5.1 & 5.2 測試與驗證階段已完成！**

準備進入 **Phase 2: 使用者認證系統開發**！ 🚀
