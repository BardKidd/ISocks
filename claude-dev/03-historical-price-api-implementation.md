# 歷史價格查詢 API 實作 - TODO 2.1

## 📋 概述
實作 TODO 2.1：歷史價格查詢功能，建立 REST API 端點讓前端能夠查詢特定日期的股票價格資訊。

## 🎯 實作目標
1. **新增歷史價格查詢 API 端點** - `GET /api/stocks/{symbol}/price?date={date}`
2. **建立歷史價格 DTO 類別** - 定義請求和回應格式
3. **實作非交易日邏輯處理** - 自動取得最近交易日價格
4. **完善錯誤處理** - 股票不存在、日期格式錯誤等情況
5. **增強 API 文檔** - Swagger 文檔和使用範例

## 🏗️ 需要修改的檔案

```
apps/Backend/src/stock/
├── controllers/
│   └── stock.controller.ts          # 新增歷史價格端點
├── dto/
│   ├── stock-price-query.dto.ts     # 新建 - 歷史價格查詢參數
│   └── stock-price-response.dto.ts  # 新建 - 歷史價格回應格式
├── services/
│   └── alpha-vantage.service.ts     # 已存在，無需修改
└── interfaces/
    └── stock.interface.ts           # 已存在，無需修改
```

## 💡 實作內容

### 1. 歷史價格查詢參數 DTO

**檔案**: `apps/Backend/src/stock/dto/stock-price-query.dto.ts`

```typescript
import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StockPriceQueryDto {
  @ApiProperty({
    description: '查詢日期 (YYYY-MM-DD 格式)',
    example: '2024-01-15',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: '日期格式必須為 YYYY-MM-DD',
  })
  @Transform(({ value }) => value?.trim())
  date?: string;
}

export class StockSymbolParamDto {
  @ApiProperty({
    description: '股票代碼',
    example: 'AAPL',
    minLength: 1,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: '股票代碼不能為空' })
  @Transform(({ value }) => value?.trim().toUpperCase())
  symbol: string;
}
```

### 2. 歷史價格回應 DTO

**檔案**: `apps/Backend/src/stock/dto/stock-price-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class StockPriceDataDto {
  @ApiProperty({ description: '股票代碼', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: '價格日期', example: '2024-01-15' })
  date: string;

  @ApiProperty({ description: '開盤價', example: 185.50 })
  open: number;

  @ApiProperty({ description: '最高價', example: 188.20 })
  high: number;

  @ApiProperty({ description: '最低價', example: 183.10 })
  low: number;

  @ApiProperty({ description: '收盤價', example: 186.75 })
  close: number;

  @ApiProperty({ description: '成交量', example: 45234567 })
  volume: number;

  @ApiProperty({ 
    description: '貨幣單位', 
    example: 'USD',
    required: false,
  })
  currency?: string;

  @ApiProperty({ 
    description: '時區', 
    example: 'US/Eastern',
    required: false,
  })
  timezone?: string;
}

export class StockPriceResponseDto {
  @ApiProperty({ 
    description: '股票價格資訊',
    type: StockPriceDataDto,
  })
  data: StockPriceDataDto;

  @ApiProperty({ 
    description: '查詢的股票代碼', 
    example: 'AAPL',
  })
  symbol: string;

  @ApiProperty({ 
    description: '請求的日期', 
    example: '2024-01-15',
  })
  requestedDate: string;

  @ApiProperty({ 
    description: '實際返回的日期 (可能是最近交易日)', 
    example: '2024-01-15',
  })
  actualDate: string;

  @ApiProperty({ 
    description: '是否為最近交易日 (非請求日期)', 
    example: false,
  })
  isClosestTradingDay: boolean;

  @ApiProperty({ 
    description: '回應時間戳', 
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;
}

export class StockPriceNotFoundDto {
  @ApiProperty({ description: '錯誤狀態碼', example: HttpStatus.NOT_FOUND })
  statusCode: number;

  @ApiProperty({ 
    description: '錯誤訊息', 
    example: 'Stock price not found for the specified date range',
  })
  message: string;

  @ApiProperty({ description: '查詢的股票代碼', example: 'INVALID' })
  symbol: string;

  @ApiProperty({ description: '查詢的日期', example: '2024-01-15' })
  date: string;

  @ApiProperty({ 
    description: '回應時間戳', 
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;
}
```

### 3. Stock Controller 新增歷史價格端點

**檔案**: `apps/Backend/src/stock/controllers/stock.controller.ts`

在現有的 `StockController` 類別中新增以下方法：

```typescript
// 在現有的 imports 中新增
import { StockSymbolParamDto, StockPriceQueryDto } from '../dto/stock-price-query.dto';
import { 
  StockPriceResponseDto, 
  StockPriceDataDto,
  StockPriceNotFoundDto 
} from '../dto/stock-price-response.dto';
import { Param } from '@nestjs/common';

// 在 StockController 類別中新增此方法
@Get(':symbol/price')
@ApiOperation({
  summary: '查詢歷史價格',
  description: '根據股票代碼和日期查詢歷史價格資訊。如果指定日期無交易資料，將返回最近交易日的價格。',
})
@ApiParam({
  name: 'symbol',
  description: '股票代碼',
  example: 'AAPL',
  type: String,
})
@ApiQuery({
  name: 'date',
  description: '查詢日期 (YYYY-MM-DD)，不提供則返回最新價格',
  example: '2024-01-15',
  required: false,
  type: String,
})
@ApiResponse({
  status: HttpStatus.OK,
  description: '查詢成功',
  type: StockPriceResponseDto,
})
@ApiResponse({
  status: HttpStatus.BAD_REQUEST,
  description: '請求參數錯誤',
  schema: {
    properties: {
      statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
      message: { 
        type: 'array', 
        items: { type: 'string' },
        example: ['日期格式必須為 YYYY-MM-DD'],
      },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: '股票或價格資料不存在',
  type: StockPriceNotFoundDto,
})
@ApiInternalServerErrorResponse({
  description: '服務器內部錯誤',
  schema: {
    properties: {
      statusCode: { type: 'number', example: HttpStatus.SERVICE_UNAVAILABLE },
      message: { type: 'string', example: 'Failed to get stock price' },
    },
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
async getStockPrice(
  @Param() paramDto: StockSymbolParamDto,
  @Query() queryDto: StockPriceQueryDto,
): Promise<StockPriceResponseDto> {
  try {
    this.logger.log(
      `Stock price request: ${paramDto.symbol} for date: ${queryDto.date || 'latest'}`,
    );

    // 如果沒有提供日期，使用今天的日期
    const queryDate = queryDto.date || new Date().toISOString().split('T')[0];
    
    const stockPrice = await this.alphaVantageService.getStockPrice(
      paramDto.symbol,
      queryDate,
    );

    // 如果沒有找到價格資料
    if (!stockPrice) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Stock price not found for the specified date range',
          symbol: paramDto.symbol,
          date: queryDate,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 轉換為 DTO 格式
    const priceData: StockPriceDataDto = {
      symbol: stockPrice.symbol,
      date: stockPrice.date,
      open: stockPrice.open,
      high: stockPrice.high,
      low: stockPrice.low,
      close: stockPrice.close,
      volume: stockPrice.volume,
      currency: stockPrice.currency,
      timezone: stockPrice.timezone,
    };

    const response: StockPriceResponseDto = {
      data: priceData,
      symbol: paramDto.symbol,
      requestedDate: queryDate,
      actualDate: stockPrice.date,
      isClosestTradingDay: stockPrice.date !== queryDate,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Stock price found: ${paramDto.symbol} on ${stockPrice.date} = $${stockPrice.close}`,
    );

    return response;

  } catch (error) {
    this.logger.error(
      `Stock price query failed: ${error.message}`,
      error.stack,
    );

    // 如果是業務邏輯錯誤 (HttpException)，保持原始錯誤狀態碼和訊息
    if (error instanceof HttpException) {
      throw error;
    }

    // 其他系統級意外錯誤
    throw new HttpException(
      'Internal server error occurred while fetching stock price',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
```

## 🔧 API 使用範例

### 請求範例

```bash
# 查詢 Apple 股票在特定日期的價格
GET /api/stocks/AAPL/price?date=2024-01-15

# 查詢 Apple 股票最新價格 (不指定日期)
GET /api/stocks/AAPL/price

# 查詢台積電 ADR 價格
GET /api/stocks/TSM/price?date=2024-01-10
```

### 成功回應範例

```json
{
  "data": {
    "symbol": "AAPL",
    "date": "2024-01-15",
    "open": 185.50,
    "high": 188.20,
    "low": 183.10,
    "close": 186.75,
    "volume": 45234567,
    "currency": "USD",
    "timezone": "US/Eastern"
  },
  "symbol": "AAPL",
  "requestedDate": "2024-01-15",
  "actualDate": "2024-01-15",
  "isClosestTradingDay": false,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 非交易日回應範例 (週末)

```json
{
  "data": {
    "symbol": "AAPL",
    "date": "2024-01-12",
    "open": 184.25,
    "high": 186.40,
    "low": 183.85,
    "close": 185.92,
    "volume": 38567432,
    "currency": "USD"
  },
  "symbol": "AAPL",
  "requestedDate": "2024-01-13",
  "actualDate": "2024-01-12",
  "isClosestTradingDay": true,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 錯誤回應範例

```json
{
  "statusCode": 404,
  "message": "Stock price not found for the specified date range",
  "symbol": "INVALID",
  "date": "2024-01-15",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## ✅ 實作檢查清單

### 📝 需要建立的新檔案
- [ ] `stock-price-query.dto.ts` - 查詢參數驗證
- [ ] `stock-price-response.dto.ts` - 回應格式定義

### 🔧 需要修改的現有檔案
- [ ] `stock.controller.ts` - 新增 `getStockPrice` 方法

### 🧪 功能驗證項目
- [ ] 使用有效股票代碼和日期查詢價格
- [ ] 查詢不提供日期 (返回最新價格)
- [ ] 查詢非交易日 (返回最近交易日)
- [ ] 測試無效股票代碼錯誤處理
- [ ] 測試無效日期格式錯誤處理
- [ ] 檢查 Swagger 文檔正確顯示
- [ ] 驗證日誌記錄功能正常

## 🎯 實作重點

### 1. 非交易日處理邏輯
- Alpha Vantage 服務已經實作了 `findClosestTradingDate` 方法
- API 會自動返回最近的交易日價格
- 回應中會標示是否為原請求日期

### 2. 日期格式驗證
- 嚴格驗證 YYYY-MM-DD 格式
- 自動轉換為大寫股票代碼
- 移除前後空白字符

### 3. 錯誤處理層級
- **400**: 請求參數格式錯誤
- **404**: 股票代碼不存在或日期範圍無資料
- **503**: Alpha Vantage API 服務不可用

### 4. 回應資訊完整性
- 提供請求日期 vs 實際返回日期
- 標示是否為最近交易日
- 包含完整的 OHLCV 資料

## ⚠️ 注意事項

1. **API 限制**: Alpha Vantage 免費版每分鐘 5 次請求限制
2. **日期範圍**: 通常可查詢最近 100 個交易日的資料
3. **股票代碼**: 主要支援美股，台股需使用 ADR 代碼
4. **時區處理**: 價格日期基於股票所在交易所時區
5. **資料延遲**: 免費版可能有 15-20 分鐘延遲

## 🧪 測試建議

### 手動測試案例
1. **正常查詢**: `GET /api/stocks/AAPL/price?date=2024-01-15`
2. **最新價格**: `GET /api/stocks/AAPL/price`
3. **週末查詢**: `GET /api/stocks/AAPL/price?date=2024-01-14` (週日)
4. **無效代碼**: `GET /api/stocks/INVALID/price?date=2024-01-15`
5. **格式錯誤**: `GET /api/stocks/AAPL/price?date=2024/01/15`

### Swagger 測試
- 訪問 `/api/docs` 查看新的 API 端點
- 使用 Swagger UI 直接測試不同參數組合
- 檢查錯誤回應格式是否正確

## 🎯 下一步

完成此實作後，可以繼續進行：
- **TODO 2.2**: 即時價格查詢 API (`GET /api/stocks/{symbol}/current`)
- **TODO 3.1**: 實作快取機制
- **TODO 5.1**: 單元測試建立

這個實作完成後，你的股票價格查詢系統就具備了完整的歷史價格查詢功能！