import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisCacheService } from './redis-cache.service';
import { CacheService } from './cache.service';

@Global() // 全域模組，所有模組都可以使用
@Module({
  // 注入 Module
  imports: [ConfigModule],
  // 注入 service
  providers: [
    {
      provide: CacheService,
      useClass: RedisCacheService,
    },
  ],
  exports: [CacheService],
})
export class CacheModule {}
