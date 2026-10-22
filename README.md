# Corrobora

研究 AI 在處理完整 Minecraft 生電農場時，先前的診斷經驗何時有幫助、何時會誤導，以及有限成本的重新檢查能否讓經驗更可靠地轉移。

**本庫目前是規劃／P0，沒有已完成的 Corrobora runtime 或經驗轉移結果。** Farm 已有受控機器實測，整合庫已有工具／context 原型；它們不自動算本庫正式契約通過。文件中的 Corrobora 工具與測試仍是待實作契約。

## 從這裡開始

[現行索引](docs/README.md) → [研究總覽與三庫分工](docs/plan/00-overview.md) → [近期 MIS 診斷／改善里程碑](docs/plan/06-roadmap.md#0-近期mis診斷與改善案例)。第二波投入的[首組配對已完成](https://github.com/hthOG/minecraft-farm-mcp/blob/c7c9ba4a5e62c41f38eb29f420244387e10ef59c/docs/63-mis-idle-strategy-results.md)：5,000 刻內基準送達 6 件、host 策略版 12 件，紅石未改；只有一組配對，獨立重複為 0。下一步是同協定獨立重測與操作建議；[P0 完整農場工作表](docs/experiments/p0-first-farm.md)保留給後續正式農場研究，不把 MIS 當自然農場或跨案例成果。不先建大型記憶系統。

模型接入規格已拆清：

- [Agent—Minecraft 介面](docs/plan/agent-world-interface.md)：模型初始資訊、如何觀察三維結構、時間、感測與受控實驗。
- [工具契約與範例](docs/plan/agent-tool-contracts.md)：參數、回傳、分頁、修改、實驗 proposal 與工具教學。
- [驗收清單](docs/plan/agent-world-acceptance.md) 與 [P1 工作表](docs/experiments/p1-interface-smoke.md)：接模型前後應驗證什麼，尚未有通過紀錄。

## 架構與研究

```text
模型工具呼叫
 -> Python runner：權限、預算、狀態與記錄
 -> Java/Fabric adapter：受限世界讀取／修改
 -> 結構化觀察與切片
 -> 模型自行理解、測試、提出修改
 -> 獨立新世界驗收
```

本庫正式環境提案是 Python、固定版本的 Minecraft Java/Fabric、JSONL 原始紀錄與 SQLite。近期先沿用 Farm 現有受控流程，按需移植整合庫的選擇性查詢與證據能力，依[共同接入邊界](docs/plan/agent-tool-contracts.md#0-既有runtime的接入邊界)標記缺口。MCP 可選包裝，不是必備；PostgreSQL、向量資料庫、完整知識圖、多 Agent 和模型訓練不在開工前置。

後續正式完整農場／跨案例研究的首個模式採 `repair_restricted`；近期 MIS 是受控 host 操作開發案例。允許重建的 `free_optimize` 及無起始完整藍圖的 `design_build` 分開。長期仍保留需求、設計、建造、測試與迭代目標；修好現成農場不等於已完成自主設計。

CDET 是待驗候選：先觀察普通強模型加工具、原始歷史或普通筆記能做到什麼。反覆錯用經驗有證據時，再比較固定的重用檢查；假說／測試排序另外比較，不把一整套流程的勝出當每個模組有效。

[評測協定](docs/plan/05-evaluation-protocol.md) 保留強模型原始歷史、普通筆記與固定流程，並加入提示／證據／證據＋規則三組，分清額外資訊和執行控制。主要看真正成功、總成本、錯誤重用與回歸，不只看記憶命中或遵守率。

模型不拿 OP、主機 shell 或私有答案，不能改計分或注入成品。概要不給人工模組圖，模型自己提出可修訂解釋。原始證據、推導經驗、當題狀態分開；[資料與安全](docs/plan/07-data-and-safety.md) 的來源限制持續有效。

## 現有內容

`docs/` 只保留現行計畫、介面及工作表；舊稿由 Git 查閱，不另留 archive。`raw-data/` 是既有來源素材；`benchmark/gold_dataset/` 是舊問答／管線 fixture，不能當完整農場資料或已跑的模型結果。

研究入口與近期順序於 2026-10-22 對齊，並同步 Farm 63 的首組結果；本庫沒有新增 runtime、遊戲試驗或方法成效。廣泛文獻檢索仍依 [08](docs/plan/08-related-work.md) 的 2026-10-02 範圍及閱讀限制，並非全部文獻今日重新審查。介面所需官方技術來源另列於規格。

目前沒有可執行安裝／啟動命令。實作後用真實配置、命令和結果更新 [現況](docs/plan/09-status-and-deliverables.md)，不預先宣稱全球首創、RSI、模型不可取代或科展成果。


## 2026-10-13補充閱讀

六份本機來源稿及主agent複核見[文獻補充與註解](docs/plan/10-literature-supplement-2026-10-13.md)。依使用者要求保留原段落；本補充收斂新穎性與評測解讀，建議仍待驗證，Corrobora保持P0。

## 2026-10-21 補充閱讀

新增[四份來源補充註解](docs/plan/12-literature-supplement-2026-10-21.md)：三篇新增閱讀及一篇同封存重讀，補充記憶／harness先例、重複試驗與成本邊界。依使用者要求只追加，不改原主計畫；Corrobora維持P0，沒有新增方法效果或農場驗收結果。
