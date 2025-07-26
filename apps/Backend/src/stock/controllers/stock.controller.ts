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
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlphaVantageService } from '../services/alpha-vantage.service';
import {
  StockSearchItemDto,
  StockSearchResponseDto,
} from '../dto/stock-search-response.dto';
import { StockSearchQueryDto } from '../dto/stock-search-query.dto';

@ApiTags('stocks')
@Controller('api/stocks')
export class StockController {
  private readonly logger = new Logger(StockController.name);

  constructor(private readonly alphaVantageService: AlphaVantageService) {}

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
        statusCode: { type: 'number', example: HttpStatus.BAD_REQUEST },
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
        statusCode: { type: 'number', example: HttpStatus.SERVICE_UNAVAILABLE },
        message: { type: 'string', example: 'Failed to search stocks' },
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchStocks(
    @Query() queryDto: StockSearchQueryDto,
  ): Promise<StockSearchResponseDto> {
    try {
      this.logger.log(`Stock search request: ${queryDto.query}`);

      const results = await this.alphaVantageService.searchStocks(
        queryDto.query,
      );

      // 轉會為 DTO 格式
      const formattedResults: StockSearchItemDto[] = results.map((result) => ({
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
        `Stock search completed: ${response.total} results for "${queryDto.query}"`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Stock search failed: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error occurred while searching stocks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
