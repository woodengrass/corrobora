[索引](README.md) · [整體架構](00-overview-and-architecture.md) · [Roadmap](09-roadmap-and-benchmark.md)

# 實際狀態、架構取捨與 Migration 提案

## 1. 盤點方法與範圍

盤點日期 2026-09-11，起始 tracked HEAD `233ba10`，工作樹起始乾淨。
真正 Git repository 是工作目錄下一層 `corrobora/`。
已閱讀原 00–09 全部規劃、legacy 規劃 1,738 行、來源／ingestion／testing／eval 文件、
全部 13 個 TypeScript 參考檔與 4 份 SQLite migrations、題庫與 fixture 契約。
檢查原始資料的實際欄位與內容、解析所有 tracked JSON，並以 CSV parser 核對 logical records。
另檢查 Git 忽略目錄的本機 source manifest、建置設定與漏斗相關實作／呼叫路徑。

這是架構盤點，**不是逐行審核 6,624 份 Minecraft Java 檔案或逐筆判定全部領域文字正確性**。
原始 corpus 以全量格式／數量盤點、fixture hash 核對加代表內容閱讀；本次未執行 Minecraft build、遊戲實驗
或 Agent benchmark。下列「已存在」不代表「已整合／可運行」。

## 2. Repository 的真實起點

| 項目 | 實際狀態 | 對規劃的影響 |
| --- | --- | --- |
| tracked files | 起始 292 個 | 主要是文件與領域資料 |
| corrobora runtime | 無 pyproject、Python application、FastAPI、compose、Alembic 或 tests runner | 本輪是規劃重定位與未來實作遷移，不是 production service refactor |
| ADR | 未找到既有 ADR 文件 | 依本輪使用者補充維持人可讀討論計畫，不建立 ADR |
| Legacy TypeScript | 13 個檔案，含 scanner、queue、machine sync、supervisor、audit／eval | 有可借用邏輯，但 imports 指向缺失的原專案 modules，不能直接 npm test |
| SQLite migration | 0001–0004，涵蓋 sources/raw/jobs/machines 與修正 | 是 reference DDL，不是本 repo 已運行 DB；沒有搬入 knowledge.db |
| Documents／memory runtime | 未有 parser/retriever/Agent/Finding 的完整新實作 | 不能沿用舊 Phase 標籤推定進度 |
| Minecraft source | 本機 ignored 目錄，1.21.11 / parchment 2025.12.20，6,624 Java files | 可早期做 source research baseline；需正式 snapshot 登記 |
| Blueprint | machine filename 有 `.litematic`／zip，但工作區實體 `.litematic` 數為 0 | 先 catalog，不能主張已有 4,000 藍圖或 structural parser |

### 原始資料與 benchmark 實測

| 資產 | 數量／結果 |
| --- | --- |
| dictionary entries | 112；upstream APPROVED 112；中文翻譯 112 |
| references／referencedBy | references 189；其中有 9 個不同 target IDs 不在詞條 ID 集；referencedBy 197 個不同外部編號 |
| GTMC | 23 篇 Markdown，共 4,167 行；含未完成／導航／404 |
| legacy CSV | 151 logical records，19 筆多行；舊文「4287 行」不可當記錄数 |
| GTMC／CSV 重複 | 19 篇以 legacy trim 比較相同，不等於 raw bytes 相同 |
| TechMC Glossary | 415 records、26 欄；含 BOM |
| machines | 81 records、81 唯一 sub_id、228 tags |
| questions | 33：29 draft／4 approved（均 machine recommendation），9 類；gold source IDs 全空 |
| machine baseline | 9 cases，綁定的 normalized database hash 與目前 corpus 一致 |
| triage | 14 cases 的 normalized hashes 全吻合；9 份人工 AI JSON seeds，不是實際模型輸出 |
| JSON 完整性 | 起始全部 129 個 tracked JSON 可解析 |

舊稿的 979 詞條、215 篇 GTMC、假定 code source 為空與外部 `src/services/*.ts` 連結
均不能繼續作本專案前提。source policy 的 trust_level 主要描述來源／授權可追溯，
不是 Minecraft 結論的可靠度排名。

## 3. 既有設計的取捨

| 舊設計 | 建議處置 | 理由／新定位 |
| --- | --- | --- |
| Python/FastAPI/Pydantic | 保留 | 與資料研究生態相容，邊界有型別驗證 |
| PostgreSQL authority + Qdrant candidate index | 保留，提高優先級 | 研究記憶與索引分離，跨模型可重建 |
| immutable source revisions、document revisions | 保留並補完 capture | bytes 快照而非只存可變原路徑 |
| aliases／terminology | 保留，提高優先級 | 混語 corpus、社群詞與一詞多義仍需穩定管理 |
| 一切先抽 atomic Claim 再人審 | 移除主線 | Documents 先可研究，Finding 只存高 utility 結論 |
| Claim conditions／exceptions／provenance | 沿用意圖，重構到 Findings | 条件與来源不因 Agent 強而失去價值 |
| deterministic query planner／模板 subquestions | 從新建置清單移除 | Agent 自主拆題，schema 管的是輸出與 scope |
| 巨大 state machine | 簡化 | research／verify-consolidate／synthesize 由 Agent 反覆進行 |
| Evidence Workspace／Package | 簡化為研究上下文與回應契約 | 無須第二套 reasoner／evidence ontology |
| 全量 KG／mechanism ontology | 移除主線 | graph 以研究聯想為主，少量 Concepts／Findings |
| knowledge_objects 通用 registry | 替換 | local_id 無實體 FK；用 typed FK／專用 relations 避免空殼引用 |
| code facts 與 interpretation 分離 | 保留 | index 做導航，解釋放 Finding，少量 bridge |
| Tree-sitter | 保留，輕量 | structural navigation baseline |
| JDT／SCIP／CodeQL／CFG/DFG | optional／實驗後再做 | 不預先建立多套完整 code intelligence |
| Neo4j | optional | PG traversal 的真實瓶頸＋graph utility 先證明 |
| ColBERT／multi-vector everywhere | optional | rerank／hybrid baseline 不足才比較 |
| BGE-M3 | baseline implementation | ports 解耦，不固定模型／維度 |
| 專家 Domain LLM／CPT | 降出主線 | 強 Agent 使用外部記憶；只在高頻規律任務考慮訓練 |
| vLLM／SGLang／多 serving backend | optional | 有本地推理負載才加入 |
| Blueprint catalog | 保留，独立支線 | 人類作品實例，不是教模型機制的先決條件 |
| Research sessions／benchmark | 提高優先級 | 把節省與錯誤传播變成可觀測、可反駁的研究 |

## 4. 現有 code：具體如何用

所有以下路徑位於 `docs/legacy-reference/`。這些是**移植規則**，不是逐行翻譯 TS。

| 檔案 | 可沿用 | 需要重構／不可照搬 |
| --- | --- | --- |
| `ingestion-pipeline-code/rawScanner.ts` | UTF-8/BOM/換行正規化、source routing、regular-file boundaries、去重、DB 確認 manifest | raw→AI job 強制分流改為 parser/index；保存 bytes；PG 交易／併發；檔尾「canonical 不重派」註解與上方實際重派邏輯不一致，以測試釐清 |
| `ingestion-pipeline-code/rawAssets.ts` | 路徑＋hash＋record 身分、每份來源保留 | path-only snapshot 無法保证歷史重建；改 blob＋revision＋observations |
| `ingestion-pipeline-code/manifest.ts` | 非權威快取、損毀可重建、原子檔案更新 | 不作跨 worker 或索引完成的唯一狀態來源 |
| `ingestion-pipeline-code/sources.ts` | idempotent 登記、不覆寫人工政策 | PG FK／權限 projection，持久化完整 policy fields |
| `sourcePolicy.reference.ts` | 來源清單、署名／export 規則集中化 | 舊部分欄位僅記憶體保存；改 PG policy version，路徑重新映射 |
| `ingestion-pipeline-code/machines.ts` | sub_id upsert、tags diff、不改人工 status、來源移除另記 | source_id 舊欄其實是外部 id；新 schema 分开；snapshot/revision、嚴格輸入、保留排序；removed 僅作用本來源 |
| `ingestion-pipeline-code/aiJobs.ts` | job lifecycle、bounded retry | 目前沒有 consumer；PG lease／SKIP LOCKED／fencing，啟動不重置所有 running jobs |
| `ingestion-pipeline-code/worker.reference.ts` | debounce、fallback polling、啟停可觀測 | 只 scan/enqueue 未消費 AI；新 worker 真正接 parser/index/memory handlers |
| `ingestion-pipeline-code/workerSupervisor.reference.ts` | 有界 retry 與 isolation 意圖 | Node fork／PID lock／QQBot 生命週期不移植；改部署工具監督 worker＋PG lease |
| `enums.reference.ts` | enum 校驗、不可自動 approved、品質與公開性分開 | Finding statuses 改 scoped validity；既有 flags/materialize 與 ingestion 文本有歧義，需新契約 |
| `ingestion-pipeline-code/auditCalculations.ts` | logical record stats、field inventory、diff、link resolution | trim audit hash≠canonical hash；按檔名判 404 只作舊 audit heuristic，不當通用 parser truth |
| `ingestion-pipeline-code/audit-knowledge-data.ts` | 全量 inventory＋hash diff、坏檔失敗報告 | 舊 roots／Node dependencies，改 Python audit；不要把 relax_column_count 當無需驗證格式 |
| `ingestion-pipeline-code/eval-machines.ts` | 固定 queries、排序、hash／新增移除 cases 比對 | imports 的舊 searchMachines 不在此 repo，不能聲稱已重播；新 adapter 要先找回該演算法或明示新 baseline |
| `migrations/0001–0004` | schema 修正經驗：NULL 唯一鍵、來源身分、source_removed | SQLite DDL、cascade、raw path-only、global single writer 不能直接執行於 PG |

### 應刪除哪些 code？

目前沒有新系統 runtime 可刪；這輪不刪歷史參考碼或原始資料。
**從未來 implementation 清單移除**的是全量 Claim extraction、全量 KG extraction、
query-specific state machine、預生成 code summaries、Domain LLM 必備服務與 Node supervisor 移植。
舊稿提及的 embeddings.ts／dictionary.ts／learn.ts／source.ts／search.ts 不在本 repo，
不能把它們列為已存在且已重構／已移除的 code。

## 5. Architecture migrations

這裡的 migration 包含「規劃到新實作」與「未來若有外部部署需搬資料」兩種；
不能為不存在的 corrobora production DB 編寫假升級紀錄。

| Migration | 輸入→輸出 | 驗證與回退 |
| --- | --- | --- |
| P1：定位／執行邊界 | 專家化後端→Agent research infrastructure；多服務圖→modular monolith | tools 可單獨給外部 Agent 用；版本化 API，保留 client adapter 意圖 |
| P2：Raw identity | legacy path/hash→source revision＋blob＋observation | 重抓／A→B→A、跨路徑 duplicate、原路徑刪改仍可還原；失敗不切 latest |
| P3：Documents | chunk/AI materialize→revision/sections/passages＋quality flags | 新／舊 fixture 結果差異逐項列出，原文不覆寫，parser 版本可回切 |
| P4：Claims→Findings | 原規劃 atomic statements→高價值 Finding revisions／validations | 如外部有 Claim：逐筆保留 ID 映射、review 與 sources，缺 scope／依賴先 provisional，不批次冒充 verified |
| P5：Evidence／Graph | registry／Evidence ontology→typed finding_sources/dependencies/relations＋少量概念連結 | orphan/cross-scope 檢查；不推定所有 semantic edges 都是必要依賴 |
| P6：Retrieval | 多 collections／code summaries→raw_passages＋research_findings | shadow build／alias cutover，PG hydration，壞 build 可回切 |
| P7：Agent | 固定 planner／state→自主 tools＋memory-first／gap-only＋events | 同 C baseline 对照，budget／scope／寫入限制測試；feature flags 可停 gap／graph |
| P8：Code | 預排四工具→repo snapshot search/read＋light index | 使用現有 1.21.11、hash refs；進階工具 on/off 可比較 |
| P9：Memory lifecycle | 無跨題成果→admission/consolidation/invalidation | 先 PG validity，再向量；worker crash／亂序／併發／間接失效測試 |
| P10：Benchmark | 靜態 draft questions→versioned gold＋sequential streams | 保留舊資料與 status，新 rubric 另版；不得用覆寫 baseline 掩蓋失敗 |

P2/P3/P6 先於 memory 閉環；P7 的 session 記錄應從 stateless baseline 開始。
P9 的**基本** provenance／失效在 MVP 就做，細粒度 propagation 與真實版本 challenge 再成熟。
P8 直接 repo access 可與 Documents 平行；Blueprint 不在此 critical path。

### 若日後對接既有 OpenST 部署

先另行取得外部 DB／實際 client contracts 與備份，不假設 legacy reference 已含全量系統。
匯入到獨立 PG schema、保留 old→new public ID 對照、dual-run 讀取對比，再切 client。
舊 bytes 若只剩 path/hash 且無歷史內容，標 unresolved provenance，不能憑目前檔案補造過去 revision。
記憶 feature 回退到 stateless raw research 時仍使用最新权限與版本檢查，不回退過期 verified 狀態。

## 6. 仍需作決定的事項

- 主題与 corpus 擴充來源，尤其數千篇私人文章與真實第二份 code snapshot。
- review 人力與可接受的 provisional reuse 政策；MVP 先採保守線索用途。
- 來源取得／storage 環境、encoder／reranker 初始候選與 API 预算。
- Criterion for admission、accuracy 非劣性 margin 与 stream 規模，使用 pilot 校準。
- 197 個 referencedBy 外部 IDs 的對照來源；未取得不阻塞核心 research memory。

這些問題先在計畫內保留假設與替代方案；待實驗與討論收斂後，才適合另寫 ADR。
