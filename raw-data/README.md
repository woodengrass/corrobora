# Raw Data：專業研究 corpus

本目錄的 tracked 素材複製自 OpenST-QQBot 的資料資產；corrobora 尚未完成匯入服務。
建議流程見[文件攝取](../docs/plan/03-ingestion-and-claims.md)，
目前工作區的盤點與遷移見[現況](../docs/plan/10-current-state-and-migrations.md)。

## 2026-09-11 核對結果

| 來源 | 內容 | 新系統定位 |
| --- | --- | --- |
| `dictionary/entries/` | 112 筆 upstream APPROVED 詞條 | 原始定義、概念／aliases 種子，不自動成为 verified Finding |
| `dictionary/zh-translations.json` | 112 筆中文翻譯 | 保留翻譯来源、版本與多義情況 |
| `dictionary/config.json` | 詞條目錄與摘要 | 導航，不能取代完整 definition |
| `gtmc-database/` | 23 篇 Markdown＋圖片，含導航／未完成／404 | 結構化 raw documents，Agent 按需研究 |
| `machines/database.json` | 81 筆機器、228 tags、81 唯一 sub_id | 人類作品 catalog；描述／tags 的版號與效能是來源宣稱 |
| `legacy/database.csv` | 151 RFC 4180 邏輯記錄，19 筆多行正文 | 原文保留、解析／重複與術語整理；不可按實體換行數算筆數 |
| `legacy/database.md` | 215 行社群學習日誌 | 受保護原始歷程，來源識別與可檢索正文分開 |
| `legacy/Dictionary.txt` | 117 行 | 補充待審 alias／翻譯，不覆蓋正式詞典 |
| `TechMC Glossary.csv` | 415 records、26 欄、BOM | 按實際中英欄映射，來源政策目前 internal |

### 本機 Minecraft source

此工作區另有 **Git 忽略**的 `minecraft source code/`，不保證新 clone 具有此目錄。
其 README 標示 Minecraft 1.21.11、parchment 2025.12.20、Vineflower 1.13.0-a712f4c930；
Java 21 build 設定，6,624 個 Java 檔案。它可作 JIT source research 的起點，
但還沒有 corrobora repository/version/symbol index。需登記 snapshot／hash／mapping／來源政策後使用。
來源標示 DO NOT REDISTRIBUTE，維持本機研究資料邊界。

machine catalog 的 filename 並不代表 blueprint bytes 已在此目錄；盤點未找到實體 `.litematic`。

## 保留與權限

原始來源的授權、署名與可公開範圍見
[legacy source policy](../docs/legacy-reference/source-policy.md)。該文件的 `public/database/raw/`
在本 repo 對應 `raw-data/`，machine JSON 則對應 `raw-data/machines/database.json`。
TechMC Glossary 授權待確認，不可自行改 public；舊 Dictionary.txt 不繼承正式詞典授權。

目前檔案是匯入素材。未來 capture 必須另存 immutable bytes＋source revisions，不能只留
這個可編輯路徑與 hash。AI summary／Finding 不能取代原文。
新 ingestion 保留矛盾與未知版本供研究，不因可搜尋就把其內容當已驗證事實。

舊[文件規則](../docs/legacy-reference/document-ingestion-rules.md)與
[fixtures](../benchmark/gold_dataset/README.md)保留作行為參考；本版調整的 flags／index
eligibility 需新 expected layer，不直接繼承舊 Claim-first materialize 流程。
