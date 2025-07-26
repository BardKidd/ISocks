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
    description: '搜索結果陣列',
    type: [StockSearchItemDto],
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
