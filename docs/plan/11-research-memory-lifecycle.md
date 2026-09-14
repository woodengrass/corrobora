[索引](README.md) · [資料模型](01-postgres-schema.md) · [檢索流程](04-knowledge-graph-and-retrieval.md)

# Research Memory：保存、成熟與自我失效

## 1. 什麼值得記住？

Research Finding 是一個經過一定研究成本、未來有重用價值的結論。
它可以是機制解釋、跨文件／code 確認的條件、設計型 mechanism、版本差異，
或高成本得到的負面結果。不是每一句 factual statement，也不是完整 answer cache。

| 值得保存 | 通常不保存 |
| --- | --- |
| 多個 code path 的行為差異及適用條件 | class 名稱、能直接 grep 的 literal |
| 不同文件說法的相容條件／已定位的矛盾 | 每讀一段就生成摘要 |
| 對後續多題有 utility 的 mechanism | 一次性聊天措辭／完整回答 |
| 精確版本的可重用設計限制 | 沒來源的模型自信結論 |
| 有限定搜尋範圍的高成本 negative result | 「搜不到所以世界上不存在」 |

Admission 先用 Strong Agent 的簡短理由＋policy checks：研究成本、跨來源程度、
可重用性、版本敏感性、典型適用問題、條件完整性與 provenance。
蒸餾時按三面向記錄——成功模式、失敗觸發、比較洞見（ReMe 的 multi-faceted
distillation，見參考文獻 Cao et al. 2026），讓後續不同情境能情境感知重用，
而不只存結論文字。不先發明一個精確 utility 分數；之後用實際 reuse／review 成本校準。
不保存也記 `finding_not_saved` 原因，才能評估 admission 是否漏掉有價值成果。

負面 Findings 必須有搜尋 corpus snapshot、查詢範圍與時間；新增相關 corpus 後應重查。
MVP 不自動以負面 finding 支撐普遍不存在的結論。

## 2. 最小 Finding 的讀法

例如「某版本下，漏斗接收與發送路徑的冷卻設定有不同前提」：

- title／statement：可重用的结論，不嵌入這次使用者的完整問題。
- reasoning_summary：簡短可查證的依據摘要，不保存私有 chain-of-thought。
- conditions／exceptions：版本、環境、容器狀態與時序前提。
- domain concepts／typical questions：讓未來不同 wording 能找到它（對應 ReMe 的
  scenario ω＋keywords κ：什麼情境用、什麼工具鏈，檢索時按情境 embedding 找，不只按結論文字）。
- sources：相關文章段落與精確 code methods，分 supports／contradicts／context／derived_from。
- dependencies：哪些 source、method、tag 或上游 Finding 改動要重查。
- validation：provisional 或特定 scope 的 verified 等状态，含查證人與時間。

這個示例不自動生成正式 Finding，不以本次文件閱讀冒充已完成 benchmark 或人工核准。

## 3. 寫入流程

```text
研究完成 → Candidate Finding + read receipts
    → schema / scope / provenance / admission validation
    → retrieve similar findings（包含 lexical、concept、版本／條件）
    → compare：equivalent / extends / contradicts / supersedes / independent
    → policy 決定可自動完成的部分或送 review
    → PG transaction：revision / validation / sources / dependencies / relations / events / outbox
    → 索引更新
```

schema 合法不代表結論已 verified。admitted 的初始結論是 provisional；
MVP 人工 review 才可升格 verified。Agent 不能在 submit payload 中指定「既有 verified 已修正」。
對已存在內容的修訂一律新增 revision；superseded 舊資料保留歷史。

## 4. Consolidation 的五種結果

| 分類 | 判斷重點 | 建議寫入動作 |
| --- | --- | --- |
| `equivalent` | 結論、條件、例外、scope 都等價，不只是 wording 相似 | 相同重送回既有結果；新的來源支持建立補充修訂／review，保留舊原文與核准紀錄 |
| `extends` | 新增適用條件、解釋、mechanism 或實驗支持，但不推翻舊結論 | 新 revision／Finding + `EXTENDS`；新版本 scope 另建 validation，不直接 union |
| `contradicts` | 同 scope／條件下互斥，非僅版本不同 | 保存兩側＋`CONTRADICTS`；有效性 policy 標爭議／待重查，不能吞掉低分一方 |
| `supersedes` | 在明確 scope 下由新結論取代舊結論 | 新結論通過替代政策後，新→舊 `SUPERSEDES`，舊 validation 才停用 |
| `independent` | 只是相關，或條件／效果不同，不能互相取代 | 獨立保存，必要時 `RELATED_TO` |

不能用 0.95/0.97 cosine 閾值直接 merge；這些舊閾值對新模型、Finding 粒度與不同條件不適用。
比較需讀完整 Finding，必要時看 raw support。版本不重疊未必矛盾，scope 擴大也不是免費驗證。
一篇文章的轉載不能算第二個獨立來源；provenance lineage 必須保留。

### 保守、可實作的第一版

- 完全相同 idempotency key、相同 candidate payload／receipts：不重複寫入。
- Strong LLM few-shot 提供 consolidation 建議，记录模型與 prompt。
- 寫入採 selective addition（ReMe 實證）：只從成功軌跡蒸餾，單次失敗的教訓只在重試成功後保留，
  否則丟棄不入池；失敗重試設上限，避免模型自身限制造成無限迴圈。
- 新 provisional 的獨立保存可自動完成；語意 merge／supersede／影響 verified 的操作先人工確認。
- 剪枝用效用規則：某 Finding 被取回 f 次、成功貢獻 u 次，當 f≥α 且 u／f＜β 時移除
  （ReMe 的 utility-based deletion；α、β 由 pilot 校準，先保守）。
- LLM-as-judge 只作第一道過濾（actionable／accurate／valuable＋相似去重），
  ReMe 自陳其可能遺漏細微品質問題；本計畫 verified 一律要人工 review，比論文更嚴。
- 自動規則可降低可用性，例如收到有效反證提案先排 revalidation；不能自動升格 verified。
- 合併結果保存 candidate、比對目標、decision、rationale、差異與 sources；可追查錯誤 merge。
- 人工 review 不必在線阻擋答案，寫入可先排隊。benchmark 分別記 foreground 與等待／review 成本。

## 5. 併發與修訂

不同 session 可能同時保存等價成果。semantic comparison 在 transaction 外進行；提交時：

1. 用 idempotency key 擋 exact retries。
2. 對比對涉及的 finding IDs 按固定順序 row lock，檢查 current revision／row_version。
3. 若已變動，重新比較；不拿舊建議覆蓋新成果。
4. 新 Finding 尚無共同 ID 時，可按同一 admission batch 串行 consolidation。
   不宣稱資料庫 unique text hash 能完全阻止語意重複；後續周期 consolidation 補漏。
5. 同交易建立 sources／dependencies／relations／audit／outbox，失敗整體 rollback。

資料正文 revision 不可覆寫；等價追加 provenance 若改變被驗證的來源集合，新增 revision，
重新確認支持鏈後再設 current。單純重試不用新增 revision。
找到新結論不應立刻廢棄仍有效舊版，直到替代結論可用，避免 pending 修訂造成記憶真空。

## 6. 有效狀態

| 狀態 | 定義 | 可否直接視為已覆蓋 |
| --- | --- | --- |
| `provisional` | 已保存、可追溯，尚未完成指定驗證 | 否，作線索／有條件推論 |
| `verified` | 指定 scope 已通過 policy，依賴仍有效 | 可，但仍需符合問題 constraints |
| `disputed` | 同 scope 有未解矛盾 | 否 |
| `needs_revalidation` | 關鍵依賴變更或核准基準不再適用 | 否 |
| `stale` | 已確認對此 scope 不再成立／不再可用 | 否，保留作歷史 |
| `superseded` | 此 scope 已被指定後繼成果取代 | 否，導航到後繼 |

主要轉移：

- candidate admitted → provisional；review → verified 或 disputed。
- verified/provisional → needs_revalidation：invalidation policy，附 event。
- verified → disputed：有經政策接受的反證，不能只因 cosine 高就標矛盾。
- needs_revalidation/disputed → verified：完成重新查證、綁新依賴並經授權 review。
- needs_revalidation/disputed → stale：確認已失效；→ superseded：後繼已可用。
- stale/superseded 不原地復活；新 revision／validation 保存新的確認與前後關係。

狀態變更只改 validation projection，舊 review/events 仍保留；provenance 不會跟著狀態被刪掉。

## 7. Dependency-aware Invalidation

這裡的「self-invalidating」是系統依已記錄依賴自動找受影響成果，
**不是自動知道所有語意真偽，也不是保證依賴永遠完整**。

```text
偵測來源／code／upstream Finding 變動
    → append invalidation_event（包含舊／新 fingerprints）
    → 反向查找直接 dependencies
    → 計算受影響 target scope
    → 標 needs_revalidation、增加 generation、寫 outbox
    → 依 upstream dependencies 逐層傳播
    → 下次 query 命中時 gap-only revalidation
```

| 變動 | 動作 |
| --- | --- |
| 同文章新 revision | follow_source 的依賴重查；精確 passage diff 可縮小範圍，無可靠對齊則整 revision |
| 同版本 code snapshot／symbol body 改變 | 對相關 scope 標待查；mapping／decompiler 改版也記錄，不能視為必然行為變更 |
| 新 Minecraft version | 不自動沿用，也不廢棄舊版本；新 target validation 待查 |
| 上游 Finding disputed／失效／更正 | required dependent validations 待查，逐層传播 |
| source 消失 | snapshot 可還原時歷史 evidence 仍在；source availability 與 validity 分開 |
| 來源權限撤銷 | 立即更新可見性，按新的可用來源集合檢查衍生內容；不等待向量更新 |
| parser 切段改版 | 舊 locator 保留；不能因 passage IDs 重建就把所有原文判成變更 |
| unrelated file 改變 | 有精確依賴時不影響；保守 repo-level 依賴可產生 false invalidation，需量測 |

`pinned` 依賴表示歷史快照；`follow_source` 表示目前維護中的來源說法；
`compare_target_version` 表示需為新遊戲版本重新確認。watch_mode 在建立 validation 時明示，
不得以「最新文件一定取代舊版歷史」當預設。

### 傳播未完成的時間窗

直接事件先落 PG。若 transitively affected rows 尚未更新，read-time validity check
必須沿 required dependency 檢查上游 generation／pending change watermark。
任一路未確認就不能當 verified reuse；大圖超出檢查预算也回 needs_revalidation，
不因背景 worker 尚未追完就繼續給出過期答案。
MVP dependency DAG 小，可完整反向遍歷；worker 以 event＋validation 唯一鍵 idempotent 重播。
visited set、防循環、批次游標與 generation 保證重試不無限傳播。

### 多來源支持的取捨

一個支持來源變更不一定推翻整個結論，但不能單靠「還剩一篇」就自動保持 verified。
MVP required dependency 任一變動先重查；supplementary 只產生提醒。
alternative support groups 可日後引入，前提是 false invalidation 與 revalidation cost
已證明值得增加 schema，不預先建立完整邏輯證明器。

## 8. Revalidation 不是完整重研

Query 命中過期 Finding 時，提供舊 statement／scope、原始 sources、changed dependencies、
diff／新版本 locator，以及受影響的 needs。Agent 只查變動部分與必要相鄰路徑。
結果可能是結論仍成立、條件縮小、新版本不同、無法確認或被取代。

同 statement 可新增 validation／provenance revision；statement 改變則新增 Finding revision。
核准交易檢查研究開始時的 dependency generation，途中再變更則不能以舊結果升格。
驗證失败保留狀態與原因，照實交付未知部分。

## 9. 記憶長期成長與健康度

先以 admission 控量，再做相似候選比較與周期 consolidation，並按實際 reuse／review
成本做 utility-based refinement：加入已驗證成果、剪除過期低價值者，保持記憶緊湊高品質
（ReMe 第三機制，見參考文獻）。
低 reuse 但高成本／稀有用途的 Finding 不因不熱門立即刪除；可從 active index 降權或移到
archive projection，保留 PG、provenance 與歷史。需監測：

- duplicate／false merge、Findings 成長數、平均 provenance/dependency 大小。
- 保存後固定時間窗口的 reuse rate，與未來還沒有機會被 reuse 的 censored 項分開。
- consolidation／review／indexing／revalidation 的總成本。
- 新模型讀舊模型 Findings 的可用性與錯誤傳播。

如果記憶越大造成 retrieval／review 成本高於節省，應先縮減 admission／改善表示，
而不是自動加 graph database 或訓練更多專用模型。
