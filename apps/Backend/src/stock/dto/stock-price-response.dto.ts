import { ApiProperty } from '@nestjs/swagger';

export class StockPriceDataDto {
  @ApiProperty({ description: '股票代碼', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: '價格日期', example: '2023-01-01' })
  date: string;

  @ApiProperty({ description: '開盤價', example: 185.5 })
  open: number;

  @ApiProperty({ description: '最高價', example: 190 })
  high: number;

  @ApiProperty({ description: '最低價', example: 183.1 })
  low: number;

  @ApiProperty({ description: '收盤價', example: 187.5 })
  close: number;

  @ApiProperty({ description: '成交量', example: 100000 })
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
    description: '股票價格數據',
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
    example: '2023-01-01',
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
  @ApiProperty({ description: '錯誤狀態碼', example: 404 })
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
