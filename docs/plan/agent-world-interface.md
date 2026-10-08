# Agent 與 Minecraft：接入、觀察與實驗介面

[索引](../README.md) · [系統](02-system-and-stack.md) · [農場規格](03-farm-testbed.md) · [驗收清單](agent-world-acceptance.md)

更新：2026-10-08。狀態：規格草案 `corrobora.world.v0.1-draft`，尚無已實作的 adapter 或通過的遊戲測試。本文是模型可見資料、工具語意與實驗提交的唯一規格；02 管部署，03 管任務與計分，04 管候選重用政策，05 管比較。以下名稱是本專案擬定介面，不是 Minecraft 原生 API。

## 1. 接入路徑與責任

```text
模型的工具呼叫
  -> Python runner：驗證參數、權限、預算、狀態與紀錄
  -> 本機受保護的 JSON-RPC 2.0 控制通道
  -> Java/Fabric adapter：在伺服器執行緒讀取／修改世界
  -> 有時間與範圍標記的原始觀察
  -> runner 驗證、裁切／分頁
  -> 同一模型繼續工作
```

模型透過 function calling 工作；需要接現成 Agent 時，runner 可另包成 MCP。MCP 並不自動提供世界理解、沙箱、資料正確性或 Minecraft 控制能力。MCP 工具的 input/output schema、structuredContent 與工具錯誤按選定的協定版本映射；backend JSON-RPC 不因此自動成為 MCP server。[T1]

模型提出位置、假說、測試和修改；runner 控制操作與預算；adapter 提供版本特定的可測資料；固定 evaluator 在獨立世界計分。模型不得直接連 adapter、取得 OP/RCON、讀寫世界檔或操作 evaluator 程序。

## 2. 任務開始時的資料包

runner 從公開 manifest 生成 bootstrap，只傳以下資料，不直接把研究者的 docs 或私有 manifest 塞進模型上下文：

| 類別 | 必須提供 |
| --- | --- |
| 任務 | 中性的 task_id、task_mode、目標物、合法輸入、輸出端、成功指標及允許的操作條件範圍 |
| 空間與時間 | dimension、可讀／可改區域、座標慣例、時間模式、載入區域及固定玩家條件 |
| 資源 | 材料與修改限制、剩餘模型／工具／模擬預算、提交與重試上限 |
| 介面 | 實際支援的 tools、schema、能力清單、錯誤碼、分頁方式、感測器語意及限制 |
| 初始觀察 | 公開區域的邊界、方塊種類計數、可見容器／實體數與覆蓋範圍；不附人工模組名稱或故障解釋 |
| 參考資料 | 凍結且允許傳給供應商的遊戲文件／版本資料、工具教學和已核准歷史來源 |

模型可使用預訓練知識，不宣稱空白先驗。對所有主要組提供相同文件與介面教學；開放網路、額外視覺或人工模組圖另設配置，不混進 CDET 的效果。

禁止提供故障名稱、受影響模組標籤、標準修復、正常版與故障版的私有差異、正式測試 seeds、隱藏分數或研究者判定的經驗適用標籤。公開限制仍須足夠明確，不能偷偷更換驗收要求。

### 固定的模型使用說明

以下是未來 bootstrap manual 的文字骨架；實作時以已支援能力生成工具段落並保存 hash，不把本研究文件全文當提示：

```text
Use only the listed tools and the public task requirements.
Coordinates and bounds follow the supplied environment profile.
Observations describe measured state, not verified causes.
Build your own revisable interpretation of regions and mechanisms.
Before a controlled diagnostic experiment, submit its intervention,
measurements, predictions or explicit unknowns, and resource limits.
Missing or unsupported measurements are not zero.
Do not infer complete coverage from a truncated response.
Distinguish diagnostic-fork results from full-farm validation.
You may investigate from scratch when prior experience is inapplicable.
Report uncertainty and failures; do not invent observations.
Submit the final design through the provided tool.
```

教學使用與研究題目隔離的極小操作場景，只教座標、讀取、修改、推進與提交，不教正式農場故障答案。模型介面測試失敗時先修介面，不立即解讀成工程推理失敗。

## 3. 空間表示與狀態身分

所有空間查詢顯式指定 dimension。以世界整數方塊座標表示：x 向東、y 向上、z 向南；實體位置使用浮點座標。區域統一為半開區間 `[min, max_exclusive)`，min 每軸小於 max；不允許混用含尾端與不含尾端邊界。局部座標必須附 origin 與 transform，第一版預設不旋轉座標系。

方塊回傳 registry ID、位置、版本適用的 block-state properties，例如 facing、powered、power、delay。不是每種方塊都有這些屬性；不存在就不捏造。block state、容器內容與動態事件是不同資料，不能從 powered 一個欄位直接推定訊號因果路徑。

每份觀察至少綁定 `world_id, state_token, design_revision, sim_tick, observation_id, coverage`：

- `world_id` 區分建造、診斷副本與驗收世界；reset 後使用新 world_id。
- `design_revision` 在明確設計修改後更新；不代表動態世界沒變。
- `sim_tick` 由 adapter 實際記錄，不用牆鐘或日夜時間推算。
- `state_token` 是 runner 發出的世界狀態／操作屏障身分。推進時間、修改或其他會影響觀察的操作後失效；不是宣稱可完整雜湊所有 RNG。
- 多頁資料讀同一個 immutable observation capture，不能下一頁悄悄切成新時間。

要求舊 state_token 的寫入回傳 STALE_STATE，不自動重試在新世界上執行。唯讀歷史觀察仍可讀，但明示其時間與已過期；不能當成當前前提已成立的證據。

## 4. 三層觀察，不替模型解題

### 4.1 不帶語意答案的概要

`describe_world` 回傳公開可讀範圍、載入覆蓋、方塊種類計數、容器與可見實體數。統計按固定程式從允許觀察計算；不產生「收集端故障」「預期最佳路徑」等結論。

所謂主要種類只能依公開的計數規則排序。不能使用研究者的正常藍圖、私有機制圖或故障位置決定要凸顯哪裡。

### 4.2 按需查詢與局部切片

| 工具 | 輸入／回傳重點 | 重要限制 |
| --- | --- | --- |
| `inspect_region` | world、bounds、可選 block ID 篩選；座標、方塊 palette／states、覆蓋與分頁 | 不載入新 chunk、不跨允許範圍；缺資料不是 air |
| `inspect_block` | 一個位置；方塊 state、可讀 block-entity 欄位 | 不回傳全部 NBT、指令或私有標籤 |
| `inspect_container` | 一個容器；slot、item ID、count、allowlist components | 是快照庫存，不冒充過去吞吐量；禁任意寫入 |
| `inspect_entities` | bounds、types；episode-local ID、位置、種類、允許狀態 | 不暴露玩家私人 UUID；ID 不能當物品守恆身分 |
| `query_events` | 已啟用 sensor、時間區間、bounds、cursor | 只有被擷取的事件，不能回溯未量測的歷史 |
| `slice_region` | observation、固定 y 或其他宣告平面 | 程式生成圖例、軸向、方塊符號；方向／狀態可另查 |
| `read_observation` | observation_id、cursor | 原 capture 的下一頁；無 filesystem 路徑存取 |
| `render_region` | observation、camera preset、bounds | 可選配置，未實作不得列為可用工具 |

切片使用數字／字母 palette 加明確 legend，不以單一符號抹掉方向與狀態。統一列／欄與座標對應。ASCII 圖是导航輔助，詳細狀態仍可查。

`render_region` 若日後實作，使用可信程式從同一可讀資料渲染，不用生成式圖片補猜世界。記相機、光照／材質、隱藏／遮蔽、slice 設定、renderer 版本與圖片 hash。伺服器 mod 本身不等於有渲染器；需另建離線 renderer 或受控 client。client 不得改變玩家位置／載入條件而污染正式世界。主實驗先用結構化資料＋切片，視覺擴展另測且所有比較組一致。

### 4.3 模型自己的結構理解

模型可用 `annotate_region` 保存 label、bounds、推定角色、輸入／輸出位置、引用 observation IDs、未知條件與修訂理由。annotations 是 task-local 工作筆記，不是工具提供的 ground truth。

区域可能重疊，機制可能跨區域，不能先假定農場可拆成互不影響的四個模組。系統可檢查引用與座標，但不能因此認證「此區就是完整收集端」。跨任務保存需經 04 的經驗修訂，不直接把所有 annotations 寫成知識。

## 5. 感測器與缺失資料

環境啟動時提供 capability manifest，逐項列出 sensor ID、版本、量測定義、單位、空間／時間解析度、啟用時間、丟失或抽樣條件。unsupported 與未啟用要分開，不能用空陣列表示零事件。

第一版必要的是方塊／容器快照、實際 tick、執行與輸出會計；逐次物品轉移、活塞事件、生成／消失原因等屬按案例實作的進階感測，不假定 Fabric 有全部現成 hooks。優先使用已存在 events，必要時才寫窄範圍 mixin，並用獨立小案例校準。[T2]

容器數量差不等於轉移事件數；實體消失可能是合併、卸載或其他原因，沒有可驗證 hook 就只能回傳 disappearance，不標成 despawn。物品實體合併／拆分時不宣稱單一 ID 可追蹤每件物品。不得為追蹤而修改物品組件、阻止合併或改遊戲規則卻不另標環境變更。

每個事件保存實際 `tick, sequence, sensor_id, world_id, event_type, position, payload`。查詢 `[start_tick, end_tick)`；計數若抽樣、掉事件、覆蓋不全，必須附 coverage 與 dropped_count，無法確定時填 unknown 而非 0。

正式 event retention 不憑記憶體環形緩衝覆寫證據。先寫 runner 控制的 append-only 檔案；模型只讀自己的有權限區段。查詢不到已封存的資料應回 retention/capability 錯誤，不能捏造完整歷史。

## 6. 遊戲時間、載入與非破壞性讀取

主研究採 `step_controlled`：模型等待或讀取已保存資料時，不讓主要遊戲模擬任意前進；只有 advance／experiment 才推進宣告 ticks。若 adapter 做不到，先停止此配置驗收；另做 real-time 設定時所有組使用同樣規則，不能悄悄切换。

原版 `/tick freeze` 不凍結玩家及其騎乘實體，不能當作完整快照或完全停時保證。[T3] 因此固定載入條件與必要玩家／bot 狀態，禁止人類或 bot 在模型等待期間自由移動／輸入；記錄殘餘活動。若農場依賴這類活動，使用明確實作且獨立驗證的操作腳本，否則不納入此配置。

world read 不得隱性呼叫載入新 chunk 的路徑。未載入區域回傳 UNLOADED_REGION 或有缺失的覆蓋圖，不當成 air。變更載入區域是 runner 的環境操作，不是 read 的副作用。不要因看某處就把本來不運作的農場載入了。

`advance_ticks(n)` 非阻塞地排入伺服器操作佇列，實際完成後才回傳／完成 job。回傳 requested_ticks、executed_ticks、起迄 tick 與結束狀態；timeout 不等於沒有執行。控制佇列在暫停時仍需能服務，不能在主執行緒等待自己完成。

`/tick step`、`/tick sprint` 是可評估的底層工具，不開放任意命令給模型。[T3] sprint 需先驗證參考農場與所需玩家行為相容；不以修改 randomTickSpeed 冒充等價加速。每次操作後重查實際 ticking 狀態。

## 7. 資料量限制與成本

所有上限由版本化 environment profile 強制執行。以下只是可開始做介面 smoke 的保守候選值，不是已調優或正式研究預算：

```json
{
  "profile_id": "structured_probe_v1",
  "max_scan_cells": 4096,
  "max_records_per_page": 512,
  "max_events_per_page": 500,
  "max_response_bytes": 131072,
  "max_patch_operations": 128,
  "max_ticks_per_call": 6000,
  "max_active_diagnostic_forks": 1,
  "visual_access": false,
  "implicit_chunk_loading": false
}
```

超過單次範圍上限要求分區，不暗中抽樣。記掃描體積、紀錄數、回傳 bytes、模擬 ticks、sensor 開銷、模型實際 tokens、工具與牆鐘時間。不存在計算依據時不硬造一個「查詢點數」。

初始概要若範圍過大，分批在同一穩定 capture 建立並記覆蓋。預算不足時明示未掃描範圍。動態回傳省略不能默默丟掉可能故障相關的方塊。

## 8. 工具回應、分頁與錯誤

runner 為工具請求綁 episode、request_id、身份與 idempotency key；模型不能用參數冒認其他 run。寫入與推進要求 expected_state_token。所有回應有下列共同欄位：

```json
{
  "schema_version": "corrobora.world.v0.1-draft",
  "request_id": "synthetic-request-1",
  "status": "ok",
  "world_id": "synthetic-world-1",
  "state_token": "synthetic-state-7",
  "design_revision": 2,
  "sim_tick": 120,
  "observation_id": "synthetic-observation-1",
  "coverage": {
    "complete": true,
    "missing_regions": [],
    "dropped_count": 0
  },
  "next_cursor": null,
  "usage": {
    "scanned_cells": 1,
    "returned_records": 1,
    "simulated_ticks": 0
  },
  "data": {
    "position": [4, 64, 8],
    "block_id": "minecraft:hopper",
    "properties": {"facing": "east", "enabled": true}
  },
  "error": null
}
```

這是合成格式範例，不是實測；正式內容雜湊由 recorder 計算並附入 observation metadata，不手填假的 SHA。`status` 為 ok／partial／running／error；partial 不可當作完整否定證據。長操作用 job_id＋job_status 回覆，不占住 HTTP 請求直到任意 timeout。

錯誤至少分 INVALID_ARGUMENT、OUT_OF_BOUNDS、UNLOADED_REGION、UNSUPPORTED_CAPABILITY、STALE_STATE、CURSOR_EXPIRED、BUDGET_EXHAUSTED、FORBIDDEN、TIMEOUT_PARTIAL、EXECUTION_FAILED、CANCELLED。附是否有副作用、實際 ticks、可用觀察與新的狀態身分，不洩漏主機路徑或私有 evaluator 訊息。

同一 idempotency key 配相同 payload 重送只能取得既有結果；同 key 不同 payload 回 conflict。網路回覆遺失時先查 request/job 狀態，不能再次修改世界。取消保留部分操作與成本，不能把取消當 rollback。

每個工具的 generated manual 都要列：arguments、required fields、units、範圍、輸出 schema、side effects、成本計法、errors、是否限診斷世界、成功／失敗例子。MCP adapter 可將 domain error 映為 isError；JSON-RPC 協定錯誤與世界執行錯誤分開。[T1]

## 9. 修改、運行與隔離世界

| 工具 | 語意 |
| --- | --- |
| `apply_patch` | 提交有序 operations、預期前態與狀態；檢查區域／材料／模式限制，保存前後差異及累積修改成本 |
| `advance_ticks` | 有界推進並回到宣告時間模式；讀取不偷偷推進 |
| `checkpoint` / `reset` | runner 控制的狀態保存／冷重建；記不可還原的範圍，reset 也計預算 |
| `fork_diagnostic` | 從特定來源狀態建立隔離世界，保存 parent linkage；注入與改變條件只能在允許副本進行 |
| `submit_design` | 凍結當前設計、合法初始材料、必要設定，交固定 evaluator 新世界驗收 |
| `job_status` / `cancel_job` | 查看／取消自己的長操作，不能操作其他世界與評分工作 |

一般 patch 只含受支持的方塊／state 操作，不接受任意 NBT、聊天命令或可执行字串。涉及容器、液體、方塊實體、合法耗材的初始化由白名單契約另列，不能以方塊 state 介面變相注入成品。

修改有順序，鄰居更新可能即時發生；不把整批修改說成資料庫原子交易。模型不能任意選 update flags 或抑制自然副作用。失敗保留已完成 operations，由 runner 決定重建，不回報假的全部回復。

持續運行中的自然產物與建造／拆除造成的產物分開。最終新世界重新初始化並預熱，不能靠拆掉庫存方塊、搬預存成品或診斷注入提高正式產量。

## 10. 正式診斷實驗的提交

讀取現有方塊或普通探索不需填完整假說表。受控干預需先提交 experiment proposal，intent 為 explore／diagnose／applicability。探索可明記不知道會發生什麼，不能為格式逼模型捏造預測。

必要契約：

| 欄位 | 要求 |
| --- | --- |
| source | world_id、source_state_token、design_revision、引用觀察 |
| purpose | 問什麼、intent、要区分的假說或 explicit unknown |
| intervention | 允許的操作清單、bindings、是否改變負載／隔離模組 |
| measurement | sensor/query、位置、單位、預熱、量測窗口與重複計画 |
| prediction | 各假說的可量測結果、容忍範圍、未知項；無預測需給 reason |
| decision_map | 可觀察結果對應的候選修復／後續調查；可有 keep_plan 與 undecided |
| limits | 模擬、工具、牆鐘、重複與副本上限，成功／停止／失敗規則 |

`submit_experiment` 先驗證可執行性並封存 canonical proposal/hash，回傳 experiment_id；不由此認證假說正確。`execute_experiment` 只接已封存 ID，若來源狀態變更則拒絕或另立新版本，不能看結果後改舊預測。

執行流程：核對父狀態 → 建副本 → 啟用已宣告 sensor → 施加操作 → 預熱 → 量測 → 封存所有重複結果 → 回傳資料。預熱與重複都計成本。順序不同應另成 protocol 版本，不能只記最終數字。

若副本經過負載注入，結果只證明該負載下的行為。用它支持正式世界的前提，需要明示父狀態、相同條件與可轉移理由，不能把副本通過當成正式世界同樣通過。

## 11. 一次完整互動要長什麼樣

以下是預期驗收軌跡，不是已執行案例：

1. runner 建立公開任務與乾淨世界；模型取得 manual、能力清單、限制與初始概要。
2. 模型 inspect_region／slice_region 找位置，再 inspect_block／container 讀細節；大型結果靠同 capture 分頁。
3. 模型提出暫時區域解釋，引用觀察。系统不提供正確模組名稱。
4. 模型提出幾個原因，先鎖定干預、感測與預測；必要時使用 04 的重用檢查。
5. runner 建診斷副本、執行實驗並回傳原始量測；模型可修正自己的解釋。
6. 模型提交符合任務模式的正式 patch，重跑完整農場，而非直接採副本分數。
7. submit_design 凍結設計，獨立驗收；保留的最終測試資料不回流下一題記憶。
8. runner 保存模型與工具版本、觀察、修改、成本、經驗版本和失敗，最後才進下一題。

## 12. 可檢查條件與模型推論

「R7 容器有 10 個物品」可以是工具觀察；「R7 是唯一出口」是模型推論；「所以舊測試適用」還需要條件論證。不得用一個 verified 欄位混合它們。

程式檢查的 predicate 必須有白名單 validator、資料依據、單位、比較運算及有效範圍。未知 validator、缺失覆蓋、過期狀態或語意推論都不能自動通過。檢查不負責證明模型列出的前提充分完整；04 與 05 必須量測錯誤前提與錯誤拒絕。

## 13. 公平性與首版交付

所有主要 arm 共用同一環境工具、資訊精度、schema/manual hash、初始概要、事件與切片。人工模組圖、影像、額外 code access 或 profiler 可以研究，但各自在獨立配置中比較。

先完成結構化觀察、受限修改、受控推進、冷重置及正式提交，再加入診斷副本與受控實驗。render、自動因果圖與全面逐 tick profiler 不是首版前置。具體阻擋條件與測試 ID 見 [驗收清單](agent-world-acceptance.md)；第一次記錄填 [P1 工作表](../experiments/p1-interface-smoke.md)。

## 官方技術依據與查核範圍

2026-10-08 針對介面核對以下官方文件，並非重新完成全部論文的新穎性審查。

- [T1：MCP tools，2025-06-18 規格](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)：工具 schema、結構化結果、分頁與錯誤機制。此處採明示版本作參考，不宣稱是最新 MCP 版本。
- [T2：Fabric events](https://docs.fabricmc.net/develop/events)：常見事件 hooks 與 mixins 的關係。具體 hooks 需按鎖定遊戲版本確認。
- [T3：Minecraft Java 1.20.3 官方發布說明](https://feedback.minecraft.net/hc/en-us/articles/21968446892173-Minecraft-Java-Edition-1-20-3)：tick 的 freeze／step／sprint 語意與玩家例外。這是設計依據，目標版本仍需實測。
- [T4：Fabric 1.21.11 自動測試](https://docs.fabricmc.net/1.21.11/develop/automatic-testing)：單元與遊戲測試起點，不代表已實現冷重置或精確快照。
