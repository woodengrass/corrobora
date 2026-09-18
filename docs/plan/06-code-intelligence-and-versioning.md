[索引](README.md) · [← Agent](05-agent-design.md) · [Provenance →](07-evidence-and-verification.md)

# Lightweight Code Navigation、版本與 Blueprint

## 1. 實際起點

本工作區有 `raw-data/minecraft source code/`，被 `.gitignore` 排除；不是 Git tracked corpus。
其 README 標示 Minecraft **1.21.11**、mapping **parchment 2025.12.20**、
Vineflower **1.13.0-a712f4c930**。Gradle 設定 Java 21；實測 6,624 個 `.java`，
約 31.8 MB Java bytes。這是原始資料資產，不是 corrobora 已有 code intelligence service。

目前只確認這一版本的 source snapshot。未執行 Gradle build，也未確認其與原始 JAR 的
完整對應；來源 README 的版本聲明、mapping manifest、decompiler、實際 file/tree hashes
要在匯入時各自記錄。其 `DO NOT REDISTRIBUTE` 標記延續為本機研究來源的 export policy。

## 2. Code Graph 告訴 Agent 去哪裡找

```text
Minecraft Repository / Snapshot
  → 檔案清單、repo lexical search、基本 symbol index
  → 可可靠取得的 Lightweight Edges
  → Strong Agent 直接讀 source / 比較 code paths
  → 高價值時保存 Finding + precise code refs
```

先提供 repo search、read_file、固定 snapshot 的 line/hash reference；Tree-sitter 可作
class/method/field/file、definition 与 syntactic references 的輕量 index。
不必等 JDT／SCIP 完成才能開放原始碼研究，也不把整份 repo 逐 symbol 先寫 AI 摘要。

| 能力 | baseline 邊界 |
| --- | --- |
| class/method/field/file、位置與 signature | deterministic parser，可從小範圍驗證後擴至全 repo |
| definition/reference | 保留解析方式、來源位置與 unresolved targets |
| CALLS、READS、WRITES | 能可靠解析才標 resolved；Tree-sitter 不能保證 overload／virtual dispatch 全解析 |
| EXTENDS、IMPLEMENTS、OVERRIDES | 語法可見與型別解析確認分開；OVERRIDES 不凭同名猜 |
| canonical symbol identity | 限 repository／mapping lineage，rename 候選需可信 mapping 或 review |
| concept ↔ symbol bridge | 少量高價值、按需建立，附 Finding 支持 |

Graph missing edge 不是「不存在呼叫」的證明。Agent 應能繼續讀實際實作；
symbol 與 edge 索引的 completeness／resolution 記為工具回傳 metadata。

## 3. 技術選項與加入條件

| 技術 | 建議處置 | 重新評估條件 |
| --- | --- | --- |
| repo search＋read_file | 立即作 baseline | 大 repo 測 tool/token 成本 |
| Tree-sitter | 保留輕量導航 | 對比 pure repo search 的定位時間／引用正確率 |
| Eclipse JDT | optional、局部按需 | overload/type resolution 錯誤實際造成 benchmark 失敗 |
| SCIP | optional | 真正需要與其他工具交換／重用 symbol index |
| CodeQL | optional、benchmark-gated | 強 Agent＋repo search＋輕圖在 data/control-flow 題型仍不穩定 |
| 全量 CFG／DFG | 延後 | 按需分析已有明顯效益，且建置成本可攤銷 |
| MC semantic extraction | 簡化 | 少量 registry/tag/resource 導航可規則解析；不做全世界語意圖 |

任何進階工具都與相同 Agent、相同 corpus、相同 budget 的 baseline 比較，計入建索引時間／
儲存與維護成本。不要把 Tree-sitter→JDT→SCIP→CodeQL 寫成必走流水線。

## 4. Code provenance 與失效

Code Finding 至少可沿來源鏈解出：repository、snapshot／commit、game version、mapping name＋
version、file path、symbol signature、line range、file/body hash、hash algorithm version。
本機未有 repo commit 時使用 snapshot tree hash，不能填假 commit。

同名方法跨 version／mapping／overload 不共用 locator。body hash 變更表示需要重查，
不代表行為必然變；body hash 未變也不代表所有前提不變，caller、callee、field initializer、
tag/resource／設定可能改變。Agent 保存研究結果時應列關鍵依賴；不確定的范围用 file 或
repo snapshot 粒度，承認較高 false invalidation 成本，透過 benchmark 再縮細。

新 Minecraft 版本入庫後，先建立未知／待驗證的 target scope，不把舊版已成立的 validation
直接改 stale。對同版本 authoritative source 的修正，才依被改內容及 dependency policy
影響原 validation。詳細傳播見[記憶生命週期](11-research-memory-lifecycle.md)。

### 可先做的研究案例

現有 GTMC `MicroTiming/04-方块实体.md`、legacy 漏斗筆記與本機
`HopperBlockEntity` 已可構成跨來源研究樣本。實際 source 的 `pushItemsTick`、`tryMoveItems`、
`tryMoveInItem` 展示不同方法與條件；只保存一個 `8` literal 不能回答
「哪個漏斗、哪條 code path、何時出現 7／8gt」。
這類整理值得成為具条件的 Finding；類名或一行常數則直接 repo search 即可。
文件 code snippet 若未有明確 snapshot，仍屬 document evidence，不冒充 version-pinned source。

## 5. Blueprint：人類做過什麼

Blueprint database 與 mechanism research 平行演進，定位為 catalog／extension 支線，不阻擋 Documents／Memory。

1. **Catalog**：先遷移 81 筆 machines，保存 name、author、description、tags、sub_id、
   filename、preview、原始排序與來源 revision。目錄存在不代表檔案已取得。
2. **Asset**：取得 `.litematic`／schematic／world archive 時保存 bytes/hash／format／availability；
   同 machine 可有多種版本與 module。不可假定現在已有 4,000 個藍圖。
3. **Association**：找到某 mechanism 的人類使用案例、可替代機器與可重用 module；
   tags→concept 關係是待確認的 interpretation，不把名字中「全速」當量測保證。
4. **Extension 支線**：結構理解、效率驗證、動態測試皆屬獨立 extension，不屬 Documents／Memory 核心閉環；本文件不新增結構特徵、3D 編碼、功能模擬或相關模型內容。

現有機器 metadata 中 name、tags、description 可能給出不同適用版號，必須保留矛盾，
不能採第一個字串就標整機 verified。source_removed_at 延續「來源消失不等於審核否定」的設計。

## 6. 實驗與小模型

初版可人工登記 experiment/run、環境、raw log、量測與樣本數，讓 Finding 引用具體實驗。
Fabric/Mixin 自動 Test Runner 是獨立 extension；無實測時，Agent 可提出設計與測試方法，
不能宣稱已測得產量或 MSPT。

主線為 Strong Online Agent＋infrastructure。只有高頻、規律且費用高的任務才考慮
distillation：reranker、terminology linker、finding extractor、consolidation／coverage classifier、
next retrieval action。先做 Strong LLM few-shot，取得可靠標註與成本資料，再評估 SFT/LoRA；
retrieval/reranker fine-tuning 按對應瓶頸選擇，CPT 最後才考慮。
不用 Minecraft expert generation model 當架構前提；SGLang／多 serving backends 同樣 optional。
