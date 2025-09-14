# 教學：建立 CI 自動化檢查流程 (Lint & Format)

本教學將引導你建立一個 GitHub Actions 工作流程 (Workflow)，用於在你的專案中自動執行程式碼樣式檢查 (Linting) 和程式碼排版檢查 (Formatting)。

這是一個非常好的實踐，能確保所有貢獻到專案的程式碼都符合團隊的開發規範，提升程式碼的品質與一致性。

## 為什麼需要這個？

- **自動化**：無需手動執行檢查指令，每次提交程式碼時自動執行。
- **品質保證**：在程式碼合併到主分支前，就能發現並修正樣式與排版問題。
- **團隊協作**：確保所有團隊成員都遵循相同的程式碼風格，提升程式碼的可讀性。

---

### 步驟一：建立 Workflow 資料夾

GitHub Actions 會在你的專案根目錄下尋找一個名為 `.github/workflows` 的特定資料夾。所有的工作流程檔案都必須存放在這裡。

```bash
mkdir -p .github/workflows
```

### 步驟二：建立 Workflow YAML 檔案

在 `.github/workflows` 資料夾中，建立一個新的 YAML 檔案，例如 `ci-checks.yml`。

```bash
touch .github/workflows/ci-checks.yml
```

### 步驟三 (建議)：建立 `.nvmrc` 檔案

為了確保本地開發與 CI 環境的 Node.js 版本一致，最佳實踐是在專案根目錄建立一個 `.nvmrc` 檔案。

```bash
# 在 .nvmrc 檔案中寫入你專案使用的 Node.js 版本
echo "v20.11.1" > .nvmrc
```

後續的 workflow 會直接讀取這個檔案來設定 Node.js 版本。

### 步驟四：撰寫 Workflow 內容

將以下內容複製並貼到你剛剛建立的 `ci-checks.yml` 檔案中。

這個設定包含了兩個**平行執行**的任務 (Job)：`lint` 和 `format`。

```yaml
# .github/workflows/ci-checks.yml

name: Code Style and Formatting Checks

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # --- 第一個 Job：執行 Lint ---
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Setup Node.js from .nvmrc
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Linter
        run: pnpm lint

  # --- 第二個 Job：檢查 Format ---
  format:
    runs-on: ubuntu-latest
    steps:
      # 每個 Job 都需要自己的設定，因為它們在獨立的虛擬機上執行
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Setup Node.js from .nvmrc
        uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Check Formatting
        # 重要：CI 中應該用「檢查」指令，而不是「寫入」指令
        # 例如：prettier --check . 而不是 prettier --write .
        run: pnpm format
```

#### **重點說明**

1.  **兩個 Job**：我們定義了 `lint` 和 `format` 兩個獨立的 Job。
2.  **平行執行**：預設情況下，`jobs` 列表中的所有 Job 都會同時開始執行，這可以縮短整體的等待時間。
3.  **獨立環境**：每個 Job 都在一個全新的虛擬機中執行，因此它們都需要各自完成 `checkout`, `setup-node`, `install` 等前置步驟。
4.  **清晰回饋**：在 GitHub 的 Pull Request 頁面，你會看到兩個獨立的檢查項，可以清楚地知道是 Lint 失敗還是 Format 失敗。
5.  **指令要求**：請確保你的 `package.json` 中有 `lint` 和 `format` 這兩個 `scripts`。`format` 指令應該是**檢查性質**的 (例如 `prettier --check .`)，而不是會修改檔案的指令。

### 步驟五：提交你的變更

將新建立的檔案加入到 Git 中，並提交到你的儲存庫。

```bash
git add .nvmrc .github/workflows/ci-checks.yml
git commit -m "feat: Add parallel CI checks for lint and format"
git push
```

### 步驟六：驗證結果

提交後，你可以到你的 GitHub 儲存庫頁面，點擊上方的 **Actions** 標籤。你應該會看到一個新的 workflow 正在執行。

如果你建立一個新的 Pull Request，你也會在 PR 的頁面下方看到 **lint** 和 **format** 這兩個獨立的檢查項，以及它們各自的執行結果。

---

恭喜！你已經成功建立了一個更完整、更高效的 CI 檢查流程。
