[索引](README.md) ｜ [← Evidence Workspace / Package / 最終驗證](07-evidence-and-verification.md) ｜ [分階段路線圖與 Benchmark →](09-roadmap-and-benchmark.md)

---

## 21. 現在不該做的功能（避免 Overengineering）

明確排除於 MVP / Phase 1 / Phase 2：

| 功能 | 排除到 | 理由 |
| --- | --- | --- |
| CodeQL 全量 Call Graph / DFG | Phase 2 後期，按需查詢起步 | 建置成本高，MVP 沒有足夠 Claim 需要程式驗證 |
| Eclipse JDT 語意解析 | Phase 2 後期 | 同上，先用 Tree-sitter 打樁 |
| Litematic / Blueprint 解析 | Phase 3+ | 需要先有穩定 Component 分類本體，MVP 沒有 |
| Dynamic Verification / Test Runner | Advanced | 需要獨立 MC 測試環境與 mod 開發，投入產出比在早期最低 |
| Neo4j / Memgraph | 只在 PG relations 遞迴查詢證實為瓶頸時才評估 | 見第7節 |
| ColBERT late interaction | Phase 2 | Cross-Encoder rerank 先驗證夠不夠用 |
| CPT（Continued Pretraining） | Advanced，且需先有 SFT 資料證明小模型不夠用 | CPT 成本高、風險高（catastrophic forgetting），優先做 LoRA/SFT |
| 完全自由的 autonomous agent（ReAct 自由生成 next action） | 不做 | 使用者明確要求 deterministic state machine，可控性優先 |
| 多語系（英文以外的其他領域語言）泛化驗證 | Advanced | 先在單一語言（繁中/簡中+英文技術詞）把 pipeline 打穩 |

MVP 的判斷準則：**任何功能若沒有辦法在 2 週內看到「Recall@10 是否提升」或「Unsupported Claim Rate 是否下降」這類量化訊號，就先不做**。

---

## 22. 建議先寫哪些服務 / 資料表 / API / 測試

實作優先序（對應 MVP，見第17節）：

**資料表（第一批遷移，已依 v2 修正更新）**：`game_versions`, `version_scopes`, `version_scope_versions`, `sources`, `source_revisions`, `documents`, `document_revisions`, `document_sections`, `chunks`, `concepts`, `concept_aliases`, `claims`, `claim_conditions`, `claim_exceptions`, `knowledge_objects`, `claim_evidence`, `human_reviews`, `relations`（先只用於 concept/claim/chunk 三種 `knowledge_objects.object_type`）。`mechanism_details`, `effect_details`, `constraint_details`, `application_details` 第二批。`farms`/`code_*`/`experiments` 第三批（對應 Phase 1/2）。`game_versions` 種子資料（Java 版本序列）必須在第一批就準備好，否則 `version_scopes` 無從建立。

**服務**：
1. Ingestion（先支援 dictionary-entry JSON + markdown + csv 三種 parser，對應現有 `dictionary/entries`、`gtmc-database`、`database.csv`，優先序見 5.1 節分級）
2. Claim Extraction + 最小審核 CLI/網頁
3. Retrieval（dense only 先上，sparse/RRF/rerank 第二輪）
4. Query Understanding（先用規則+既有 alias 表 + LLM few-shot 分類，不訓練小模型；別名比對可先移植 `dictionary.ts::matchDictionaryTerms` 的邏輯當降級 fallback，見 5.1.6）
5. Orchestrator（先實作 UNDERSTAND→PLAN→RETRIEVE→ASSESS 四狀態，REFORMULATE/RESOLVE_CONTRADICTION 第二輪）
6. Evidence Workspace/Package
7. Gateway `/v1/ask`

**API（MVP 必要）**：
- `POST /v1/ask` — 主入口
- `POST /ingest/document` — 匯入
- `GET/POST /review/claims` — 審核
- `GET /health`

**測試優先序**：
1. Claim atomic 檢查的 deterministic rule 單元測試
2. Version filter 正確性測試（確保跨版本資料不互相污染，這是整個系統可信度的底線）
3. Evidence Package schema 的 golden snapshot 測試
4. Retrieval Recall@K 對固定 10 題（先用小規模題庫起步，第16節）

---

## 23. MVP 定義

**MVP 目標**：驗證「Concept/Claim 資料模型 + 簡化版 Agent Loop + Evidence Package + Strong LLM」比「現有 CSV 語意搜尋直接丟給 LLM（即現有 QQBot 的 `/ask`）」在**至少一種指標**（Unsupported Claim Rate 或 Recall@10）上有可測量的提升。

**MVP 範圍**：

- 資料：`dictionary/entries`（979 筆，approved）+ `gtmc-database`（215 篇，approved）優先遷移；`database.json`（機器 metadata）次之；`database.csv`（4287 行，pending，先跑規則初篩+AI抽取）與 `Dictionary.txt`/`TechMC Glossary.csv`（pending）殿後——詳細對照與偽代碼見 5.1 節，不再沿用 KNOWLEDGE_SYSTEM_PLAN.md 舊規則重新設計
- 檢索：Dense-only（BGE-M3 dense 向量），無 sparse/rerank
- Graph：只用 `relations` 表存 concept↔mechanism↔claim 三種型別關係，種子資料直接來自 5.1.2 節 `dictionary/entries` 遷移產出的 979 筆 approved concept 與既有 `references` 關係，不需人工從零建立
- Agent：4 狀態 state machine（UNDERSTAND→PLAN→RETRIEVE→ASSESS），無 REFORMULATE 迴圈（先跑一輪，不夠就直接標 unknown）
- Claim：完整 Candidate→Review→Approved workflow，但審核介面可以是 CLI
- Code Intelligence / Litematic / Dynamic Verification / 小模型訓練：**完全不做**
- Evidence Package → Strong LLM → 簡化版 Final Verification（只做 deterministic 的 `claim_has_evidence`/`version_matches`，不做 AI verifier）

**完成條件**：對 15-20 題手工 gold 題庫（第16節子集），MVP pipeline 的 Unsupported Claim Rate 低於現有 `/ask` 直接 RAG 方式，且每題平均 latency 在可接受範圍（建議先設 <15s，不含人工審核時間）。

---

