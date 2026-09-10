[索引](README.md) ｜ [← Agent 設計](05-agent-design.md) ｜ [Evidence Workspace / Package / 最終驗證 →](07-evidence-and-verification.md)

---

## 13. Code Intelligence Pipeline

MVP/Phase 1 **不做**（見第21節），但先定義 Phase 2 目標流程避免日後結構衝突：

```text
Minecraft Source + Mappings + game_version
  -> Tree-sitter: 語法樹、基本 symbol 位置（快、多語言通用）
  -> Eclipse JDT: 語意解析、型別推斷、overload resolution
  -> SCIP: 產生標準 symbol/definition/reference index（跨工具交換格式）
  -> CodeQL: Call Graph、CFG、DFG、複雜資料流查詢
  -> 寫入 code_canonical_symbols / code_symbols / code_symbol_diffs（第3.8節）
  -> 人類定義寫 code_annotations，不寫 code_symbols
```

分工原則：Tree-sitter 做「快速、可增量」的第一遍；JDT 做「正確但貴」的語意層，只在 Tree-sitter 標記為 public API / 高引用符號時才觸發，避免對整個 codebase 做全量語意分析（Minecraft 反編譯碼庫可能數十萬行，先限定只索引已核准 concept 相關的類別）。CodeQL 查詢按需（on-demand）執行，不是每次 ingestion 都重跑全部 CodeQL query。線上調查是 Orchestrator 下的受控子迴圈（見 5.1.7 節），不是自由 agent。

> **白話說（這四個工具分別在做什麼）**：可以把分析一份原始碼想成蓋房子檢查——Tree-sitter 是「先拍照記錄哪裡有牆、哪裡有門」（語法結構，快但只看表面長相）；Eclipse JDT 是「確認這道牆真的承重、這扇門真的通到哪一間房」（語意/型別，準確但慢，所以只對重要的部分做）；SCIP 是「把檢查結果寫成一份大家都看得懂的標準格式報告」（跨工具交換格式，不是分析本身）；CodeQL 是「順著水管、電線走一遍，看某個開關按下去最終會影響哪些房間」（Call Graph/資料流，能回答「這段程式碼被誰呼叫、又呼叫了誰」這類問題，但成本最高，所以只在真的需要時才問）。

---

## 14. Minecraft-specific Code Semantic Layer

Phase 2 後期。分層原則：

| 產生方式 | 內容 |
| --- | --- |
| **Deterministic**（從 resource/data pack JSON 直接解析） | `RegistryEntry`, `ResourceLocation`, `Tag`, `LootTable`, `Recipe`——這些是結構化資料，可 100% 規則解析，不該用 AI |
| **Deterministic + Code 分析** | `REGISTERS`, `LOOKS_UP`, `BELONGS_TO_TAG`, `SCHEDULES_TICK`——從 call graph 找特定 registry API 呼叫點，規則式判斷 |
| **AI 輔助** | `Event`→`EMITS_EVENT`/`HANDLES_EVENT` 的語意標註（哪個 handler 對應哪個遊戲概念）、`Concept -> IMPLEMENTED_BY -> CodeSymbol` 的初始候選配對，因為「這段程式碼實作了哪個玩家理解的機制」需要語意判斷，之後必須人工審核才能變成 approved relation；人類描述寫 `code_annotations`，圖邊走 `relations` |

原則：**能規則解析的絕不用 AI**，AI 只負責「規則做不到的語意橋接」，且產出一律是 candidate（`code_annotations` pending + candidate relation），走 Claim 系統同一套審核流程（不另開一套審核機制）。

---

## 15. Multi-version Support / Version Alignment

- 每個可檢索實體帶 `version_scope_id`，檢索一律先 filter 再 ANN（已在第4.3節說明）。
- Code symbol 版本比對流程：
  1. 新版本 ingestion 時，對每個新 symbol 計算 `ast_hash`/`body_hash`/`signature`，並綁定 `code_version_id + mapping + game_version_id`。
  2. 用 `code_canonical_symbols` 候選比對：先比對 mapping name 相同 + fqcn 相同 → `UNCHANGED`/`LOGIC_CHANGED`（依 body_hash 是否變）；fqcn 不同但 signature 相似度高 → 候選 `RENAMED`/`MOVED`，標記人工確認；找不到對應 → `ADDED`；舊版本存在但新版本找不到 → `REMOVED`。
  3. 自動配對信心不足（相似度低於閾值）一律進 pending，由審核者在 Review Service 手動指認 `code_canonical_symbols.id`；通用定義保留在 `code_annotations(version_scope_id IS NULL)`，版本特化才另加一筆。

---

## 16. Blueprint / Litematic

**明確延後，不進 MVP/Phase 1/Phase 2**（詳見第21節理由）。Phase 3+ 再規劃：deterministic parse litematic → Block Graph → pattern-match 出 Component（Spawn Platform/Kill Chamber 等，用規則式子圖比對，不是 AI 猜）→ Farm CONTAINS Component、Component USES_MECHANISM Mechanism 兩類 relation，直接複用第3.9節既有 `relations` 表，不需新 schema。

---

## 17. Dynamic Verification（Test Runner）

**Advanced 階段**（第21節），先佔位 schema（第3.7節 experiments 已足夠），流程草案：

```text
定義 Experiment（version_scope, seed, gamerules, sim distance, entity setup）
  -> Fabric mod + Mixin 注入量測點（spawn attempts, tick time...）
  -> 執行固定 tick 數 -> Spark/async-profiler/JFR 收集效能與呼叫頻率
  -> 寫入 experiment_runs + experiment_results
  -> 建立 relations(EXPERIMENT VALIDATES CLAIM)
```

MVP 完全不做；`search_experiments`/`get_test_result` tool 先實作為「查已有人工登錄的實驗資料」，`run_test` 留空實作（回傳 not_implemented），Agent 遇到需要動態驗證的 unknown 直接誠實列在 Evidence Package 的 `unknowns`。

---

