import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import {
  AlphaVantageConfig,
  StockSearchResult,
} from '../interfaces/stock.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  AlphaVantageErrorResponse,
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
   * @parma url 請求 URL
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
          `API request attempt ${attempt} failed: ${error.message}}`,
        );

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryAttempts * attempt);
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
        `Alpha Vantage API Error: ${errorResponse['Error Message']}}`,
      );
    }

    if (errorResponse['Note']) {
      throw new Error(`Alpha Vantage API Note: ${errorResponse['Note']}}`);
    }

    if (errorResponse['Information']) {
      throw new Error(
        `Alpha Vantage API Information: ${errorResponse['Information']}}`,
      );
    }
  }
}
