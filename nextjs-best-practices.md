# Next.js 大型專案最佳實踐

這份文件旨在為使用 Next.js 開發大型、可擴展且易於維護的企業級應用程式提供一套最佳實踐和架構指南。

## 1. 專案結構 (Project Structure)

一個清晰的專案結構是可擴展性的基礎。推薦採用以「功能」(feature) 或「領域」(domain) 為中心的組織方式。

```
/src
|-- /app                 # Next.js App Router 核心目錄
|-- /components          # 全域共享、無業務邏輯的純 UI 元件 (如 Button, Input)
|   |-- /ui              # (可選) 整合 shadcn/ui 或類似的基礎元件
|   `-- ...
|-- /constants           # 全域常數 (如 API 路徑, 設定值)
|-- /contexts            # 全域共享的 React Context
|-- /features            # ✨ **核心：按功能劃分模組**
|   |-- /auth            # 驗證功能
|   |   |-- /components  # 僅在 auth 功能內使用的元件
|   |   |-- /hooks       # 僅在 auth 功能內使用的 Hooks
|   |   |-- /services    # 處理 API 請求、業務邏輯
|   |   `-- /types.ts    # 該功能的 TypeScript 型別
|   |-- /dashboard       # 儀表板功能
|   `-- ...
|-- /hooks               # 全域共享的 Hooks
|-- /lib                 # 輔助函式、工具函式 (如 date-fns 設定, classnames 封裝)
|-- /services            # 全域的服務或 API Client 設定 (如 Axios instance)
|-- /store               # 狀態管理 (Zustand, Redux)
|-- /styles              # 全域樣式、Tailwind 基礎層
`-- /types               # 全域共享的 TypeScript 型別
```

**優點**：高內聚、低耦合。當您開發某個功能時，大部分時間都可以在同一個資料夾內完成，方便查找和修改。

## 2. 狀態管理 (State Management)

- **伺服器狀態 (Server State)**：對於從 API 獲取的資料，**強烈推薦**使用 `SWR` (由 Vercel 開發) 或 `React Query (TanStack Query)`。它們能自動處理快取、重新驗證、載入和錯誤狀態，避免您手動編寫大量 `useEffect` 和 `useState`。
- **客戶端狀態 (Client State)**：
    - **簡單狀態**：對於跨元件層級不深或僅限於單一頁面的狀態，優先使用 React 內建的 `useState`, `useReducer`, `useContext`。
    - **複雜全域狀態**：對於需要跨越多個頁面、頻繁更新的全域狀態（如使用者資訊、主題設定），推薦使用：
        - **Zustand**：輕量、現代、API 簡單，是目前社群非常推薦的選擇。
        - **Redux Toolkit**：功能強大、生態成熟，適合非常複雜的狀態邏輯。

## 3. 資料獲取 (Data Fetching)

- **統一的 API Client**：在 `/services` 或 `/lib` 中建立一個統一的 API 客戶端實例 (例如使用 `axios` 或 `ky`)。在此處統一處理請求攔截、回應攔截、`Authorization` 標頭的注入和錯誤處理。
- **環境變數**：API 的基礎路徑 (Base URL) 應存放在環境變數中，切勿寫死在程式碼裡。
- **型別安全**：如果後端提供 OpenAPI (Swagger) 規範，可使用工具 (如 `orval` 或 `openapi-typescript-codegen`) 自動生成請求函式和型別，確保前後端介面的一致性。

## 4. 元件化與樣式 (Components & Styling)

- **樣式方案**：
    - **Tailwind CSS**：強烈推薦。它提供了一致的設計系統，避免了 CSS 的全域污染問題，非常適合大型專案的協作。
    - **CSS-in-JS** (如 `styled-components`, `Emotion`)：如果專案需要大量基於 props 的動態樣式，這也是一個不錯的選擇。
- **元件庫**：
    - **shadcn/ui**：目前最受歡迎的選擇之一。它不是一個傳統的元件庫，而是提供一組可複製貼上、高度可自訂的基礎元件，讓您擁有完全的控制權。
    - **MUI, Ant Design**：如果需要功能更完整、開箱即用的元件，可以選擇這些成熟的元件庫。
- **元件開發與文檔**：使用 **Storybook** 來獨立開發、測試和記錄您的 UI 元件。這對於大型團隊分工合作至關重要。

## 5. 程式碼品質與一致性 (Code Quality & Consistency)

- **Linter & Formatter**：
    - **ESLint**：設定嚴格的規則來捕捉潛在錯誤和不規範的寫法。
    - **Prettier**：自動統一所有程式碼的格式，避免因格式問題在 Code Review 中浪費時間。
- **Git Hooks**：
    - 使用 `husky` 和 `lint-staged` 在每次 `git commit` 時自動執行 ESLint 和 Prettier，確保提交到倉庫的程式碼永遠是符合規範的。

## 6. 測試 (Testing)

大型專案必須有完善的測試策略，以確保穩定性。
- **單元測試 (Unit Testing)**：
    - **工具**：`Jest` + `React Testing Library`。
    - **目標**：測試獨立的函式、Hooks 和簡單的 UI 元件。
- **整合測試 (Integration Testing)**：
    - **工具**：同樣使用 `Jest` + `React Testing Library`。
    - **目標**：測試多個元件協同工作的場景（例如：測試一個完整的表單提交流程）。
- **端到端測試 (E2E Testing)**：
    - **工具**：`Cypress` 或 `Playwright`。
    - **目標**：模擬真實使用者在瀏覽器中的操作流程，確保關鍵業務流程（如登入、購物、結帳）正常運作。

## 7. 環境變數 (Environment Variables)

- **命名規範**：使用 `NEXT_PUBLIC_` 前綴的變數會暴露在瀏覽器端，適用於 API URL 等公開資訊。沒有此前綴的變數僅在伺服器端可用，適用於資料庫密碼、私鑰等敏感資訊。
- **管理**：使用 `.env.local` 儲存本地開發環境的變數（此檔案不應提交到 Git）。在 Vercel 或其他託管平台上，使用其提供的儀表板來管理生產環境的變數。

## 8. 驗證與授權 (Authentication & Authorization)

- **解決方案**：**絕對不要自己造輪子**。
    - **NextAuth.js (Auth.js)**：社群首選，與 Next.js 深度整合，支援多種驗證方式 (OAuth, Email, Credentials)。
    - **第三方服務**：`Clerk`, `Auth0`, `Firebase Auth` 等提供了更完整的使用者管理後台。
- **權限控制**：在前端實現基於角色的元件/頁面顯示控制，但**最終的權限驗證必須在後端 API 完成**。

## 9. TypeScript 實踐

- **嚴格模式**：在 `tsconfig.json` 中啟用 `strict: true`。
- **避免 `any`**：盡最大努力為所有變數、函式參數和回傳值提供準確的型別。
- **共享型別**：將後端 API 回應的資料結構定義為共享型別，並在整個前端應用中重複使用。
