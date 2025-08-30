import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.ALPHA_VANTAGE_API_KEY = 'TEST_API_KEY';
});

afterAll(async () => {
  // 清理測試環境
});

export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: { [key: string]: string } = {
      REDIS_URL: 'redis://localhost:6379',
      ALPHA_VANTAGE_API_KEY: 'TEST_API_KEY',
    };
    return config[key] || defaultValue;
  }),
};
