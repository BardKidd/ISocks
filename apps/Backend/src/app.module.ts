import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity'; // 引入 User Entity
import { Post } from './post/entities/post.entity'; // 引入 Post Entity
import { PostModule } from './post/post.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { StockModule } from './stock/stock.module';
import { CacheService } from './cache/cache/cache.service';
import { RedisCacheService } from './cache/redis-cache.service';

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'), // 從 .env 檔案讀取 JWT_SECRET
        signOptions: { expiresIn: '1d' },
      }),
    }),
    // 全域連線資料庫
    ConfigModule.forRoot({
      isGlobal: true, // 全域可使用 .env
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        console.log('DB_USER from env:', config.get('DB_USERNAME'));
        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          entities: [User, Post], // 明確列出所有 Entity
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'], // Migration 檔案的路徑
          migrationsRun: false, // 應用程式啟動時不自動執行 migration
          migrationsTableName: 'typeorm_migrations', // 儲存 migration 記錄的資料表名稱
          synchronize: false, // IMPORTANT: 在生產環境中應始終為 false，由 migration 管理
        };
      },
    }),
    PostModule,
    AuthModule,
    StockModule,
  ],
  controllers: [AppController],
  providers: [AppService, CacheService, RedisCacheService],
})
export class AppModule {}
