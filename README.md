# openst-expert

特定領域 AI 專家化系統——利用線上大型 LLM 的通用推理能力，結合自建專業知識庫、
Agentic 多輪檢索、Knowledge Graph 與程式分析工具，讓通用 LLM 在特定領域（第一個
驗證領域：Minecraft Technical / 生電）逼近專家級分析能力。

與 `OpenST-QQBot` 是不同 repository、不同技術棧（Python/FastAPI + PostgreSQL + Qdrant，
OpenST-QQBot 是 Node/TypeScript + CSV/JSON），未來 OpenST-QQBot 只作為呼叫本系統
API 的 client 之一。詳見 [`docs/plan/00-overview-and-architecture.md`](docs/plan/00-overview-and-architecture.md)。

## 目錄結構

```text
openst-expert/
├── docs/
│   ├── plan/               開發計畫（原 EXPERT_SYSTEM_PLAN.md 拆分版，見 docs/plan/README.md）
│   └── legacy-reference/   從 OpenST-QQBot 各 worktree 挖出的既有規格、程式碼與資料
├── benchmark/
│   └── gold_dataset/       評測題庫、機器推薦回歸基準、文件攝取測試 fixture
└── raw-data/               MVP 第一批要匯入的實際領域資料（詞典、GTMC 文件、機器目錄）
```

## 從這裡開始

1. 讀 [`docs/plan/README.md`](docs/plan/README.md) 依序了解完整架構設計。
2. 讀 [`docs/legacy-reference/README.md`](docs/legacy-reference/README.md) 了解哪些規則/資料
   已經在 OpenST-QQBot 的其他分支上想清楚，不要重新設計一次。
3. `raw-data/` 是實際會被匯入的內容，`benchmark/gold_dataset/` 是驗證匯入與檢索是否正確的
   題庫與 fixture。

本 repo 目前只是本地整理，尚未推送到遠端。
