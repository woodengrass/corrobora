# corrobora 規劃索引

> **現行研究主線：2026-10-01 修訂，尚未實作。** 完整生電農場的自主工程迴圈，以及跨農場的診斷經驗轉移。不是先建通用 memory／RSI 框架再找用途。

## 這次改變了什麼

- 保留完整農場的理解、設計、測試與迭代目標；先用既有農場診斷與改良建立可測訊號，不把第一個 pilot 說成已會自主設計。
- 主方法改為條件式診斷經驗轉移；知識、工具、記憶是可比較手段，不是預設必要模組。
- 把 simulator／量測／固定評分器移到最前。PostgreSQL、Qdrant、完整文件攝取、知識圖譜不再是 pilot 前置。
- 主對照包含同一強模型＋原始完整歷史、普通筆記及固定診斷流程；無歷史模型只作額外對照。
- 不宣稱全球首創、模型永遠無法取代、已實現 RSI，或保證科展名次。新穎性與效益都需要實驗。

## 閱讀順序

**00 → 08 → 15 → 16 → 09 → 12**。確認研究定位、範圍、工程契約、候選方法與公平評測後，再選需要的資料基礎設施。

| 文件 | 現在的用途 |
| --- | --- |
| [00 定位與架構](00-overview-and-architecture.md) | 主問題、分層架構、研究貢獻與非目標 |
| [08 範圍與 MVP](08-scope-and-mvp.md) | P0–P5 實作依賴、驗收與停止條件 |
| [15 農場測試環境](15-farm-testbed.md) | farm manifest、建造／執行／量測介面、評分邊界 |
| [16 條件式診斷經驗轉移](16-conditional-diagnostic-transfer.md) | 可實作的候選演算法、紀錄格式與消融 |
| [09 研究問題與 benchmark](09-roadmap-and-benchmark.md) | RQ、B0–B4 基線、指標與貢獻判準 |
| [12 長期實驗協定](12-longitudinal-experiment.md) | 順序、checkpoint、held-out、成本、統計與再現 |
| [13 相關工作與邊界](13-related-work-and-completeness.md) | 本輪核對來源、相近工作與尚待確認的差異 |
| [17 交付、風險與研究紀錄](17-deliverables-and-research-integrity.md) | 如何形成完整研究、負結果、科展準備與決策紀錄 |

## 舊文件的效力

以下文件保留既有細節，**不是本輪必須照順序實作的清單**。有衝突時，以 00／08／09／12／15／16 的現行研究協定為準；來源授權、不可篡改原始證據、不能自標 verified 等底線仍有效。

| 文件 | 保留內容／新的定位 |
| --- | --- |
| [01 PostgreSQL schema](01-postgres-schema.md) | 將來需要正式資料服務時的邏輯模型；不是 pilot 強制 schema 或已存在 migration |
| [02 Qdrant](02-qdrant-vector-design.md) | 可選候選檢索索引；不決定證據真偽，也不必先部署 |
| [03 文件攝取](03-ingestion-and-claims.md) | 來源政策、快照、去重與原文定位；不要求先全量整理 corpus |
| [04 Findings 檢索](04-knowledge-graph-and-retrieval.md) | 文件／Finding 研究支援；不替代新實驗的適用性檢查 |
| [05 Agent 設計](05-agent-design.md) | 舊資料研究 Agent 的邊界參考；新環境權限以 15 為準 |
| [06 Code 與 Blueprint](06-code-intelligence-and-versioning.md) | code 定位、版本與藍圖資產參考；藍圖生成不能等同功能驗證 |
| [07 Provenance](07-evidence-and-verification.md) | 來源存在、語意支持、實測通過與人審分開；安全底線沿用 |
| [10 現況盤點](10-current-state-and-migrations.md) | 2026-09-11 歷史盤點；P1–P10 是旧 migration 提案，不是新排程 |
| [11 Memory lifecycle](11-research-memory-lifecycle.md) | 候選支援／消融；不預設完整生命週期是有效或必要的 |
| [14 文獻登記簿](14-literature-registry.md) | 歷史文獻線索。本次未逐條重核；不得把舊稿的全數驗證敘述當作本輪背書 |

舊版主線與全部文件可在 [修訂前 commit](https://github.com/woodengrass/corrobora/tree/e30bdedd6ec324830ff1326feb51a5848848432b/docs/plan) 查閱。`docs/research/` 的舊 shortlist／方向報告保留作思考歷史，不覆蓋本輪選題。

## 實作與文獻紀律

所有範例 API、資料欄位、目錄與測試數量均為提案；未建 runner 前不寫已通過 benchmark。實作只依真正出現的功能新增測試與命令，不把舊資料當新結果。

只把本輪能核對的原始資料寫成事實；原始論文摘要能支持的範圍與全文／程式復現要分開。文獻的新近日期不能代替方法比較，沒有查到相同作品也不能證明全球第一。
