import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  // 資料庫類型
  type: 'mysql',
  // 從 .env 檔案讀取資料庫主機位址
  host: process.env.DB_HOST,
  // 從 .env 檔案讀取資料庫連接埠
  port: parseInt(process.env.DB_PORT as string, 10),
  // 從 .env 檔案讀取資料庫使用者名稱
  username: process.env.DB_USERNAME,
  // 從 .env 檔案讀取資料庫密碼
  password: process.env.DB_PASSWORD,
  // 從 .env 檔案讀取資料庫名稱
  database: process.env.DB_NAME,

  // *** 非常重要的設定 ***
  // `synchronize: true` 會讓 TypeORM 根據 Entity 自動更新資料庫結構。
  // 這在開發初期很方便，但在生產環境中極其危險，可能導致資料遺失。
  // 因此我們設定為 `false`，並總是使用 `migration` 來變更資料庫。
  synchronize: false,

  // 設定日誌記錄。'error' 表示只記錄錯誤。
  // 開發時可設為 ['query', 'error'] 來查看 TypeORM 執行的所有 SQL 查詢。
  logging: ['error'],

  // 自動載入 Entity 檔案的路徑。
  // `src/**/*.entity{.ts,.js}` 是一個 glob 模式，會尋找 `src` 目錄下任何子目錄中，
  // 所有以 `.entity.ts` 或 `.entity.js` 結尾的檔案。
  // 這是 TypeORM CLI 能夠找到所有 Entity 的關鍵。
  entities: ['src/**/*.entity{.ts,.js}'],

  // 自動載入 Migration 檔案的路徑。
  // 這會尋找 `src/migrations` 目錄下所有的 .ts 或 .js 檔案。
  migrations: ['src/migrations/**/*{.ts,.js}'],

  subscribers: [],
});
