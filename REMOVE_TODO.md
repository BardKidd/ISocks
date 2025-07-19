# REMOVE_TODO.md

本文件列出需要移除的項目，以解決因已刪除文件導致的依賴錯誤問題。

## 🚨 發現的問題

運行 `pnpm dev` 時發現以下錯誤：

```
Backend:dev: src/app.module.ts:12:30 - error TS2307: Cannot find module './events/events.module' or its corresponding type declarations.
Backend:dev: import { EventsModule } from './events/events.module';
```

## 📋 需要移除的項目清單

### Backend (NestJS) 需要移除：

#### 1. EventsModule 相關引用
- **文件位置**: `apps/Backend/src/app.module.ts`
- **需要移除的內容**:
  - 第 12 行: `import { EventsModule } from './events/events.module';`
  - 第 52 行: 在 imports 數組中的 `EventsModule,`
- **原因**: `./events/events.module` 文件已被刪除，但引用仍存在

### Frontend (React) 需要移除：

#### 1. 已刪除頁面的路由引用
- **文件位置**: `apps/Frontend/src/routes.tsx`
- **需要移除的內容**:
  - 第 3 行: `import About from './pages/About';`
  - 第 7 行: `import GeminiPage from './pages/GeminiPage';`
  - 第 8 行: `import ChatRoom from './pages/ChatRoom';`
  - 第 5 行: `import MyFormStudy from './pages/Form';`
  - 相對應的路由定義:
    - 第 23 行: `<Route path="about" element={<About />} />`
    - 第 24 行: `<Route path="form" element={<MyFormStudy />} />`
    - 第 25 行: `<Route path="gemini" element={<GeminiPage />} />`
    - 第 26 行: `<Route path="chatroom" element={<ChatRoom />} />`

#### 2. Socket.io 相關文件和依賴
- **需要移除的文件**:
  - `apps/Frontend/src/socket.ts` (完整文件)
  - `apps/Frontend/src/components/Chat.tsx` (完整文件)
- **需要移除的依賴引用**:
  - `socket.io-client` package 依賴 (在 package.json 中)

#### 3. 已刪除類型文件的引用
- **影響的文件**: 
  - `apps/Frontend/src/socket.ts` (若保留需要創建類型文件)
  - `apps/Frontend/src/components/Chat.tsx` (若保留需要創建類型文件)
- **缺失的類型文件**: `@/types/socket` (已被刪除)

#### 4. 權限配置清理
- **文件位置**: `apps/Frontend/src/mock/permission.ts`
- **需要移除的內容**:
  - About 頁面權限配置 (第 28-39 行)
  - Form 頁面權限配置 (第 40-51 行)  
  - Gemini 頁面權限配置 (第 52-63 行)
  - ChatRoom 頁面權限配置 (第 64-76 行)

## 🎯 建議處理順序

1. **優先處理 Backend 錯誤** - 移除 EventsModule 引用，讓後端可以正常啟動
2. **清理 Frontend 路由** - 移除已刪除頁面的路由和引用
3. **移除 Socket.io 相關** - 移除 socket 文件和相關依賴
4. **清理權限配置** - 移除不存在頁面的權限設定
5. **清理 package.json** - 移除不再使用的依賴包

## ⚠️ 注意事項

- 在移除 socket.io-client 依賴前，確認沒有其他地方還在使用
- 移除路由後，如果有導航選單引用這些路徑，也需要一併移除
- 建議逐步移除並測試，確保每個步驟都不會引入新的錯誤