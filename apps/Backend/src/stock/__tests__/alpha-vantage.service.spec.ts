import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

import { AlphaVantageService } from '../services/alpha-vantage.service';
import { CacheService } from '../../cache/cache.service';
import {
  mockSearchResponse,
  mockDailyResponse,
  mockQuoteResponse,
} from '../../test/__mocks__/alpha-vantage.mock';
import { mockConfigService } from '../../test/setup';

describe('AlphaVantageService', () => {
  let service: AlphaVantageService;
  let httpService: HttpService;
  let cacheService: CacheService;

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    clear: jest.fn(),
    expire: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlphaVantageService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<AlphaVantageService>(AlphaVantageService);
    httpService = module.get<HttpService>(HttpService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchStocks', () => {
    it('應該返回格式化的搜尋結果', async () => {
      const query = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockSearchResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.searchStocks(query);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'Equity',
        region: 'United States',
        marketOpen: '09:30',
        marketClose: '16:00',
        timezone: 'UTC-04',
        currency: 'USD',
        matchScore: 1.0,
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_search: aapl',
        result,
        3600,
      );
    });

    it('應該在快取命中時返回快取結果', async () => {
      const query = 'AAPL';
      const cachedResult = [{ symbol: 'AAPL', name: 'Apple Inc.' }];

      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.searchStocks(query);

      expect(result).toEqual(cachedResult);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('應該處理 API 錯誤', async () => {
      const query = 'INVALID';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API Error')),
      );

      await expect(service.searchStocks(query)).rejects.toThrow();
    });
  });

  describe('getStockPrice', () => {
    it('應該返回特定日期的股票價格', async () => {
      const symbol = 'AAPL';
      const date = '2024-01-15';
      const mockResponse: AxiosResponse = {
        data: mockDailyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getStockPrice(symbol, date);

      expect(result).toEqual({
        symbol: 'AAPL',
        date: '2024-01-15',
        open: 185.92,
        high: 186.4,
        low: 183.43,
        close: 185.85,
        volume: 47471600,
        timezone: 'US/Eastern',
      });

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_price: AAPL:2024-01-15',
        result,
        86400,
      );
    });

    it('應該處理非交易日查詢', async () => {
      const symbol = 'AAPL';
      const date = '2024-01-13';
      const mockResponse: AxiosResponse = {
        data: mockDailyResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getStockPrice(symbol, date);

      expect(result?.date).toBe('2024-01-12');
    });
  });

  describe('getCurrentQuote', () => {
    it('應該返回即時報價', async () => {
      const symbol = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCurrentQuote(symbol);

      expect(result).toEqual({
        symbol: 'AAPL',
        currentPrice: 185.85,
        openPrice: 185.92,
        highPrice: 186.4,
        lowPrice: 183.43,
        previousClose: 186.29,
        change: -0.44,
        changePercent: -0.2362,
        volume: 47471600,
        lastTradingDay: '2024-01-15',
      });
    });

    it('應該根據市場狀態使用不同的快取時間', async () => {
      const symbol = 'AAPL';
      const mockResponse: AxiosResponse = {
        data: mockQuoteResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      jest
        .spyOn(Date, 'now')
        .mockReturnValue(new Date('2024-01-15T14:30:00Z').getTime());

      await service.getCurrentQuote(symbol);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        'stock_current: AAPL',
        expect.any(Object),
        expect.any(Number),
      );
    });
  });

  describe('錯誤處理和重試機制', () => {
    it('應該重試失敗的 API 呼叫', async () => {
      const query = 'AAPL';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get
        .mockReturnValueOnce(throwError(() => new Error('Network Error')))
        .mockReturnValueOnce(throwError(() => new Error('Network Error')))
        .mockReturnValueOnce(
          of({
            data: mockSearchResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any,
          }),
        );

      const result = await service.searchStocks(query);

      expect(result).toHaveLength(2);
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });

    it('應該在最大重試次數後拋出錯誤', async () => {
      const query = 'AAPL';

      mockCacheService.get.mockResolvedValue(null);
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Persistent Error')),
      );

      await expect(service.searchStocks(query)).rejects.toThrow();
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });
  });
});
