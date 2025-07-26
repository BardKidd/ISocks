# Stock Controller 實作 - 股票搜尋 API

## 📋 概述
完成 TODO 1.2：實作股票搜尋 API，建立 REST API 端點讓前端能夠搜尋股票資訊。

## 🎯 實作目標
1. **建立 Stock Module** - 整合 Alpha Vantage 服務
2. **建立 Stock Controller** - 提供 REST API 端點
3. **建立 DTO 類別** - 定義請求和回應格式
4. **API 端點實作** - 支援股票名稱和代碼搜尋

## 🏗️ 檔案結構

```
apps/Backend/src/stock/
├── controllers/
│   └── stock.controller.ts          # 新建
├── dto/
│   ├── stock-search-query.dto.ts    # 新建
│   └── stock-search-response.dto.ts # 新建
├── interfaces/
│   ├── alpha-vantage.interface.ts   # 已存在
│   └── stock.interface.ts           # 已存在
├── services/
│   └── alpha-vantage.service.ts     # 已存在
└── stock.module.ts                  # 新建
```

## 💡 實作內容

### 1. Stock Module 建立

**檔案**: `apps/Backend/src/stock/stock.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { StockController } from './controllers/stock.controller';

@Module({
  imports: [
    HttpModule,
    ConfigModule, // 確保可以注入環境變數
  ],
  controllers: [StockController],
  providers: [AlphaVantageService],
  exports: [AlphaVantageService], // 讓其他模組可以使用
})
export class StockModule {}
```

### 2. 請求 DTO 建立

**檔案**: `apps/Backend/src/stock/dto/stock-search-query.dto.ts`

```typescript
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StockSearchQueryDto {
  @ApiProperty({
    description: '股票搜尋關鍵字 (公司名稱或股票代碼)',
    example: 'AAPL',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: '搜尋關鍵字不能為空' })
  @MinLength(1, { message: '搜尋關鍵字至少需要 1 個字符' })
  @MaxLength(50, { message: '搜尋關鍵字不能超過 50 個字符' })
  @Transform(({ value }) => value?.trim()) // 自動移除前後空白
  query: string;
}
```

### 3. 回應 DTO 建立

**檔案**: `apps/Backend/src/stock/dto/stock-search-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { StockSearchResult } from '../interfaces/stock.interface';

export class StockSearchItemDto {
  @ApiProperty({ description: '股票代碼', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: '公司名稱', example: 'Apple Inc.' })
  name: string;

  @ApiProperty({ description: '證券類型', example: 'Equity' })
  type: string;

  @ApiProperty({ description: '市場區域', example: 'United States' })
  region: string;

  @ApiProperty({ description: '市場開盤時間', example: '09:30' })
  marketOpen: string;

  @ApiProperty({ description: '市場收盤時間', example: '16:00' })
  marketClose: string;

  @ApiProperty({ description: '時區', example: 'US/Eastern' })
  timezone: string;

  @ApiProperty({ description: '貨幣', example: 'USD' })
  currency: string;

  @ApiProperty({ 
    description: '匹配度分數 (0-1)', 
    example: 1.0,
    minimum: 0,
    maximum: 1,
  })
  matchScore: number;
}

export class StockSearchResponseDto {
  @ApiProperty({ 
    description: '搜尋結果陣列', 
    type: [StockSearchItemDto],
    isArray: true,
  })
  results: StockSearchItemDto[];

  @ApiProperty({ description: '結果總數', example: 5 })
  total: number;

  @ApiProperty({ description: '搜尋關鍵字', example: 'AAPL' })
  query: string;

  @ApiProperty({ 
    description: '回應時間戳', 
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;
}
```

### 4. Stock Controller 實作

**檔案**: `apps/Backend/src/stock/controllers/stock.controller.ts`

```typescript
import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AlphaVantageService } from '../services/alpha-vantage.service';
import { StockSearchQueryDto } from '../dto/stock-search-query.dto';
import { 
  StockSearchResponseDto, 
  StockSearchItemDto 
} from '../dto/stock-search-response.dto';

@ApiTags('stocks')
@Controller('api/stocks')
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(
    private readonly alphaVantageService: AlphaVantageService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: '搜尋股票',
    description: '根據公司名稱或股票代碼搜尋股票資訊',
  })
  @ApiQuery({
    name: 'query',
    description: '搜尋關鍵字 (公司名稱或股票代碼)',
    example: 'AAPL',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: '搜尋成功',
    type: StockSearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: '請求參數錯誤',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['搜尋關鍵字不能為空'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: '服務器內部錯誤',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 503 },
        message: { type: 'string', example: 'Failed to search stocks' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchStocks(
    @Query() queryDto: StockSearchQueryDto,
  ): Promise<StockSearchResponseDto> {
    try {
      this.logger.log(\`Stock search request: \${queryDto.query}\`);

      const results = await this.alphaVantageService.searchStocks(queryDto.query);

      // 轉換為 DTO 格式
      const formattedResults: StockSearchItemDto[] = results.map(result => ({
        symbol: result.symbol,
        name: result.name,
        type: result.type,
        region: result.region,
        marketOpen: result.marketOpen,
        marketClose: result.marketClose,
        timezone: result.timezone,
        currency: result.currency,
        matchScore: result.matchScore,
      }));

      const response: StockSearchResponseDto = {
        results: formattedResults,
        total: formattedResults.length,
        query: queryDto.query,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        \`Stock search completed: \${response.total} results for "\${queryDto.query}"\`,
      );

      return response;

    } catch (error) {
      this.logger.error(
        \`Stock search failed: \${error.message}\`,
        error.stack,
      );

      // 如果是業務邏輯錯誤 (HttpException)，保持原始錯誤狀態碼和訊息
      if (error instanceof HttpException) {
        throw error;
      }

      // 其他系統級意外錯誤 (如網路錯誤、程式 bug 等)
      throw new HttpException(
        'Internal server error occurred while searching stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
```

### 5. 在主 App Module 中註冊

**檔案**: `apps/Backend/src/app.module.ts`

需要將 `StockModule` 添加到 imports 中：

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... 其他 imports
import { StockModule } from './stock/stock.module'; // 新增

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      // ... 資料庫設定
    }),
    // ... 其他模組
    StockModule, // 新增
  ],
  // ...
})
export class AppModule {}
```

## 🔧 API 使用範例

### 請求範例

```bash
# 搜尋 Apple 股票
GET /api/stocks/search?query=AAPL

# 搜尋包含 "tech" 的公司
GET /api/stocks/search?query=tech

# 搜尋台積電
GET /api/stocks/search?query=2330.TW
```

### 回應範例

```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "type": "Equity",
      "region": "United States",
      "marketOpen": "09:30",
      "marketClose": "16:00",
      "timezone": "US/Eastern",
      "currency": "USD",
      "matchScore": 1.0
    }
  ],
  "total": 1,
  "query": "AAPL",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## ✅ 實作完成檢查清單

### 🎯 實作狀態檢查 (2024-07-26 更新)

#### ✅ **已完成項目**：

- [x] **建立 Stock Module** - `stock.module.ts` 完整實作
- [x] **建立 Stock Controller** - `stock.controller.ts` 完整實作
- [x] **建立請求 DTO** - `stock-search-query.dto.ts` 完整實作
- [x] **建立回應 DTO** - `stock-search-response.dto.ts` 完整實作
- [x] **API 端點實作** - `GET /api/stocks/search?query={keyword}` 正常運作
- [x] **Swagger 文檔** - 完整的 API 文檔註解和範例
- [x] **錯誤處理** - 業務邏輯錯誤和系統錯誤分層處理
- [x] **數據驗證** - ValidationPipe 和 class-validator 完整實作
- [x] **日誌記錄** - 搜尋請求和錯誤的完整日誌記錄
- [x] **依賴注入** - AppModule 正確導入 StockModule

#### 🧪 **功能驗證**：

- [x] 使用 `GET /api/stocks/search?query=AAPL` 搜尋股票
- [x] 獲得標準化的 JSON 回應格式
- [x] 看到 Swagger 文檔中的 API 端點 (訪問 `/api/docs`)
- [x] 處理無效請求參數的錯誤回應 (400 Bad Request)
- [x] 在日誌中看到搜尋記錄和錯誤訊息
- [x] Alpha Vantage API 整合正常運作
- [x] 支援美股搜尋 (AAPL, TSM, MSFT 等)

#### ⚠️ **已知限制**：

- Alpha Vantage 主要支援美股，台股需使用 ADR 代碼 (如 TSM 代替 2330)
- 免費版 API 每分鐘限制 5 次請求
- 搜尋結果依賴 Alpha Vantage 的數據覆蓋範圍

### 📋 **實作完成度**: 100% ✅

**此階段 (TODO 1.2) 已完全實作完成，可進入下一階段開發！**

## 🧪 測試建議

1. **手動測試**:
   - 使用 Postman 或 curl 測試 API
   - 測試不同的搜尋關鍵字
   - 測試錯誤情況 (空字串、過長字串)

2. **Swagger 測試**:
   - 訪問 `/api/docs` 查看 Swagger 文檔
   - 直接在 Swagger UI 中測試 API

## 🎯 下一步

完成此實作後，股票搜尋功能就完整了，可以繼續進行：
- TODO 2.1: 歷史價格查詢 API
- TODO 2.2: 即時價格查詢 API

## ⚠️ 注意事項

1. **環境變數**: 確保 `ALPHA_VANTAGE_API_KEY` 已正確設定
2. **API 限制**: Alpha Vantage 免費版有請求頻率限制
3. **錯誤處理**: 已包含完整的錯誤處理和日誌記錄
4. **驗證**: 使用 class-validator 進行輸入驗證
5. **文檔**: Swagger 文檔自動生成