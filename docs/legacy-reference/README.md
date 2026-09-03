# Legacy Reference：從 OpenST-QQBot 各 worktree 挖出的既有資產

OpenST-QQBot 的 `main` 分支刻意保持接近原作者版本，但該倉庫還有幾個尚未合併回
`main` 的 worktree/分支，裡面其實已經做了一輪相當完整的「知識系統」規劃與實作
（T0～T1.5a 這幾個 Track），比本專案 `docs/plan/` 目前的階段更早，且是針對
SQLite + Node/TypeScript 打造的。這些內容雖然技術棧不同，但規則、資料與測試
資產本身是語言無關的，值得在寫 Python/Postgres 版實作前先讀過，避免把已經想清楚
的細節重新想一次、甚至想錯。

## 來源 worktree

以下 worktree 在 2026-09 盤點時互為子集關係，`OpenST-QQBot-t1.2a` 的提交歷史
包含其餘三個的全部內容，是本次盤點的唯一來源：

| Worktree | 分支 | 狀態 |
| --- | --- | --- |
| `OpenST-QQBot-t1.2a` | `feature/t1.2a-worker-raw-scanner` | 最新，涵蓋下方全部三者 |
| `OpenST-QQBot-t1.2b` | `feature/t1.2b-raw-migration` | 已被 t1.2a 包含 |
| `OpenST-QQBot-t1.4a` | `feature/t1.4a-machine-sync` | 已被 t1.2a 包含 |
| `OpenST-QQBot-t1.5a` | `feature/t1.5a-machine-baseline` | 已被 t1.2a 包含 |

`.claude/worktrees/` 下兩個 worktree 與 `main` 同一 commit，`OpenST-QQBot-e890395-review`
與 `t1.2a` 同一 commit，皆無獨立內容，未再另外盤點。

## 目錄內容與如何使用

| 檔案 | 原始位置（t1.2a） | 這是什麼 | 怎麼用在本專案 |
| --- | --- | --- | --- |
| [`knowledge-system-plan-v2-sqlite.md`](knowledge-system-plan-v2-sqlite.md) | `KNOWLEDGE_SYSTEM_PLAN.md`（1738 行，main 上只有 309 行的舊版） | 比 main 分支更完整的知識系統規劃，含雙進程架構、SQLite schema、T0-T1.5a 详细 Track 規格 | **交叉核對用**，不是要照抄 SQLite schema，而是它比 `docs/plan/01-postgres-schema.md` 早想清楚很多資料完整性細節（見下方逐項對照），寫 Python 版時遇到猶豫的地方先來這裡查有沒有現成答案 |
| [`document-ingestion-rules.md`](document-ingestion-rules.md) | `docs/document-ingestion.md`（T0.5） | 通用文件攝取規則：canonical hash 正規化（處理 CRLF/LF 平台差異）、`stub`/`navigation`/`not_found`/`duplicate_exact` 等確定性判定規則（R1-R8, S1-S4）、AI JSON 契約（`document_triage`/`document_quality`/`conflict_review`）、materialize 條件 | **直接可用的規則清單**——`docs/plan/03-ingestion-and-claims.md` 目前只有粗略的 pipeline 骨架，這份文件把「怎麼判斷一段文字是不是廣告/占位/導航頁」「跨平台雜湊怎麼算才不會因換行符不同而誤判重複」這類細節都想清楚了，Python 版 ingestion 直接照這份規則實作即可，不需要重新設計 |
| [`source-policy.md`](source-policy.md) | `docs/source-policy.md`（T0.1） | 逐一列出 GTMC、Storage Tech Dictionary、TechMC Glossary、legacy CSV 等來源的真實授權、trust_level、署名規則、公開匯出限制 | **直接可用的種子資料**——對應 `docs/plan/01-postgres-schema.md` 的 `sources` 表，這張表已經把每個來源的 `license`/`trust_level`/`visibility` 都調查清楚了（例如 TechMC Glossary 授權未確認、不可公開匯出），Python 版 `sources` 表的第一批 seed data 直接照這裡的表格填 |
| [`testing-standards.md`](testing-standards.md) | `docs/code-testing.md` | 單元測試原則（不追求覆蓋率、只測純函式/狀態轉移/權限檢查、AI 呼叫不做單元測試） | 給 Python 版測試策略當參考基準，原則本身跨語言通用 |
| [`data-audit.json`](data-audit.json) | `docs/data-audit.json` | 對 `sources`/`fileHashes` 做的欄位級資料盤點結果 | 交叉核對 `docs/plan/03-ingestion-and-claims.md` 5.1 節的資產分級是否有遺漏 |
| [`eval-baseline-notes.md`](eval-baseline-notes.md) | `eval/README.md` | 說明 `baseline-machines.json` 用途與 `npm run eval:machines` 回歸測試流程 | 參考「遷移推薦邏輯到新資料庫時如何驗證不回歸」的方法論 |
| [`enums.reference.ts`](enums.reference.ts) | `src/db/enums.ts`（533 行） | 完整的審核狀態、品質旗標、AI 任務類型、Claim 條件/證據/關係類型等枚舉，以及狀態機合法轉移規則 | **對照表**：Python 版的 `review_status`/`confidence`/`quality_flags` 等列舉值直接參考這裡，這是目前兩個專案中最完整的一份列舉定義，`docs/plan` 裡對應的 enum 應該跟這裡對齊或說明差異 |
| [`sourcePolicy.reference.ts`](sourcePolicy.reference.ts) | `src/db/sourcePolicy.ts` | 讀取來源政策表、禁止程式碼中硬編碼授權資訊的實作 | 設計 Python 版 `sources` 存取層時的介面參考 |
| [`migrations/`](migrations/) | `src/db/migrations/*.sql` | 實際跑過的 SQLite DDL（`sources`/`raw_assets`/`machines`/`machine_tags` 等），含機器來源移除標記、raw asset 身分識別等後續修正 | 與 `docs/plan/01-postgres-schema.md` 的 PostgreSQL schema **對照用**，不是直接拿來執行（SQLite 語法與 PG 不同），但欄位設計與修正歷程值得參考 |
| [`ingestion-pipeline-code/`](ingestion-pipeline-code/) | `src/db/import/*.ts`、`src/worker.ts`、`src/workerSupervisor.ts`、`scripts/audit-knowledge-data.ts`、`scripts/lib/auditCalculations.ts`、`scripts/eval-machines.ts` | 實際跑過的 TypeScript 匯入器（Raw 掃描器、機器同步器、AI 任務佇列）、雙進程 Worker 架構、資料稽核工具、機器推薦回歸測試 | **演算法邏輯參考**，不是要在 Python 專案裡跑 TS 程式碼——重點是這些檔案裡已經解決過的問題（增量掃描怎麼避免重複處理、跨進程單一 Worker 保證、canonical 去重排序鍵怎麼選）在 `docs/plan/03-ingestion-and-claims.md` 的 Ingestion Pipeline 章節目前只有骨架，寫 Python 版時對照這裡的實作細節 |

## 與 `docs/plan/` 現有規劃的已知落差（交叉核對後的具體發現）

1. **Canonical hash 正規化**：`docs/plan/01-postgres-schema.md` 的 `source_revisions.content_hash` 目前只寫「SHA-256」，沒有處理跨平台換行符（CRLF/LF）正規化。`document-ingestion-rules.md` 第2節已經踩過這個坑（同一檔案在 Windows/Git 環境會算出不同雜湊），Python 版實作 hash 計算時必須採用同樣的正規化順序（UTF-8 解碼 → 去 BOM → 統一換行符），不能只是套 `hashlib.sha256(raw_bytes)`。
2. **Stub/Navigation/404 判定規則**：`docs/plan/03-ingestion-and-claims.md` 的 Ingestion Pipeline 目前完全沒有「怎麼判斷一段文字不該進索引」的具體規則，`document-ingestion-rules.md` 的 R1-R8、S1-S4 是已經跑過真實 GTMC 文件驗證過的規則，應該直接併入或引用，不要重新發明。
3. **來源政策的真實資料**：本專案 `docs/plan` 對 `sources` 表只給了欄位定義，沒有真的填入資料；`source-policy.md` 已經有真實可用的種子資料（含每個來源的授權狀態、trust_level、是否可公開），第一批 ingestion 應直接用這份資料初始化 `sources` 表，不必重新調查一次。
4. **枚舉值完整度**：本專案 `docs/plan/01-postgres-schema.md` 的 `review_status`/`confidence` 等枚舉是精簡版，`enums.reference.ts` 多了 `legacy_review`（專用於缺乏逐筆來源版本資訊的歷史資料）這個狀態，值得評估是否也需要在 Postgres 版加入。
5. **雙進程架構**：`knowledge-system-plan-v2-sqlite.md` 的「進程架構」一節詳細定義了 Bot/Worker 兩進程的啟動順序、崩潰重啟退避策略（5s/30s/120s）、資料庫並發規則（短 transaction、busy_timeout）。本專案的第00篇只畫了服務方塊圖，沒有這麼細的運維規則，Python 版若採 Ingestion Service 常駐背景執行，這裡的退避/並發規則可以直接借用設計思路。

## 明確不建議做的事

不要把 `ingestion-pipeline-code/` 裡的 TypeScript 檔案直接翻譯成 Python 逐行對應——那些檔案是為 SQLite 單檔資料庫 + Node 單執行緒模型寫的，PostgreSQL + 可能的非同步/多 worker 架構會有不同的 transaction 邊界與併發模型，照抄程式碼結構只會把不適合的假設一起搬過來。應該做的是照抄「規則」（哪些情況要擋、canonical 怎麼選、去重鍵怎麼排序），演算法重新用 Python 寫。
