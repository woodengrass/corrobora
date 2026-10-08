# 02｜系統架構與技術棧

[索引](../README.md) · [模型—世界介面](agent-world-interface.md) · [工具契約](agent-tool-contracts.md) · [農場與計分](03-farm-testbed.md) · 更新：2026-10-08

全部為待實作提案。本次沒有建立 Python package、Java mod、可執行啟動命令或通過遊戲測試的環境。工具語意以 agent-world-interface 為準，欄位與呼叫範例統一在 agent-tool-contracts，不在各文件維護第二套 schema。

## 1. 最小技術選擇

| 工作 | 第一版提案 | 邊界 |
| --- | --- | --- |
| 控制、Agent 介面與分析 | Python 3.12 起步、uv／lockfile | 先驗相容性；實際 pyproject 才是命令依據 |
| 邊界契約 | Pydantic、JSON Schema | 拒絕未知欄位、限制範圍；格式通過不代表事實正確 |
| 世界操作 | 版本固定的 Java/Fabric server adapter | 世界存取在伺服器執行緒；有界控制佇列與任務回覆 |
| 傳輸 | loopback JSON-RPC 2.0 | 模型只接 Python 工具入口；adapter 不公開 |
| 外部 Agent 接入 | 按需加入 MCP adapter | 與 function calling 共用同一服務與權限 |
| 原始證據 | append-only 檔案／JSONL、雜湊與來源身分 | runner 唯一寫入，模型只讀允許範圍 |
| 中繼資料 | SQLite＋欄位／全文搜尋 | 不先上 PostgreSQL、Qdrant、Neo4j |
| 測試 | pytest／Ruff／Pyright；Gradle、JUnit／GameTest | 真實配置建立後才宣告可用；研究數據不是單元測試 |
| 觀察呈現 | 結構化查詢＋程式化切片 | 視覺另配 renderer/client，不預設 server 能出圖 |

FastAPI、分散式 queue、Web UI、多 Agent、領域模型訓練及完整語料匯入都不是 P0–P2 前置。

## 2. 版本與可用能力

保留 Java Edition 1.21.11／Java 21／Fabric 作相容性候選，不宣稱最新或已部署。P0 需實際鎖 game/server、JDK、loader、Fabric API、Gradle、mappings 與 mod hashes。

Fabric 文件可能描述較新的遊戲版本；首版對照所選版本文件及真實 build，不把新範例當舊版 API。官方 1.21.11 公告與該版自動測試文件列於文末。若候選不合適，記錄理由及替代版本，重新驗證正常農場和計分。

能力清單由實際 adapter 報告，逐項列 unsupported／未啟用／已校準。不得列出不存在的物品轉移、消失原因或 render 工具。量測缺口回 unknown，不用模型猜測補原始資料。

## 3. 邏輯架構與模組

```text
Model/provider
    -> fixed harness + tool schemas
    -> Python runner / policy / budget / recorder
    -> authenticated local adapter client
    -> Java server control queue
    -> Minecraft world + trusted observations

frozen design -> separately authorized evaluator -> sealed results
```

擬定目錄，現在尚不存在：

```text
src/corrobora/
  contracts/      公開任務、工具、觀察與結果型別
  runner/         episode、預算、調度、重試與封存
  environment/    Minecraft adapter client
  agents/         provider、harness、各實驗組政策
  experience/     原始歷史、摘要、CDET 候選
  analysis/       成本、配對比較、圖表與失敗分析
server-mod/       Java 世界操作與原始事件擷取
trusted-eval/     隔離的驗收入口及私有測試配置
```

contracts 不呼叫模型；experience 不直寫世界；analysis 只讀封存结果。不用全域 singleton 共用不同實驗的狀態。

trusted-eval 不只是命名：模型沙箱不可掛載私有資料、存取同 UID 的敏感程序或連到管理端。初版可用不同 OS 使用者／容器與最小網路端點實作，實際隔離需測試。loopback 本身不等於完整驗證，還需短期 episode capability、来源驗證和檔案／網路權限。

## 4. 一次任務如何運行

`created -> initialized -> running -> submitted -> evaluating -> sealed`。失敗、取消、預算耗盡也封存，不默默建立另一次重試取代原結果。

runner 生成 bootstrap：公開需求、版本、工具 manual、限額、載入與觀察配置、基礎概要。模型先探索結構，自建可修訂的區域解釋，再提交測試或 patch；觀察不含人工標好的模組圖。

同一 world 的操作序列化；讀取可從 immutable capture 分頁。request_id、idempotency key、world_id、state_token、design_revision 和實際 tick 分開管理。長任務回 job_id；主執行緒不等待模型、阻塞 HTTP 或等待自己執行的 job。

模型等待時採 step_controlled 模式。不能因 API 較慢而讓某組農場多運作；玩家、載入和停止語意通過 W05–W07 才放行。無法保證時不可混入 real-time 結果。

## 5. 修改與取消不是資料庫交易

patch 是有序操作，可能觸發即時鄰居更新和物品生成。先驗參數與權限再執行，保留部分成功、前後狀態與副作用。回覆遺失先查 job，不重複執行；取消只停止未開始動作，不宣稱已還原。

冷重置先停服再从乾淨副本重建；不在世界仍寫入時直接複製並宣稱一致快照。快照包含與未捕捉的狀態如實登記；完整 RNG／排程回滾不是首版承諾。

## 6. 模型設定與經驗政策

記 provider、model id、可用 snapshot、API 日期、sampling／推理設定、prompt/manual/schema hashes、context／compaction、重試規則。不能固定 snapshot 時交錯跑各組並報限制，不假定同名模型永遠相同。

模型負責方案生成；04 的固定 gate 只讀凍結方案與 validator 證據。政策變更是宣告的研究處置，不能同時讓處置組多拿感測或工具。

原始證據、經驗 revision 與當題工作狀態分開。hash 表内容身分，不代表結論／來源可靠。慢模型呼叫不持有資料庫交易；任意自改 harness、安裝上游依賴不在首版。

## 7. 驗收與維護

[驗收清單](agent-world-acceptance.md) 列 W01–W22 和 G01–G08；[P1 工作表](../experiments/p1-interface-smoke.md) 記實際命令、配置、結果與限制。

先驗 validator／budget／會計，再做 server 契約／整合、正常農場重跑，最後模型操作與研究。watchdog 記心跳、最後事件、退出碼與累計預算；無輸出不直接等於死鎖。工具失敗、模型誤用、任務無解分開。

每個元件實作後更新 [09](09-status-and-deliverables.md)，補真實命令與證據，不把提案名稱當已通過測試。

## 官方技術依據

- [Fabric 1.21.11 公告](https://www.fabricmc.net/2025/12/05/12111.html)：候選版本相容性起點。
- [Fabric 1.21.11 自動測試](https://docs.fabricmc.net/1.21.11/develop/automatic-testing)：版本特定的 JUnit／GameTest 參考。
- [介面文件的官方來源](agent-world-interface.md)：MCP、events、tick 語意及查核範圍。本輪補規格不等於實際 build，也不更新全部研究文獻的檢索日期。
