import Redis from 'ioredis-mock';
import { EventEmitter } from 'events';

export class MockRedisService extends EventEmitter {
  private redis = new Redis();
  private connected = true;

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    return this.redis.get(key);
  }

  async setEx(key: string, ttl: number, value: string): Promise<'OK'> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.redis.setex(key, ttl, value);
  }

  async del(key: string): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.exists(key);
  }

  async expire(key: string, ttl: number): Promise<number> {
    if (!this.connected) return 0;
    return this.redis.expire(key, ttl);
  }

  async flushDb(): Promise<'OK'> {
    if (!this.connected) throw new Error('Redis not connected');
    return this.redis.flushdb();
  }

  async connect(): Promise<void> {
    this.connected = true;
    this.emit('connect');
  }

  async quit(): Promise<'OK'> {
    this.connected = false;
    return 'OK';
  }

  setConnectionStatus(status: boolean): void {
    if (this.connected && !status) {
      this.emit('disconnect');
    }
    this.connected = status;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
