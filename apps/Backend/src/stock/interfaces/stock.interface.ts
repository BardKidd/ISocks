export interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
}

export interface StockDailyData {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  currency?: string;
  timezone?: string;
}

export interface StockQuoteData {
  symbol: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  lastTradingDay: string;
  currency?: string;
}

export interface AlphaVantageConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
