# Corrobora

**研究 AI 能否把前一座完整生電農場的診斷與實驗經驗，適当地用在下一座農場：什麼時候會進步，什麼時候反而被舊經驗誤導？**

Minecraft 是可執行、可干預的工程實驗平台。長期目標包含理解需求、設計、建造、量測與自我迭代；第一個研究先從完整農場的診斷與改良開始，再獨立驗證從需求自主設計。

**目前狀態：規劃／P0。沒有可執行的 Corrobora runtime、農場 runner、正式 farm dataset 或實驗結果。** 文件中的 API、目錄、方法與測試都是待實作，不代表已完成。

## 直接開始

先讀 [現行計畫索引](docs/README.md) 與 [研究總覽](docs/plan/00-overview.md)，再填 [第一座農場實驗工作表](docs/experiments/p0-first-farm.md)。第一個目標是人工跑通一座完整農場，記清配置、合法輸入、正式輸出與量測波動；不先建記憶資料庫。

[實作路線](docs/plan/06-roadmap.md)：P0 定義農場與量測 → P1 建可靠測試環境 → P2 強基線 → P3 必要的最小方法 → P4 正式跨農場實驗 → P5 從需求設計。

## 研究內容

在相同模型、工具、原始歷史與預算下，比較無歷史、可搜尋完整紀錄、普通筆記、固定診斷流程與候選方法。

候選方法 CDET 的工作方式是：重用過去測試前先確認前提；有多個可能原因時，選能區分原因且成本合理的實驗；依新證據修正局部設計與經驗，再由獨立評分器驗收。**這是待驗證提案，不是已證實有效或原創的演算法。**

主要結果是固定預算成功率、達標成本、錯誤重用和修正後的回歸。只報幾座成功農場、記憶命中率或模型自己說理解了，都不足以支持研究結論。詳見 [研究問題](docs/plan/01-research-questions.md) 與 [實驗協定](docs/plan/05-evaluation-protocol.md)。

## 技術與邊界

第一版提案是 Python 控制與分析、固定版本的 Minecraft Java／Fabric adapter、受限工具、JSONL 原始紀錄與 SQLite 中繼資料。先驗證相容性，不預設最新版範例適用舊版本。PostgreSQL、Qdrant、完整知識圖譜、多 Agent 和模型訓練都不是前置需求。

Agent 可改農場與提出測試，不能改評分器、注入成品造分或讀保留答案。原始證據、推導經驗與當題工作狀態分開。詳見 [系統與技術棧](docs/plan/02-system-and-stack.md)、[農場環境](docs/plan/03-farm-testbed.md) 與 [資料安全](docs/plan/07-data-and-safety.md)。

## 文件與資料

```text
AGENTS.md                    協作規則與真實進度邊界
README.md                    專案入口
docs/
  README.md                  唯一現行計畫索引
  plan/00-09                 研究、方法、工程、評測與最新文獻
  experiments/p0-first-farm.md  第一個實驗工作表
raw-data/                    既有來源素材，非已驗證機制或農場資料集
benchmark/gold_dataset/       既有問答／匯入 fixture，非本研究 farm benchmark
```

舊規劃與不再採用的實作參考已從工作樹移除，不另保留 archive；歷史可由 Git 查閱。原始資料與 fixture bytes 保留，不代表來源已允許外部模型使用或公開再散布，先查 [來源限制](docs/plan/07-data-and-safety.md)。

[相關工作](docs/plan/08-related-work.md) 檢索截止 2026-10-02，明列全文、摘要與索引摘要的查核程度。已有方法包含條件式重用、讀取時整理、信念修正與工程迭代；本專案不預先宣稱全球第一、模型永遠需要特殊架構、已實現 RSI 或保證科展成果。

目前沒有安裝／啟動命令可執行；實作後以真正的專案設定、測試與 [現況文件](docs/plan/09-status-and-deliverables.md) 更新，不把規劃寫成完成。
