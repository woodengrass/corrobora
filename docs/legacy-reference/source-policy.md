# 來源政策（T0.1）

本文件是知識系統遷移的唯一來源登錄清單。任何匯入器（Raw 掃描器、術語匯入、文件匯入、機器同步器等）
在寫入 `sources` 表或決定內容的授權、署名與公開性之前，必須先查詢本表或資料庫中對應的
`sources` 列，禁止在程式碼中硬編碼 `license`、`creator` 或 `visibility`。

## 欄位定義

| 欄位 | 說明 |
| --- | --- |
| `source_key` | 匯入器使用的穩定來源鍵，對應 `sources.source_key` |
| `type` | 來源分類（本文件內部命名，供文件與匯入器共用；非資料庫列舉） |
| `display_name` | 對外顯示名稱 |
| `creator` | 原始創作者／組織；找不到時留空，不得臆造 |
| `origin_url` | 原始來源網址；找不到時留空並標記「待補充」 |
| `license` | 授權條款；未確認時填「待確認」 |
| `license_url` | 授權條款全文連結 |
| `visibility_default` | 匯入時預設 `sources.visibility`：`internal` 或 `public` |
| `trust_level` | 匯入時預設 `sources.trust_level`：`high`／`medium`／`low`（定義見下方「trust_level 分級」） |
| `attribution_rule` | 一般回答引用此來源時的署名規則 |
| `public_export_rule` | 若 `visibility_default=public`，公開匯出（一般回答、`source_references`）時必須遵守的規則 |
| `status` | 本來源目前的政策狀態（例如是否被授權問題阻擋公開匯出） |

## trust_level 分級

| 等級 | 定義 |
| --- | --- |
| `high` | 授權條款、來源網址與著作權資訊皆可驗證追溯 |
| `medium` | 有明確使用條款或社群審核流程約束，但個別條目未逐筆外部驗證 |
| `low` | 歷史或未經外部驗證的來源；授權、作者、版本資訊不完整或待確認 |

## 初始來源清單

| source_key | type | display_name | creator | origin_url | license | license_url | visibility_default | trust_level | attribution_rule | public_export_rule | status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `gtmc` | document_collection | GTMC 技術文件 | 待補充（各文章作者不同，逐篇追溯） | 待補充 | CC BY-NC-SA 4.0 | 待補充 | public | medium | 顯示作品／文章名稱、可得作者、原始 URL、CC BY-NC-SA 4.0 與修改標記；找不到作者時留空 | 每次使用 GTMC 證據的回答須列來源 ID、作品／文章名稱與作者或署名對象；找不到作者時留空，不得臆造 | 已核准；來源 URL、授權全文 URL 與逐篇作者待補充前不得標為 high |
| `storage_tech_dictionary` | dictionary | Storage Tech Dictionary | Storage Tech Dictionary 社群 | https://github.com/StorageTechDictionary/StorageTechDictionary.github.io | GPL-3.0-or-later | 見 `public/database/raw/dictionary/LICENSE.md` | public | high | 保留原始來源連結、著作權聲明與授權資訊 | 顯示來源與 GPL-3.0-or-later 資訊；不得省略授權聲明 | 已核准；**範圍僅限 `public/database/raw/dictionary/`**，不含 `Dictionary.txt` |
| `techmc_glossary` | glossary | TechMC Glossary | 待確認 | 待確認 | 待確認 | 待確認 | internal | low | 授權確認前僅供內部檢索與審核 | 授權確認前禁止進入 `public` 匯出或一般回答引用；不得假設授權已解決 | 外部阻擋：等待來源 URL、作者與再散布條件確認 |
| `openst_machine_submission` | machine_submission | OpenST 機器投稿 | 各投稿者 | 既有 OpenST 檔案庫 | OpenST 投稿條款（投稿者已同意） | 待補充 | internal | medium | 僅用於機器推薦 | Bot 顯示既有 OpenST 檔案庫連結，不建立額外來源目錄條目；不對外暴露內部匯入細節 | 已核准 |
| `legacy_database_csv` | legacy_raw | 歷史知識庫（CSV） | 社群（原始貢獻者身份僅存 Raw 區） | 無（本地歷史檔案） | 內部整理，無外部授權聲明 | 無 | internal | low | 只作 Raw 與 AI 整理來源；核准整理內容改以 `openst_community` 發布 | 本來源本身不得公開匯出；僅其審核後衍生的 `openst_community` 內容可視情況公開 | 已核准（僅供 Raw／AI 整理，救援遷移另立 session） |
| `legacy_database_markdown` | legacy_raw | 歷史學習日誌（Markdown） | 社群（原始貢獻者身份僅存 Raw 區） | 無（本地歷史檔案） | 內部整理，無外部授權聲明 | 無 | internal | low | 只作 Raw 與 AI 整理來源；核准整理內容改以 `openst_community` 發布 | 本來源本身不得公開匯出；僅其審核後衍生的 `openst_community` 內容可視情況公開 | 已核准（僅供 Raw／AI 整理） |
| `legacy_dictionary_txt` | legacy_raw | 舊術語對照（Dictionary.txt） | 社群（原始貢獻者身份僅存 Raw 區） | 無（本地歷史檔案） | 內部整理，無外部授權聲明 | 無 | internal | low | 僅作待審翻譯候選內部使用，不得繼承 `storage_tech_dictionary` 的 `public`、`high` 與 GPL-3.0-or-later 署名姿態 | 不得公開匯出；內容只能進入 `extraction_candidates`（T2.6）作為待審翻譯候選，不得寫入正式術語翻譯或覆蓋 T2.5 由 `dictionary/` 匯入的既有翻譯 | 已核准（僅供 Raw／AI 整理翻譯候選，不得覆蓋正式詞典） |
| `openst_community` | community_curated | OpenST 社群整理 | 匿名／社群整理（預設） | 無 | 無外部授權聲明（原創整理內容） | 無 | internal | medium | 預設顯示「社群整理」；僅原始貢獻者明確同意才顯示貢獻者姓名 | 一般回答預設署名「社群整理」；公開網站與條款不屬於本專案範圍 | 已核准 |

## 歷史脈絡：`legacy_dictionary_txt` 曾經沒有正式 source_key

`public/database/raw/legacy/Dictionary.txt`（人工中英對照補充候選）在計畫初期的
「既有資料的初始狀態」表只列為 `pending` 翻譯候選，理由是「可能與正式詞典翻譯衝突」，
且計畫的 Raw 目錄配置將它放在 `raw/legacy/`（與 `database.csv`、`database.md` 同列）
而非 `raw/dictionary/`，因此不得由 `storage_tech_dictionary` 的來源設定涵蓋，需要
獨立的 `source_key`。這個 `source_key`（`legacy_dictionary_txt`）現已正式併入上方
「初始來源清單」主表，欄位完整（不再只有 visibility／trust_level 兩欄），本節僅保留
歷史脈絡。**約束**：`Dictionary.txt` 不得繼承 `storage_tech_dictionary` 的 `public`、
`high` 與 GPL-3.0-or-later 署名姿態；其內容只能作為待審翻譯候選進入
`extraction_candidates`（T2.6），不得寫入正式術語翻譯，也不得覆蓋 T2.5 由
`dictionary/` 匯入的既有翻譯——這條約束已納入主表對應列的 `attribution_rule` 與
`public_export_rule` 兩欄。

## 驗收規則

1. 匯入器不得在程式碼中硬編碼授權、作者或 `visibility`；所有值必須由本表（匯入 `sources` 表後）或資料庫
   `sources` 查詢取得。
2. 缺少 `license` 或 `public_export_rule` 的 `public` 來源必須拒絕公開匯出（不得建立 `visibility=public` 的
   `source_references`），但仍可保存 Raw 快照供審核者查閱。
3. `status` 欄標記為「外部阻擋」或「待確認」的來源，其 `visibility_default` 必須為 `internal`，直到政策更新
   為止；任何 Track 不得自行將其升級為 `public`。

## 外部阻擋

- **TechMC Glossary 的來源與授權**：尚未取得原始網址、作者資訊與再散布條件，因此暫時只能內部檢索與審核，
  無法在一般回答中公開引用。
- 公開來源網站與 OpenST 公開投稿條款的建置不屬於本專案範圍，不在本文件處理。
