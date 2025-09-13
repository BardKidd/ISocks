# IStocks 開發待辦事項

> 請讀取 CLAUDE.md, claude-dev 的內容, CLAUDE-md-workflow-update.md, restart-prompt, database-design.md 和 TODO.md，並 use context7 讀取最新套件資訊。然後協助我繼續 IStocks 專案的開發。

## 📋 專案概述

個人投資組合管理系統，允許使用者追蹤投資績效並與全球市場指數比較。

---

## 🎯 第一階段：股票數據 API 系統 (已完成)

**🏆 Phase 1 最終狀態: 100% 完成**

✅ Alpha Vantage 服務完整實作
✅ Redis 快取系統
✅ Stock API Controllers (搜尋、歷史、即時)
✅ 完整 Swagger API 文檔
✅ 錯誤處理與重試機制
✅ 完整測試套件 (單元測試 + 整合測試)

---

## 🎯 第二階段：投資組合系統與使用者擴展 (進行中)

> **備註**: 以下為根據 `claude-dev/database-design.md` 的初步開發規劃，具體細節與做法我們可以在開發過程中持續討論與調整。

### 核心功能規劃

#### 🗄️ 1. 資料庫與實體 (Entities)

- [x] **1.1** 擴展 User Entity，新增投資相關欄位
- [x] **1.2** 建立 Portfolio Entity
- [x] **1.3** 建立 Position Entity
- [x] **1.4** 建立 Transaction Entity
- [x] **1.5** 產生並執行資料庫遷移 (Migration) 以應用所有變更

#### 🔐 2. 認證與授權 (Auth)

- [ ] **2.1** 增強 JWT Payload，使其包含更多使用者資訊 (如姓名、偏好等)
- [ ] **2.2** 更新 Auth Service 的 `signIn` 方法以回傳擴展後的使用者資訊
- [ ] **2.3** 建立 Portfolio 的 CRUD 權限控制 (Guards)，確保使用者只能存取自己的投資組合

#### ⚙️ 3. 核心後端 API

- [ ] **3.1** 建立 Portfolio Module, Service, Controller
- [ ] **3.2** 實作 Portfolio 的 CRUD (Create, Read, Update, Delete) API 端點
- [ ] **3.3** 建立 Position Module, Service, Controller
- [ ] **3.4** 實作 Position 的 CRUD API 端點
- [ ] **3.5** 建立 Transaction Module, Service, Controller
- [ ] **3.6** 實作 Transaction 的 CRUD API 端點

#### 💹 4. 核心商業邏輯

- [ ] **4.1** 實作交易後自動計算持倉平均成本的邏輯
- [ ] **4.2** 建立排程服務 (Scheduler/Cron Job) 定期更新所有持倉的即時價格與價值

#### 🧪 5. 測試

- [ ] **5.1** 為 Portfolio, Position, Transaction 的 Service 撰寫單元測試
- [ ] **5.2** 為所有新的 API 端點撰寫 E2E 整合測試

### Phase 3+ 後續階段

- **前端應用**: React 19 + Vite + Apple HIG 2025 設計
- **圖表視覺化**: Chart.js 互動式圖表
- **效能分析**: 投資組合與市場指數比較
