import { MockRedisService } from '../../test/__mocks__/redis.mock';
import { RedisCacheService } from '../redis-cache.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { mockConfigService } from '../../test/setup';

jest.mock('redis', () => ({
  createClient: jest.fn(() => new MockRedisService()),
}));

describe('RedisCacheService', () => {
  jest.useFakeTimers();

  let service: RedisCacheService;
  let mockRedis: MockRedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
    mockRedis = (service as any).client;
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('快取基本操作', () => {
    it('應該能設定和取得快取', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };
      const ttl = 3600;

      await service.set(key, value, ttl);
      const result = await service.get(key);

      expect(result).toEqual(value);
    });

    it('應該在 TTL 過期後返回 null', async () => {
      const key = 'test:expire';
      const value = { data: 'expire test' };

      await service.set(key, value, 1);

      jest.advanceTimersByTime(1100);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該能刪除快取', async () => {
      const key = 'test:delete';
      const value = { data: 'delete test' };

      await service.set(key, value, 3600);
      await service.delete(key);

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該能檢查快取是否存在', async () => {
      const key = 'test:exists';
      const value = { data: 'exists test' };

      expect(await service.exists(key)).toBe(false);

      await service.set(key, value, 3600);
      expect(await service.exists(key)).toBe(true);
    });
  });

  describe('錯誤處理', () => {
    it('Redis 連線失敗時應該降級處理', async () => {
      mockRedis.setConnectionStatus(false);
      const key = 'test:error';
      const value = { data: 'error test' };

      await expect(service.set(key, value, 3600)).resolves.not.toThrow();

      const result = await service.get(key);
      expect(result).toBeNull();
    });

    it('應該在 set 操作失敗時紀錄錯誤日誌', async () => {
      const loggerSpy = jest.spyOn((service as any).logger, 'error');
      jest.spyOn(mockRedis, 'setEx').mockImplementationOnce(() => {
        throw new Error('Redis SET command failed');
      });

      await service.set('fail-key', 'value', 3600);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('設定快取失敗 [fail-key]'),
        expect.any(String),
      );
    });
  });

  describe('連線狀態管理', () => {
    it('應該正確回報連線狀態', () => {
      expect(service.isRedisConnected()).toBe(true);

      mockRedis.setConnectionStatus(false);

      expect(service.isRedisConnected()).toBe(false);
    });
  });
});
