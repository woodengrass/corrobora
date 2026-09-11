[索引](README.md) · [← 文件攝取](03-ingestion-and-claims.md) · [Agent →](05-agent-design.md)

# Memory-first／Gap-only Retrieval 與研究關聯圖

## 1. Retrieval 是閱讀導航

Retrieval 的責任是縮小需要閱讀的 corpus。Strong Agent 自行閱讀與推理，
不是把 top 5 chunks 當成封閉世界，再要求模型只根據那五段作答。

```text
問題與目標 scope
  → alias／terminology resolution
  → Finding dense + sparse/lexical + exact concept lookup
  → fusion / rerank + PG 狀態與權限回查
  → Agent 建立 information needs 與 coverage assessment
      ├─ 足夠：重用 findings → reasoning / synthesis
      └─ 缺口：只研究 missing / stale / contradictory 部分
          → Raw Docs Search / Code Search / Machine Catalog
          → section / article / source file 主動閱讀
          → 新候選成果 → consolidation → 更新 memory
```

memory-first 是預設存取順序，不是禁止重新看 code。已有 verified Finding 且符合
條件時通常不用重讀全部 source；當關鍵互動、依賴或新版本不明時，Agent 可回原始資料。
首次使用 memory 為空時，自然退化成 raw corpus research。

## 2. Coverage：不把相似分數當「我已經知道」

Agent 自主拆出 information needs，也可在研究途中新增、合併或修正。
每個 need 保存：`need_id, question, required_constraints, target_scope, matched_validations,
coverage_status, missing_parts, rationale, assessment_at`。

| coverage_status | 意義 | 下一步 |
| --- | --- | --- |
| `covered` | 足夠的相關成果已覆蓋必要條件，版本／有效性符合 | 可直接重用，仍允許必要抽查 |
| `partially_covered` | 有可用部分，但仍缺必要互動／條件 | 保留已知，只研究缺口 |
| `uncovered` | 沒有足夠成果或搜尋未能確認 | fresh search；區分檢索失敗與 corpus 真空 |
| `stale` | 有關成果需 revalidation 或已知不再有效 | 定位原依賴與變動部分 |
| `contradictory` | 同 scope 存在未解决反證／disputed | 比較版本、條件與來源，不任選最高分 |

先以 deterministic 檢查版本、環境、權限、validation status、dependency generation；
再由 Agent 評估語意是否涵蓋、哪些条件缺失。不能僅以 cosine > threshold 或 evidence count
斷定 covered。`provisional` 可提供研究線索與有條件推論，不能單獨支撐 verified coverage。
同一 need 可帶多個 reason codes，避免 stale 與 contradictory 同時出現時遺失資訊。

搜尋服務失敗時標 `retrieval_incomplete`，不是 uncovered 的確定標籤；reranker 沒命中也不能
推導「整個 corpus 沒資料」。Knowledge gap 評估至少區分使用者缺少條件、memory 缺口、
raw corpus 缺口與工具失敗，並允許問使用者或停止。

### 貫穿例：漏斗處理系統

問題是某版本的卸貨／分類設計。既有 Findings 覆蓋冷卻、輸出／拉取次序，但沒有
「特定容器與時序下的交互」。Agent 保留已知機制，只讀新 interaction 的文章與方法。
若問題又要求 MSPT，既有 source logic 不能自動覆蓋量測需求，該 need 仍是 gap。
這個示例描述流程，不把未實測設計寫成 verified 機器。

## 3. Raw Documents Search

```text
query / aliases / scope
    → dense + learned sparse 或 lexical
    → RRF fusion → reranker
    → passage candidates
    → 按 document revision、section 聚合／內容多樣化
    → read_section（相鄰段、父標題、表格、註腳）
    → read_document / follow_reference（需要時）
```

同一文章 10 個高度重疊 passage 不該擠掉第二篇關鍵反證。聚合保留命中位置、每段 rank
與來源多樣性，允許 Agent 依 budget 展開全部 section。鄰近上下文引用仍綁原 revision。
外連先回 corpus 找已捕獲文章；外部 fetch 若開放，使用同一 capture／permission 路徑，
不能直接把搜尋摘要当 immutable evidence。

未知版本文件保留「研究線索」通道；明確版本比較以兩組結果呈現。版號、symbol、BUD
這類 token 需 lexical／exact 通道；中英、繁簡、社群詞則由 aliases 与 multilingual encoder
互補。正規化查詢不改變原文引用。

## 4. Finding Graph：Associative Memory

Graph 以 Findings 為中心，Concept／Mechanism／Effect／Constraint 為連接點；
Source／Passage／Code Symbol 是 provenance 與導航，Machine／Blueprint 是應用實例。
不以全量抽取建立 Minecraft 世界 ontology。

```text
semantic retrieval seeds
  → Finding relations / concept associations
  → 字面不相似但共享機制、限制或用途的 Findings
  → PG scope/status/permission checks
  → rerank + Agent 判斷是否補足缺口
```

例如「低延遲物品整理」可能透過 effect／constraint 找到鎖漏斗、並行整流、緩衝等研究，
但圖上的 `RELATED_TO` 只是相關線索；有 `SUPPORTS` 邊也不等於來源已证明整段答案。
`CONTRADICTS`、`SUPERSEDES` 用來看研究脈絡；`REQUIRES` 若真影響有效性，
還必須在 finding_dependencies 登記，不能僅靠自由語意邊做 invalidation。

PG 使用 bounded recursive CTE／小型 BFS：先 1–2 hops、例如最多 100 nodes／300 edges，
每層 filter、visited 去重、回傳 path 與 truncated。參數用 dev benchmark 定案。
同樣控制回傳 token 成本，不只 SQL latency。超限回傳部分結果與原因，Agent 可縮小條件。

Neo4j 只在 PG traversal 經索引、限深、批次查詢後仍成為測得的瓶頸，且 graph ablation
先證明知識效益時才評估。深度 >3 本身不是換資料庫的充分理由。

## 5. 模組失敗時的行為

| 失敗 | 可行降級 |
| --- | --- |
| Finding index 尚未建立／索引延遲 | PG exact／lexical 找記憶，必要時 raw research，記錄原因 |
| Dense encoder 不可用 | lexical／alias 通道，標記 retrieval 降級 |
| Reranker 超時 | 使用 fusion 結果，保留未 rerank 標記 |
| Code graph 不完整 | repo search／read_file，不把 missing edge 當作 negative proof |
| Graph expansion 過廣 | 限額結果、縮小 concepts／scope |
| 原始來源無法讀取 | 不確認舊結論，保留 gap；已保存 snapshot 可用時改讀 snapshot |

## 6. 模組驗證

- Finding recall 與 raw passage／section recall 分開量測；無 gold sources 的舊題不能算 recall。
- Coverage 以人工 information needs 評分，特別計算 **false-covered rate**：
  系統說足夠但實際缺必要條件的比例。
- 比較 memory-only reuse、memory + fresh whole-question research、memory + gap-only。
  如 gap-only 只是漏查而省成本，accuracy／完整度與 unsupported claim 指標必須揭露。
- Graph-on/off 使用相同 Finding snapshot，防止把「多存了一批知識」誤算為 graph 收益。
- 部分 covered 的 precision／recall、stale detection、contradiction detection 分開報告，
  不用一個平均 similarity 掩蓋問題。
