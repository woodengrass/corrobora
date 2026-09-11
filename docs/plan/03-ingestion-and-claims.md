[索引](README.md) · [← 向量索引](02-qdrant-vector-design.md) · [檢索流程 →](04-knowledge-graph-and-retrieval.md)

# 文件攝取：保存可研究的原文，不預先抽取整個知識世界

## 1. 建議流程

```text
來源登記／權限
  → 保存 immutable raw bytes + metadata snapshot
  → Source Revision + Import Run
  → 確定性解析、去重與品質標記
  → Document Revision → Sections → Passages + links/assets
  → terminology／version hints（可選補充，不改原文）
  → PG commit + index outbox
  → Raw Passage hybrid retrieval
  → Agent 按需讀完整 section／article
  → 有研究與重用價值時才提出 Candidate Finding
```

Documents 的資料工程仍是主線：metadata、語言、章節與位置越完整，Agent 越容易縮小閱讀範圍。
**移除「所有原文必須先經 AI triage→Claim→人審，才能被研究」的前置依賴。**
資料可供研究、來源可公開、內容是否可信、Finding 是否 verified 是四個不同維度。
有矛盾的社群文章是研究材料，不應因為不適合直接作答案而在 raw search 中消失。

## 2. 原始層與索引層的保留策略

| 情況 | 保存 | 搜尋／閱讀 |
| --- | --- | --- |
| 正常 Markdown／HTML／text | bytes、原始／解析正文、版本、links | passages 索引，Agent 可展開上下文 |
| 空白、404 | raw＋確定性 flags | 不進語意正文索引，仍可回查存在與匯入原因 |
| 純導航頁 | raw＋section＋links | 不當 factual evidence，但可沿目錄找文章 |
| 部分未完成 | 完整 raw、完整 section tree、flags | 有內容區段正常搜尋，未完成區段標記後可閱讀 |
| 短段／TODO 字樣 | 原文與 flag | 預設降為低優先級，不一刀刪除所有含 TODO 的段落 |
| 圖片、表格、code block | 原樣保存、位置與資產引用 | 沒有 vision/OCR 時回報限制，不捏造圖中內容 |
| exact duplicate | 每份來源與 snapshot 都保留 | 相同內容可共用 embedding，召回後聚合，保留每份 provenance |
| conflicting_fact／possible_typo | 原文及問題標記 | 授權 research 模式可查；結論需進行 fresh verification |
| parser failure | raw＋error＋parser version | 不偷偷讓 AI summary 取代失敗的 parsing；可用 raw read 作有標記的調查 |

沿用 legacy R1（RFC 4180）、R2/R3（empty／404）、R6（broken link）、R7（exact duplicate）、
R8（比對鍵不改原文）的核心經驗。R4/S2 的導航判斷用於「是否值得索引」；
S3 `<120 字元` 與 S4「出現 TODO 就排除整節」改為 flags／降權 baseline，
因為研究閱讀與舊 Answer Index 的風險不同，短術語、否定句與反證可能很有價值。
修改的規則必須建立新版 expected fixtures，不能改舊 gold 假裝無行為變更。

HTML 仍不執行 script 或外部資源，優先 article/main，保留表格欄列與 pre/code。
Markdown 的 GFM 表格、列表、code、圖片與 docsify link（省略 `.md`、`?id=`、中文編碼）
都應保留。chunk 長度是模型輸入限制，不能反過來決定來源是否存在。

## 3. 各類現有資料的實際遷移

| 本 repository 路徑 | 實測內容 | 建議落點／注意事項 |
| --- | --- | --- |
| `raw-data/dictionary/entries/*.json` | 112 筆，全有 upstream `APPROVED` | 原文 document/passage + concept sources；保留 upstream review，不自動產生 verified Findings |
| `raw-data/dictionary/zh-translations.json` | 112 筆，`termsZh` 為字串 | 翻譯原文與來源獨立保存；不把中文定義誤視為原文已驗證的逐字等價 |
| `raw-data/dictionary/config.json` | 詞條目錄與截斷 summary | 可用於目錄，不以 summary 取代 entries 的 definition |
| `raw-data/gtmc-database/` | 23 篇 Markdown，含導航／空白／404／未完成 | 結構化 raw corpus；不因 GTMC 名稱就把所有段落標 verified |
| `raw-data/machines/database.json` | 81 筆、228 tags | machines + revisions/tags，保留 sub_id、原始順序與描述；版本冲突保留為 hints |
| `raw-data/legacy/database.csv` | 151 邏輯記錄、19 筆多行正文 | 先 raw snapshot + RFC parser；其中 GTMC 重複內容用來源關聯，短詞作候選 aliases |
| `raw-data/legacy/database.md` | 215 行，歷史社群學習紀錄 | 受保護 raw；檢索表示依既有政策去除使用者識別，附 transform 與原始 locator |
| `raw-data/legacy/Dictionary.txt` | 117 行 | 待審 alias／translation 建議，不覆蓋正式詞典 |
| `raw-data/TechMC Glossary.csv` | 415 列、26 欄、UTF-8 BOM | 以實際 `Full Form (English)`／`Short Form`／`Chinese` 等欄映射；目前 internal |

沒有 979 筆詞條、215 篇 GTMC 或 4287 筆 CSV 記錄；那些是舊稿的錯誤計數。
19 篇 GTMC 與 CSV 內容的重複是 legacy audit 的「換行正規化＋trim」比較，
不等於新 canonical hash 的完全相同；保留 comparison_kind，不把不同 hash 偷改成一樣。

### 詞典連結的兩個陷阱

1. `references[]` 有 type／id／URL，應優先按 namespace＋ID 精確解析，不只按 term 字串。
   實際 189 個 reference 中存在不屬於這 112 個 dictionary IDs 的目標，未解析者保存
   `unresolved_references`；不能假設全部都是 dictionaryTerm。
2. `referencedBy[]` 有 197 個不同外部編號，例如 AB003／VBS002。現在未有完整對照表，
   保留原值；不以猜測建立 machine relation。`terms[]` 也可能列對比概念，須處理一詞多義。

## 4. Durable capture 與增量更新

先把讀到的 bytes 寫入 content-addressed blob，完成 checksum 驗證後才 commit revision。
中途失敗不發布來源指標；孤立 blob 可在核對後清理，但已被 revision 引用的 raw 不刪。
重抓同內容追加 observation 而不重做 embedding；A→B→A 也能追溯。

舊 rawAssets.ts 只保存 path＋hash，舊檔案未 commit 即被覆寫時，歷史內容會消失。
這個限制不能移植到新架構。manifest 仍可作掃描快取，但要向 PG 確認 revision 已存在；
不能用 manifest 取代 authoritative capture。

每個 parser／index job 具 importer、rules、representation version，支援 idempotent replay。
source 消失先記 observation／availability，不刪 source revision。worker 抓取 job 用短交易與 lease；
LLM 呼叫不持有 DB transaction，不在每次啟動時把所有 worker 的 running job 無條件重置。

## 5. AI 整理放在哪裡才值得？

可選工作包括版本 hint、術語 linking、長文閱讀導引、針對已發現問題的 contradiction review。
使用 Strong LLM few-shot baseline，記錄模型與成本；有價值再做小模型。
這些結果都是衍生 metadata 或 candidate，不會覆蓋 raw，不是所有文件入庫的必要關卡。

Finding 在研究完成後提出，使用[admission 與 consolidation](11-research-memory-lifecycle.md)。
全量 `claim_extract`、Flash→Pro 強制分流與 corpus-wide graph extraction 從主線移除。
過去人工整理的高價值 Claim 未來可經 provenance／scope 稽核轉為 Finding，
並非把歷史所有 atomic statements 自動搬成 memory。

## 6. 沿用 fixture 的方式

舊 [triage fixtures](../../benchmark/gold_dataset/README.md) 的 14 個來源 hash 與 9 份人工 JSON
仍有價值，但它們測的是舊 candidate/materialize 規則，不是本系統完整 ingestion。
重播 adapter 做三件事：根路徑映射、legacy camelCase→snake_case、rawAssetId 佔位 remap。
其中 conflict_review 的 IDs 是多來源陣列索引，不能把所有 `0/1` 換成同一 raw ID。

新 expected layer 要明確列：raw 已保存、section 可讀、index eligibility、flags、provenance、
source policy，以及「没有自動 verified」。例如衝突文字由舊 `candidate/no chunk`
改為新「有 passage、research 可讀、conflict flag」，應作明示的行為變更測試。

## 7. 驗收

- 原文未改寫，重匯入不重複，舊 revision 可以還原。
- heading、段落、表格、code、引用與圖片位置可追溯。
- raw search 可定位完整上下文，而非只輸出數段 AI 改寫摘要。
- 跨來源 duplicate 不遺失原 URL／權限，也不被算成獨立佐證。
- 停用 LLM extraction 仍能完成 Documents ingestion 與搜尋。
