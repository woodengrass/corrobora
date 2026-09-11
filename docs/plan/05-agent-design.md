[索引](README.md) · [← Retrieval](04-knowledge-graph-and-retrieval.md) · [Code 與 Blueprint →](06-code-intelligence-and-versioning.md)

# Strong Agent、工具邊界與 Research Sessions

## 1. 自主研究的最小 orchestration

```text
RESEARCH ↔ VERIFY / CONSOLIDATE → SYNTHESIZE
```

這是工作責任的簡化示意，不是強制三步只能走一次的狀態機。
Agent 可自行拆題、提出 hypothesis、改寫搜尋、比較文章、追蹤 code、發現新缺口、回頭補查。
不再由 query_type 固定 subquestion 骨架，也不需要為每種問題建立 deterministic planner。

系統確定性管理的是 session 開始／取消／完成、budget、工具 scope、schema、權限與
Finding 寫入；不是控制 Agent 每一個中間推論。Query classification 可作報表／检索提示，
不是必須先建一個服務或訓練小模型才能開始研究。

## 2. Agent 必須知道與不必知道的東西

每次 session 提供：使用者問題、edition／版本／環境與未定條件、可用 corpus、工具說明、
budget、memory-first 原則，以及 Finding statuses／引用規則。
不用暴露 Qdrant API 或 SQL；可直接給 Agent repo search／read_file 這類通用能力，
不把每一種 Minecraft 問法包成獨立 tool。

建議工具契約：

| 工具 | 回傳重點 |
| --- | --- |
| `search_findings(query, scope, mode)` | revision/validation IDs、狀態、範圍、命中理由；mode 區分 reuse/research |
| `get_finding(validation_id)` | 完整結論、條件、來源、dependencies、contradictions、generation |
| `resolve_terms(text)` | 多義候選、aliases、來源與未解析詞 |
| `search_documents(query, filters)` | passage/section/article candidates；不把 snippet 當完整文章 |
| `read_section / read_document` | 精確 revision 的上下文、links、assets、truncation/cursor |
| `search_code / read_code / search_symbols` | pinned code version、file／line／hash、symbol resolution |
| `compare_code_versions` | 兩側具體檔案／symbols、配對可靠性、diff；第二版 source 存在才提供 |
| `expand_findings` | 有界 graph paths、每筆 scope/status |
| `search_machines / get_machine` | 真實 catalog revision、filename、availability、原始版號 hints |
| `submit_finding` | admission outcome、candidate／revision ID，不接收自填 verified |
| `propose_revalidation / propose_consolidation` | 比較報告、來源綁定與待審提案 |

Evidence read 回傳系統簽發的 read receipt／引用 ID，含實際 revision、range、hash。
Agent 保存成果引用這些 receipt；找不到的 source ref 被 schema/policy 拒絕，不允許憑空編 ID。
read receipt 证明工具回傳過內容，不保證 Agent 理解正確，語意支持仍要驗證。

## 3. 輸入輸出邊界

工具以 Pydantic typed models 暴露，`extra='forbid'`，採 snake_case。
共通 result 帶 `request_id, ok, typed_data, error_code, elapsed_ms, truncated, next_cursor,
corpus_snapshot, index_build_id`；不用任意 `dict | list[dict]` 當全系統資料契約。
服務端注入 source access constraints；Agent 不能透過傳入寬鬆 filter 提升權限。

`POST /v1/ask` 接受 question、scope、budget profile，回傳 answer／citations／unresolved needs／
session ID／usage／memory-write outcome。外部 coding/research Agent 也能直接使用相同工具；
MCP 可日後作薄 transport adapter，不是核心資料模型的依賴。

## 4. Budget 與停止

预算包含 input/output tokens、tool calls、API cost、wall time、retrieved/read bytes，
分成 query foreground 與 maintenance background。並行 call 先保留額度再結算，
重試也計費；不讓每個並行工作各自以為還有全部餘額。
未知 provider usage／cost 要標 unknown 或 estimate，不能記成 0。

Agent 決定研究足夠時可停止；硬限制、取消或不可用工具時由 orchestrator 停止。
停止可產生 `complete / partial / failed / cancelled` outcome；若缺必要資訊，回答清楚列出
條件與未解項，不能為了通過固定 checklist 不斷繞圈。
不要求所有 hypothesis 都已證明或反駁才能回答，保留尚未驗證的假設是合理研究結果。

單次 timeout 依工具設定，不用相同 5 秒套在 repo scan、向量查詢與長文章閱讀。
第一輪以 pilot 量測設 budget profile；舊稿 90 秒／0.50 美元／15 秒回答不是已測得的 SLO。

## 5. 寫入權限與驗證

| Actor | 可做 |
| --- | --- |
| Research Agent | 讀授權資料、提出 provisional Finding／修訂／合併／反證 |
| Memory write service | schema、provenance、版本與併發檢查後保存；維護 append-only 歷程 |
| Invalidation worker | 依實際來源變動降低受影響 validation 的可用性，不能自動升格 verified |
| Reviewer | 按明確 scope 與來源核准 verified／disputed／superseded，不能覆寫舊原文 |

MVP 的 verified 由人工 reviewer 明確核准，介面可為 CLI。provisional Findings 在完成
provenance validation 與 admission 後即可存在，供後續研究定位，不需每個 raw paragraph 人審。
日後可對可程式驗證命題加入受政策授權的独立 verifier，但 LLM 自評不等於 verification。

## 6. Episodic Memory：可觀測的研究歷程

低成本保存 `research_sessions / research_events`，以 ID 與結構化 metadata 為主，
不把每次 tool 大段結果再複製一份全文。原文仍在 corpus，事件只保存當時 locator／hash。

| 事件 | 用途 |
| --- | --- |
| session_started，query／scope／模型／budget | 比較相同設定的實驗 |
| finding_retrieved / finding_used / finding_rejected | 區分命中與真正重用，計算 memory utility |
| coverage_assessed / gap_updated | 分析 false-covered、漏拆子問題 |
| tool_started / tool_finished / tool_failed | tool calls、retry、latency、retrieval failure |
| passage_retrieved / passage_read / document_opened / code_read | 檢索候選與實際閱讀成本分開 |
| finding_proposed / consolidated / revalidated | 研究成果來源、merge 质量、維護成本 |
| session_finished | 完成度、答案引用、成本、tokens、未解項與錯誤 |

只記外顯研究行動與簡短 rationale，不把模型內部 chain-of-thought 當必備數據。
query／final answer 存於受保護 session store，general logs 只留 ID 與計量；
訓練資料日後另做來源授權與去識別化 projection，不假設全體 trajectories 都能公開或訓練。

Events 的用途是 debug、回放工具結果、搜尋行為分析、建立未來 preference／next-action
候選資料；**不進一般 Finding semantic index，也不把前次完整答案當 memory reuse**。
不能聲稱「完全重播模型思考」；可重播的是相同 tools／來源快照與保存的輸出。

## 7. 工程形態

先以一個可替換的 Agent provider adapter 接強線上模型，PG sessions 保存 durable history。
背景 worker 負責索引／ingestion／失效，不 fork 一個 QQBot 專屬子進程來管理整個後端。
short transaction、idempotency、lease timeout 與 retry budget 保留舊實作的可靠性意圖，
PostgreSQL 併發语意則重新實作。服務可先單 instance，但契約不能依賴全域單例。
