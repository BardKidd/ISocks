import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class StockSearchQueryDto {
  @ApiProperty({
    description: '股票名稱或代碼',
    example: 'Apple Inc.',
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
