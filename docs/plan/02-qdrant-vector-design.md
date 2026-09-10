[索引](README.md) ｜ [← PostgreSQL Schema](01-postgres-schema.md) ｜ [Ingestion Pipeline 與 Claim 審核 →](03-ingestion-and-claims.md)

---

## 4. Qdrant Collection / Vector / Payload 設計

### 4.1 多 collection vs 單 collection 分析

| | 多 collection（依實體型別） | 單 collection + payload type |
| --- | --- | --- |
| 優點 | 各型別可用不同 embedding 維度/模型；HNSW 參數可分別調；filter 更快（不用先篩 type） | 跨型別語意搜尋一次查詢；維運簡單 |
| 缺點 | 跨型別查詢要 fan-out 多次 query 再合併 | 所有型別被迫用同一 embedding 維度；payload index 變複雜 |
| 適合本案原因 | **實體型別的 embedding 語意本來就不同**（mechanism 的 effect_vector 和 code_summary 的向量不該共用模型/維度），且 Agent tool 本來就是分別呼叫 `search_mechanisms()`/`search_symbols()`，天然對應多 collection | — |

**建議：多 collection，按「檢索用途」切，不按 SQL 表切**（MVP 只先建 `documents` + `concepts`，dense-only；其餘 collection 按 Phase 1/2 順序加）：

| Collection | 對應資料 | 說明 |
| --- | --- | --- |
| `documents` | chunks | 一般文件語意檢索 |
| `concepts` | concepts | 概念定義 |
| `mechanisms` | mechanisms | 多 named vector（見 4.2） |
| `claims` | claims | statement 語意 |
| `code_summaries` | code_symbols 的 AI 摘要 | 不是原始碼本身 |
| `experiments` | experiments | setup+procedure 描述 |

每個 collection 內用 Qdrant 的 **named vectors** 承載 multi-vector，而不是拆成更多 collection。

> **白話說（為什麼要「多 collection」）**：可以把每個 collection 想成圖書館裡的一個獨立分區（技術文件區、術語卡片區、機制卡片區、程式碼摘要區...），每一區的卡片長相跟索引方式本來就不一樣，機制卡片甚至一張卡有四個索引（見下方），程式碼摘要卡只有一個。硬要塞進同一區、用同一種索引卡格式，反而要多繞一手先看「這張卡片是哪一種」才能決定要用哪個索引，不如從一開始分區存放。

### 4.2 Named Vectors 範例（`mechanisms` collection）

> **白話說（Multi-vector 是什麼）**：同一個 mechanism（例如某個 0-tick 活塞裝置）會被問到完全不同角度的問題：「這是什麼」「它能達成什麼效果」「適合用在什麼場景」「有什麼限制」。如果只做一個 embedding，這四種問法混在一起訓練出來的向量誰都照顧不好。所以同一筆 mechanism 資料實際上算了四份不同的向量，分別對應這四個角度——很像圖書館一張書卡除了「書名」索引之外，還另外做了「主題」「適讀對象」「館藏限制」三份獨立索引卡，讀者用哪個角度找書，就查對應那份索引卡。

**v2 修正（Qdrant schema 語法）**：dense named vectors 與 sparse vectors 在 Qdrant 是分開的 collection 設定區塊（`vectors` vs `sparse_vectors`），不能混在同一個 `vectors` dict 裡，否則建 collection 會直接失敗：

```json
{
  "vectors": {
    "description": { "size": 1024, "distance": "Cosine" },
    "effect": { "size": 1024, "distance": "Cosine" },
    "application": { "size": 1024, "distance": "Cosine" },
    "constraint": { "size": 1024, "distance": "Cosine" }
  },
  "sparse_vectors": {
    "sparse": { "modifier": "idf" }
  },
  "payload": {
    "mechanism_id": "int (PG FK)",
    "concept_slugs": ["array of string, indexed"],
    "edition": "keyword",
    "version_ids": ["array of int, indexed"],
    "status": "keyword",             -- 只有 approved 才進 Answer Index 查詢
    "confidence": "keyword"
  }
}
```

**v2 修正（版本 payload）**：不再存 `version_min`/`version_max` 字串。改存 `version_ids`：寫入時從 PG 的 `version_scope_versions`（3.1節）展開出該筆資料涵蓋的所有 `game_versions.id`，整份陣列寫進 payload。查詢時 Query Understanding 把使用者的目標版本解析成單一 `game_version_id`，用 Qdrant 的 `MatchAny`/`array-contains` 做精確整數比對，不再有字串 range 比較的正確性風險。

**Payload index**：`status`（keyword）、`edition`（keyword）、`version_ids`（integer array）、`concept_slugs`（keyword array）都建 payload index，用於檢索前置 filter（見第7節：filter 先行，再 ANN）。`code` 相關 collection 另加 `code_version_id`、`mapping_name` filter，`mapping` 不同不得混排。

**Point ID = UUID + PG 反查（統一，不用 `{table}_{id}` 字串）**：每個 point 用 UUID，PG 側用 `chunks.qdrant_point_id` 等欄位反查。確保 Qdrant 只是 candidate index，PostgreSQL 永遠是 truth source，可隨時從 PG 全量重建 Qdrant。重建時先清 collection 再按 `updated_at` 分批寫入，避免新舊混存。

**Embedding contract（MVP 先凍結，升級必須重建）**：model 名、版本、維度、distance、切段規則（chunk size / overlap / 語言處理）視為同一份 contract。`mechanisms` 的 4 向量現階段只是佔位，MVP 只用 `description` dense；sparse / reranker / ColBERT 留到 Phase 1/2，model 升級一律重建對應 collection，不混用新舊向量。

### 4.3 Version Filter 流程

檢索一律：`must: status=approved` + `must: version_ids contains <target_game_version_id>` → 縮小候選集 → 才做 ANN/RRF。不相容版本资料**不進入 ANN 距離計算**，避免語意相近但版本錯誤的內容排到高分。這個 filter 現在是整數精確比對而非字串 range，正確性由 3.1 節 `game_versions`/`version_scope_versions` 保證。

### 4.4 Exact Lexical Layer（不做 OpenSearch，但保留精確比對通道）

`NaturalSpawner`、`BUD`、`1.21.1` 這類 token 不值得浪費在 embedding 語意搜尋上——語意相近排序對「精確符號/版本號」是負優化。即使不引入 OpenSearch，也要保留一條低成本的精確詞彙比對通道，作為 Dense+Sparse+RRF（第8節）之外的第三個候選來源：

| 用途 | 技術 |
| --- | --- |
| Concept/別名精確查找 | `concept_aliases` 上的 `lower(alias)` 唯一索引（已在3.3節），O(1) 查找 |
| 模糊拼寫/縮寫容錯 | PostgreSQL `pg_trgm` extension 對 `concepts.canonical_name`/`concept_aliases.alias` 建 GIN trigram index |
| 長文技術詞彙全文比對 | PostgreSQL 內建 FTS（`tsvector`/`tsquery`）對 `chunks.content` 建索引，當 fallback，不當主要檢索 |
| 程式符號精確查找 | `code_symbols(fqcn)` 一般索引 + `(code_version_id, fqcn, signature)` 定位唯一（`fqcn` 跨版本/overload 會重複，不可建全域唯一，見 3.8 節） |

這條通道的結果與 Dense+Sparse 的結果一起送進 RRF 融合，而不是獨立回傳——這樣「使用者打對了精確術語」時排序自然靠前，不需要額外規則判斷何時該用哪條通道。

---

