import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './user/entities/user.entity';
import { Post } from './post/entities/post.entity';

// 載入 .env 檔案中的環境變數
dotenv.config();

const DB_PORT: string = process.env.DB_PORT as string;

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false, // IMPORTANT: 在生產環境中應始終為 false，由 migration 管理
  logging: ['query', 'error'], // 可以開啟查詢日誌，方便調試
  entities: [User, Post], // 列出所有您的 Entity
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'], // Migration 檔案的路徑
  subscribers: [],
});
