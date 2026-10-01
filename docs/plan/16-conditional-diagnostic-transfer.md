[索引](README.md) · [測試環境](15-farm-testbed.md) · [基線與指標](09-roadmap-and-benchmark.md)

# 候選方法：條件式診斷經驗轉移（CDET）

> 2026-10-01。工作名稱與可實作提案，尚未證實有效或原創。既有主動實驗／技能記憶方法必須作比較，不能以新欄位名稱主張新演算法。

## 1. 目標與非目標

在新農場表現未達需求時，利用舊實驗判斷「該測什麼、結果能排除什麼、該改哪裡」。不建立完整 Minecraft ontology，不要求所有觀察都有唯一因果解釋，不把模型信心當校準機率。

假設案例：舊農場曾有下游容量問題，新農場產量也低。Agent 應先區分生產不足、途中損失與下游積壓，不能只因表象相同就增加收集設備。這只是研究情境，不是對特定遊戲版本機制的事實主張。

## 2. 三種資料分離

| 資料 | 內容 | 寫入規則 |
| --- | --- | --- |
| `experiment_record` | 當時條件、干預、事前預測、觀察、artifact hashes、成本 | runner append-only；永不因結論改變而改寫 |
| `diagnostic_experience` | 要區分的原因、測試程序、適用範圍、支持與反證、局部修正 | revisioned；保留舊版與證據，不可自標全面 verified |
| `working_state` | 這次角色對應、候選原因、目前計畫與未知前提 | 可修改的 task-local 狀態，不直接當永久事實 |

## 3. 最小經驗契約

```text
experience_id, revision_id, parent_revision_id
source_task_ids, source_experiment_ids
module_roles, observable_requirements
hypotheses_distinguished
preconditions[]: predicate, evidence_refs, status
experiment_template: bindings, intervention, measurements, budget_cap
predictions_by_hypothesis: measurable_outcomes, tolerance, unknowns
supported_scope, contradicted_scope, unresolved_scope
dependent_experience_ids, tool_artifact_hashes
validation_records, estimated_cost, measured_cost
```

`status` 只表示有證據支持／未知／已知不符合該前提，不能由文字語氣轉成真實機率。scope 至少包含版本、運作條件與涉及模組；不把「某一次通過」擴大成「這類農場都有效」。

`validation_records` 是固定檢查或審查結果，綁具体版本與條件。Agent 可提出候選／needs_revalidation，但正式驗證狀態由 runner／reviewer 依既定規則更新。引用存在、程式可執行、預測符合與因果支持分開保存。

## 4. 可實作流程

### 4.1 取回與角色對應

從過去實驗與普通 raw history 取候選，依可觀察症狀、模組功能與條件檢索，不只依農場名稱。Agent 將舊程序中的入口、出口、儲存端等角色綁到新設計的觀察位置。

角色對應本身是可能出錯的假說；不得由 benchmark 的 private module labels 免費提供。每個 arm 都有同樣的通用觀察工具。

### 4.2 適用性檢查

把候選經驗的必要前提分成：已支持、未知、已知不符。

- 已知不符：拒絕原封不動重用；可改成新候選程序並重新驗證。
- 未知且會影響決策：提出成本受限的適用性測試，或保留多個解釋。
- 前提有支持：允許重用測試作為候選，但不直接斷定故障原因相同。

版本／權限等硬限制由工具層強制執行；停用方法 gate 的消融也不能繞過安全與明確版本約束。

### 4.3 選擇能改變決策的測試

Agent 在 budget 內生成數個解釋及候選實驗，先保存各解釋對每個實驗的可量測預測。允許預測區間、分類結果與 unknown，不要求虛構精確數字。

最小排序啟發式：先排除不可執行／不安全的候選，優先選能區分解釋、且不同結果會改變修復決策的實驗，再以預估成本打破平手。可測量：

`disagreement(e) = distinguishable hypothesis pairs / all considered pairs`

兩個假說的預測區間重疊或任一未知時，不計為已能區分。只有一個假說時，改選能反駁它的測試或擴充候選，不把分母零填成高分。此為分歧啟發式，不是校準後的 expected information gain。

對照可用隨機合法測試、最便宜測試、固定診斷順序、強模型自由選擇及適配的既有主動實驗方法。另做固定候選池比較，區分收益來自更好的假說生成，還是測試選擇。

### 4.4 執行、修正、完整驗證

```text
retrieve candidate experiences and raw evidence
bind observable roles in the new design
check hard constraints and uncertain preconditions
generate hypotheses and candidate experiments
commit predictions before observations
select and execute one bounded experiment
update evidence and candidate explanations
propose a local design change when justified
validate the frozen design in the full farm
version the experience and preserve unaffected scopes
```

看見反例時先檢查條件、實作與量測，不立即宣告舊規則普遍錯誤。可選擇限縮 scope、建立情境分支、修正程序或標待重驗；只重驗受影響依賴，不全庫清空。

未找到唯一原因時，報告尚可成立的解釋與下個有價值測試。修好了農場只能證明該修改在測試条件有效，未必證明唯一因果機制；修復成效與解釋正確性分開計分。

## 5. 經驗怎樣反過來改善設計

在 `design_build` 模式，可重用的是測試程序、設計前提與局部模組，不必等出錯才用。例如先量測某子系統在合法負載下的容量，再決定其他部分規模。完整 blueprint reuse 單獨標記，不與抽象經驗遷移混在一起。

一次農場迭代只代表 artifact improvement。要說 Agent 有跨任務改善，需要凍結其歷史／經驗後，在未見設計上比較；若它修改了自己的實驗策略，還要另有同 budget 的流程級實驗，才討論 RSI。

## 6. 消融與可推翻的假說

| 對照 | 要區分的原因 |
| --- | --- |
| 結構化紀錄、但不強制適用性 gate | 是否普通整理就足夠，而不是檢查策略有效 |
| 有 gate、用固定／自由選測試 | gate 與分歧導向選擇的個別效果 |
| 有選測試、無額外 gate | 效益是否主要来自主動實驗，而非重用控制 |
| 同候選假說／實驗池、只換排序 | 分離生成與選擇的效果 |
| 全量重研究／重驗 vs 局部修正 | 節省是否以增加誤修或漏修為代價 |
| 同一經驗分別給較強／較便宜模型 | 方法必要性與模型依賴，不預設強模型仍需要 |

所有組都能正常推理、查看 raw history、自己提出反例；不能禁止 baseline 思考適用條件，只能不提供本方法的固定結構／控制策略。不同 prompt 與 controller 是實驗處置，需版本化，不能聲稱所有 prompt 完全相同。

本方法若不能超過強模型＋原始歷史／普通筆記，或收益不足以支付維護成本，就沒有證據支持部署。結果應保留而非增加模組直到挑出一個有利比較。
