# 02｜系統架構與技術棧

[索引](../README.md) · [世界與量測契約](03-farm-testbed.md) · 2026-10-02

所有元件皆為實作提案。此提交沒有建立 Python package、Java mod、可執行命令或通過測試的環境。

## 1. 最小技術選擇

| 工作 | 第一版提案 | 原因與升級條件 |
| --- | --- | --- |
| 實驗控制、模型介面、分析 | Python 3.12 起步；uv 管理環境與鎖檔 | 版本先求相容與可重現，不因套件剛更新就升級；建立 pyproject 後才宣告命令可用 |
| 契約驗證 | Pydantic，公開邊界拒絕未知欄位 | 驗證型別、範圍與回應格式；不代表推論是真實 |
| Minecraft 操作與事件 | Java server-side Fabric adapter；版本固定 | 在主伺服器執行緒處理世界修改；mixins 僅用於已確認缺少的觀察點 |
| 控制傳输 | Python 與 adapter 的本機 JSON RPC；按需包成 MCP tools | Agent 不持有無限制 RCON／server OP；HTTP 只綁 loopback 並使用 episode 權限 |
| 原始證據 | 不可覆寫的檔案、JSONL 事件、內容 hash | Runner 是唯一寫入者；大檔另存，只以 URI／hash 引用 |
| 中繼資料與搜尋 | SQLite＋簡單全文／欄位查詢 | 不先部署 PostgreSQL、Qdrant 或 Neo4j；新索引必須在各主要組一致 |
| 工程測試 | Python pytest、Ruff、Pyright；Java Gradle、JUnit／GameTest | 先建立實際設定，再以它為準。遊戲實驗不是單元測試 |
| Agent 執行 | 一個可替換模型 adapter＋固定通用執行框架 | 記錄版本、prompt、上下文與重試；不重造通用多 Agent 平台 |

FastAPI 只有在需要正式外部 API 或多個使用者時採用。多服務、distributed queues、模型訓練、完整 corpus ingestion 不在第一版。

## 2. Minecraft 版本選擇不能照抄最新文件

P0 的首選相容性候選是 Java Edition 1.21.11／Java 21／Fabric，原因是既有資料以該版本為線索；這不代表已有可运行 server，也不宣稱它是最新版本。先驗證第一座農場、建置工具與所需觀察介面，再鎖精確 loader、API、JDK、Gradle 與 mappings 版本。

Fabric 官方指出 1.21.11 與 26.1 在混淆、mappings、mod 相容性及世界儲存方面存在改變。當前自動測試文件已顯示 26.2，不能直接拿它的程式碼和 Java 範例當 1.21.11 契約。版本變更必須另建配置、重跑 reference 與計分器，不混在主比較中。[1][2][3]

不要求為追最新版本承擔重寫成本。若相容性 spike 證明既有候選不合適，將理由及替代版本寫入 P0，不把歷史 source 快照當成 runtime。

## 3. 模組與依賴

擬定目錄，現在尚不存在：

```text
src/corrobora/
  contracts/      公開 task、工具輸入輸出、事件與結果
  runner/         episode、預算、調度、重試與封存
  environment/    Minecraft adapter client
  agents/         provider、harness、各實驗組 policy
  experience/     原始歷史搜尋、摘要、CDET 候選
  analysis/       成本、配對比較、圖表與失敗分析
server-mod/       Java 世界操作與原始事件擷取
trusted-eval/     私有測試配置與固定評分入口
```

`trusted-eval/` 是部署隔離邊界，不只是資料夾命名。Agent 的沙箱不可掛載其私有設定、讀取執行中程序或更改程式。公開發布評分器程式碼與實驗時隔離私有測試並不矛盾。

相依方向：contracts 不呼叫模型；runner 透過介面呼叫環境與 agent；experience 不可直寫世界或評分；analysis 只讀封存結果。不要用一個全域 singleton 同時保存世界、模型與研究資料。

## 4. Episode 生命週期

```text
created → initialized → running → submitted → evaluating → sealed
                              ↘ budget_exhausted / failed / cancelled
```

這是執行與紀錄狀態，不是規定 Agent 每一步如何思考。失敗也必須封存 trace、成本與原因。收到取消後停止新工具呼叫，終止該次執行並保留證據；不能默默重開新 episode 冒充同一次成功。

每次工具請求有 request_id、episode_id、expected_world_revision。改世界的操作使用 revision 檢查及 idempotency key，避免網路重送造成重複建造。輸出包含完成狀態、實際推進 ticks、花費預算、世界 revision 與觀察定位。

任意 patch 可能觸發方塊更新，不能假裝是無副作用的資料庫交易。先驗證範圍／材料，採隔離副本或可回復快照；執行失敗時封存部分結果並重建，不能回傳假的原子成功。

## 5. 模型與執行框架介面

記錄 provider、精確 model id、可用 snapshot、API 日期、推理強度、sampling 參數、tool schema、system prompt hash、context／compaction 規則。沒有 snapshot 時標 unknown，不以模型名稱相同保證服務未變。

固定最大模型呼叫、工具步數、模擬 ticks、輸出大小、單次 timeout 與整體上限。重試只處理預先定義的基礎設施錯誤；模型選了錯動作不能免費重來。

基本 watchdog 監控 job 心跳、最後工具事件與 budget。無輸出不等於死鎖，有輸出也不代表有進度；保存退出碼、進程狀態與最後事件。這是可靠執行的工程功能，不聲稱為新研究。

主比較保持 harness 和通用工具一致；CDET 的控制策略與格式是宣告的實驗處置。不要同時升級模型、增加隱藏觀察和擴大算力再歸因於經驗。

## 6. 原始資料與經驗儲存

原始 observations／patches／predictions／usage 由 runner 寫入不可覆寫物件；SQLite 保存定位與關聯。經驗 revision 只新增版本，當前指標可更新。舊結論被修正時保留舊證據。

hash 用於確認內容身分，不證明來源可信或結論成立。schema 驗證、程式執行、預測吻合、人工審核分開記錄，不合併成含糊的 verified=true。

需要更快檢索時先量測簡單搜尋不足在哪，再引入向量索引。若進入主比較，所有相關組保持相同基本檢索能力，並計入建索引與維護成本。

## 7. 測試分層

| 層次 | 要測什麼 |
| --- | --- |
| 純單元測試 | budget、manifest、patch 邊界、去重、計分會計、成本彙總；使用自建小型 fixture |
| 契約測試 | adapter 的 schema、錯誤碼、超時、revision conflict、重送與取消 |
| 遊戲整合測試 | 方塊與容器觀察、世界重置、事件擷取、正式計分與診斷隔離 |
| Reference farm | 正常設計的重跑分布、量測器干擾、重啟後行為 |
| Agent benchmark | 正式模型／任務／政策比較；不得假裝是 deterministic unit test |

可評估官方 GameTest 作為整合測試起點，但不能預设其結構快照捕捉了所有 entities、RNG、排程、玩家與持續農場狀態；以實測契約為準。[3]

## 8. 實作文件何時更新？

任何 placeholder 被真實程式取代時，更新此文件與 [09 現況](09-status-and-deliverables.md)，補啟動命令、版本、測試結果定位及已知限制。只寫計畫不能把命令標為可執行。

## 官方技術來源

[1] [Fabric for Minecraft 1.21.11](https://www.fabricmc.net/2025/12/05/12111.html)，2025-12-05；本輪讀取公告。

[2] [Fabric for Minecraft 26.1](https://www.fabricmc.net/2026/03/14/261.html)，2026-03-14；本輪讀取公告。跨版本不相容不能忽略。

[3] [Fabric Automated Testing](https://docs.fabricmc.net/develop/automatic-testing)，本輪頁面標示 26.2；支援 JUnit／GameTest 的事實不等於本 repo 已建置或適用所有舊版本。
