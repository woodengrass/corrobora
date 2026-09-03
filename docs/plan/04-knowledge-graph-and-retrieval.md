[索引](README.md) ｜ [← Ingestion Pipeline 與 Claim 審核](03-ingestion-and-claims.md) ｜ [Agent 設計 →](05-agent-design.md)

---

## 7. Knowledge Graph 建立方式（PostgreSQL relations 版）

不引入 Neo4j，靠 `relations` 表 + `knowledge_objects` 間接層（3.9節）+ 應用層查詢函式。所有查詢第一步都是 `knowledge_objects` 查出 `object_id`，第二步才查 `relations`，下表省略第一步只寫查詢意圖：

| 查詢需求 | 實作方式 |
| --- | --- |
| Concept 找相關 Mechanism | 先在 `concepts(category='mechanism')` 或既有 concept 上，查 `relations WHERE from_object_id=? AND relation_type IN ('USES','IMPLEMENTED_BY')` |
| Effect 反查 Mechanism（「有什麼機制能讓生物聚集」） | 先在 `concepts(category='effect')` 用 alias/embedding 找到 effect concept 的 `knowledge_object_id`，再查 `relations WHERE to_object_id=? AND relation_type='PRODUCES'`（方向：mechanism→PRODUCES→effect），因為 effect 現在是 concept 化的節點（3.4節 v2 修正），不再是自由文字 |
| Farm 找 Mechanism | `farm_components` join `relations(USES_MECHANISM)` |
| Mechanism 找 Claim | `relations(SUPPORTED_BY / VALIDATED_BY)` |
| Claim 找 Evidence | 直接查 `claim_evidence`（其 `evidence_object_id` 已是 `knowledge_objects.id`，見3.5節） |
| Concept/Mechanism 找 Code Symbol | `relations(IMPLEMENTED_BY)` from concept/mechanism to code_symbol |
| 多跳 path（find_path） | 遞迴 CTE（`WITH RECURSIVE`），全程走 `from_object_id`/`to_object_id`，限制最大深度（預設3），並在每層套 version/status filter，避免 explosion |

多跳查詢的效能風險：`relations` 表會快速變大，`from_object_id`/`to_object_id` 都需要複合 index（已在 3.9 定義）。當單一查詢 fan-out 超過 ~500 邊時，Orchestrator 應該中止並回報「graph too broad」而非硬跑。

何時該換 Neo4j：當 `find_path` 深度需求 > 3 跳、或多跳查詢延遲成為 Agent Loop 瓶頸（可用 benchmark 第16節量化），才評估遷移，MVP/Phase 1/2 都不需要。

---

## 8. Retrieval Pipeline

```text
Query (+ metadata filter: edition/version_id/status)
  -> Dense Search (Top 100)        ─┐
  -> Sparse Search (Top 100)       ─┼-> RRF Fusion -> Top 50
  -> Exact Lexical Search（第4.4節）─┘   (pg_trgm/FTS/符號精確索引，同樣併入 RRF 而非獨立通道)
  -> Cross-Encoder Rerank -> Top 10~20
  -> (Phase 2+) ColBERT late-interaction 精排
```

**Sparse 方案比較（中英混合 + 技術詞 + MC 專有詞）**：

| 方案 | 優點 | 缺點 | 建議 |
| --- | --- | --- | --- |
| SPLADE (英文預訓練) | 學習式擴展詞效果好 | 中文支援差，需自行訓練/微調 | 不直接用預訓練 checkpoint |
| BGE-M3 sparse | 原生支援中英混合、同時輸出 dense+sparse+colbert，一個模型三種表示 | 相對新，社群案例較少 | **建議採用**：一次滿足 dense + sparse + 未來 late-interaction 需求，減少維護多套模型的成本 |
| 純 BM25 (PG tsvector) | 簡單、deterministic | 不理解同義詞/別名，仰賴 concept_aliases 展開彌補 | 作為 fallback / 精確符號比對（class name、版本號）用，不當主 sparse |

RRF 參數：`k=60`（業界常用預設），Top-K 數字先固定成文件建議值，實際比例待 benchmark（第16節）後調整。

> **白話說（RRF 在解決什麼問題）**：Dense 搜尋回傳的分數是「語意相似度」（例如 0.82），Sparse 搜尋回傳的分數是完全不同尺度的東西（例如 TF-IDF 加權分數 13.5）。這兩種分數**不能直接比大小**，硬要加權平均等於拿溫度計的讀數跟身高的讀數加在一起。RRF（Reciprocal Rank Fusion）的做法是完全不看分數本身，只看「這筆結果在各自的排行榜上排第幾名」——Dense 榜上第 1 名和 Sparse 榜上第 1 名都給差不多高的加分，名次越後面加分越少，兩份排行榜的加分相加就是最終排序依據。這樣就不需要煩惱兩種分數要怎麼換算成同一個尺度。

---

