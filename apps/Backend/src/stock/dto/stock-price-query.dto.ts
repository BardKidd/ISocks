import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StockPriceQueryDto {
  @ApiProperty({
    description: '查詢日期 (YYYY-MM-DD 格式)',
    example: '2023-01-01',
    pattern: '^\\d{4}-\\d{2}-\d{2}$/',
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
