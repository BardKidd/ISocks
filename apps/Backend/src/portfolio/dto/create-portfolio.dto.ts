import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({
    description: '投資組合的名稱',
    example: '美股長期投資',
  })
  @IsString()
  @Length(1, 100, { message: '名稱長度必須介於 1 到 100 個字元之間' })
  name: string;

  @ApiProperty({
    description: '詳細說明',
    example: '短線操作組合',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '幣別，預設 USD',
    example: 'USD',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
