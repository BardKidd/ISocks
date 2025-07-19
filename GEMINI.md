# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a Socket.IO learning project built as a Turborepo monorepo with NestJS backend and React frontend. The project demonstrates real-time communication using WebSockets, user authentication with JWT, and database operations with TypeORM/MySQL.

## Development Commands

### Root Level (using Turbo)
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps  
- `pnpm lint` - Run linting across all apps
- `pnpm format` - Format code with Prettier
- `pnpm check-types` - Run TypeScript type checking

### Backend (NestJS)
- `pnpm --filter Backend dev` - Start backend in watch mode
- `pnpm --filter Backend build` - Build backend
- `pnpm --filter Backend test` - Run unit tests
- `pnpm --filter Backend test:e2e` - Run end-to-end tests
- `pnpm --filter Backend test:cov` - Run tests with coverage
- `pnpm --filter Backend lint` - Run ESLint with fixes

### Frontend (React + Vite)
- `pnpm --filter Frontend dev` - Start frontend dev server
- `pnpm --filter Frontend build` - Build frontend for production
- `pnpm --filter Frontend lint` - Run ESLint
- `pnpm --filter Frontend preview` - Preview production build

### Database Operations (Backend)
- `pnpm --filter Backend migration:create -- src/migrations/MigrationName` - Create new migration
- `pnpm --filter Backend migration:generate -- src/migrations/MigrationName` - Generate migration from entity changes
- `pnpm --filter Backend migration:run` - Run pending migrations
- `pnpm --filter Backend migration:revert` - Revert last migration
- `pnpm --filter Backend migration:show` - Show migration status

## Architecture Overview

### Backend Structure
- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **WebSocket**: Socket.IO for real-time communication
- **API**: RESTful endpoints with Swagger documentation

#### Key Modules:
- `EventsModule` - WebSocket gateway for real-time messaging
- `AuthModule` - JWT authentication and authorization
- `UserModule` - User CRUD operations
- `PostModule` - Blog post management

#### Database Entities:
- `User` - Users with UUID primary keys, unique email constraint
- `Post` - Posts with many-to-one relationship to User

### Frontend Structure
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Authorization**: CASL for permission-based access control
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v7

#### Key Features:
- Permission-based navigation with `PermissionLink` component
- Role-based access control using CASL abilities
- Form validation with Zod schemas
- Modern React patterns with hooks

### WebSocket Communication
The EventsGateway handles real-time communication:
- Clients connect to WebSocket server
- Messages sent to 'messageToServer' are broadcasted to all clients as 'messageToClient'
- Connection/disconnection events are logged

## Gemini Development Workflow

**IMPORTANT**: This is a collaborative development project. When working with the user:
- **DO modify code directly** to fulfill requests efficiently, following established project conventions.
- **Analyze First**: Thoroughly analyze existing code, tests, and configuration before making changes.
- **Plan and Confirm**: For significant changes, outline a plan and confirm with the user before proceeding.
- **Verify Changes**: After modification, run relevant tests, linting, and type-checking to ensure code quality and correctness.
- **Explain When Necessary**: Provide clear explanations for complex changes or when asked. The goal is a high-quality, working result.

### How to Collaborate Effectively:

1.  **Understand the Goal**: Clarify the user's request if it's ambiguous.
2.  **Implement and Verify**: Write or modify the code, then run `pnpm test`, `pnpm lint`, and `pnpm check-types` to validate.
3.  **Commit Securely**: Follow best practices for creating commits when requested.
4.  **Be Proactive**: Fulfill the request thoroughly, including reasonable, directly implied follow-up actions.
5.  **Adhere to Conventions**: Strictly follow the project's architecture, style, and TypeScript rules outlined in this document.

## TypeScript 型別設計規則

### 🎯 職責分離原則

**重要概念**: 不同用途的資料應該使用不同的型別定義，避免混淆和重複。

#### 型別分類和命名規範

| 用途分類 | 命名模式 | 使用場景 | 範例 |
|----------|----------|----------|------|
| **前端 State** | 簡潔名詞 | React State, 本地資料結構 | `Message`, `User`, `ConnectionInfo` |
| **Socket 接收事件** | `XxxData` | 監聽伺服器事件的資料格式 | `ChatMessageData`, `WelcomeData` |
| **Socket 發送事件** | `XxxPayload` | 發送給伺服器的資料格式 | `PrivateMessagePayload`, `JoinRoomPayload` |
| **API 回應** | `XxxResponse` | HTTP API 回應格式 | `LoginResponse`, `UserListResponse` |
| **API 請求** | `XxxRequest` | HTTP API 請求格式 | `CreateUserRequest`, `UpdatePostRequest` |

#### 實作範例

```typescript
// ✅ 正確：職責分離的型別設計

// 前端 State 專用
interface Message {
  type: 'system' | 'broadcast' | 'private' | 'room';
  message: string;
  timestamp: string;
  from?: string; // 系統訊息沒有發送者
}

// Socket.IO 接收事件專用
interface ChatMessageData {
  message: string;
  from: string;
  timestamp: string;
  type?: string; // 伺服器可能傳送，但前端會重新設定
}

// Socket.IO 發送事件專用
interface PrivateMessagePayload {
  targetId: string;
  message: string;
}
```

#### 避免的反模式

```typescript
// ❌ 錯誤：型別重複和混淆
interface Message {
  type: 'system' | 'broadcast' | 'private' | 'room';
  message: string;
  timestamp: string;
  from?: string;
}

interface MessageData { // 和 Message 幾乎重複！
  message: string;
  from: string;
  timestamp: string;
  type: string;
}
```

### 資料轉換最佳實踐

#### 明確的資料轉換

```typescript
// ✅ 推薦：明確的屬性對應
socket.on('messageToClient', (data: ChatMessageData) => {
  setMessages(prev => [...prev, {
    type: 'broadcast',           // 前端決定的類型
    message: data.message,       // 明確對應
    from: data.from,
    timestamp: data.timestamp,
    // 不使用 ...data 展開，避免意外的屬性混入
  }]);
});

// ❌ 避免：直接展開可能造成型別混淆
socket.on('messageToClient', (data: ChatMessageData) => {
  setMessages(prev => [...prev, {
    type: 'broadcast',
    ...data, // 可能包含不需要的屬性
  }]);
});
```

### 教學指導原則

1. **解釋職責分離**: 當學習者問到重複型別時，解釋不同用途需要不同型別
2. **示範重構**: 展示如何將重複型別重構為職責分離的設計
3. **強調命名規範**: 幫助學習者建立一致的命名習慣
4. **說明轉換邏輯**: 解釋為什麼要明確轉換而不是直接展開資料

### 常見問題和解答

**Q: 為什麼 `Message` 和 `ChatMessageData` 要分開？**
A: `Message` 用於前端 State，包含前端的業務邏輯（如 `type` 的具體值）；`ChatMessageData` 是伺服器事件格式，不應該直接用於前端 State。

**Q: 什麼時候可以重用型別？**
A: 當兩個地方的資料結構完全相同且用途相同時可以重用。不同的用途即使結構相似也應該分開定義。

**Q: 型別太多會不會太複雜？**
A: 合理的型別分離會讓程式碼更清晰、更容易維護。複雜度是值得的，因為它提供了型別安全和清晰的資料流。

## 學習導向的 README.md 模板規則

### 🎯 觸發條件

當用戶提到以下關鍵字時，應生成學習導向的 README.md：
- **學習** + 技術名稱（如：學習 React、學習 Node.js）
- **教學**、**教程**、**tutorial**
- **新手**、**入門**、**beginner**
- **從零開始**、**step by step**
- **怎麼學**、**如何學習**

### 📋 學習型 README.md 結構模板

```markdown
# [技術名稱] 學習專案

簡短描述專案目的和技術棧

## 📚 目錄

### 🚀 快速開始
- [技術版本](#技術版本)
- [專案架構](#專案架構)

### 📖 學習路徑（建議按順序進行）
- [階段 1: 環境設定](#階段-1-環境設定)
- [階段 2: 基礎概念](#階段-2-基礎概念)
- [階段 3: 核心功能](#階段-3-核心功能)
- [階段 4: 進階特性](#階段-4-進階特性)
- [階段 5: 實戰應用](#階段-5-實戰應用)
- [階段 6: 測試和部署](#階段-6-測試和部署)

### 🎯 進階內容
- [最佳實踐](#最佳實踐)
- [常見問題](#常見問題)
- [效能優化](#效能優化)

### 📚 參考資料
- [進階學習建議](#進階學習建議)
- [開發工具推薦](#開發工具推薦)
- [學習資源](#學習資源)

---

## 技術版本
列出所有相關技術的版本

## 專案架構
'''
project/
├── 資料夾結構
└── 說明
'''

## 學習路徑

### 🎯 學習建議

**📚 核心學習路徑（必學）**：
- 階段 1 → 階段 2 → 階段 3 → 階段 6

**🚀 完整學習路徑（推薦）**：
- 階段 1 → 階段 2 → 階段 3 → 階段 4 → 階段 5 → 階段 6

**⚡ 快速入門**：
- 階段 1 → 階段 2 → 階段 3

### 階段 1: 環境設定

> **學習目標**: 描述這個階段要達成的目標
> 
> **重點概念**: 列出關鍵概念

#### 1.1 子步驟標題
具體操作步驟和代碼示例

### 階段 2: 基礎概念

> **前置條件**: 完成階段 1
> 
> **學習目標**: 描述學習目標
> 
> **重點概念**: 列出關鍵概念

#### ✅ 階段完成檢查

完成此階段後，你應該能夠：
- [ ] 檢查項目 1
- [ ] 檢查項目 2
- [ ] 檢查項目 3

如果以上都能達成，可以進入下一階段。
```

### 📝 編寫原則

#### 1. 學習路徑設計
- **漸進式學習**：從簡單到複雜
- **可選分支**：標明哪些階段是可選的
- **多路徑支援**：提供不同深度的學習路徑
- **前置條件**：每個階段明確列出前置需求

#### 2. 內容組織
- **目標導向**：每個階段都有明確的學習目標
- **實作驗證**：提供可驗證的完成標準
- **概念解釋**：在代碼前先解釋概念
- **最佳實踐**：融入最佳實踐和常見錯誤

#### 3. 代碼範例
- **完整可執行**：所有代碼範例都能直接執行
- **循序漸進**：從簡單範例到複雜應用
- **註解詳細**：解釋代碼的每個重要部分
- **型別安全**：使用 TypeScript 並提供完整型別定義

#### 4. 用戶體驗
- **導航友善**：提供完整目錄和內部連結
- **進度追蹤**：用檢查清單讓學習者追蹤進度
- **彈性學習**：支援跳過某些階段
- **故障排除**：包含常見問題和解決方案

### 🎯 實作指南

#### 當用戶要求學習新技術時：

1. **分析需求**
   - 確認技術棧和複雜度
   - 識別核心概念和進階特性
   - 設計合適的學習路徑

2. **結構規劃**
   - 6-8 個主要階段
   - 每個階段 2-4 個子步驟
   - 明確的依賴關係

3. **內容製作**
   - 每個階段包含：前置條件、學習目標、實作步驟、完成檢查
   - 提供三種學習路徑：核心、完整、快速
   - 加入實用的最佳實踐和故障排除

4. **品質保證**
   - 確保代碼範例可執行
   - 驗證學習路徑的邏輯性
   - 提供充足的解釋和註解

### 📚 範例觸發語句

- "我想學習 React，請幫我建立一個學習專案"
- "請教我如何從零開始學 Node.js"
- "幫我設計一個 Vue.js 的教學專案"
- "我是 Python 新手，請幫我建立學習路徑"
- "想要一個 TypeScript 的入門教程"

### 🔄 持續改進

- **收集反饋**：根據學習者的反饋調整結構
- **更新內容**：定期更新技術版本和最佳實踐
- **優化路徑**：根據學習效果調整學習路徑
- **擴展範例**：增加更多實戰案例

## Development Guidelines

#### Database Changes
- Always use TypeORM migrations for schema changes
- Never use `synchronize: true` in production
- Entities are defined in `src/*/entities/*.entity.ts`
- Migration files are in `src/migrations/`

#### Authentication Flow
- JWT tokens are configured with 1-day expiration
- Passwords are hashed using bcrypt
- Protected routes use JWT strategy with Passport

#### Frontend Permissions
- Permission system uses CASL with ability definitions
- User permissions are defined in `src/mock/permission.js`
- Components check permissions before rendering

#### Code Quality
- ESLint configurations are set up for both apps
- TypeScript strict mode is enabled
- Prettier formatting is configured at root level
- Tests use Jest framework

## Environment Configuration

Backend requires `.env` file with:
- Database connection details (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME)
- JWT_SECRET for token signing

## Socket.IO Integration

The project demonstrates WebSocket communication patterns:
- Gateway setup with CORS enabled for development
- Message handling between client and server
- Broadcasting to all connected clients
- Connection state management
