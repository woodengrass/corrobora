[索引](README.md) · [← PostgreSQL](01-postgres-schema.md) · [文件攝取 →](03-ingestion-and-claims.md)

# 分層語意索引與可替換 Retrieval 元件

## 1. 兩個核心索引就夠

| Logical collection | 索引單位 | 用途 |
| --- | --- | --- |
| `raw_passages` | 一筆 passage，精確綁定 document revision | 找值得展開閱讀的 section／article |
| `research_findings` | 一筆 Finding revision 的 scoped validation | 找已有研究成果與需要 revalidation 的線索 |

Qdrant 不是正式內容庫。Finding 的 statement、reasoning、sources 與 status 回 PG 取；
passage 原文回 PG／blob 取。每個 logical collection 可有一個 active physical build，
例如 `raw_passages_<build_id>`，升級時以 alias 切換。

不再預設 concepts、mechanisms、claims、code_summaries、experiments 各建 collection。
概念先走 PostgreSQL alias/exact lookup，machine catalog 先走原有關鍵字能力；code 直接
repo search。需要 semantic Finding 的 code 結論使用同一 memory index，無須全量 AI code summary。

## 2. Embedding 表示與 payload

**Raw 表示**：title + heading path + passage 原文，可附少量已解析術語。
這個表示是搜尋用的拼接，不回寫為 raw text；超長表格／code block 另有索引窗口，
但窗口必須能定位原始完整區塊，不靜默截斷來源。

**Finding 表示**：title + statement + reasoning summary + typical applicable questions +
domain concepts + terminology aliases。typical questions 只由已完成研究概括，不能從尚未
發生的 benchmark 題目或 gold answer 生成。

| 共同 payload | Raw 特有 | Finding 特有 |
| --- | --- | --- |
| `public_id, pg_id, index_build_id, representation_hash, access_scope, source_types` | `passage_id, section_id, document_revision_id, source_revision_id, language, index_status, version_scope_kind, version_ids` | `finding_id, finding_revision_id, validation_id, status, version_ids, scope_kind, loader, server_implementation, concepts, entities, mechanisms, dependency_generation` |

狀態、edition、版本 ID、來源型別、ACL scope、語言／concepts 建 payload indexes。
Point ID 使用 UUID，或由 target public ID＋build contract 派生 UUID；不得使用 Qdrant
不支援的任意 `{type}_{id}` 字串。Finding 每個 validation 一個 point，可共用 revision embedding cache。

最初每個 point 一個 dense vector，加一個可選 sparse vector。這與 ColBERT token-level
multi-vector 不同，不因為有兩種表示就導入 late interaction。dimensions 與 distance 來自
encoder contract，不固定 1024，也不在 domain schema 寫 BGE 專用型別。

## 3. 抽象邊界：小而具體

| Port | 輸入／輸出責任 | 初始 implementation |
| --- | --- | --- |
| `DenseEncoder` | 批次文字→dense vectors + 模型／tokenizer contract | BGE-M3 可作 baseline，另選可用模型比較 |
| `SparseEncoder` | 文字→term IDs/weights + vocabulary contract | BGE-M3 sparse 可作 baseline；語彙空間不可混用 |
| `Reranker` | query + candidates→有序 ID 與分數 | strong few-shot 或 cross-encoder baseline，實測成本 |
| `VectorRetriever` | typed query/filter→candidate IDs/ranks | Qdrant adapter，不洩露 Qdrant Filter 物件給 domain |
| `LexicalRetriever` | exact／tokenized lexical search | PG exact/trigram/FTS，必要時独立 BM25 implementation |

初始 hybrid 為 dense + lexical，learned sparse 與 reranker 用同一評測選擇。
**PostgreSQL FTS 的 ts_rank 不是 BM25**；中文分詞亦不能靠預設英文 FTS 自動解決。
對中文術語與 code token 應測 tokenization／trigram／exact 通道，BM25 與 learned sparse
分別標明实现，不能把兩者的分數或 vocabulary 當作可互換。

RRF 以 rank 融合，不直接加不同模型原始分數。可先試每通道 top 50、fusion 20、rerank 10，
`k=60` 作起點；這些是可調參數，使用 dev set 選擇並鎖定後測試，不是適用所有 corpus 的常數。

## 4. 版本過濾需要兩種閱讀模式

**reuse 模式**：已知相容 scope、有效 status、授權符合的 Findings。
**research 模式**：可回傳 provisional、needs_revalidation、stale、disputed 或未知版本線索，
明示不能當已覆蓋結論；contradictory Findings 即使語意分數低，也應透過關聯顯示。

Documents 通常缺少版本。若一律要求 `version_ids contains target`，大量有價值的文件
永遠找不到。故 raw search 分成「已知相容」與「未知待判定」兩路，後者只供閱讀與確認，
不是自動跨版本有效。明確不相容資料預設排除；Agent 做版本比較時可明確指定另一側，
結果分組顯示，不混成同一版本答案。

每次向量候選取回後，以 PG batch hydration 重查版本、該 validation 的最新狀態、dependency generation
與權限；被剔除時在同预算內 oversample／補取。若索引落後或 unavailable，以 PG lexical
降級並記錄 retrieval incomplete，不能把「找不到」當作「記憶裡沒有」。

## 5. PG→Qdrant：可恢復，不做不可靠雙寫

```text
PG transaction: Finding / status change + index_outbox
    → commit
    → worker 讀取目前 PG generation
    → encoding（如表示未變，重用向量）
    → idempotent upsert / tombstone
    → 確認回應後標 outbox 完成
```

同一 aggregate 的索引工作序列化；重試處理最新 PG 狀態，不以過期 event payload 覆蓋新狀態。
寫入前後檢查 generation；若變動，重新排程直到收斂。PG hydration 是最後的正確性檢查。
不要讓慢速向量工作阻擋 source 失效標記；Qdrant 壞掉不應使過期記憶恢復成 verified。

模型／tokenizer／dimensions／normalization／distance／sparse vocabulary／表示組裝版本
共同構成 index contract。**模型更換重建索引，不重寫 Finding 正文，不重新研究整個 corpus。**

重建流程：固定 PG snapshot + outbox high watermark → 建新 collection → backfill → replay
增量 → 驗證筆數、抽樣 locator／filters、retrieval regression → 原子切 alias。
保留舊 build 到觀察期完成，失敗可切回；切回後仍受 PG 最新有效性與權限檢查。
不採用舊稿「先清空 active collection 再慢慢重灌」的停機方式。

## 6. 成本與何時擴展

將 query encoding、候選搜尋、rerank、PG hydration、context expansion 與 indexing 分開計時。
每個 build 保存資料 snapshot、模型 artifact、輸入表示 hash 與記憶體／儲存量。
ColBERT、多 named vectors、獨立 concept vector index 只在指定題型 recall／成本曲線
證明有益後加入；Qdrant baseline 的好壞也由同一 port 下的比較決定。
