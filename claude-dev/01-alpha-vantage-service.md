# Alpha Vantage API 服務類別設計

## 📋 概述
建立一個完整的 Alpha Vantage API 服務類別，用於整合股票數據 API。此服務將提供股票搜尋、歷史價格查詢、和即時價格查詢功能。

## 🎯 設計目標
1. **封裝 Alpha Vantage API 呼叫**
2. **提供型別安全的 TypeScript 介面**
3. **統一錯誤處理機制**
4. **實作基本的請求限制和重試機制**

## 📦 依賴套件
需要安裝的 npm 套件：
```bash
# 在 Backend 目錄執行
cd apps/Backend
pnpm install axios @nestjs/axios
```

### 🎯 **技術決定說明**
經過討論，我們決定使用 `@nestjs/axios + firstValueFrom` 而非原生 axios：

**理由**：
- ✅ **NestJS 最佳實踐**: 符合 NestJS 生態系統標準
- ✅ **專案一致性**: 與其他 NestJS 服務保持一致
- ✅ **依賴注入**: 符合 NestJS 的設計哲學
- ✅ **未來擴展**: 便於添加攔截器、中間件等功能
- ✅ **測試友善**: NestJS 提供更好的測試工具

**RxJS 學習成本**：
對於此專案，只需學會一個語法：
```typescript
const response = await firstValueFrom(this.httpService.get(url));
```

## 🏗️ 檔案結構
```
apps/Backend/src/
├── stock/
│   ├── services/
│   │   └── alpha-vantage.service.ts
│   ├── interfaces/
│   │   ├── alpha-vantage.interface.ts
│   │   └── stock.interface.ts
│   └── dto/
│       ├── stock-search.dto.ts
│       └── stock-price.dto.ts
```

## 💡 實作內容

### 1. Alpha Vantage 回應介面定義
檔案：`apps/Backend/src/stock/interfaces/alpha-vantage.interface.ts`

```typescript
/**
 * Alpha Vantage API 回應介面定義
 */

// 股票搜尋回應
export interface AlphaVantageSearchResponse {
  bestMatches: Array<{
    '1. symbol': string;
    '2. name': string;
    '3. type': string;
    '4. region': string;
    '5. marketOpen': string;
    '6. marketClose': string;
    '7. timezone': string;
    '8. currency': string;
    '9. matchScore': string;
  }>;
}

// 每日時間序列回應
export interface AlphaVantageDailyResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Output Size': string;
    '5. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

// 即時報價回應
export interface AlphaVantageQuoteResponse {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

// API 錯誤回應
export interface AlphaVantageErrorResponse {
  'Error Message'?: string;
  'Note'?: string;
  'Information'?: string;
}
```

### 2. 股票相關介面定義
檔案：`apps/Backend/src/stock/interfaces/stock.interface.ts`

```typescript
/**
 * 應用程式內部使用的股票相關介面
 */

// 股票搜尋結果
export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
}

// 股票價格資訊
export interface StockPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timezone: string;
}

// 即時股票報價
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  lastTradingDay: string;
}

// API 設定選項
export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
```

### 3. Alpha Vantage API 服務實作
檔案：`apps/Backend/src/stock/services/alpha-vantage.service.ts`

```typescript
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { 
  AlphaVantageSearchResponse, 
  AlphaVantageDailyResponse, 
  AlphaVantageQuoteResponse,
  AlphaVantageErrorResponse 
} from '../interfaces/alpha-vantage.interface';
import { 
  StockSearchResult, 
  StockPrice, 
  StockQuote, 
  AlphaVantageConfig 
} from '../interfaces/stock.interface';

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly config: AlphaVantageConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.config = {
      apiKey: this.configService.get<string>('ALPHA_VANTAGE_API_KEY'),
      baseUrl: 'https://www.alphavantage.co/query',
      timeout: 10000, // 10秒超時
      retryAttempts: 3,
      retryDelay: 1000, // 1秒重試延遲
    };

    if (!this.config.apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }
  }

  /**
   * 搜尋股票 - 支援公司名稱或股票代碼
   * @param query 搜尋關鍵字
   * @returns 股票搜尋結果陣列
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      this.logger.log(\`Searching stocks with query: \${query}\`);

      const url = this.buildUrl('SYMBOL_SEARCH', { keywords: query });
      const response = await this.makeRequest<AlphaVantageSearchResponse>(url);

      // 檢查是否有錯誤
      this.checkForErrors(response.data);

      // 轉換 Alpha Vantage 格式到內部格式
      const results: StockSearchResult[] = response.data.bestMatches?.map(match => ({
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

      this.logger.log(\`Found \${results.length} stocks for query: \${query}\`);
      return results;

    } catch (error) {
      this.logger.error(\`Error searching stocks: \${error.message}\`, error.stack);
      throw new HttpException(
        'Failed to search stocks',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 取得特定日期的股票價格
   * @param symbol 股票代碼
   * @param date 日期 (YYYY-MM-DD)
   * @returns 股票價格資訊
   */
  async getStockPrice(symbol: string, date: string): Promise<StockPrice | null> {
    try {
      this.logger.log(\`Getting stock price for \${symbol} on \${date}\`);

      const url = this.buildUrl('TIME_SERIES_DAILY', { 
        symbol: symbol.toUpperCase(),
        outputsize: 'compact' // 取得最近100天的數據
      });
      
      const response = await this.makeRequest<AlphaVantageDailyResponse>(url);
      
      // 檢查是否有錯誤
      this.checkForErrors(response.data);

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No time series data found');
      }

      // 尋找指定日期的數據，如果沒有則找最近的交易日
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
        volume: parseFloat(priceData['5. volume']),
        timezone: timezone,
      };

      this.logger.log(\`Found price for \${symbol} on \${targetDate}: \$\${result.close}\`);
      return result;

    } catch (error) {
      this.logger.error(\`Error getting stock price: \${error.message}\`, error.stack);
      throw new HttpException(
        'Failed to get stock price',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 取得即時股票報價
   * @param symbol 股票代碼
   * @returns 即時報價資訊
   */
  async getCurrentQuote(symbol: string): Promise<StockQuote> {
    try {
      this.logger.log(\`Getting current quote for \${symbol}\`);

      const url = this.buildUrl('GLOBAL_QUOTE', { symbol: symbol.toUpperCase() });
      const response = await this.makeRequest<AlphaVantageQuoteResponse>(url);

      // 檢查是否有錯誤
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

      this.logger.log(\`Current quote for \${symbol}: \$\${result.currentPrice}\`);
      return result;

    } catch (error) {
      this.logger.error(\`Error getting current quote: \${error.message}\`, error.stack);
      throw new HttpException(
        'Failed to get current quote',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 建構 API URL
   * @param func API 功能
   * @param params 參數
   * @returns 完整的 URL
   */
  private buildUrl(func: string, params: Record<string, string>): string {
    const urlParams = new URLSearchParams({
      function: func,
      apikey: this.config.apiKey,
      ...params,
    });

    return \`\${this.config.baseUrl}?\${urlParams.toString()}\`;
  }

  /**
   * 發送 HTTP 請求
   * @param url 請求 URL
   * @returns 回應資料
   */
  private async makeRequest<T>(url: string): Promise<AxiosResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, {
            timeout: this.config.timeout,
          })
        );

        return response;

      } catch (error) {
        lastError = error;
        this.logger.warn(\`API request attempt \${attempt} failed: \${error.message}\`);
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * 檢查 API 回應是否包含錯誤
   * @param data API 回應資料
   */
  private checkForErrors(data: any): void {
    const errorResponse = data as AlphaVantageErrorResponse;
    
    if (errorResponse['Error Message']) {
      throw new Error(\`Alpha Vantage API Error: \${errorResponse['Error Message']}\`);
    }
    
    if (errorResponse['Note']) {
      throw new Error(\`Alpha Vantage API Note: \${errorResponse['Note']}\`);
    }
    
    if (errorResponse['Information']) {
      throw new Error(\`Alpha Vantage API Info: \${errorResponse['Information']}\`);
    }
  }

  /**
   * 尋找最接近指定日期的交易日
   * @param timeSeries 時間序列資料
   * @param targetDate 目標日期
   * @returns 最接近的交易日，若沒有找到則返回 null
   */
  private findClosestTradingDate(
    timeSeries: Record<string, any>, 
    targetDate: string
  ): string | null {
    const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a)); // 降序排列
    
    // 如果指定日期存在，直接返回
    if (timeSeries[targetDate]) {
      return targetDate;
    }

    // 尋找最接近且不超過目標日期的交易日
    const target = new Date(targetDate);
    for (const date of dates) {
      if (new Date(date) <= target) {
        return date;
      }
    }

    return null;
  }

  /**
   * 延遲執行
   * @param ms 延遲毫秒數
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 🔧 使用方式

### 在 Module 中註冊服務
```typescript
// stock.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AlphaVantageService } from './services/alpha-vantage.service';

@Module({
  imports: [HttpModule],
  providers: [AlphaVantageService],
  exports: [AlphaVantageService],
})
export class StockModule {}
```

### 在其他服務中使用
```typescript
// 範例：在 Controller 或其他 Service 中使用
constructor(private readonly alphaVantageService: AlphaVantageService) {}

// 搜尋股票
const results = await this.alphaVantageService.searchStocks('AAPL');

// 取得歷史價格
const price = await this.alphaVantageService.getStockPrice('AAPL', '2024-01-15');

// 取得即時報價
const quote = await this.alphaVantageService.getCurrentQuote('AAPL');
```

## ⚠️ 注意事項

1. **API 限制**: Alpha Vantage 免費版有請求頻率限制 (每分鐘 5 次)
2. **錯誤處理**: 已包含完整的錯誤處理和重試機制
3. **型別安全**: 所有方法都有完整的 TypeScript 型別定義
4. **日誌記錄**: 重要操作都會記錄在日誌中
5. **環境變數**: 確保 `ALPHA_VANTAGE_API_KEY` 已正確設定

## 🧪 測試建議

建議建立單元測試來測試：
- API 呼叫成功的情況
- API 呼叫失敗的重試機制
- 錯誤回應的處理
- 數據格式轉換的正確性

## 📈 下一步

完成此服務類別後，可以繼續：
1. 建立 Stock Controller 來提供 REST API 端點
2. 實作快取機制來優化 API 呼叫
3. 建立單元測試和整合測試