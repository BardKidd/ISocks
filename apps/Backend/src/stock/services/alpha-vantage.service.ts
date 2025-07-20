import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import {
  AlphaVantageConfig,
  StockSearchResult,
  StockPrice,
  StockQuote,
} from '../interfaces/stock.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  AlphaVantageDailyResponse,
  AlphaVantageErrorResponse,
  AlphaVantageQuoteResponse,
  AlphaVantageSearchResponse,
} from '../interfaces/alpha-vantage.interface';

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly config: AlphaVantageConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.config = {
      apiKey: this.configService.get<string>('ALPHA_VANTAGE_API_KEY'),
      baseUrl: 'https://www.alphavantage.co/query',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
    };

    if (!this.config.apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY is not configured');
    }
  }

  /**
   * 搜尋股票 - 支援公司名稱或股票代碼
   * @param query 搜尋關鍵字
   * @returns 股票搜尋結果陣列
   */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    try {
      this.logger.log(`Searching stocks with query: ${query}`);

      const url = this.buildUrl('SYMBOL_SEARCH', {
        keywords: query,
      });
      const response = await this.makeRequest<AlphaVantageSearchResponse>(url);

      // 檢查是否有錯誤
      this.checkForErrors(response.data);

      // 轉換 Alpha Vantage 格式到內部格式
      const results: StockSearchResult[] =
        response.data.bestMatches?.map((match) => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: match['3. type'],
          region: match['4. region'],
          marketOpen: match['5. marketOpen'],
          marketClose: match['6. marketClose'],
          timezone: match['7. timezone'],
          currency: match['8. currency'],
          matchScore: parseFloat(match['9. matchScore']),
        })) || [];

      this.logger.log(`Found ${results.length} stocks for query: ${query}`);

      return results;
    } catch (error) {
      this.logger.error(
        `Error searching stocks: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to search stocks',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 取得特定日期的股票價格
   * @param symbol 股票代碼
   * @param date 日期 (YYYY-MM-DD)
   * @returns 股票價格資訊
   */
  async getStockPrice(
    symbol: string,
    date: string,
  ): Promise<StockPrice | null> {
    try {
      this.logger.log(`Getting stock price for ${symbol} on ${date}`);

      const url = this.buildUrl('TIME_SERIES_DAILY', {
        symbol: symbol.toUpperCase(),
        outputsize: 'compact', // 取的最近 100 天的數據
      });

      const response = await this.makeRequest<AlphaVantageDailyResponse>(url);

      // 檢查是否有錯誤
      this.checkForErrors(response.data);

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('No time series data found');
      }

      // 尋找指定日期的數據，如果沒有找到則找最近的交易日
      const targetDate = this.findClosestTradingDate(timeSeries, date);
      if (!targetDate) {
        return null;
      }

      const priceData = timeSeries[targetDate];
      const result: StockPrice = {
        symbol: symbol.toUpperCase(),
        date: targetDate,
        open: parseFloat(priceData['1. open']),
        high: parseFloat(priceData['2. high']),
        low: parseFloat(priceData['3. low']),
        close: parseFloat(priceData['4. close']),
        volume: parseInt(priceData['5. volume']),
      };

      this.logger.log(
        `Found price for ${symbol} on ${targetDate}: ${result.close}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting stock price: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get stock price',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 取得即時股票報價
   * @param symbol 股票代碼
   * @returns 即時報價資訊
   */
  async getCurrentQuote(symbol: string): Promise<StockQuote> {
    try {
      this.logger.log(`Getting current quote for ${symbol}`);

      const url = this.buildUrl('GLOBAL_QUOTE', {
        symbol: symbol.toUpperCase(),
      });
      const response = await this.makeRequest<AlphaVantageQuoteResponse>(url);

      // 檢查是否有錯誤
      this.checkForErrors(response.data);

      const quote = response.data['Global Quote'];
      if (!quote || !quote['01. symbol']) {
        throw new Error('No quote data found');
      }

      const result: StockQuote = {
        symbol: quote['01. symbol'],
        currentPrice: parseFloat(quote['05. price']),
        openPrice: parseFloat(quote['02. open']),
        highPrice: parseFloat(quote['03. high']),
        lowPrice: parseFloat(quote['04. low']),
        previousClose: parseFloat(quote['08. previous close']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseFloat(quote['06. volume']),
        lastTradingDay: quote['07. latest trading day'],
      };

      this.logger.log(`Current quote for ${symbol}: ${result.currentPrice}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error getting current quote: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'Failed to get current quote',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * 搜尋 API URL
   * @param func API 功能
   * @param params 參數
   * @returns 完整的 URL
   */
  private buildUrl(func: string, params: Record<string, string>): string {
    const urlParams = new URLSearchParams({
      function: func,
      apikey: this.config.apiKey,
      ...params,
    });

    return `${this.config.baseUrl}?${urlParams.toString()}`;
  }

  /**
   * 發送 HTTP 請求
   * @param url 請求 URL
   * @returns 回應資料
   */
  private async makeRequest<T>(url: string): Promise<AxiosResponse<T>> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await firstValueFrom(
          this.httpService.get<T>(url, {
            timeout: this.config.timeout,
          }),
        );

        return response;
      } catch (error) {
        lastError = error;
        this.logger.error(
          `API request attempt ${attempt} failed: ${error.message}`,
        );

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * 延遲執行
   * @param ms 延遲毫秒數
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 檢查 API 回應是否包含錯誤
   * @param data API 回應資料
   */
  private checkForErrors(data: any): void {
    const errorResponse = data as AlphaVantageErrorResponse;

    if (errorResponse['Error Message']) {
      throw new Error(
        `Alpha Vantage API Error: ${errorResponse['Error Message']}`,
      );
    }

    if (errorResponse['Note']) {
      throw new Error(`Alpha Vantage API Note: ${errorResponse['Note']}`);
    }

    if (errorResponse['Information']) {
      throw new Error(
        `Alpha Vantage API Information: ${errorResponse['Information']}`,
      );
    }
  }

  /**
   * 尋找最接近指定日期的交易日
   * @param timeSeries 時間序列資料
   * @param targetDate 目標時間
   * @returns 最接近的交易日，若沒有找到則返回 null
   */
  private findClosestTradingDate(
    timeSeries: Record<string, any>,
    targetDate: string,
  ): string | null {
    const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a)); // 降序排列

    // 如果指定日期存在，直接返回
    if (timeSeries[targetDate]) {
      return targetDate;
    }

    // 尋找最接近且不超過目標日期的交易日
    const target = new Date(targetDate);
    for (const date of dates) {
      if (new Date(date) <= target) {
        return date;
      }
    }

    return null;
  }
}
