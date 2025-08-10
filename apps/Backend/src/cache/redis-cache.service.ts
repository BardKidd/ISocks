import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { CacheService } from './cache.service';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheService extends CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client!: RedisClientType; // 明確賦值斷言
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeRedis();
  }

  /**
   * 初始化 Redis 連線
   */
  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 10000, // 10秒連線超時
          socketTimeout: 30000, // 30秒 Socket 閒置超時
          noDelay: true, // 禁用 Nagle 算法，優化延遲
          keepAlive: true, // 保持連線活動
          keepAliveInitialDelay: 5000, // Keep-alive 初始延遲
        },
      });

      this.client.on('error', (error) => {
        this.logger.error(`Redis 連線錯誤: ${error.message}`, error.stack);
        this.isConnected = false;
      });

      this.client.on('disconnect', () => {
        this.logger.warn('Redis 連線中斷');
        this.isConnected = false;
      });

      await this.client.connect();
      this.logger.log('Redis 快取服務初始化完成');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Redis 初始化失敗: ${errorMessage}`, errorStack);
      this.isConnected = false;
    }
  }

  /**
   * 設定快取
   */
  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取設定: ${key}`);
        return;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);

      this.logger.debug(`快取已設定: ${key} (TTL: ${ttl}秒)`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`設定快取失敗 [${key}]: ${errorMessage}`, errorStack);
    }
  }

  /**
   * 取得快取
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取讀取: ${key}`);
        return null;
      }

      const cachedValue = await this.client.get(key);

      if (cachedValue === null) {
        this.logger.debug(`快取未命中: ${key}`);
        return null;
      }

      const parsedValue = JSON.parse(cachedValue);
      this.logger.debug(`快取命中: ${key}`);
      return parsedValue as T;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`讀取快取失敗 [${key}]: ${errorMessage}`, errorStack);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過快取刪除: ${key}`);
        return;
      }

      await this.client.del(key);
      this.logger.debug(`快取已刪除: ${key}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`刪除快取失敗 [${key}]: ${errorMessage}`, errorStack);
    }
  }

  async clear(): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis 未連線，跳過快取清除');
        return;
      }

      await this.client.flushDb();
      this.logger.log('所有快取已清除');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`清除快取失敗: ${errorMessage}`, errorStack);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `檢查快取存在失敗 [${key}]: ${errorMessage}`,
        errorStack,
      );
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isConnected) {
        this.logger.warn(`Redis 未連線，跳過設定過期時間: ${key}`);
        return;
      }

      await this.client.expire(key, ttl);
      this.logger.debug(`快取過期時間已設定: ${key} (TTL: ${ttl}秒)`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `設定快取過期時間失敗 [${key}]: ${errorMessage}`,
        errorStack,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.logger.log('Redis 連線已關閉');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`關閉 Redis 連線失敗: ${errorMessage}`, errorStack);
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}
