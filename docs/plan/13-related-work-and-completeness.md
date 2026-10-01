[索引](README.md) · [方法](16-conditional-diagnostic-transfer.md) · [歷史文獻登記簿](14-literature-registry.md)

# 相關工作、查證狀態與可主張邊界

> 2026-10-01 修訂。這是選題與對照地圖，不是「全球沒人做」的證明。本次針對核心方向核對少數一手來源，沒有重做完整系統性文獻回顧或復現論文。

## 1. 本輪能支持的先例

| 工作與來源 | 本輪核對層級 | 與本計畫的關係 |
| --- | --- | --- |
| [Voyager](https://arxiv.org/abs/2305.16291)，2023；[作者專案頁](https://voyager.minedojo.org/) | arXiv 搜尋摘要與作者專案頁 | Minecraft 技能生成、保存與跨任務使用已有先例；不能把「Agent 在 Minecraft 累積技能」當新意 |
| [SciCrafter：Can Current Agents Close the Discovery-to-Application Gap?](https://arxiv.org/abs/2604.24697v2)，v1 2026-04-27、v2 2026-05-20 | arXiv 摘要頁與版本資訊；本轮未复現程式 | 用參數化紅石電路測發現到應用，分析知識缺口、實驗、整理與應用；「做實驗再建造」並非空白 |
| [EvoSCM](https://arxiv.org/abs/2609.01526)，2026-09-01 | 本輪取得 arXiv 搜尋索引的完整摘要；直接摘要頁擷取未成功，未讀全文／程式 | 摘要明確包含競爭因果假說、區分性干預、預測與信念修正；不能宣稱本計畫首創這些流程 |
| [AIDE²：Recursive self-improvement of AI research agents](https://arxiv.org/abs/2609.26457)，2026-09-22 | 本輪取得 arXiv 搜尋索引的完整摘要；直接頁擷取未成功，未复現 | 自改研究 Agent 程式、hidden evaluation 與保留任務泛化已有直接研究；generic harness RSI 不作本篇賣點 |
| [Darwin Gödel Machine](https://arxiv.org/abs/2505.22954v3)，v1 2025-05-29、v3 2026-03-12 | arXiv 摘要頁與版本資訊 | Agent 程式自我修改及基準驗證並非新題；改農場 artifact 與改 Agent 本身須區分 |

以上均不表示本 repo 已復現其結果。摘要可支持「研究了什麼」，不足以確定完整任務覆蓋、消融公平性與本方法的細部新穎性。因此不把舊模型上的分數抄成現今所有模型的能力上限。

## 2. 已有功能與可研究差異

| 不能單獨作新意 | 本計畫需要另外證明 |
| --- | --- |
| memory、skills、tool generation、反思 | 新的表示／决策是否在同證據同預算下有淨效益 |
| 信念／假說修正、主動做實驗 | 跨農場的條件適用性如何影響選測試，是否更少誤修與浪費 |
| Minecraft 或紅石建造 | 完整農場是否揭露既有評測沒有量到的耦合、長時運作與跨設計問題 |
| 版本／依賴／來源管理 | 局部重驗是否比原始歷史或固定檢查更有效，而不只是維持工程衛生 |
| 多做幾題後分數上升 | 是否排除任務變簡單、資料洩漏、更多計算與相同藍圖重複 |

既有方法做過某個功能，不代表該方向從此沒有任何方法貢獻；但「它沒做我的完整組合」也不足以證明我們原創。必須比較表示、控制策略、觀察權限、任務分布與評測目標。

## 3. 本篇候選貢獻的限定說法

可以在計畫中寫：

> 我們擬研究完整可執行農場中的條件式診斷經驗轉移，測量舊實驗在新設計中何時有效、何時誤導，並評估適用性驗證與測試選擇的成本—品質取捨。

完成實驗後才可以依結果寫：

> 在明確列出的模型、設計家族、條件與預算下，相對所列基線得到某個效果及不確定性。

現在不能寫：全球首次、沒人做完整農場、模型再強也無法取代、已形成通用機制理論、已實現 RSI、具備必然的國際科展／論文成果。

## 4. 正式選題／投稿前的核對工作

- 查找 farm design、iterative engineering、conditional skill reuse、negative transfer、active diagnosis／experiment design、belief revision 的直接相近工作；不只查題目含 Minecraft 的文章。
- 對最接近者讀全文方法、資料切分、代碼／license 與評測，不以摘要直接聲稱對方沒做某項能力。
- 為每篇記 `verified_at, primary_url, version, sections_checked, code_commit, reproduction_status, overlap, unresolved_questions`。
- 能復現的基線優先；介面改編要標 adaptation。未確認來源的舊週報數字、模型價格與安全新聞，不寫成研究前提。
- 若查到同題，不立即停止，也不換名迴避；比較是否仍有方法、評測、成本或可靠性上的明確未解差異。

## 5. 對舊文獻文件的處理

[14](14-literature-registry.md) 與 `docs/research/` 保留作歷史線索，不覆寫或刪除。本次沒有逐條重核，舊稿中的「全部已驗證」「皆已被吃掉」不能作現行 blanket claim。

舊 13 的殘餘清單曾把選題限縮為資料版本與引用管理；本輪以可執行工程評測重新定義主問題。這是研究定位的改動，不代表舊資料已無價值，也不代表新候選方法已通過原創性審查。
