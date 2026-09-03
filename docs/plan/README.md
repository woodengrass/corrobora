# openst-expert 開發計畫（索引）

本目錄是 `EXPERT_SYSTEM_PLAN.md` 的拆分版本，原始單一檔案已從 OpenST-QQBot repo 移出到這裡並拆成 10 篇，方便分頭閱讀與日後個別修訂。拆分只是切檔案，內容與交叉引用（「見第X節」）未改寫，讀到節號時仍對照原本的節號，只是現在分散在不同檔案裡。

## 閱讀順序

| # | 檔案 | 內容 |
| --- | --- | --- |
| 1 | [00-overview-and-architecture.md](00-overview-and-architecture.md) | 定位與範圍、一句話心智模型、整體架構圖、Repository 模組切分（原第0-2節） |
| 2 | [01-postgres-schema.md](01-postgres-schema.md) | PostgreSQL 完整 schema：來源版本控制、文件、術語/概念、Claim 系統、農場、實驗、程式碼符號、關係(knowledge_objects)、稽核（原第3節） |
| 3 | [02-qdrant-vector-design.md](02-qdrant-vector-design.md) | Qdrant collection/named vector/payload 設計、版本 filter、精確詞彙比對層（原第4節） |
| 4 | [03-ingestion-and-claims.md](03-ingestion-and-claims.md) | Ingestion Pipeline、現有 OpenST-QQBot 資產盤點與遷移對照（5.1節）、Claim 審核 workflow（原第5-6節） |
| 5 | [04-knowledge-graph-and-retrieval.md](04-knowledge-graph-and-retrieval.md) | PostgreSQL relations 版知識圖譜查詢、Dense+Sparse+RRF 檢索管線（原第7-8節） |
| 6 | [05-agent-design.md](05-agent-design.md) | Research State schema、Agent Tool API、State Machine、Stop Conditions（原第9-12節） |
| 7 | [06-code-intelligence-and-versioning.md](06-code-intelligence-and-versioning.md) | Code Intelligence Pipeline、MC 語意層、多版本對齊、Litematic、Dynamic Verification（原第13-17節） |
| 8 | [07-evidence-and-verification.md](07-evidence-and-verification.md) | Evidence Workspace、Evidence Package、Final Claim Verification（原第18-20節） |
| 9 | [08-scope-and-mvp.md](08-scope-and-mvp.md) | 不做的事、優先建置清單、MVP 定義（原第21-23節） |
| 10 | [09-roadmap-and-benchmark.md](09-roadmap-and-benchmark.md) | Phase Roadmap、Benchmark 規模、實際 Implementation Order（原第17-18節/附錄/結尾） |

## 相關目錄

- [../legacy-reference/](../legacy-reference/README.md) — 從 OpenST-QQBot 各 worktree 挖出的既有規格、程式碼與資料，寫 Python/Postgres 版實作前先看這裡有沒有現成規則可以照搬。
- [../../benchmark/gold_dataset/](../../benchmark/gold_dataset/) — 現成的評測題庫、機器推薦基準與文件攝取測試 fixture。
- [../../raw-data/](../../raw-data/) — 實際的領域資料（詞典、GTMC 技術文件、機器目錄、歷史 CSV），MVP 第一批匯入的原始素材。
