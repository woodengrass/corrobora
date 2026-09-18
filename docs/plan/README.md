# corrobora 研究架構與開發計畫

> **狀態：專案啟動前討論稿，2026-09-11。** 本輪重新檢查整份規劃，
> 主線為 Strong Agent + Raw Professional Corpus + Research Memory。
> 其中 Research Memory 是待比較的持久化底層（persistent substrate），
> 不是預設最優解；memory-first 不是既定架構，是否重用既有成果需經檢索與消融實驗驗證。
> 本目錄不是 ADR，也不代表功能已實作；舊設計可由 Git 歷史追溯。

建議先讀 **00 → 10 → 08 → 09**，了解方向、真實起點、最小可行範圍與研究方法；
之後依興趣閱讀資料模型、檢索與記憶生命週期。各篇以明確文件連結互相引用，
不再沿用拆檔前已失效的「第 X 節／Phase X」交叉引用。

| 文件 | 回答的問題 |
| --- | --- |
| [00 定位與架構](00-overview-and-architecture.md) | 為什麼做研究 infrastructure？Agent 與系統如何分工？ |
| [01 PostgreSQL 資料模型](01-postgres-schema.md) | 原始資料、Findings、版本有效性、provenance 與 sessions 如何連結？ |
| [02 Qdrant 與可替換檢索元件](02-qdrant-vector-design.md) | Raw Passages 與 Findings 如何分層、同步與重建？ |
| [03 文件攝取與來源整理](03-ingestion-and-claims.md) | 如何延續既有 parser／dedup 規則，又取消全量 Claim-first？ |
| [04 Findings 輔助與原始檢索](04-knowledge-graph-and-retrieval.md) | Findings 輔助／原始檢索＋Coverage／gap 判斷＋可選關聯，如何決定何時重用、何時重研？ |
| [05 Agent 與研究歷程](05-agent-design.md) | 如何給強 Agent 自主權，又維持工具與寫入邊界？ |
| [06 Code、版本與 Blueprint](06-code-intelligence-and-versioning.md) | 哪些 code index 值得做？藍圖如何獨立演進？ |
| [07 Provenance 與驗證](07-evidence-and-verification.md) | 引用存在與結論成立有何不同？誰能標 verified？ |
| [08 範圍與 MVP](08-scope-and-mvp.md) | 第一個完整閉環應做到哪裡？哪些功能有條件才做？ |
| [09 基線 RQ／消融／Roadmap](09-roadmap-and-benchmark.md) | 基線 RQ、消融對照、開發里程碑與 A–H 對照如何安排？ |
| [10 現況與架構遷移](10-current-state-and-migrations.md) | 實際有哪些 code／資料？哪些沿用、重構、移除或尚不存在？ |
| [11 Research Memory 生命週期](11-research-memory-lifecycle.md) | Finding admission、consolidation、invalidation 如何可實作？ |
| [12 Longitudinal Experiment](12-longitudinal-experiment.md) | 如何公平測量累積效果、版本更新與模型接棒？ |
| [13 相關工作與非新穎性邊界](13-related-work-and-completeness.md) | 邊界摘要：哪些主張已被吃掉、反駁點與殘餘清單為何？細節見 14。 |
| [14 文獻登記簿](14-literature-registry.md) | 完整文獻條目：A／B／C／D／E 各篇借用、不得宣稱與限制為何？ |

`03-ingestion-and-claims.md` 保留既有檔名以維持連結，內容已改為文件攝取與按需研究成果。
`01` 是人可讀的邏輯 schema 與完整性約束提案，不是可直接執行的 migration；
實作時才落 Alembic DDL 與 Pydantic contracts。

## 參考資產

- [Legacy reference](../legacy-reference/README.md)：歷史規則與 TypeScript／SQLite 程式碼。
  其 Track、固定模型、路徑與 Answer Index 政策代表舊專案，不能直接作本版要求。
- [原始資料](../../raw-data/README.md)：可作初始 corpus 的來源、授權與本機 source 說明。
- [既有 benchmark](../../benchmark/gold_dataset/README.md)：33 題、機器 baseline、triage fixtures；
  尚無 Research Memory runner 或 longitudinal 結果。

閱讀時請區分 **實測現況、建議設計、待驗證假說**。任何「能力提升」都要回到 benchmark，
任何「已實作」都要能指向本 repository 的程式與執行結果。
文件中若出現 non-parametric continual learning，一律指待驗證假說／歷史用語，不代表已實現持續學習。

## 參考文獻

- Cao et al. 2026. Remember Me, Refine Me: A Dynamic Procedural Memory Framework
  for Experience-Driven Agent Evolution. *Findings of ACL 2026*, pp. 16803–16822.
  （ReMe：procedural memory 三機制——multi-faceted distillation、context-adaptive
  reuse、utility-based refinement；經驗觀察：Qwen3-8B＋記憶在 BFCL-V3＋AppWorld
  平均 55.03% vs 無記憶 Qwen3-14B 的 54.65%。本計畫將其視為強基線／相關工作，
  用於對照重用收益與負遷移風險，不作為本架構的理論依據。程式碼見
  https://github.com/agentscope-ai/ReMe。）
