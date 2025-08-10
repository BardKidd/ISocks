import { Injectable } from '@nestjs/common';

/**
 * 快取服務抽象介面
 * 提供統一的快取操介面，方便測試和切換不同快取實作
 */
@Injectable()
export abstract class CacheService {
  /**
   * 快取設定
   * @param key 快取鍵
   * @param value
   * @param ttl 過期時間(秒)
   */
  abstract set(key: string, value: any, ttl: number): Promise<void>;

  /**
   * 獲取快取
   * @param key 快取鍵
   * @returns 快取值或 null
   */
  abstract get<T>(key: string): Promise<T | null>;

  /**
   * 刪除快取
   * @param key 快取鍵
   */
  abstract delete(key: string): Promise<void>;

  /**
   * 清除所有快取
   */
  abstract clear(): Promise<void>;

  /**
   * 檢查快取是否存在
   * @param key 快取鍵
   */
  abstract exists(key: string): Promise<boolean>;

  /**
   * 檢查快取是否過期
   * @param key 快取鍵
   * @param ttl 過期時間(秒)
   */
  abstract expire(key: string, ttl: number): Promise<void>;
}
