# corrobora

為強通用 Agent 建立 **Domain Research Infrastructure / Agentic Research Memory**。
Agent 先搜尋可追溯的研究成果、判斷知識缺口，再按需閱讀專業文檔與 source code；
高價值 Findings 經 consolidation、版本與依賴管理後持續累積，來源變動時重新驗證。
第一個驗證領域為 Minecraft Technical／生電。

**目前是專案啟動前的規劃與資料準備 repository**：已有原始資料、benchmark fixtures
及舊 TypeScript／SQLite 參考碼；Python/FastAPI + PostgreSQL + Qdrant 是建議技術棧，
尚未建置可執行的 corrobora 服務。完整提案見
[`docs/plan/00-overview-and-architecture.md`](docs/plan/00-overview-and-architecture.md)，
實際盤點見 [`docs/plan/10-current-state-and-migrations.md`](docs/plan/10-current-state-and-migrations.md)。

## 目錄結構

```text
corrobora/
├── docs/
│   ├── plan/               架構討論、資料模型、MVP、遷移與長期評估計畫
│   └── legacy-reference/   從 OpenST-QQBot 各 worktree 挖出的既有規格、程式碼與資料
├── benchmark/
│   └── gold_dataset/       評測題庫、機器推薦回歸基準、文件攝取測試 fixture
└── raw-data/               詞典、GTMC、機器目錄與本機忽略追蹤的 Minecraft source
```

## 從這裡開始

1. 讀 [`docs/plan/README.md`](docs/plan/README.md) 依序了解完整架構設計。
2. 讀 [`docs/legacy-reference/README.md`](docs/legacy-reference/README.md) 了解哪些規則/資料
   已有可沿用經驗，以及哪些舊假設需要重新定位。
3. `raw-data/` 是實際會被匯入的內容，`benchmark/gold_dataset/` 是驗證匯入與檢索是否正確的
    題庫與 fixture。
