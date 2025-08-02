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
import {
  StockCurrentDataDto,
  StockCurrentResponseDto,
} from '../dto/stock-current-response.dto';

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

  @Get(':symbol/current')
  @ApiOperation({
    summary: '查詢即時價格',
    description:
      '取得股票的當前市場價格、交易狀態和相關資訊。包含開盤/收盤狀態判斷。',
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
    type: StockPriceNotFoundDto,
  })
  @ApiInternalServerErrorResponse({
    description: '服務器內部錯誤',
    schema: {
      properties: {
        statusCode: { type: 'number', example: HttpStatus.SERVICE_UNAVAILABLE },
        message: {
          type: 'string',
          example: 'Failed to fetch current stock price',
        },
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
      if (!currentQuote) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Current stock price not available',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const marketStatus = this.determineMarketStatus();

      // 轉為 DTO 格式
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
        delayMinutes: 15,
      };

      const response: StockCurrentResponseDto = {
        data: currentData,
        symbol: paramDto.symbol,
        timestamp: new Date().toISOString(),
        isRealTime: marketStatus === 'open',
        nextUpdateIn: marketStatus === 'open' ? 60 : 300, // 開盤時1分鐘，收盤時5分鐘。
      };

      this.logger.log(
        `Current stock pice found: ${paramDto.symbol} = $${currentQuote.currentPrice} (${currentQuote.changePercent}%)}`,
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
  private determineMarketStatus():
    | 'open'
    | 'closed'
    | 'pre-market'
    | 'after-hours' {
    const now = new Date();
    const currentHour = now.getUTCHours();

    // 美東時間 9:30~16:00 為開盤時間 (UTC: 14:30~2100)
    // 實際應用中需要考慮夏令時、假日等
    const easterHour = (currentHour - 5 + 24) % 24; // 估算東部時間。UTC - 5 小時 = 美東標準時間 (EST)，+24 為防止負數，取 24 的餘數可以確保值在 0~23 範圍。

    if (easterHour >= 9.5 && easterHour < 16) {
      return 'open';
    } else if (easterHour >= 4 && easterHour < 9.5) {
      return 'pre-market';
    } else if (easterHour >= 16 && easterHour < 20) {
      return 'after-hours';
    } else {
      return 'closed';
    }
  }
}
