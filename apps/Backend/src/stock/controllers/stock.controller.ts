import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
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
import {
  StockPriceDataDto,
  StockPriceNotFoundDto,
  StockPriceResponseDto,
} from '../dto/stock-price-response.dto';
import {
  StockPriceQueryDto,
  StockSymbolParamDto,
} from '../dto/stock-price-query.dto';

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

  @Get(':symbol/price')
  @ApiOperation({
    summary: '查詢歷史價格',
    description:
      '根據股票代碼和日期查詢歷史價格資訊。如果指定日期無交易資料，將返回最近交易日的價格。',
  })
  @ApiParam({
    name: 'symbol',
    description: '股票代碼',
    example: 'AAPL',
    type: String,
  })
  @ApiQuery({
    name: 'date',
    description: '查詢日期 (YYYY-MM-DD 格式)，不提供則返回最新價格',
    example: '2023-01-01',
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
        statusCode: {
          type: 'array',
          items: { type: 'number' },
          example: ['日期格式必須為 YYYY-MM-DD'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '股票價格未找到',
    type: StockPriceNotFoundDto,
  })
  @ApiInternalServerErrorResponse({
    description: '服務器內部錯誤',
    schema: {
      properties: {
        statusCode: { type: 'number', example: HttpStatus.SERVICE_UNAVAILABLE },
        message: { type: 'string', example: 'Failed to fetch stock price' },
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

      const queryDate = queryDto.date || new Date().toISOString().split('T')[0];

      const stockPrice = await this.alphaVantageService.getStockPrice(
        paramDto.symbol,
        queryDate,
      );

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
        `Stock price found: ${paramDto.symbol} on ${stockPrice.date} = ${stockPrice.close}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Stock price request failed: ${error.message}`,
        error.stack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Internal server error occurred while fetching stock price',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
