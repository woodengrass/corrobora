# Legacy Reference：OpenST-QQBot 規劃與程式資產

此目錄保存從 OpenST-QQBot worktree 移入的歷史規格、TypeScript／SQLite code 與 audit。
原始檔的 Track／Phase、舊路徑、固定模型、審核與 Answer Index 政策屬於舊專案。
**本輪 corrobora 的討論計畫以 [docs/plan](../plan/README.md) 為準**；
逐檔沿用／重構與已發現落差見[現況與遷移](../plan/10-current-state-and-migrations.md)。

## 歷史來源

原盤點記錄的主要 worktree 為 `OpenST-QQBot-t1.2a`，分支
`feature/t1.2a-worker-raw-scanner`，其歷史包含 t1.2b／t1.4a／t1.5a 的資產。
這是移入時的來源紀錄，不表示本 repository 含有完整 OpenST runtime 或其目前最新狀態。

## 閱讀指南

| 資產 | 可學到什麼 | 本版注意事項 |
| --- | --- | --- |
| [SQLite 規劃](knowledge-system-plan-v2-sqlite.md) | 資料政策、修訂／審核、匯入與測試的脈絡 | 部分是計畫，不是已實作；不直接沿用 Phase 完成度 |
| [文件攝取規則](document-ingestion-rules.md) | canonical normalization、stub/navigation、結構、去重、fixture remap | 舊 AI triage/materialize 不再是 raw research 前置，差異見新 ingestion |
| [來源政策](source-policy.md) | 各來源的授權、署名、internal/public、缺失 metadata | 來源政策繼續參考；trust_level 不代表 factual accuracy；本機 MC source 另登記 |
| [測試原則](testing-standards.md) | 先測純邏輯、狀態、權限，不為 coverage 建大量 mock | npm／Node 測試指令不是 corrobora 現成指令 |
| [data-audit.json](data-audit.json) | 原始資料欄位、數量與 hashes | 保留舊路徑與計算規則；現況另做核對 |
| [eval notes](eval-baseline-notes.md) | machine migration 的行為回歸方法 | 實際 eval code 對 hash 變更會失敗，舊 notes 的「僅提示」不準確 |
| [enums](enums.reference.ts) | schema validation、review／quality／visibility 分離 | 原狀態表不適用 Finding scoped validity；不能直接照抄所有 enum |
| [source policy code](sourcePolicy.reference.ts) | 集中來源設定、不覆寫人工資料 | 有些政策字段尚未持久化，新版需保存 |
| [migrations](migrations/) | raw identity／NULL unique、source removal 等修正歷程 | SQLite DDL 只作 reference，不在 PG 執行 |
| [ingestion code](ingestion-pipeline-code/) | scanner、manifest、machine sync、queue、worker、audit／eval | imports 缺少原專案依賴；worker 未接 AI consumer，不是完整可跑 pipeline |

## 三項重要更正

1. **Raw 永久保存需要 bytes snapshot**：舊 rawAssets 只有 path/hash，依賴 Raw Git 歷史；
   新方案用 immutable blob＋source revisions。bytes SHA-256 與 BOM／換行正規化 hash 分開保存。
2. **可研究與已驗證分開**：新 Documents 保存衝突與未知版本供 Agent 閱讀，
   不沿用所有内容必須先抽 Claim／人審的門檻。Findings 的 verified 寫入仍受政策控制。
3. **移植規則，不移植進程假設**：PG transaction、worker lease 與 outbox 取代
   SQLite 單寫者／Node fork／PID lock；保持 idempotency、短交易與 bounded retries 的意圖。

本目錄原始參考規格與 code 保留歷史內容；若新計畫與它衝突，應按 migration 表明示取捨，
不要為了兩邊形式上一致而覆寫原始史料。
