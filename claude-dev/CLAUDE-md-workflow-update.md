# CLAUDE.md 開發工作流程更新建議

## 📋 目的
為了確保 Claude Code 始終遵循正確的開發工作流程，需要在 CLAUDE.md 中明確說明詳細的協作規則。

## 🔄 建議新增的工作流程說明

在 CLAUDE.md 的 "Development Workflow with Claude Code" 章節中，建議新增以下詳細說明：

```markdown
## Development Workflow with Claude Code

This project follows a structured development workflow between the user and Claude Code:

### 🚨 重要原則: Claude Code 只提供內容，使用者負責實作

**Claude Code 的責任**:
- 根據 TODO.md 識別當前需要完成的項目
- 在 `/claude-dev/` 資料夾中建立詳細的實作建議文件
- 提供程式碼片段、設計方案、和技術建議
- **絕對不可以**直接編輯專案檔案 (除非使用者明確要求)

**使用者的責任**:
- 審核 Claude Code 在 `/claude-dev/` 中提供的內容
- 親自實作程式碼到專案檔案中
- 完成實作後請 Claude Code 檢查並更新 TODO.md 狀態

### 1. 任務識別與規劃
- Claude Code 讀取 `TODO.md` 識別當前未完成的項目
- **重要**: 只專注於目前標記為 `[ ]` 的項目，不提前進行下一步
- 如果發現多個未完成項目，優先處理標記為進行中的項目

### 2. 內容生成與文檔化
- Claude Code 在 `/claude-dev/` 資料夾中建立對應的實作文件
- 檔案命名格式: `{序號}-{功能名稱}.md`
- 內容包含:
  - 程式碼片段 (小塊、可管理的)
  - 設計說明和技術決策
  - 實作步驟指引
  - 注意事項和測試建議

### 3. 審核與實作流程
- 使用者審核 `/claude-dev/` 中的文件內容
- 使用者親自將程式碼實作到專案檔案中
- **學習目的**: 這確保使用者理解每一行程式碼

### 4. 驗證與狀態更新
- 實作完成後，使用者請 Claude Code 檢查實作結果
- Claude Code 驗證程式碼是否符合設計文件
- Claude Code 更新 `TODO.md` 中對應項目的狀態為 `[x]`
- 標記下一個需要進行的項目

### 5. 迭代開發原則
- **一次只處理一個 TODO 項目**
- 等待使用者確認完成後才進行下一步
- 保持增量開發，避免大範圍修改
- 確保每個步驟都有適當的文檔記錄

### ⚠️ 重要提醒

**Claude Code 必須避免的行為**:
- ❌ 直接編輯專案檔案
- ❌ 提前進行未在 TODO.md 中標記的項目
- ❌ 批量處理多個 TODO 項目
- ❌ 假設使用者已完成某個步驟

**Claude Code 應該做的**:
- ✅ 仔細檢查 TODO.md 的當前狀態
- ✅ 只在 `/claude-dev/` 中提供內容
- ✅ 等待使用者確認後才繼續
- ✅ 提供詳細但分塊的指引

### 🔄 會話重啟處理
- 每次重新開始時，Claude Code 應該:
  1. 讀取 `CLAUDE.md` 了解專案和工作流程
  2. 讀取 `CLAUDE-md-workflow-update.md` 了解專案和工作流程
  3. 檢查 `TODO.md` 確認當前進度
  4. 檢查 `/claude-dev/` 中是否有未完成的文件
  5. 詢問使用者當前需要協助的具體項目
```

## 📝 建議的更新位置

將上述內容取代或補充現有的 "Development Workflow with Claude Code" 章節，讓工作流程更加明確和詳細。

## 🎯 預期效果

1. **一致性**: 每次重啟 Claude Code 都會遵循相同流程
2. **透明度**: 使用者清楚知道每個步驟的責任歸屬
3. **學習效果**: 使用者親自實作確保理解程式碼
4. **可追蹤性**: TODO.md 準確反映專案進度