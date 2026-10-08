# 04｜候選方法：有條件的診斷經驗轉移

[索引](../README.md) · [世界介面](agent-world-interface.md) · [評測](05-evaluation-protocol.md) · 更新：2026-10-08

CDET 是工作名稱，尚未實作、未證實有效或原創。第一個可識別處置縮為「凍結重用方案 → 取得指定前提證據 → 依固定規則准用、補查或退回」。複雜假說排序、完整信念治理與 RSI 不是必備核心。

## 1. 問題與啟動條件

研究在新農場中，檢查舊診斷程序的適用前提能否保留重用收益、降低誤用，且值得其成本。P2 先確認相關錯誤或試驗浪費，不因文件已寫就強制開發方法。

程式 gate 不保證模型提出的前提完整、語意正確或足以識別原因。改善可能只是較多資訊或較詳細提示有效；05 的提示／證據／規則比較用來區分。

## 2. 資料分層

| 物件 | 內容與身分 | 修改權限 |
| --- | --- | --- |
| experiment_record | world/state、設定、干預、事前預測、原始觀察、成本與雜湊 | runner 追加，更正另建事件 |
| diagnostic_experience | 曾區分的原因、程序、前提、適用範圍、反證與修訂 | 可提案新 revision，不覆寫原始證據 |
| working_state | 當題區域解釋、角色對應、候選原因與下一步 | 模型可改，不自動變永久事實 |
| reuse_plan | 指定 experience revision、bindings、必要前提與將執行的程序 | 提交後鎖定；修改必須有新 ID |
| check_receipt | validator 與證據範圍、supported／contradicted／unknown、理由與成本 | 固定程式產生，不由模型自填通過 |

模型區域標記引用 observation_id、world_id 與 state_token，不能只寫「收集端」。找得到引用不等於語意成立。

## 3. 模型與固定程式分工

| 工作 | 模型可做 | 程式保證／不保證 |
| --- | --- | --- |
| 前提與原因 | 產生可能錯誤的假說、必要條件及反例 | 限定提案規格與數量，不保證完整性 |
| 模組對應 | 依方塊、時間紀錄與切片推定角色 | 檢查座標／引用，不提供私有模組圖 |
| 檢查方案 | 選擇 validator、位置、條件與程序 | 驗證型別／權限／覆蓋，執行凍結方案 |
| 前提判定 | 附語意推論供分析 | gate 只讀 validator 結果，不暗呼叫 LLM 決定真偽 |
| 下一步 | 提出修復／重新調查 | 控制原重用路徑，安全規則始終獨立生效 |
| 結果解讀 | 推論可能原因與修訂經驗 | 獨立 evaluator 確認功能，不以解釋文筆計分 |

「collector_overloaded」不是第一版直接可驗證的 predicate，它已是故障解釋。應拆成可測的流量、積壓、負載與覆蓋條件；支持哪個原因仍可能不唯一。

## 4. 最小方案與 validator

```text
reuse_plan
  plan_id, parent_plan_id, experience_revision_id
  source_world_id, source_state_token, design_revision, config_hash
  bindings: role -> region/position + observation_refs
  required_predicates[]:
    predicate_id, claim_text, validator_id, validator_version
    arguments, units, evidence_requirements, validity_scope
  procedure: frozen experiment proposal/reference
  after_check_actions: supported/contradicted/unknown -> action
  check_budget, total_budget, revision_limit
```

第一版 validator 只接受可信程式白名單，例如：位置為指定方塊／state、感測能力與覆蓋存在、設定符合、完整量測值落在凍結區間。參數都在執行前鎖定。

引用存在、程式可執行、預測吻合與原因成立分開。語意條件不能轉成合法 validator 時保留 unknown，不用模型說「確認了」繞過。不讓 Agent 提交任意驗證程式自封可信；自寫分析工具只是候選，需獨立測試才能成為共同工具。

validator 回傳：

- supported：觀察與判準相符，且覆蓋、時間、來源及量測品質有效。
- contradicted：有效觀察在該 scope 中明確不符合判準。
- unknown：未量測、partial、sensor 不支持、過期、工具失敗、無法區分或未定義語意。

unknown 的 reason 與工具錯誤分開記，不能把 sensor 失敗當領域規則不成立。閾值與容忍範圍在 dev 校準後凍結，不讓模型事後縮窄區間換取通過。同一實驗轉述多次只算同一 evidence，不以多筆筆記灌高支持。

經驗保留 source_task_ids、source_experiment_ids、症狀、角色、required_observables、測試與各假說預測、支持／反駁／未決 scope、依賴及 tool hashes、修復驗證與實際成本；不建立全域 verified=true。

## 5. 固定控制決策

概念函式為 `decide_reuse(locked_plan, receipts, current_context, remaining_budget, policy_config)`；相同輸入有相同輸出，不呼叫模型。輸出是 ALLOW、CHECK、REJECT、FALLBACK 或 TOOL_ERROR，附理由與成本。

| 條件 | 強制動作 |
| --- | --- |
| 違反安全／任務限制 | REJECT；各組共同生效，不算研究 gate 效果 |
| 無必要前提、未知 validator、無合法位置對應 | FALLBACK／限次重新提案；不以空集合自動通過 |
| 任一必要前提 contradicted | REJECT 原方案；可提有新 ID 的改編方案 |
| 有 unknown 且有合法可負擔檢查 | CHECK，執行凍結的下一檢查 |
| 有 unknown 但不能檢查或已耗完限額 | FALLBACK 一般調查，不強制整題失敗 |
| 全部必要前提 supported | ALLOW 指定程序；不代表舊故障原因成立或允許任意修復 |
| 基礎設施執行錯誤 | TOOL_ERROR，按共同重試規則，保留 partial 成本 |

unknown 不無限追查。首版按檢查預估 simulated ticks、tool calls、predicate_id 的固定字典序選最便宜可行項；成本估計規則及缺值時的處理在 dev 凍結，缺值不當零。複雜資訊分數不進首個 gate 實驗。

介面 smoke 可先採每決策點最多 3 個重用提案、每案 4 個必要前提、3 次檢查與 1 次修訂；只是工程候選值，不是有效性結果。累計模擬、模型及單次上限仍由 task profile 給定；缺值拒絕啟動。正式上限在 dev 後版本化，不由模型臨場無限制延長。

## 6. 證據新鮮度與副本

receipt 綁定來源狀態、設定、bindings、sensor/procedure 版本及作用範圍。父世界推進或修改後，動態 receipt 預設失效；只有 validator 明確宣告並實測的不變條件才能跨指定狀態沿用。

檢查在隔離副本推進時，父世界維持凍結。結果是該 parent state 衍生的受控試驗，不能寫成父世界已觀察到同一事件。是否可支援 parent 的前提由預定 validator 契約判定，不靠模型自稱可轉移；保留重複副本與噪聲限制。

改變過負載、規則或模組的副本結果不可無條件移回正式農場。證據不足就 unknown；原始紀錄不因 receipt 過期而刪除。

## 7. gate 的執行邊界

gate 控制已提交 reuse_plan 與指定程序，不是禁止模型心中使用任何歷史。普通 inspect、一般調查與合法 patch 仍按共同工具權限可用。

同方案換字重送不增加預算；改 procedure/bindings/predicate 有新版本與成本。模型可以回到一般調查並提出類似修復，但須記路徑；不能把所有成功都算 gate 成功，也不把合法回退說成作弊。

局部機制實驗先凍結共同方案與證據，比較強制與非強制；完整 Agent 實驗允許自由生成與回退，測整體效果。兩者分開。

## 8. 分歧排序是獨立候選策略

S1 可先沿用「可區分假說對／全部不同假說對」，但不稱校準資訊增益或最優決策。第一個 gate 實驗不依賴 S1。

固定世界、歷史、假說、預測、候選測試與後續決策表，只換排序，比較最便宜優先、模型自由選與 S1。生成費用一致；人工提供真原因的候選池只能算 oracle-assisted，不當自主成績。

必測完全重複假說、排列／改寫、過窄預測區間、真原因缺席。完全相同的預測與決策簽名可固定去重，語意近似去重仍可能出錯。區間重疊或 unknown 不算已可区分；單一假說不除以零，轉反駁測試或調查。全不吻合保留 unknown／其他原因。

分數高不等於修復好；改變決策也不是必要或充分條件。小型 dev 可從同狀態分叉，比較不同測試或不測試的後續功能與總成本。額外分析分支不免費提供正式 Agent。

## 9. 經驗修訂與回歸

依新證據可保留、限縮條件、建立情境分支、改程序或標待重驗。關聯表示值得重查，不代表下游結論全假。不先建完整因果圖或全面工具治理。

原始 evidence 不覆寫。新 revision 說明修改依據、仍適用及未決 scope。修復後完整農場驗收並測應保留的舊情境；功能改善不證明唯一機制。工具／前提錯誤、假說缺失、排序與修復失敗分別分析。

## 10. 主要比較與貢獻限制

05 定義 I0 提示、I1 證據、I2 證據＋規則；I1/I2 共用同檢查結果隔離外部規則，均計入證據成本。另保留 B1 原始歷史、B2 普通筆記、B3 固定檢查表，不只勝過被削弱的提示組。

報成功、總成本、錯誤放行、有效程序誤擋、回退與修復路徑，不能只報遵守率。沒有獨立適用性證據時不把前提通過率當真實適用率。

主動實驗、工具契約、記憶抽象與外部檢查都有先例。本次補足可執行政策，不等於已發明新演算法；方法沒淨收益就簡化。文獻查核與限制見 [08](08-related-work.md)。

從需求設計可以使用經驗做設計前檢查，但與診斷分開驗收。一次農場改良不等於 Agent 成長，更不自動等於 RSI。
