# Claude Code 重啟 Prompt

請使用以下 prompt 來重新啟動 Claude Code 會話：

---

**Prompt:**

```
請讀取 CLAUDE.md 和 TODO.md，然後協助我繼續 IStocks 專案的開發。

目前狀態：
- 已完成 Alpha Vantage API 服務實作 (TODO 1.1 ✅)
- 下一步需要實作股票搜尋 API Controller (TODO 1.2)
- 實作計劃已準備在 claude-dev/02-stock-controller-implementation.md

請檢查 claude-dev 資料夾中的文件，了解目前進度，並準備協助實作 TODO 1.2。

記住我們的開發流程：
1. 你只在 claude-dev/ 資料夾中提供實作建議
2. 我會親自審核並手動實作程式碼
3. 完成後你檢查實作結果並更新 TODO.md 狀態
4. 一次只處理一個 TODO 項目
```

---

## 🔄 會話重啟後的預期行為

1. **讀取專案文件**: Claude 會讀取 CLAUDE.md、TODO.md
2. **檢查進度**: 查看 claude-dev/ 資料夾了解目前狀態  
3. **識別當前任務**: 認知到需要協助 TODO 1.2 的實作
4. **準備協助**: 等待你的指示開始實作或審核

## 📂 重要檔案位置

- **專案說明**: `/CLAUDE.md`
- **任務清單**: `/TODO.md` 
- **實作文件**: `/claude-dev/` 資料夾
- **當前任務**: `claude-dev/02-stock-controller-implementation.md`

## 🎯 當前進度摘要

- ✅ **完成**: Alpha Vantage API 服務 (股票搜尋、歷史價格、即時報價)
- 🔄 **進行中**: 股票搜尋 API Controller 實作 (TODO 1.2)
- ⏳ **待辦**: 歷史價格 API、即時報價 API (TODO 2.1, 2.2)

使用此 prompt 可以確保 Claude Code 快速進入開發狀態！