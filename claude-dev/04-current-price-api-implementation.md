# 即時價格查詢 API 實作 - TODO 2.2

## 📋 概述
實作 TODO 2.2：即時價格查詢功能，建立 REST API 端點讓前端能夠查詢股票的當前市場價格和交易狀態。

## 🎯 實作目標
1. **新增即時價格查詢 API 端點** - `GET /api/stocks/{symbol}/current`
2. **建立即時價格 DTO 類別** - 定義當前價格回應格式
3. **實作市場狀態判斷** - 開盤/收盤/盤前/盤後狀態
4. **處理延遲價格顯示** - 免費版 API 延遲處理
5. **增強 API 文檔** - Swagger 文檔和使用範例

## 🏗️ 需要修改的檔案

```
apps/Backend/src/stock/
├── controllers/
│   └── stock.controller.ts          # 新增即時價格端點
├── dto/
│   └── stock-current-response.dto.ts # 新建 - 即時價格回應格式
├── services/
│   └── alpha-vantage.service.ts     # 已存在，無需修改
└── interfaces/
    └── stock.interface.ts           # 已存在，無需修改
```

## 💡 實作內容

### 1. 即時價格回應 DTO - 更新實作

**檔案**: `apps/Backend/src/stock/dto/stock-current-response.dto.ts`

**⚠️ 當前狀態**: 文件已存在但缺少 API 裝飾器和完整類別

**需要更新內容**:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class StockCurrentDataDto {
  @ApiProperty({ description: '股票代碼', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: '當前價格', example: 186.75 })
  price: number;

  @ApiProperty({ description: '開盤價', example: 185.50 })
  open: number;

  @ApiProperty({ description: '最高價', example: 188.20 })
  high: number;

  @ApiProperty({ description: '最低價', example: 183.10 })
  low: number;

  @ApiProperty({ description: '前日收盤價', example: 184.20 })
  previousClose: number;

  @ApiProperty({ description: '價格變動', example: 2.55 })
  change: number;

  @ApiProperty({ description: '價格變動百分比', example: '1.38%' })
  changePercent: string;

  @ApiProperty({ description: '成交量', example: 45234567 })
  volume: number;

  @ApiProperty({ 
    description: '市場狀態',
    enum: ['open', 'closed', 'pre-market', 'after-hours'],
    example: 'open',
  })
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';


  @ApiProperty({ 
    description: '最後更新時間', 
    example: '2024-01-20 16:00:00',
  })
  lastUpdated: string;

  @ApiProperty({ 
    description: '資料延遲時間 (分鐘)', 
    example: 15,
  })
  delayMinutes: number;
}

export class StockCurrentResponseDto {
  @ApiProperty({ 
    description: '股票即時價格資訊',
    type: StockCurrentDataDto,
  })
  data: StockCurrentDataDto;

  @ApiProperty({ 
    description: '查詢的股票代碼', 
    example: 'AAPL',
  })
  symbol: string;

  @ApiProperty({ 
    description: '查詢時間戳', 
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;

  @ApiProperty({ 
    description: '是否為即時價格 (基於市場狀態)', 
    example: true,
  })
  isRealTime: boolean;

  @ApiProperty({ 
    description: '下次更新建議時間 (秒)', 
    example: 60,
  })
  nextUpdateIn: number;
}

export class StockCurrentNotFoundDto {
  @ApiProperty({ description: '錯誤狀態碼', example: 404 })
  statusCode: number;

  @ApiProperty({ 
    description: '錯誤訊息', 
    example: 'Current stock price not available',
  })
  message: string;

  @ApiProperty({ description: '查詢的股票代碼', example: 'INVALID' })
  symbol: string;

  @ApiProperty({ 
    description: '回應時間戳', 
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;
}
```

### 2. Stock Controller 新增即時價格端點

**檔案**: `apps/Backend/src/stock/controllers/stock.controller.ts`

在現有的 `StockController` 類別中新增以下方法：

```typescript
// 在現有的 imports 中新增
import { 
  StockCurrentResponseDto, 
  StockCurrentDataDto,
  StockCurrentNotFoundDto 
} from '../dto/stock-current-response.dto';

// 在 StockController 類別中新增此方法
@Get(':symbol/current')
@ApiOperation({
  summary: '查詢即時價格',
  description: '取得股票的當前市場價格、交易狀態和相關資訊。包含開盤/收盤狀態判斷。',
})
@ApiParam({
  name: 'symbol',
  description: '股票代碼',
  example: 'AAPL',
  type: String,
})
@ApiResponse({
  status: HttpStatus.OK,
  description: '查詢成功',
  type: StockCurrentResponseDto,
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
        example: ['股票代碼不能為空'],
      },
      error: { type: 'string', example: 'Bad Request' },
    },
  },
})
@ApiResponse({
  status: HttpStatus.NOT_FOUND,
  description: '股票或即時價格資料不存在',
  type: StockCurrentNotFoundDto,
})
@ApiInternalServerErrorResponse({
  description: '服務器內部錯誤',
  schema: {
    properties: {
      statusCode: { type: 'number', example: HttpStatus.SERVICE_UNAVAILABLE },
      message: { type: 'string', example: 'Failed to get current stock price' },
    },
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
async getCurrentStockPrice(
  @Param() paramDto: StockSymbolParamDto,
): Promise<StockCurrentResponseDto> {
  try {
    this.logger.log(`Current stock price request: ${paramDto.symbol}`);

    const currentQuote = await this.alphaVantageService.getCurrentQuote(
      paramDto.symbol,
    );

    // 如果沒有找到即時價格資料
    if (!currentQuote) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Current stock price not available',
          symbol: paramDto.symbol,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // 判斷市場狀態 (固定使用美東時間，因為主要支援美股)
    const marketStatus = this.determineMarketStatus();

    // 轉換為 DTO 格式 (直接使用 Alpha Vantage 已計算好的數據)
    const currentData: StockCurrentDataDto = {
      symbol: currentQuote.symbol,
      price: currentQuote.currentPrice,
      open: currentQuote.openPrice,
      high: currentQuote.highPrice,
      low: currentQuote.lowPrice,
      previousClose: currentQuote.previousClose,
      change: currentQuote.change,
      changePercent: `${currentQuote.changePercent}%`,
      volume: currentQuote.volume,
      marketStatus,
      lastUpdated: currentQuote.lastTradingDay,
      delayMinutes: 15, // Alpha Vantage 免費版延遲
    };

    const response: StockCurrentResponseDto = {
      data: currentData,
      symbol: paramDto.symbol,
      timestamp: new Date().toISOString(),
      isRealTime: marketStatus === 'open',
      nextUpdateIn: marketStatus === 'open' ? 60 : 300, // 開盤時 1分鐘，收盤時 5分鐘
    };

    this.logger.log(
      `Current stock price found: ${paramDto.symbol} = $${currentQuote.currentPrice} (${currentQuote.changePercent}%)`,
    );

    return response;

  } catch (error) {
    this.logger.error(
      `Current stock price query failed: ${error.message}`,
      error.stack,
    );

    // 如果是業務邏輯錯誤 (HttpException)，保持原始錯誤狀態碼和訊息
    if (error instanceof HttpException) {
      throw error;
    }

    // 其他系統級意外錯誤
    throw new HttpException(
      'Internal server error occurred while fetching current stock price',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

/**
 * 判斷市場狀態 (簡化版本，固定美東時間)
 * @returns 市場狀態
 */
private determineMarketStatus(): 'open' | 'closed' | 'pre-market' | 'after-hours' {
  const now = new Date();
  const currentHour = now.getUTCHours();
  
  // 美東時間 9:30-16:00 為開盤時間 (UTC: 14:30-21:00)
  // 實際應用中需要考慮夏令時、假日等
  const easternHour = (currentHour - 5 + 24) % 24; // 估算東部時間
  
  if (easternHour >= 9.5 && easternHour < 16) {
    return 'open';
  } else if (easternHour >= 4 && easternHour < 9.5) {
    return 'pre-market';
  } else if (easternHour >= 16 && easternHour < 20) {
    return 'after-hours';
  } else {
    return 'closed';
  }
}
```

## 🔧 API 使用範例

### 請求範例

```bash
# 查詢 Apple 股票即時價格
GET /api/stocks/AAPL/current

# 查詢 Microsoft 股票即時價格
GET /api/stocks/MSFT/current

# 查詢台積電 ADR 即時價格
GET /api/stocks/TSM/current
```

### 成功回應範例 (開盤時間)

```json
{
  "data": {
    "symbol": "AAPL",
    "price": 186.75,
    "open": 185.50,
    "high": 188.20,
    "low": 183.10,
    "previousClose": 184.20,
    "change": 2.55,
    "changePercent": "1.38%",
    "volume": 45234567,
    "marketStatus": "open",
    "lastUpdated": "2024-01-20",
    "delayMinutes": 15
  },
  "symbol": "AAPL",
  "timestamp": "2024-01-20T20:45:00Z",
  "isRealTime": true,
  "nextUpdateIn": 60
}
```

### 收盤時間回應範例

```json
{
  "data": {
    "symbol": "AAPL",
    "price": 186.75,
    "open": 185.50,
    "high": 188.20,
    "low": 183.10,
    "previousClose": 184.20,
    "change": 2.55,
    "changePercent": "1.38%",
    "volume": 45234567,
    "marketStatus": "closed",
    "lastUpdated": "2024-01-20",
    "delayMinutes": 15
  },
  "symbol": "AAPL",
  "timestamp": "2024-01-20T22:30:00Z",
  "isRealTime": false,
  "nextUpdateIn": 300
}
```

### 錯誤回應範例

```json
{
  "statusCode": 404,
  "message": "Current stock price not available",
  "symbol": "INVALID",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## ✅ 實作檢查清單

### 📝 需要建立的新檔案
- [ ] `stock-current-response.dto.ts` - 即時價格回應格式

### 🔧 需要修改的現有檔案
- [ ] `stock.controller.ts` - 新增 `getCurrentStockPrice` 方法和 `determineMarketStatus` 私有方法

### 🧪 功能驗證項目
- [ ] 使用有效股票代碼查詢即時價格
- [ ] 驗證價格變動計算正確性
- [ ] 測試市場狀態判斷邏輯
- [ ] 測試無效股票代碼錯誤處理
- [ ] 檢查 Swagger 文檔正確顯示
- [ ] 驗證日誌記錄功能正常
- [ ] 測試不同時區的市場狀態判斷

## 🎯 實作重點

### 1. 市場狀態判斷邏輯
- **開盤時間**: 美東時間 9:30-16:00 (需考慮夏令時)
- **盤前交易**: 4:00-9:30
- **盤後交易**: 16:00-20:00
- **收盤時間**: 其他時間
- **注意**: 實際應用需考慮假日和特殊交易日

### 2. 價格變動計算
- 計算絕對變動: `當前價格 - 前日收盤價`
- 計算百分比變動: `(變動 / 前日收盤價) × 100%`
- 保留適當小數位數顯示

### 3. 資料更新策略
- **開盤時間**: 建議每 60 秒更新
- **收盤時間**: 建議每 300 秒更新
- **延遲標示**: 明確標示資料延遲時間

### 4. 錯誤處理層級
- **400**: 請求參數格式錯誤
- **404**: 股票代碼不存在或即時價格不可用
- **503**: Alpha Vantage API 服務不可用

## ⚠️ 注意事項

1. **API 限制**: Alpha Vantage 免費版每分鐘 5 次請求限制
2. **資料延遲**: 免費版有 15-20 分鐘延遲，非真正即時
3. **時區處理**: 需正確處理不同交易所的時區
4. **假日處理**: 市場狀態判斷需考慮交易日曆
5. **快取策略**: 建議實作適當的快取避免頻繁 API 調用

## 🧪 測試建議

### 手動測試案例
1. **正常查詢**: `GET /api/stocks/AAPL/current`
2. **不同股票**: `GET /api/stocks/MSFT/current`
3. **無效代碼**: `GET /api/stocks/INVALID/current`
4. **不同時間段**: 在開盤/收盤時間分別測試
5. **價格變動**: 檢查變動計算是否正確

### Swagger 測試
- 訪問 `/api/docs` 查看新的 API 端點
- 使用 Swagger UI 直接測試
- 檢查回應格式和錯誤處理

## 🧠 擴展建議

### 未來改進方向
1. **更精確的市場狀態判斷**
   - 整合交易日曆 API
   - 處理夏令時變更
   - 支援多個交易所時區

2. **智能快取機制**
   - 根據市場狀態調整快取時間
   - 開盤時短快取，收盤時長快取

3. **WebSocket 支援**
   - 實作即時價格推送
   - 減少客戶端輪詢頻率

4. **多資料來源整合**
   - 整合多個股價資料提供商
   - 提高資料可靠性和即時性

## 🎯 下一步

完成此實作後，可以繼續進行：
- **TODO 3.1**: 實作快取機制
- **TODO 4.1**: 完善 Stock Module 結構
- **TODO 5.1**: 單元測試建立

這個實作完成後，你的股票價格查詢系統就具備了完整的即時價格查詢功能！