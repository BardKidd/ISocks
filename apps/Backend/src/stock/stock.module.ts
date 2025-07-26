import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { StockController } from './controllers/stock.controller';

@Module({
  imports: [HttpModule, ConfigModule], // HttpModule 用於提供 Http 服務，可發送外部 API 請求；ConfigModule 可以提供環境變數和配置管理服務。
  controllers: [StockController],
  providers: [AlphaVantageService],
  exports: [AlphaVantageService],
})
export class StockModule {}
