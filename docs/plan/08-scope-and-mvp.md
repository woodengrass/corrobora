[索引](README.md) · [← 驗證](07-evidence-and-verification.md) · [Roadmap →](09-roadmap-and-benchmark.md)

# 範圍與 MVP：先完成一個可累積、可重查的研究閉環

## 1. MVP 的問題

**在相同強 Agent 與資料條件下，保存可追溯 Findings、先找記憶再補缺口，
是否能減少重複研究，而不因漏答或過期記憶降低品質？**

MVP 是測量方法與架構閉環，不是論文結論。小樣本用來找問題與估計成本／變異，
不能因 15 題通過就宣稱 continual learning 已成立。

## 2. 最小範圍

| 能力 | MVP 做到哪裡 |
| --- | --- |
| Corpus | 112 筆詞典、23 篇 GTMC；擇可標註的漏斗／物品處理或更新主題，不要求全量 legacy 語意清理 |
| Raw | bytes snapshots、dual hash、document revisions、sections/passages、links、來源政策 |
| Retrieval | dense＋lexical baseline、alias lookup、section/article expansion；ports 可換模型 |
| Memory | Finding revisions、scoped validation、sources/dependencies/relations；兩層 Qdrant index |
| Agent | 一個 strong provider adapter、自主多輪研究、memory-first＋gap record、budget |
| Consolidation | exact idempotency＋相似 Finding 比較提案＋最小 review CLI |
| Invalidation | 文檔 revision／上游 Finding 的反向依賴傳播與按需重查，先單一精確版本 validation |
| Code | 使用現有本機 1.21.11 source 的 search/read＋snapshot/file/range/hash；小範圍 symbol index spike |
| Sessions | 查詢、讀取／重用、工具、tokens/cost/latency、結果與維護成本 |
| Catalog | 資產與 81 筆機器 baseline 保留；catalog 移植可平行，不阻塞 memory 核心 |
| Benchmark | 既有題目重新標註成 pilot stream，raw agent vs memory vs gap-only；可控制的更新事件 |

MVP 前半先建立 Documents＋stateless Agent baseline；後半才加入 Findings 與 lifecycle。
Tree-sitter 全 repo edges、graph associative expansion、自動 semantic merge 都不是閉環前置。
code file 級 dependency 已可驗證變動管線，symbol-body 粒度在後續測細化收益。

## 3. 可交付的使用流程

1. 使用者問一個需跨文章／code 的問題，Agent 找不到足夠記憶，完成一次 fresh research。
2. 保存一個高價值 provisional Finding，綁實際來源；review 可在 session 後完成。
3. 新問題 wording／條件不同，但部分需要同一機制，系統找回它，只補缺失部分。
4. 更新一份相關文件／上游 Finding，受影響 validation 進 needs_revalidation。
5. 下一題只重查受影響部分；不相關 Finding 与歷史版本引用保持可用。
6. 全流程能比較答案、來源正確性、閱讀量與總成本，而不只是顯示「命中 memory」。

## 4. 第一批資料與 API

按依賴建 migration batches，而不是一次建立所有未來 extension：

- **Corpus batch**：sources/revisions/observations/import_runs、documents/revisions、sections/passages、
  links/assets、versions/scopes、concepts/aliases/translations/sources、unresolved references。
- **Research batch**：sessions/events、jobs、index_builds/outbox；先讓 raw baseline 有可比觀測。
- **Memory batch**：findings/revisions/validations、sources/dependencies/relations/concepts、reviews、
  invalidation_events。無 source 或 upstream dependency 的 verified 寫入要被拒絕。
- **Code batch**：repositories/versions/files；symbol/index 擴展可獨立加入。
- **Extension batch**：machines/revisions/tags、blueprints、experiments，依案例開啟。

最小入口（皆為待實作契約）：

- `POST /v1/ask`、`GET /v1/research/sessions/{id}`。
- `POST /v1/ingest/documents`、`GET /v1/documents/{id}/revisions/{revision_id}`。
- `POST /v1/findings/search`、`POST /v1/findings/candidates`、`POST /v1/findings/reviews`。
- `GET /health`；對外 Agent tools 使用同一 application services，避免兩套寫入政策。

## 5. 完成條件

### 工程底線

- Raw revision 可還原，重匯入與 job retry 不重複產生資料。
- 非授權 Agent 不能標 verified／覆寫來源；version、permission、dependency 在 PG 強制檢查。
- 同條件重送、相似但不同條件、矛盾、跨版本、間接依賴、失效途中查詢都有 fixture。
- Qdrant 停機／索引延遲時能降級且不錯用 stale status。
- 完成上述六步 demo，可從 session 重建「實際讀了哪些資料與用了哪些 Findings」。

### 研究起步

- 15–20 題 pilot（包含相關不同題、部分重用、新主題及至少一個更新事件）；
  逐題標 expert rubric、必要 evidence／scope，記錄未通過與不能回答的題。
- raw agent、memory、gap-only 使用同一 Agent、corpus、budget，輸出相同評分欄位。
- 同時报告 accuracy／完整度、來源正確、false-covered、stale errors、成本与维护工作量。
- 若節省成本但 accuracy 或完整度下降，MVP 工程可能完成，研究假說仍未成立，先分析原因。

## 6. 功能取捨

| 處置 | 項目 |
| --- | --- |
| 保留／提高優先級 | PG、Qdrant、immutable raw、document hybrid retrieval、aliases、Findings、provenance、sessions、benchmark |
| 簡化 | orchestrator、Evidence Workspace、graph schema、code pipeline、review 的操作介面 |
| 從核心建置清單移除 | deterministic query planner、巨大 query-specific state machine、全量 Claim／KG extraction、專家生成小模型 |
| 後續研究增量 | 更細 dependency、associative expansion、自動 consolidation、擴大 longitudinal stream |
| Optional，需實驗支持 | JDT、SCIP、CodeQL、CFG/DFG、Neo4j、ColBERT、multi-vector、SGLang／多 serving backend |
| 獨立平行支線 | Blueprint structural understanding、機器資料庫深化、dynamic test runner |
| 最後才評估 | 特定任務 SFT/LoRA、retrieval fine-tuning、CPT；均非架構 requirement |

小模型不是依固定階段「時間到了就要做」。只有頻率、品質與費用證明有需求，才投入訓練。
排期應在 pilot 後依開發與 review 人力決定，不延續舊稿尚未實測的固定週數。
