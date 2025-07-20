# IStocks 開發待辦事項

> 請讀取 CLAUDE.md 和 TODO.md，然後協助我繼續 IStocks 專案的開發。

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

- [ ] **1.2** 實作股票搜尋 API
  - [ ] 支援公司名稱搜尋 (ex: "Apple", "台積電")
  - [ ] 支援股票代碼搜尋 (ex: "AAPL", "2330.TW")
  - [ ] 返回標準化的股票資訊格式

#### 💰 2. 股票價格查詢功能

- [ ] **2.1** 歷史價格查詢

  - [ ] 根據指定日期取得收盤價
  - [ ] 處理非交易日的邏輯 (取得最近交易日價格)
  - [ ] 支援不同交易所的時區處理

- [ ] **2.2** 即時價格查詢
  - [ ] 取得當前市場價格
  - [ ] 判斷市場開盤/收盤狀態
  - [ ] 處理盤後價格顯示

#### 🗄️ 3. 數據快取與優化

- [ ] **3.1** 實作快取機制

  - [ ] 避免重複呼叫相同股票的歷史數據
  - [ ] 設定合理的快取過期時間
  - [ ] 優化 API 呼叫頻率限制

- [ ] **3.2** 錯誤處理與容錯
  - [ ] API 呼叫失敗重試機制
  - [ ] 資料驗證與格式檢查
  - [ ] 適當的錯誤訊息回傳

#### 📦 4. 後端 API 設計

- [ ] **4.1** 建立 Stock Module

  - [ ] 設計 Stock Entity (如需要)
  - [ ] 建立 Stock Service
  - [ ] 建立 Stock Controller

- [ ] **4.2** API 端點設計

  - [ ] `GET /api/stocks/search?query={symbol_or_name}` - 股票搜尋
  - [ ] `GET /api/stocks/{symbol}/price?date={date}` - 特定日期價格
  - [ ] `GET /api/stocks/{symbol}/current` - 當前價格

- [ ] **4.3** 數據格式標準化
  - [ ] 定義統一的股票資訊回傳格式
  - [ ] 定義統一的價格資訊回傳格式
  - [ ] 建立相對應的 DTO 類別

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

// 股票價格資訊
interface StockPrice {
  symbol: string;
  date: string;
  price: number;
  currency: string;
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours';
  lastUpdated: string;
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

- **第一階段**: 🔄 進行中 (3/21 項目完成)
- **預估完成時間**: 規劃中
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

#### ⚠️ 待實作功能

以下 Alpha Vantage 服務中的功能需要完整實作：

- [ ] `searchStocks()` 方法
- [ ] `getStockPrice()` 方法
- [ ] `getCurrentQuote()` 方法
- [ ] `buildUrl()` 私有方法
- [ ] `makeRequest()` 私有方法
- [ ] `checkForErrors()` 私有方法
- [ ] `findClosestTradingDate()` 私有方法 - **特別需要邏輯實作**
- [ ] `delay()` 私有方法

#### 📋 技術決策記錄

- **HTTP Client**: 選擇 @nestjs/axios + firstValueFrom (RxJS)
  - 理由: NestJS 最佳實踐、專案一致性、未來擴展性
  - 學習成本: 只需掌握一個 RxJS 操作符

#### 🎯 下一步計劃

1. 完成 Alpha Vantage 服務的程式碼實作
2. 建立介面文件 (alpha-vantage.interface.ts, stock.interface.ts)
3. 建立 Stock Module 並註冊服務
4. 測試 API 整合功能

- **前端區塊**: 待後端功能全部完成後才會開始執行。
