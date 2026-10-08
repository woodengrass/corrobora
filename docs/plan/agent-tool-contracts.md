# 模型—世界工具契約與呼叫範例

[索引](../README.md) · [介面語意](agent-world-interface.md) · [驗收](agent-world-acceptance.md) · 2026-10-08

狀態：`corrobora.world.v0.1-draft` 人可讀契約，未實作、未產生正式 JSON Schema。下列呼叫都是合成範例，不是實驗紀錄。實作時以此建立型別、機器 schema 和契約測試，不將格式文件冒充通過測試的程式。

## 1. 共同型別與信任邊界

| 型別 | 精確約定 |
| --- | --- |
| Id | 非空字串，只能引用工具已發給同一 arm/episode 的物件；不能用任意路徑或網址代替 |
| BlockPos | 三個整數 `[x,y,z]`，世界座標；Y 限目標 dimension 的實際高度 |
| EntityPos | 三個有限浮點數；不接受 NaN／Infinity |
| Bounds | `dimension:string, min:BlockPos, max_exclusive:BlockPos`；逐軸 min<max，半開邊界 |
| StateRef | `world_id:Id, expected_state_token:Id`；檢查所屬身分、生命週期及當前狀態 |
| Cursor | runner 生成的不透明字串，绑定 observation、查詢與身份；不讓模型組装 offset 跨資料 |
| ObservationRef | `observation_id:Id` 加可選 `record_ids:string[]`；引用存在不證明語意推論 |
| Budget | 非負整數限額與有限 timeout；不以缺值代表無上限，總限額由 runner 強制 |

所有 schema 封閉，未知欄位拒絕。registry ID、state property 和白名單 component 依實際版本校驗，不允許任意 NBT 或執行字串。模型選 world_id 不代表取得該世界權限。

模型只提交工具參數；runner 加 request_id、episode、呼叫身份、idempotency key 與配置 hash。重送同一網路請求沿用同 key；模型在之後回合重新要求相同行動，預設是新請求，不能被永久去重掉。

每個回應依介面 envelope 帶 status、request_id、world/state/tick（適用時）、observation_id、coverage、next_cursor、usage、data、error；尚未建立 world 的錯誤可用 null，不捏造狀態。長任務 `status=running` 時帶 job_id，結果完成後才有 observation。

## 2. 觀察工具

以下每項均有單次資料量／總預算限制，均不得隱性載入 chunk 或推進時間。

| 工具 | 模型 arguments | data 內容 |
| --- | --- | --- |
| describe_world | world_id | public_bounds、loaded_coverage、捕捉時點、block_type_counts、可見 containers/entities 計數、capabilities/profile IDs |
| inspect_region | StateRef、bounds；可選 block_ids:string[]、include_air:bool（預設 false） | bounds、palette、records、excluded_types；record 包 pos 和 palette_id；coverage 明示完整性 |
| inspect_block | StateRef、dimension、position | pos、block_id、properties、allowlisted block_entity data |
| inspect_container | StateRef、dimension、position | snapshot_tick、slot_count、slots[{index,item_id,count,components}]、omitted_components；空槽 count=0，不混成缺資料 |
| inspect_entities | StateRef、bounds；可選 entity_types:string[] | records[{entity_id,type,position,allowed_state}]；ID 僅在此 world 有意義 |
| query_events | world_id、sensor_id、bounds、start_tick:int、end_tick:int | `[start,end)` 的 records、enabled_from、capture_scope、sampling、dropped_count；無法量測時 unknown/error |
| read_observation | observation_id、cursor | 原查詢下一頁，不能附新 bounds/filter；cursor 與查詢不符則拒絕 |
| slice_region | observation_id、axis:x/y/z、index:int | ASCII/palette grid、legend、row/column 軸、origin、state/time、coverage；可另查方向和狀態 |
| render_region | observation_id、camera_preset、bounds | image artifact ID/hash、renderer/camera/config、coverage；只在能力清單啟用後出現 |

無 block_ids 篩選且 include_air=false 的完整 scan，可由公開界線與省略規則推知未列位置為 air；有篩選時，未列可能是不符合篩選，不能推成 air。未載入、partial、未掃描的位置永遠不是 air。需要確認時用 inspect_block。

slice/render 基於整個已捕捉 observation，不僅當前頁；capture 不完整則標未知格。重新渲染不得偷偷重讀當前世界。圖片只能來自可信程式對實際狀態的呈現，不用生成模型補景。

`describe_world` 也記掃描範圍與成本；大型概要可回 job，再從同一穩定 capture 分頁。不能因叫 summary 就免費掃全世界。能力不支援的工具不出現在模型 manual 中。

### 合成呼叫一：區域查詢

```json
{
  "world_id": "world-demo-1",
  "expected_state_token": "state-demo-12",
  "bounds": {
    "dimension": "minecraft:overworld",
    "min": [0, 64, 0],
    "max_exclusive": [4, 66, 4]
  },
  "include_air": false
}
```

區域體積是 32 格，掃描結果必須綁同一 observation。若收到 next_cursor，後續呼叫 read_observation，不能再次呼叫 inspect_region 拼成不同時間的假快照。

```json
{
  "observation_id": "observation-demo-8",
  "cursor": "opaque-demo-cursor"
}
```

此處 ID 為合成占位。實際 cursor 由 runner 發出，不能照抄此值當真實工具輸入。

## 3. 工作筆記與歷史資料

`annotate_region` arguments：world_id、label、bounds、hypothesized_role、可選的 inputs/outputs（具體位置）、evidence_refs、uncertainties、可選 parent_annotation_id。回 annotation_id、revision、source_state、validation_errors。位置合法和引用存在只表示格式／來源可用，不把 role 標成 verified。

`read_annotation` 接 annotation_id/revision，回原版本；修訂不覆寫。任務內筆記所有組都可使用，只有跨題持久化方式依 B 組不同。不得把這個工具只給 B4，形成額外工作記憶優勢。

歷史／公開文件另提供 `search_history(query, filters, cursor?)`、`read_history(record_id, start, limit)`、`search_reference`、`read_reference`。只返回自己的允許資料，分頁不透露另一組／未來任務或私有標籤；全文檢索命中不是事實驗證。B1 至少能分段讀取完整允許原始紀錄，不強制一次塞入 context。

來源工具與世界工具不同，不允許模型以 record_id 存取主機檔案。查詢次數、回傳量、實際 context tokens 與整理成本全部記錄。

## 4. 修改與時間工具

| 工具 | arguments | data／副作用 |
| --- | --- | --- |
| apply_patch | StateRef、operations 有序陣列 | completed_operation_count、逐項 outcome、前後 state、material/edit usage；部分失敗明示 |
| advance_ticks | StateRef、ticks:positive int | requested/executed_ticks、start/end_tick、final state/time mode；可能回 job |
| checkpoint | StateRef | checkpoint_id、artifact identity、captured_state、limitations、parent linkage；無法做熱快照就明確拒絕 |
| reset | world_id、checkpoint_id 或 task_initial（擇一） | 新 world_id/state、實際初始化範圍、成本與未還原狀態；不能讀其他 episode 快照 |
| fork_diagnostic | StateRef、checkpoint_id 可選 | child_world_id、parent_state、允許干預、初始化限制及實際成本 |
| submit_design | StateRef | submission_id、凍結設計身分及提交狀態；final private score 不作公開工具輸出 |
| job_status | job_id | queued/running/completed/failed/cancelled、partial ticks/operations、結果引用及已花成本 |
| cancel_job | job_id | cancel_requested、實際停止點、部分操作；不可取消別人或 evaluator 的任務 |

patch operation 首版只支援白名單 `set_block`（dimension、position、block_id、properties、可選 expected_block）和 `remove_block`（dimension、position、可選 expected_block）。非法 state／材料／範圍整批預驗；執行途中仍可能部分失敗，不能承諾原子 rollback。

預設使用固定、已測試的遊戲更新語意；模型不能自行改 update flags、無聲抑制掉落或直接寫容器。remove、replace 導致的掉落照實記錄；創造模式的材料預算是本研究的設計資源帳，不冒充生存採集成本。

初始合法耗材由 task initializer 配置；診斷副本的受控負載由獨立白名單干預處理。這兩條路不能借 patch 直接寫成品到正式輸出端。

### 合成呼叫二：局部修改

```json
{
  "world_id": "world-demo-1",
  "expected_state_token": "state-demo-12",
  "operations": [
    {
      "op": "set_block",
      "dimension": "minecraft:overworld",
      "position": [2, 65, 2],
      "block_id": "minecraft:stone",
      "properties": {},
      "expected_block": {
        "block_id": "minecraft:air",
        "properties": {}
      }
    }
  ]
}
```

僅示範型別，不代表該修改是農場解法。若 state 已改，回 STALE_STATE；模型重新觀察再決定，不由 runner 私自套到新狀態。回覆遺失由原請求查 job，不盲目重送新 key。

## 5. 提交實驗的完整物件

`submit_experiment` 接 proposal；runner 正規化、檢查能力和預算、封存後回 experiment_id 與 proposal_hash。`execute_experiment` 接 experiment_id 及來源 state；不能提交另一份事後改寫的 proposal。

| 欄位 | 型別與必填要求 |
| --- | --- |
| source | world_id、state_token、design_revision、evidence_refs |
| intent | explore／diagnose／applicability |
| question | 非空問題描述，不代替可執行操作 |
| hypotheses | 陣列，每项 hypothesis_id、claim；explore 可空，需註明 unknown |
| bindings | role 到具體 bounds／position 及觀察引用；不能是私有標籤 |
| interventions | 白名單操作的有序陣列，可空；只在指定診斷世界執行 |
| measurements | 非空陣列：measurement_id、已支援 sensor、bounds／position、聚合方式、單位 |
| predictions | hypothesis_id＋measurement_id＋預期值／區間／分類，或 explicit unknown＋reason |
| decision_map | outcome predicate 到候選 action ID／keep_plan／continue_investigation；允許未定，但不得冒充決策資訊增益 |
| protocol | warmup_ticks、measurement_ticks、repeats、order、reset_policy |
| limits | max_total_ticks、max_tool_calls、wall_timeout_seconds、fork_limit；不得超過 task 剩餘額度 |

首版 `order=intervene_then_warmup_then_measure`，其他順序需新的已驗證 protocol。需要先測前態的設計必須顯式另列量測階段，不能偷偷改順序。repeat_policy 預設每次從同一登記 parent checkpoint 重新建立副本；不精確可重現之處仍須報告。

最少支持區域／容器快照與合法交付計數；流量、生成、消失原因的 sensor 名稱必須由真實 capability manifest 取得。不得以模型自由寫的字串自創已可用 sensor。

介入白名單可先只支持有界 block patch；受控物品負載需另實作 `inject_test_load`，限定診斷世界、允許物品、入口、速率及累計上限，並留干預來源紀錄。未實作不顯示；所有比較組同權限。測試物可影響遊戲機制，因此不可當自然負載的結果。

### 合成呼叫三：先量測、再決定

```json
{
  "source": {
    "world_id": "world-demo-1",
    "state_token": "state-demo-20",
    "design_revision": 3,
    "evidence_refs": ["observation-demo-9"]
  },
  "intent": "explore",
  "question": "Measure delivery under the currently declared operating conditions.",
  "hypotheses": [],
  "bindings": {},
  "interventions": [],
  "measurements": [
    {
      "measurement_id": "delivery-window",
      "sensor_id": "public-output-counter-demo",
      "aggregation": "net_delivered",
      "unit": "items"
    }
  ],
  "predictions": [
    {"measurement_id": "delivery-window", "unknown": true, "reason": "No calibrated estimate yet."}
  ],
  "decision_map": [{"condition": "otherwise", "action": "continue_investigation"}],
  "protocol": {
    "order": "intervene_then_warmup_then_measure",
    "warmup_ticks": 200,
    "measurement_ticks": 1000,
    "repeats": 2,
    "reset_policy": "fork_from_registered_parent"
  },
  "limits": {
    "max_total_ticks": 2400,
    "max_tool_calls": 12,
    "wall_timeout_seconds": 300,
    "fork_limit": 1
  }
}
```

這些 ID、時長和限額全為格式示例，不是農場測量建議或已驗證值。公開輸出 sensor 可綁定 task 指定終端，所以該 measurement 不再帶可由模型替換的 output position；其他 sensor 必須帶其所需位置。執行前從 capability schema 驗證。

兩次 repeat 依序重建，fork_limit=1 限同時存活數而非總重複數。總 tick 至少涵蓋兩次預熱＋測量，還需計實際初始化／干預推進；若總額度不足，拒絕而非悄悄省略預熱或重複。

這是探索，不要求虛構故障預測。診斷／適用性測試在有候選原因時填入事前預測；每個 measurement 的定義固定，模型不能看完結果更改聚合。

## 6. 工具教學與完整互動

先向模型發固定 manual、公開 task、能力與資料限額。以獨立教學世界示範讀一格、讀切片、第二頁、合法／非法 patch、STALE_STATE、推進、實驗和提交；保留模型誤用與人工幫助，不用正式答案教學。

一次研究軌跡：describe_world → inspect/slice → annotate_region → search/read_history（有權限時）→ 提出方案 → submit_experiment → execute/job_status → 讀實驗證據 → 更新 annotation → apply_patch → 完整農場公開驗證 → submit_design。工具順序可由模型調整，安全與事前封存不可省略。

B0–B4 共用所有通用工具；只有跨題經驗政策與明示 controller 不同。read-time summary、視覺、人工模組圖、额外 sensor 是另一個處置，不暗中綁給 CDET。

## 7. 啟動前配置不可有空白

介面 smoke 可採主規格的小型單次上限，但正式 run 還必須填：最大模型呼叫、總 tokens／simulated ticks、總掃描／回傳量、累積 patch／材料、單次及整體 timeout、允許 sensors、事件保留範圍、提交／重試次數、時間與載入模式。缺任何必需限制時拒絕開始，不以未填表示無限。

profile、manual、schema、validator 和模型配置一同雜湊。capability 改動、schema 不相容或渲染模式改變要新配置並重驗；不能在正式比較中無記錄變更。

## 8. 傳輸細節與查核界線

backend 使用 JSON-RPC 2.0，可與 MCP 分離；MCP 的 tools/list 分頁是工具清單分頁，並不自動替大世界查詢分頁。本文 observation cursor 是 Corrobora 自定的工具資料契約。工具 outputSchema/structuredContent/isError 依已選定 MCP 版本映射，不聲稱所有版本或客戶端均支援。

JSON-RPC 格式錯誤與 domain 執行錯誤分開。partial 的 data 仍可讀，但不能用作完整否定證據；error 帶實際完成範圍和 retryable，不暴露主機或私有 test 路徑。

source state 和當前 state 分開標記；歷史 observation 讀取時不把當前 token 覆蓋其原始來源。idempotency 接收／完成紀錄持久化，重啟後不能忘記曾修改過世界。不能確定是否已執行時先對帳或重建，不無條件重放。

所有例子是提案。實作後需對正式 schema 做正反例與 W/G 驗收；目前不宣稱已能呼叫以上函式。
