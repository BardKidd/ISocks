import { ApiProperty } from '@nestjs/swagger';

export class StockCurrentDataDto {
  @ApiProperty({ description: '股票代碼', example: 'AAPL' })
  symbol: string;

  @ApiProperty({ description: '當前價格', example: 185.5 })
  price: number;

  @ApiProperty({ description: '開盤價', example: 185.5 })
  open: number;

  @ApiProperty({ description: '最高價', example: 190 })
  high: number;

  @ApiProperty({ description: '最低價', example: 183.1 })
  low: number;

  @ApiProperty({ description: '前日收盤價', example: '184.20' })
  previousClose: number;

  @ApiProperty({ description: '價格變動', example: '2.55' })
  change: number;

  @ApiProperty({ description: '價格變動百分比', example: '1.38%' })
  changePercent: string;

  @ApiProperty({ description: '成交量', example: 1232314 })
  volume: number;

  @ApiProperty({
    description: '市場狀態',
    enum: ['open', 'closed', 'pre-market', 'after-hours'],
    example: 'open',
  })
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';

  @ApiProperty({ description: '最後更新時間', example: '2023-01-01 16:00:00' })
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
    example: false,
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

  @ApiProperty({
    description: '回應時間戳',
    example: '2024-01-20T10:30:00Z',
  })
  timestamp: string;
}
