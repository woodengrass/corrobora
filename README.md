# corrobora

研究資料基礎設施的規劃 repository，主線為 Strong Agent + Raw Professional Corpus + Research Memory。
其中 Research Memory 是待比較的持久化底層，不是核心新穎性，也不預設 memory-first 最優；
持久化 Findings 只是一種待驗證的重用機制，需與無記憶基線做成本、正確性與重用傷害對照。
第一個候選驗證領域為 Minecraft Technical／生電，尚未開始驗證。

**目前是專案啟動前的規劃與資料準備 repository**：已有原始資料、benchmark fixtures
及舊 TypeScript／SQLite 參考碼；Python/FastAPI + PostgreSQL + Qdrant 是建議技術棧，
尚未建置可執行的 corrobora 服務，執行期 runtime 不存在。完整提案見
[`docs/plan/00-overview-and-architecture.md`](docs/plan/00-overview-and-architecture.md)，
實際盤點見 [`docs/plan/10-current-state-and-migrations.md`](docs/plan/10-current-state-and-migrations.md)。
文件中若出現 non-parametric continual learning，一律指待驗證假說／歷史用語，不代表已實現持續學習。

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

1. 讀 [`docs/plan/README.md`](docs/plan/README.md) 依序了解完整架構設計，建議順序為 00 → 10 → 08 → 09。
2. 讀 [`docs/legacy-reference/README.md`](docs/legacy-reference/README.md) 了解哪些規則/資料
   已有可沿用經驗，以及哪些舊假設需要重新定位。
3. `raw-data/` 是實際會被匯入的內容，`benchmark/gold_dataset/` 是驗證匯入與檢索是否正確的
    題庫與 fixture。
