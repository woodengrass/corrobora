# Corrobora 現行計畫

文件更新：2026-10-08。文獻登記簿的廣泛檢索截止仍是 2026-10-02；本輪只補模型接入、工程契約與實驗識別，不冒稱全部文獻已重新審查。

狀態：規劃／P0。沒有可執行農場 runner、正式測試資料或實驗結果。只維護一套現行計畫，歷史由 Git 保存，不另建 archive。

## 開始路徑

讀 [研究總覽](plan/00-overview.md) → 填 [P0 農場表](experiments/p0-first-farm.md) 並登記候選 → 按 [實作路線](plan/06-roadmap.md) 建可量測環境。開始模型介面前，讀下列三份規格，不先寫 CDET。

| 文件 | 負責內容 |
| --- | --- |
| [模型—Minecraft 介面](plan/agent-world-interface.md) | 接入、初始化、空間觀察、模型自行建立結構理解、感測、時間、隔離與測試語意 |
| [工具型別與完整範例](plan/agent-tool-contracts.md) | 各工具輸入輸出、共同型別、分頁、patch、診斷 proposal、教學及啟動配置 |
| [介面與 gate 驗收](plan/agent-world-acceptance.md) | W01–W22、G01–G08 的待執行測試與阻擋條件 |

## 主計畫

| 文件 | 唯一負責的內容 |
| --- | --- |
| [00 總覽](plan/00-overview.md) | 白話目的、範圍與成果邊界 |
| [01 研究問題](plan/01-research-questions.md) | 可反駁假說、主要作用與更強模型的關係 |
| [02 系統與技術棧](plan/02-system-and-stack.md) | 部署、模組依賴、版本、執行與測試分層 |
| [03 農場規格](plan/03-farm-testbed.md) | 三種任務、完整產出、耦合、修改成本與固定驗收 |
| [04 候選方法](plan/04-experience-method.md) | 模型／程式責任、重用方案、可測前提、固定 gate 及独立排序 |
| [05 實驗協定](plan/05-evaluation-protocol.md) | B0–B4、I0–I2、固定候選池、長期、切分、成本與統計 |
| [06 實作路線](plan/06-roadmap.md) | P0、P1a–c、P2、P3a–c、P4、P5 與停止條件 |
| [07 資料與安全](plan/07-data-and-safety.md) | 來源限制、原始證據、工具沙箱及發布 |
| [08 相關工作](plan/08-related-work.md) | 既有查核層級、新穎性邊界與待比較方法 |
| [09 現況與交付](plan/09-status-and-deliverables.md) | 可確認狀態、待決事項、研究紀錄與本次修訂 |

## 工作表

- [P0 第一座農場](experiments/p0-first-farm.md)：來源、正常運行、量測與候選變體。
- [候選登記表](experiments/candidate-registry.md)：所有考慮過的候選、去留與基線表現，不挑題到方法贏。
- [P1 接入實測](experiments/p1-interface-smoke.md)：不接模型的工具驗證，以及模型讀世界到正式提交的軌跡。

介面文件負責語意，工具契約負責型別／範例，03 負責工程成功，04 負責處置，05 負責比較。修改時同步相關引用，不以「新版優先」容忍矛盾。

## 閱讀與實作紀律

提案 API、限額、測試 ID 不代表函式或通過結果。介面提供可讀資料，不提供人工故障答案；模型形成的區域／機制解釋仍是可錯假說。

CDET 不保證必要或有效。先比強模型原始歷史與普通筆記，再分清額外證據和外部規則；看不到穩定淨收益就簡化。格式或縮寫不等於新演算法。

所有範例數字標為示意／候選；正式配置由 pilot 校準且保留集開封前凍結。原始資料、授權與失敗證據不因文件整理改寫。
