# Gold Dataset（沿用 OpenST-QQBot 既有評測資產）

本目錄的檔案全部從 `OpenST-QQBot-t1.2a` worktree 的 `eval/` 目錄複製而來，是既有專案已經
建立、可直接使用的評測資產，不需要從零開始寫評測題庫或測試 fixture。

## `questions.json`

33 題手工建立的 gold 題庫，對應 [`docs/plan/09-roadmap-and-benchmark.md`](../../docs/plan/09-roadmap-and-benchmark.md)
規劃的「六類各 20+ 題」分層題庫的起點。每題欄位：

```json
{
  "id": "term-001",
  "category": "term_definition",
  "question": "BUD 是什麼？",
  "edition": "java",
  "version": null,
  "environment": null,
  "expected_terms": ["BUD", "Block Update Detector"],
  "expected_source_ids": [],
  "forbidden_source_ids": [],
  "expected_answer_properties": ["定義 BUD", "說明縮寫含義"],
  "expected_uncertainty": "未知版本時不得斷言所有實作細節都適用",
  "status": "draft"
}
```

`category` 目前的分類（沿用舊專案既有分類，與本專案 `docs/plan` 的六大類不是一一對應，
擴充題庫時需要重新對應或合併分類）：包含 `term_definition`、`machine_recommendation` 等。
`status: "draft"` 的題目尚未經審核者最終確認，擴充/使用前應先過一輪審核。

## `baseline-machines.json`

`t1.2a` 為了驗證「把機器資料源從 `database.json` 換成 SQLite 時，推薦行為不能悄悄改變」，
記錄了一組固定查詢在遷移前的 top-5 推薦結果快照。遷移到 PostgreSQL/Qdrant 版本時，同樣需要
一份「遷移前後推薦結果應該一致」的回歸基準，這份檔案可以直接當初始比對基準，或參考它的方法論
重新產生一份針對新系統的基準。

## `triage-fixtures/`

文件攝取管線（stub/navigation/404/duplicate 判定、AI 分流）的真實測試樣本，从
[`docs/legacy-reference/document-ingestion-rules.md`](../../docs/legacy-reference/document-ingestion-rules.md)
（T0.5 規則文件）第10節「目前 Fixture 涵蓋的案例」逐一對應：

| 子目錄 | 內容 |
| --- | --- |
| `samples/` | 合成測試樣本：wiki 匯出 HTML、純文字社群筆記、`/learn` 投稿格式範例 |
| `ai-responses/document-triage/` | 人工撰寫並核准的 `document_triage` AI JSON 契約種子（檔名為輸入內容的正規化 SHA-256） |
| `ai-responses/document-quality/` | `document_quality` 契約種子 |
| `ai-responses/conflict-review/` | `conflict_review` 契約種子（漏斗冷卻 8gt vs 7gt 的衝突案例） |
| `document-expected.json` | 每個案例的預期匯入結果（`provenance_only`/`excluded`/`candidate`/`pending`），對照 `gtmc-database/` 裡的實際檔案 |
| `duplicate-provenance.json` | 跨路徑重複資產的預期 canonical 選擇結果 |

這些 fixture 是為 SQLite/TypeScript 版管線寫的，`rawAssetId` 等欄位在 Python 版重播時需要
按 [`docs/legacy-reference/document-ingestion-rules.md`](../../docs/legacy-reference/document-ingestion-rules.md)
第9節「Fixture 的 Raw 回鏈佔位」規則，用實際插入後的 id 取代佔位值 `0` 再驗證，不能期待欄位
直接可用。**規則本身（哪個案例該判定為什麼結果）是語言無關的，可以直接拿來驗證 Python 版
ingestion 的判定邏輯是否一致**。
