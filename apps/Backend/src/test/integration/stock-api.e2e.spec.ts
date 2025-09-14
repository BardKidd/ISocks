import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { CacheService } from '../../cache/cache.service';

describe('Stock API (e2e)', () => {
  let app: INestApplication;
  let cacheService: CacheService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    cacheService = moduleFixture.get<CacheService>(CacheService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 清理快取確保測試獨立性
    if (cacheService && typeof cacheService.clear === 'function') {
      await cacheService.clear();
    }
  });

  describe('/api/stocks/search (GET)', () => {
    it('應該返回股票搜尋結果', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stocks/search?query=AAPL')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('region');
      }
    });

    it('應該處理空查詢參數', async () => {
      await request(app.getHttpServer()).get('/api/stocks/search').expect(400);
    });

    it('應該處理無效查詢', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stocks/search?query=')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('應該快取搜尋結果', async () => {
      // 第一次請求
      const startTime1 = Date.now();
      const response1 = await request(app.getHttpServer())
        .get('/api/stocks/search?query=AAPL')
        .expect(200);
      const duration1 = Date.now() - startTime1;

      // 第二次請求應該從快取取得，更快完成
      const startTime2 = Date.now();
      const response2 = await request(app.getHttpServer())
        .get('/api/stocks/search?query=AAPL')
        .expect(200);
      const duration2 = Date.now() - startTime2;

      expect(response1.body).toEqual(response2.body);
      // 快取的請求應該明顯更快 (小於原始請求的一半時間)
      expect(duration2).toBeLessThan(duration1 / 2);
    });
  });

  describe('/api/stocks/:symbol/price (GET)', () => {
    it('應該返回特定日期的歷史價格', async () => {
      const symbol = 'AAPL';
      const date = '2024-01-15';

      const response = await request(app.getHttpServer())
        .get(`/api/stocks/${symbol}/price?date=${date}`)
        .expect(200);

      expect(response.body).toHaveProperty('symbol', symbol);
      expect(response.body).toHaveProperty('date');
      expect(response.body).toHaveProperty('open');
      expect(response.body).toHaveProperty('high');
      expect(response.body).toHaveProperty('low');
      expect(response.body).toHaveProperty('close');
      expect(response.body).toHaveProperty('volume');
      expect(typeof response.body.close).toBe('number');
    });

    it('應該處理無效的股票代碼', async () => {
      await request(app.getHttpServer())
        .get('/api/stocks/INVALIDSTOCK123/price?date=2024-01-15')
        .expect(404);
    });

    it('應該處理無效的日期格式', async () => {
      await request(app.getHttpServer())
        .get('/api/stocks/AAPL/price?date=invalid-date')
        .expect(400);
    });

    it('應該處理缺少日期參數', async () => {
      await request(app.getHttpServer())
        .get('/api/stocks/AAPL/price')
        .expect(400);
    });
  });

  describe('/api/stocks/:symbol/current (GET)', () => {
    it('應該返回即時報價', async () => {
      const symbol = 'AAPL';

      const response = await request(app.getHttpServer())
        .get(`/api/stocks/${symbol}/current`)
        .expect(200);

      expect(response.body).toHaveProperty('symbol', symbol);
      expect(response.body).toHaveProperty('currentPrice');
      expect(response.body).toHaveProperty('openPrice');
      expect(response.body).toHaveProperty('highPrice');
      expect(response.body).toHaveProperty('lowPrice');
      expect(response.body).toHaveProperty('previousClose');
      expect(response.body).toHaveProperty('change');
      expect(response.body).toHaveProperty('changePercent');
      expect(response.body).toHaveProperty('volume');
      expect(response.body).toHaveProperty('lastTradingDay');

      expect(typeof response.body.currentPrice).toBe('number');
      expect(typeof response.body.change).toBe('number');
    });

    it('應該處理無效的股票代碼', async () => {
      await request(app.getHttpServer())
        .get('/api/stocks/INVALIDSTOCK123/current')
        .expect(404);
    });

    it('應該包含正確的 CORS 標頭', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stocks/AAPL/current')
        .expect(200);

      // 檢查是否有適當的 CORS 設定
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('API 錯誤處理', () => {
    it('應該返回適當的錯誤格式', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/stocks/search')
        .expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    it('應該處理不存在的路由', async () => {
      await request(app.getHttpServer())
        .get('/api/stocks/nonexistent-route')
        .expect(404);
    });
  });

  describe('API 效能測試', () => {
    it('股票搜尋應該在合理時間內完成', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/stocks/search?query=AAPL')
        .expect(200);

      const duration = Date.now() - startTime;

      // 應該在 5 秒內完成 (考慮外部 API 延遲)
      expect(duration).toBeLessThan(5000);
    });

    it('快取的請求應該很快完成', async () => {
      // 先做一次請求確保快取
      await request(app.getHttpServer())
        .get('/api/stocks/search?query=MSFT')
        .expect(200);

      // 測試快取的請求
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/stocks/search?query=MSFT')
        .expect(200);

      const duration = Date.now() - startTime;

      // 快取的請求應該在 100ms 內完成
      expect(duration).toBeLessThan(100);
    });
  });
});
