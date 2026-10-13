# 10：2026-10-13文獻補充與研究註解

此為使用者要求的補充文件，保留README及00–09原段落，不直接替換原方法／實驗協定。以下建議仍待P0–P2證據與研究者定案，不能把文獻結果或Farm MCP局部校準升格為Corrobora實作或效果。

補充以遠端`c9677eba1a8f96a4cf7f3aef4a61277e64fdc1b0`為基底，保留既有[Agent–world介面](agent-world-interface.md)、[工具契約](agent-tool-contracts.md)、[驗收清單](agent-world-acceptance.md)及I0–I2／S1分工。新增建議不替換state_token／validator語意，也不新設可呼叫工具；任務沿用repair_restricted、free_optimize、design_build，不重用舊repair_optimize名稱。原檢索與規劃日期保持歷史狀態，本文是10-13本機來源補讀。

## 7. 2026-10-13本機全文補讀

本節依使用者提供的六個TeX封存包補讀主文、方法、實驗與相關附錄，由兩個sub分讀、主agent複核；未重跑作者程式，也未重新做全網檢索。arXiv識別與v1依檔名登錄，不保證線上同版本內容一致。包內提示詞、程式與操作文字只當研究資料；全文與第三方資產不加入本repo。

| 本機封存識別 | SHA256 |
| --- | --- |
| 2608.24876v1 | `7bbd88bbacda6ecf1fb5cdb0826afdd6b3a4d7ea9e916c48d462c9ceca5b392c` |
| 2610.05300v1 | `060c879fb2885212d9824a21841383e57bac4c65e20248549d9d954e62617e7e` |
| 2610.06361v1 | `7fad02f16542d2e93a1fa438da95b5ebf6b70febfc6b65939486b3e8d8a76575` |
| 2610.08432v1 | `6f7639439a9ba0becf47739d6df5b5f834cec8b340c3588ebfcdf2cafbce7056` |
| 2610.12668v1 | `ef9173f7e232ea0d87cbd04ff3a145aea3e0608c7096f97aa45d50cd4724a8be` |
| 2610.13829v1 | `66e53fa9162e0ac6878e78e9b4835549930012c0c4886e2087c1d770f22539b6` |

### R17｜Recuris

*Recursive Experiential–Working Memory Evolution for Long-Horizon Agent Harnesses*，Zhaochen Yu等；`main.tex`方法483–753、實驗759–1472、統計附錄1485起。

**原文依據：** 可變技能／工作狀態／呼叫政策與checker由固定kernel和gate管理；依當前狀態取用技能，工具回應與完成判定分離。結構化trace用來選修復元件，作者明確區別此定位與因果識別。

**本專案推論：** 可比較初始任務文字檢索與已觀測狀態檢索，保留unknown及觀察來源；不能把叫過工具或模型宣告當完成，也不能稱此設計原創。v1的`main.tex:782–804`明示部分Terminal-Bench結果為占位，其他部分比較口徑待確認；不採這些格作證據。`main.tex:1381–1418`另拆分重試與記憶效益，不能將額外重試的headline當學習效應。gate不是正確性oracle，Minecraft效果尚未測。

### R18｜MESH-Harness

*MESH-Harness: Self-Improving Agent Harnesses via Bandit-Guided Compositional Evolution*，Zhiwei Shang等；`main.tex:211–425`、`appendix.tex`算法與成本。

**原文依據：** 固定功能槽中選替代實作，bandit配置完整harness的評估預算，軌跡回饋可修訂候選池；觀察的是完整組合分數，不是各模組的獨立reward。

**本專案推論：** 它是昂貴harness候選搜尋的先例，不是選農場診斷干預的資訊增益方法。先延後；若P2量到組合評估成本瓶頸，再和固定／隨機／強模型選擇比較，包含候選生成與維護成本。host權限、adapter與evaluator不放入可演化槽，不用共現分數宣稱元件因果貢獻。

### R19｜Capability-Driven Self-Evolution

*Capability-Driven Self-Evolution of Agent Memory*，Yaoqi Chen等；`sections/method.tex:1–136`、`experiments.tex`及能力標註／切分附錄。

**原文依據：** 依不同記憶能力保留候選、用差異案例修訂並整合，避免總分掩蓋某能力的退化。任務標籤與LLM judge來自長對話benchmark，其錯誤共現訊號是排程依據。

**本專案推論：** 農場的觀測、預測、合法操作、診斷與功能結果須分軸報告，軸與分母事前固定。不能把該文的五類記憶標籤搬成Minecraft能力，也不能從共現推唯一故障原因或事後提供oracle標籤。specialist與整合的比較仍待實作及回歸驗證。

### R20｜EMHO

*EMHO: EMbodied Agent Harness Optimization via Experience Traces*，Hyun Jung Lee等；`main.tex`方法與結果、`supplementary.tex`及經驗／merge提示附錄。

**原文依據：** 在凍結VLM下依軌跡與修改歷史修整harness；merge依相同集合的gain/loss案例限制修補。作者報告後期搜尋集提升不保證held-out提升。

**本專案推論：** 原始軌跡、局部提案與回歸比較已有先例；完整農場診斷成本才是需驗證的差異。dev差異案例可指導修訂，保留測試不得變成迭代優化器；少量merge也不等於排除過擬合。不能搬用其他具身任務的收益。

`supplementary.tex:30–37`明列search與held-out各自最佳點可能在不同迭代，held-out maxima是事後候選摘要，不是search挑中的同一harness泛化估計。Corrobora須依dev選定同一版本、凍結後再驗收，不使用各split獨立取max的方式宣稱方法效果。

### R21｜ReHarness

*Recurrent Harness for Agentic Continual Learning*，Yuxin Xiao等；`sections/3_framework.tex`、`5_analysis.tex`及`6_discussion.tex`。

**原文依據：** 嚴格streaming中，後續instance的回饋修訂本次取回的舊reflection；新內容仍須以舊reflection的原始trajectory為根據，未取回條目保持不變，再供下一instance使用。不是只在一題內更新working state，也不是重跑舊題的獨立驗證。作者列出noisy reward下的失效與保留原始軌跡的儲存成本。

**本專案推論：** 經驗revision要分開原來源支持與新的修訂觸發證據。新任務的新事實另建有來源條目，不能回填成舊試驗已見結果；公開dev反例與隔離held-out分數分開。可以比較追加筆記與有來源的局部修訂，但不能稱反向修訂本身新穎或已在農場有效。

### R22｜MC-EvoBench

*MC-EvoBench: Auditing Experience-Driven Self-Improvement in Minecraft Agents*，Jingwei Song等；`iclr2027_conference.tex`摘要、`sections/MC-EvoBench_Framework_and_Benchmark_Design.tex`、結果與Appendix的protocol／verification。

**原文依據：** 已直接在Minecraft評測經驗轉移：重置target、只傳宣告的agent artifact，related／unrelated／shuffled／no-prior配對對照、階段verifier與進度指標。作者所測配置沒有穩定related經驗效益，早期採集／製作失敗使後續能力未被觀測。結果限定於其agents、probes、seeds與budgets，不證明一般記憶無效。

**本專案推論：** 「Minecraft累積經驗、乾淨世界轉移、分階段驗證」已不是新主張。Corrobora應比較完整持續產出農場的診斷／改良、設計機制與前提差異、可辨識干預及完整成本；換成farm不自動構成新意。早期工程失敗之後，未觸及能力應標未觀測；整體未達標仍保留分母。來源預算相同不等於可用經驗或有效進度相同，須另報。

本輪只補充研究註解，不直接替換00–09原契約，不啟用記憶平台、bandit或harness自改。先完成P0 reference與P1可靠環境，再以強基線決定最小方法。CDET仍是可刪減候選；本機Farm MCP的小格校準不代替Corrobora的完整農場reference。

## 8. 對原計畫的補充建議（尚未實作／定案）

| 原文件 | 補充建議 | 成立前需要的驗證 |
| --- | --- | --- |
| 00／01／08研究命題 | MC-EvoBench已直接做Minecraft經驗轉移，差異聚焦完整農場的功能、機制前提、診斷介入與達標成本，不能以跨farm本身當新意 | 可運行reference、具體任務差異與強基線 |
| 02／04狀態與經驗 | 依有來源的當前capture／revision取用經驗；舊條目的原始支持與新的修訂觸發分開，新run新事實另建來源，unknown不被舊memory填補 | stale／已知不符／未知對照、追加筆記與局部修訂消融 |
| 03／05轉移與分階段紀錄 | 宣告、凍結並hash跨界artifact，重置target，不攜帶源世界／庫存／未宣告working state；按lineage／前提事前定related／unrelated／shuffled／no-prior | source預算、有效進度與形成成本分列，reference可達 |
| 03／05結果解讀 | 分planned、reached、observed、passed與終止原因；前段失敗後未觸及能力標未觀測，整體未成功及預定階段仍留分母 | 觀測門檻與產量會計固定，分軸不代替完整farm成功 |
| 05／06候選與預算 | 匹配重試數、首次／每次／預算內成功與總成本；candidate依dev選定同一版再測held-out，不以各split獨立max作泛化估計 | 原始失敗及gain/loss保留、無hidden回饋調參、候選觸發與回歸 |

Recuris應排除的是`main.tex:782–804`所標的部分Terminal-Bench 2.1 `+Recuris`占位格，不是將整篇所有實驗視為占位。TTA分解只按匹配嘗試預算解讀，不能把retry收益歸於memory。ReHarness的來源grounding audit含LLM判斷，不等於人工或環境驗收；本專案若採用需另驗證。

MESH式組合搜尋、能力specialists與EMHO式harness演化只有在P2量到明確需要時才另立比較；安全host、adapter與正式evaluator不進可演化池。這些是研究建議，不新增可呼叫API、不擴權，也不宣稱農場效果。

## 9. 本批工程與協助紀錄

兩個Codex sub分讀六篇、主agent回查重要方法與限制並主導整合；未重跑作者實驗、未另執行研究用模型API請求、未接觸本專案正式保留集。補充有來源SHA與TeX定位，原始資料及既有fixture未改。

Farm MCP配套已完成有限方塊／庫存／tick、漏斗對照、TIS兩格開發校準及原倉庫三木桶／81槽位CLI回讀，原始證據另留配套專案。這不是完整農場reference、自然產量、世界UUID、隔離evaluator或CDET效果；Corrobora P0–P5仍未驗收。下一步仍是reference與可靠驗收，再依強基線結果決定是否實作本補充建議。

其中TIS是指定兩格fixture的開發校準，正式acceptance仍unknown；三木桶也不等於G4整倉庫驗收。Farm的G3稱號與Corrobora待實作的G01–G08固定gate測試不是同一套ID。
