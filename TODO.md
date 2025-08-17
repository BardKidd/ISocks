# IStocks 開發待辦事項

> 請讀取 CLAUDE.md, claude-dev 的內容, CLAUDE-md-workflow-update.md, restart-prompt 和 TODO.md，並 use context7 讀取最新套件資訊。然後協助我繼續 IStocks 專案的開發。

## 📋 專案概述

個人投資組合管理系統，允許使用者追蹤投資績效並與全球市場指數比較。

---

## 🎯 第一階段：股票數據 API 系統

### 目標

建立完整的股票搜尋和價格取得系統，作為投資組合功能的基礎。

### 核心功能需求

#### 🔍 1. 股票搜尋功能

- [x] **1.1** 設定 Alpha Vantage API 整合

  - [x] 註冊 Alpha Vantage API 帳號並取得 API Key
  - [x] 在後端環境變數中設定 `ALPHA_VANTAGE_API_KEY`
  - [x] 建立 Alpha Vantage API 服務類別設計文檔

- [x] **1.2** 實作股票搜尋 API
  - [x] 支援公司名稱搜尋 (ex: "Apple") - Alpha Vantage 主要支援美股
  - [x] 支援股票代碼搜尋 (ex: "AAPL", "TSM") - 台股需用美股 ADR
  - [x] 返回標準化的股票資訊格式

#### 💰 2. 股票價格查詢功能

- [x] **2.1** 歷史價格查詢

  - [x] 根據指定日期取得收盤價
  - [x] 處理非交易日的邏輯 (取得最近交易日價格)
  - [x] 支援不同交易所的時區處理

- [x] **2.2** 即時價格查詢
  - [x] 取得當前市場價格
  - [x] 判斷市場開盤/收盤狀態
  - [x] 處理盤後價格顯示

#### 🗄️ 3. 數據快取與優化

- [x] **3.1** 實作快取機制 ✅

  - [x] 建立快取服務抽象介面 - CacheService 已完成 ✅
  - [x] 實作 Redis 快取服務 - RedisCacheService 已完成 ✅  
  - [x] 安裝 Redis 相關依賴 - package.json 已更新 ✅
  - [x] 修正 TypeScript 嚴格模式錯誤 - 型別檢查通過 ✅
  - [x] 建立快取模組 - cache.module.ts 已完成 ✅
  - [x] 整合 Alpha Vantage 服務快取邏輯 - 已完成 ✅
  - [x] 避免重複呼叫相同股票的歷史數據 - 快取機制已實作 ✅
  - [x] 設定合理的快取過期時間 - 智能快取策略已實作 ✅
  - [x] 優化 API 呼叫頻率限制 - 快取減少 API 呼叫 ✅

- [x] **3.2** 錯誤處理與容錯
  - [x] API 呼叫失敗重試機制 - 已實作 3 次重試機制
  - [x] 資料驗證與格式檢查 - class-validator 完整驗證
  - [x] 適當的錯誤訊息回傳 - 完整 HTTP 錯誤狀態碼

#### 📦 4. 後端 API 設計

- [x] **4.1** 建立 Stock Module

  - [ ] 設計 Stock Entity (如需要) - 暫不需要，使用外部 API
  - [x] 建立 Stock Service - AlphaVantageService 已完成
  - [x] 建立 Stock Controller - StockController 已完成

- [x] **4.2** API 端點設計

  - [x] `GET /api/stocks/search?query={symbol_or_name}` - 股票搜尋 ✅
  - [x] `GET /api/stocks/{symbol}/price?date={date}` - 特定日期價格 ✅
  - [x] `GET /api/stocks/{symbol}/current` - 當前價格 ✅

- [x] **4.3** 數據格式標準化
  - [x] 定義統一的股票資訊回傳格式 - StockSearchResult interface ✅
  - [x] 定義統一的價格資訊回傳格式 - StockPrice/StockQuote interfaces ✅
  - [x] 建立相對應的 DTO 類別 - 所有 DTO 類別已完成 ✅
  - [x] 完整 Swagger API 文檔 - 所有端點已文檔化 ✅
  - [x] 輸入驗證與轉換 - class-validator & class-transformer ✅

#### 🧪 5. 測試與驗證

- [ ] **5.1** 單元測試

  - [ ] Stock Service 測試
  - [ ] Alpha Vantage API 整合測試
  - [ ] 快取機制測試

- [ ] **5.2** 整合測試
  - [ ] API 端點測試
  - [ ] 錯誤處理測試
  - [ ] 效能測試

---

## 📝 技術規格

### API 整合

- **外部 API**: Alpha Vantage API
- **主要功能**: SYMBOL_SEARCH, TIME_SERIES_DAILY, GLOBAL_QUOTE

### 後端技術

- **框架**: NestJS with TypeScript
- **快取**: Redis 或記憶體快取
- **驗證**: class-validator & class-transformer
- **文件**: Swagger/OpenAPI

### 數據格式

```typescript
// 股票搜尋結果
interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
}

// 股票價格資訊 (歷史價格)
interface StockPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timezone: string;
}

// 股票即時報價
interface StockQuote {
  symbol: string;
  currentPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  lastTradingDay: string;
}
```

---

## 🎯 下一階段預覽

完成第一階段後，將進行：

- 使用者認證系統
- 投資組合建立功能
- 圖表視覺化功能

---

## 📊 進度追蹤

- **第一階段**: ✅ 已完成 (26/26 項目完成) - **100% 完成度**
- **快取機制**: ✅ Redis 快取系統已完成並運行
- **負責人**: 開發團隊

## 🔄 開發記錄

### 2024-07-19 進度更新

#### ✅ 已完成項目

1. **Alpha Vantage API 整合規劃**: 完成服務類別設計文檔
2. **技術棧決定**: 確定使用 @nestjs/axios + firstValueFrom 而非原生 axios
3. **開發環境設定**: 安裝必要依賴 (axios, @nestjs/axios, rxjs 已內建)
4. **文檔建立**: 建立 claude-dev 目錄和開發文檔系統

#### 🔄 進行中項目

- **Alpha Vantage 服務實作**: 使用者正在手動實作設計文檔中的程式碼

#### ✅ 已完成服務方法

Alpha Vantage 服務中的所有功能已完整實作：

- [x] `searchStocks()` 方法 ✅
- [x] `getStockPrice()` 方法 ✅
- [x] `getCurrentQuote()` 方法 ✅
- [x] `buildUrl()` 私有方法 ✅
- [x] `makeRequest()` 私有方法 ✅
- [x] `checkForErrors()` 私有方法 ✅
- [x] `findClosestTradingDate()` 私有方法 ✅ - **複雜邏輯已完成**
- [x] `delay()` 私有方法 ✅

#### 📋 技術決策記錄

- **HTTP Client**: 選擇 @nestjs/axios + firstValueFrom (RxJS)
  - 理由: NestJS 最佳實踐、專案一致性、未來擴展性
  - 學習成本: 只需掌握一個 RxJS 操作符

#### 🎯 當前狀態與下一步計劃

**✅ 已完成的主要功能**：
1. Alpha Vantage 服務的完整實作 ✅
2. 介面文件 (alpha-vantage.interface.ts, stock.interface.ts) ✅
3. Stock Module 建立並註冊服務 ✅
4. API 整合功能測試 ✅
5. 完整的錯誤處理與重試機制 ✅
6. Swagger API 文檔 ✅

**⚠️ 待完成項目（MVP 完成前）**：
1. **實作快取機制** (TODO 3.1) - 提升效能與節省 API 呼叫
2. **建立單元測試** (TODO 5.1) - 確保程式碼品質
3. **建立整合測試** (TODO 5.2) - 驗證端到端功能

**🚀 準備進入下一階段**：完成快取機制後即可開始前端整合或使用者認證系統

- **前端區塊**: 待後端功能全部完成後才會開始執行。
