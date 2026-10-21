# 2026-10-21：四份來源補充註解

依使用者要求，本頁只補充相關工作與評測解讀，保留00–09主計畫及既有10/13、10/15註解。兩個subagent各讀兩份本機TeX封存，主agent複核關鍵方法、評估與限制，再由原閱讀者複核摘要。沒有執行論文程式、模型訓練或作者實驗；沒有重跑Corrobora或Farm實測。Corrobora研究維持規劃／P0，CDET仍為未驗證候選。

2610.06361與10/13來源的整包SHA-256完全相同，這次是同一封存重讀，其餘三篇是本專案新增閱讀，非出版新舊判定。arXiv URL只作識別，不以網頁現版推定封存版本。閱讀範圍是主文、方法、實驗、限制及必要文字附錄，不包含圖檔與全部參考文獻的逐篇追查。未向Git加入全文、圖像或第三方程式。

## 新增依據與既有方法的界線

| 來源 | 對現有計畫的補充 | 不能推出的結論 |
|---|---|---|
| [PrisMem／Capability-Driven Self-Evolution of Agent Memory](https://arxiv.org/abs/2610.06361) | 分能力與處理階段保存改善／退步、以差異案例整合已有先例；保持各項分母與未觀測紀錄。`sections/method.tex:4–49,110–127`。 | 五種對話記憶能力及帶gold答案／證據的離線標籤不是Minecraft能力或在線oracle；語義相似度不是精確真值或因果判定。`sections/appendix.tex:64–82,983–990`。同包重讀不新增一份獨立證據。 |
| [Self-HPO／Self-Evolving Coding Agents via Harness-Policy Optimization](https://arxiv.org/abs/2610.22791) | 固定policy改harness、固定harness做RL及共同更新的效果應分開；候選數與搜尋預算有記錄。`tex/2-method.tex:16–94; tex/3-exp.tex:7–24`。 | 它包含權重訓練，並非training-free；SWE基準不能直接外推農場。三次evaluation不等於三次獨立訓練；未有完整總token／GPU-hours成本帳。`tex/appendix.tex:4–42,47–81`。 |
| [MINDSET／Energy-based Schema Evolution for Long Conversational Agent Memory](https://arxiv.org/abs/2610.08586) | 不可變episode、版本化／active／historical狀態、情境分支及來源展開已有具體方法，不能把這些欄位本身當CDET獨創。`main.tex:198–278,446–487`。 | 不是工程程序適用性或因果診斷。對LightMem的LoCoMo檢索排序優勢有統計支持，答案F1則未顯著；手調係數及小型MAB的限制仍在。`main.tex:588–615,626–634`。 |
| [Daedalus／Bootstrapping Agent Memory from Self-Generated Tasks](https://arxiv.org/abs/2610.08048) | 自產任務、失敗抽取heuristic、重置後同題重試再納入凍結bank，是直接先例。`main.tex:178–200,220–228`。 | 同題三連勝不等於新前提下的因果或適用性證據；Explorer自寫成功條件、LLM Judge判定並非正式真值。主表測試推論費用排除記憶建置。`main.tex:228–233,418–441,711–717`。 |

MINDSET的MC10封存表格未納入主文，內容是對話QA，不是Minecraft；不拿來補Farm結果。Daedalus也觀察到bank變大及合併時heuristic範圍可能失真、表現下降（`main.tex:443–454,719–743`），不能假設累積更多記憶必然有益。

## 作為04／05方法與評測的註解

1. **分清來源與修訂。** 保存原始證據、當題工作狀態、候選經驗及有效／歷史版本。新情境可分支、待查或保留例外，不回寫成舊run早已觀測的事實。這是既有[資料契約](07-data-and-safety.md)的延伸規格，不是新增記憶模組。
2. **分清重複單位。** 同刻重讀、跨刻取樣、同題冷重置、新任務／前提及不同memory-build seeds分報；不能用三個取樣點或三次相同題成功替代獨立跨任務驗收。
3. **分清收益來源。** 固定模型、工具、觀察與總預算，比原始歷史／普通筆記／固定程序，再比較I0／I1／I2。host增加按鈕、修提交流程、改harness或改權重不是同一處置；額外強制控制不能自動歸因於理解或記憶。
4. **生成題與正式evaluator隔離。** 自產任務可作dev候選，但成功條件與judge需獨立校準；候選生成者不能修改正式計分、正式保留答案或記憶晉升真值。生成、失敗重試、修訂、合併、維護及測試成本分開記。
5. **失敗保持停止／unknown。** MINDSET的記憶切換遲滯不能移植成容忍庫存損失、未知修改或缺漏世界資料。診斷狀態管理與遊戲寫入安全是不同契約。

窄研究問題維持：固定條件下，當舊診斷程序遇到表象相似但前提改變的工程任務，額外適用性檢查能否降低錯誤重用與獨立完整功能驗收成本，且不大量誤擋有效程序？本批來源既未證實也未否定這個命題。版本化、來源追溯、自產任務記憶與失敗後重試均不能單獨作新穎性；[SEPM等前次註解](11-literature-supplement-2026-10-15.md)的直接重疊仍須保留。

仍先完成完整可重播reference及獨立計量，再進行方法比較。能量schema控制器、specialist演化、自產題平台與RL均延後。Farm的固定批次控制與297項離線測試不是Corrobora研究效果，也沒有使完整MIS分類或CDET變成通過；工程細節與採用表見[Farm文獻整理](https://github.com/hthOG/minecraft-farm-mcp/blob/main/docs/52-literature-update-2026-10-21.md)。

## 本機來源識別

| 封存識別 | SHA-256 |
|---|---|
| 2610.06361 | `7fad02f16542d2e93a1fa438da95b5ebf6b70febfc6b65939486b3e8d8a76575` |
| 2610.22791 | `aa9e598326f6657523a41d6e4c635afa4a1d9ded2e8c511c78d35a8b1b08987d` |
| 2610.08586 | `0971f6cf8da59819b09f52d3fcdc248749388eeb3e938ae219656254790aba47` |
| 2610.08048 | `82b35e3c760d5a99ca5f8634dd936404b6f4041e824e44c0a41ddbc2bb866432` |

上述行號指本機TeX普通文字。hash核對及文獻摘要不是作者實驗重現，也不延長既有廣泛網路文獻檢索截止日。本輪只驗證文件來源、連結與追加差異，沒有執行runtime測試或改寫原始計畫。
