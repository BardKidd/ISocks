# Turborepo 介紹

Turborepo 是一個為 JavaScript 和 TypeScript monorepos 設計的高效能建置系統。它由 Vercel 開發，旨在透過優化任務執行和快取來加速開發流程。

## 核心概念

### Monorepo

Monorepo 是一種將多個專案（例如 `apps` 和 `packages`）儲存在同一個程式碼儲存庫中的策略。Turborepo 特別擅長管理和優化這種結構的工作流程。

### Pipeline

Turborepo 的核心是 `pipeline` 的概念，它定義在 `turbo.json` 檔案中。Pipeline 描述了儲存庫中不同任務（如 `build`, `test`, `lint`）之間的依賴關係。Turborepo 根據這些依賴關係來優化任務的執行順序。

### 任務 (Tasks)

任務是在 `package.json` 的 `scripts` 中定義的命令。Turborepo 會執行這些任務，並根據 `turbo.json` 中的設定來快取它們的結果。

## 主要功能

1.  **增量建置 (Incremental Builds)**
    Turborepo 會記住你執行過的任務內容，並且只重新執行發生變動的部分。它會快取之前任務的輸出，如果沒有任何變動，則直接重用快取的結果。

2.  **內容感知快取 (Content-aware Hashing)**
    Turborepo 會根據檔案內容來建立快取，而不是根據檔案的時間戳。這確保了只有在檔案內容實際變更時，才會觸發任務的重新執行。

3.  **平行執行 (Parallel Execution)**
    Turborepo 會利用你電腦的所有核心來平行執行任務，以最大限度地縮短建置時間。它會建立一個任務的依賴關係圖，並以最高效的方式來安排執行。

4.  **遠端快取 (Remote Caching)**
    Turborepo 支援與團隊成員和 CI/CD 系統共享快取。這意味著如果你的同事已經建置過某個專案，你可以直接下載並使用他們的快取結果，而無需在本地重新建置。

5.  **任務管線 (Task Pipelines)**
    透過在 `turbo.json` 中定義任務之間的依賴關係，Turborepo 可以智能地決定任務的執行順序。例如，它知道在執行 `test` 或 `lint` 之前，必須先完成 `build` 任務。

## 使用 Turborepo 的好處

*   **更快的建置速度**：透過快取和平行執行，大幅縮短本地和 CI/CD 的建置時間。
*   **簡化 Monorepo 管理**：提供一個統一的視圖來管理和執行所有專案的任務。
*   **節省計算資源**：避免重複執行相同的任務，從而節省時間和計算成本。
*   **易於整合**：可以與現有的 JavaScript/TypeScript 工具鏈（如 npm, yarn, pnpm）無縫整合。

總結來說，Turborepo 是一個強大的工具，可以顯著提升 Monorepo 專案的開發效率。
