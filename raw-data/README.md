# Raw Data（實際領域資料）

本目錄是 MVP 第一批要匯入的實際內容，複製自 `OpenST-QQBot-t1.2a` worktree 的
`public/database/raw/`（該 worktree 已依照
[`../docs/legacy-reference/source-policy.md`](../docs/legacy-reference/source-policy.md)
的來源政策，把原本散在 `public/database/` 各處的檔案重新整理進統一的 `raw/` 目錄結構）。

對應 [`docs/plan/03-ingestion-and-claims.md`](../docs/plan/03-ingestion-and-claims.md)
5.1 節「現有 OpenST-QQBot 資產盤點與遷移對照」的分級：

| 目錄/檔案 | 分級 | 說明 |
| --- | --- | --- |
| `dictionary/` | A（可直接標記 approved） | 979 筆詞條，每筆已有審核狀態、Discord 來源 URL、詞條間引用關係，見 `entries/*.json` |
| `gtmc-database/` | A（可直接標記 approved） | 結構化技術文件，比 main 分支多了 `MicroTiming/` 這個分類（main 分支拉取時間較早，未包含） |
| `machines/database.json` | B（結構遷移，內容待審） | 機器目錄 metadata，`tags` 對應到哪個 concept 需要人工確認 |
| `legacy/database.csv`、`legacy/database.md`、`legacy/Dictionary.txt` | C（走完整 Candidate 流程） | 品質落差大的歷史資料，不可直接標 approved |
| `TechMC Glossary.csv` | C（走完整 Candidate 流程） | 欄位需重新映射，且可能與 dictionary/ 的正式詞典重複 |

每個來源的授權、trust_level、公開匯出規則，不要憑感覺猜，直接查
[`../docs/legacy-reference/source-policy.md`](../docs/legacy-reference/source-policy.md)
——例如 `TechMC Glossary.csv` 的授權尚未確認，不得公開匯出；`legacy_dictionary_txt`
不得繼承 `dictionary/` 的 GPL-3.0 授權姿態。

匯入規則（哪些內容該被排除、怎麼判斷重複、怎麼切段）見
[`../docs/legacy-reference/document-ingestion-rules.md`](../docs/legacy-reference/document-ingestion-rules.md)，
對應測試樣本在 [`../benchmark/gold_dataset/triage-fixtures/`](../benchmark/gold_dataset/triage-fixtures/)。
