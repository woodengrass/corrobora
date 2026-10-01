[索引](README.md) · [MVP](08-scope-and-mvp.md) · [候選方法](16-conditional-diagnostic-transfer.md)

# 完整生電農場測試環境與工具契約

> 2026-10-01，待實作規格。下列函式、欄位與目錄皆為擬定契約，不代表 Minecraft 原生已有同名 API。

## 1. 任務與環境界線

主要對象是由多個相互作用模組構成、持續產出目標物的完整農場。任務要求宣告合法輸入、限制、輸出端與成功門檻。診斷模組實驗和完整系統評分分開，不以局部測試替代端到端驗證。

支援兩種任務模式並分開報告：

- `repair_optimize`：提供起始農場，依產出／可靠性／空間／材料限制診斷與改良。
- `design_build`：提供需求與可用材料／區域，不提供完整起始藍圖；Agent 自行設計、建造、測量與修改。

Pilot 先做前者，後者是保留的完整研究目標。遊戲進程使用固定測試服與程式化建造，不把走路或資源採集混進工程能力分數。

## 2. Task manifest

| 契約 | 必要內容 |
| --- | --- |
| 身分與切分 | `task_id, task_revision, family_id, mechanism_group_ids, design_lineage_id, split, task_mode` |
| 需求 | `target_items, output_regions, quality_thresholds, material_budget, build_region, allowed_inputs, forbidden_actions` |
| 環境 | `game_version, server_artifact_hash, loader_version, mod_artifacts, config_hash, world_snapshot_hash` |
| 運行條件 | gamerules、難度、時間／天氣策略、random tick 設定、區塊／entity 載入條件、玩家／bot 位置 |
| 量測 | `warmup_ticks, measurement_ticks, repeat_policy, sensor_profile, reference_run_ids` |
| 出處 | 設計作者、license、來源 URL／版本、允許公開範圍、自建／改編標籤 |

`fault_label, affected_modules, hidden_evaluation_seeds` 屬 evaluator-private manifest，不得放在 Agent 可讀的檔名、metadata 或 trace 中。給 Agent 的模組角色由它觀察／推定；若某組有人工分解，必須另列 oracle-assisted 對照，不能混成自主能力。

候選農場須先人工確認可行性與合法輸入。人工 reference 不是宣稱最優解，也不提供給 Agent 當測試答案。主實驗固定物理規則，變化來自設計組合、合法操作條件與負載；跨版本或非原版規則另列研究。

## 3. 擬定的工具介面

| 工具 | 功能與約束 |
| --- | --- |
| `create_episode(task_id, run_id)` | runner 建立隔離世界，載入公開規格；Agent 不選隱藏測試 seed |
| `snapshot_world(episode_id)` | 生成可定位快照與 hash；列出未捕捉的 RNG／排程狀態限制 |
| `restore_world(episode_id, snapshot_id)` | 還原建造、block entities、entities、inventories、時間與相關狀態，經 runner 驗證 |
| `apply_patch(episode_id, patch, expected_snapshot)` | 僅允許宣告區域與材料；先驗證 patch，再以可回退方式執行 |
| `run_ticks(episode_id, ticks)` | 有上限的模擬推進；分開記 simulated ticks 與牆鐘時間 |
| `observe(episode_id, query)` | 讀允許的 blocks/entities/events/counters；觀察粒度、成本與各組權限一致 |
| `fork_diagnostic(episode_id, snapshot_id)` | 建立診斷副本，受控注入／隔離操作必須標記，不能回寫正式評分世界 |
| `submit_design(episode_id, artifact_id)` | 凍結候選設計；由 runner 在新世界執行固定驗收 |

工具層強制 budget、path、區域與動作限制，不只依賴 prompt。Agent 不持有 server op／主機 shell／評分器目錄的無限制權限。檢索與生成程式在獨立沙箱，透過驗證過的介面操作世界。

## 4. 原始觀察與實驗紀錄

每個 `experiment_run` 至少綁定：

```text
run_id / arm / episode_id / task_revision
baseline_snapshot_hash / proposed_patch_hash
hypothesis_set_id / prediction_record_hash
intervention_spec / diagnostic_or_full_system
sensor_profile / warmup_ticks / measurement_ticks
observations_uri / observations_hash
simulated_ticks / wall_seconds / tool_calls
model_usage / maintenance_usage / failure_type
```

預測先保存再執行；不能看完結果後補寫成事前預測。原始紀錄由 runner append-only 寫入，修正另建事件。Agent 的文字解釋、完整私有思考過程與實際執行證據不同；只要求可檢查的假說、預測、理由摘要與操作紀錄。

每類農場需定義適合的量測點，例如生產、收穫、運輸入口／出口、指定儲存端、滯留／損失。不把所有農場硬套成獨立效率相乘：上下游可能互相影響，局部測試之後必須回到完整系統驗證。

## 5. 固定 evaluator

主要評分以指定合法輸入下、量測窗口內真正到達輸出端的淨新增目標物為準；初始庫存、外部注入、作弊生成與診斷副本產物排除。不同掉落、消耗或轉換機制需由 task-specific accounting 說清楚，無法守恆的部分不能硬造通用公式。

成功需要同時滿足產出／穩定性門檻及空間、材料、動作限制。先用 feasibility constraints，另報產量、footprint、資源等；不要把所有目標任意加成一個未校準分數。

- 開發用 evaluator 回傳哪些指標，在所有組固定。
- 最終保留 evaluator 使用未參與調參的條件／seeds；不供 Agent 無限查詢來選最佳模型或設計。
- 固定評分器與事件擷取器不可由 Agent 改寫；自寫 profiler 只產生額外分析，不能覆蓋原始觀察。
- 使用新世界重播凍結的設計；診斷實驗成功不直接算完整任務成功。
- 若允許多次正式提交，次數與回饋規格須預先固定並計入 budget。

## 6. 隨機性與速度

同一 world seed 不保證相同執行軌跡；entity AI、random ticks、載入與排程狀態可能造成差異。快照介面要測試實際可還原範圍，不能只保存方塊就稱完全 deterministic。

相同初始快照／seed 可作配對阻隔，但兩個策略採取不同動作後，不能假設仍共享完全相同亂數。重複 runs 並報變異；保留預熱、重啟、chunk 載入與失敗紀錄。

不要用改 `randomTickSpeed` 代替等價加速，因為它改變實驗條件。可在固定規則下提高執行速度，但要分開報每模擬時間產出與實際牆鐘耗時。不得無條件用理想 TPS 換算實際每小時產量。效能／lag 指標僅在固定硬體與負載上另測。

## 7. 可重用工程工具與安全

Agent 可產生分析腳本、計數器查詢或診斷程序；檔案記 hash、依賴版本、輸入／輸出與測試紀錄。程式執行採白名單介面、timeout、資源限制與網路隔離；不為了工具生成開放任意上游安裝或憑證。

原始 Minecraft 程式、第三方藍圖與資料依其來源授權處理。公開 repo 只放可公開的 adapter、自建／授權 fixtures、manifest 與復現指引；不要把 ignored 的遊戲 source 或 license pending 資料提交。

## 8. P1 的測試清單

- 人工可行 reference 在固定配置下的分布可重現。
- 無產出／零庫存／積壓情境的計分正確。
- 越界 patch、偽造輸出、修改評分器、讀取 private labels 被拒絕。
- 重置不殘留前一輪物品／entities／計數器；不能還原的狀態有記錄。
- 量測器本身不顯著干擾目標機制；有／無量測的 reference 差异需檢查。
- 評分器／工具崩潰與 Agent 設計失敗分類清楚；重試條件事先固定。

目前這些都是待建測試，不宣稱已通過。
