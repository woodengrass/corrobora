[索引](README.md) ｜ [← 範圍界定與 MVP 定義](08-scope-and-mvp.md) ｜ （本篇是最後一篇）

---

## 17-18 Phase Roadmap

### MVP（4-6 週）

見第23節。

**風險**：Claim 抽取品質不穩定導致審核工作量過大而拖慢 pipeline 驗證節奏；緩解：先用 5.1 節 A 級資產（`dictionary/entries` + `gtmc-database`，已有審核依據）而非全量 `database.csv`。

### Phase 1（+6-8 週）：檢索強化 + Graph 展開

- 加入 Sparse（BGE-M3 sparse）+ RRF + Cross-Encoder rerank
- Multi-vector（mechanism 的 4 種 named vector）
- Agent 加入 REFORMULATE 迴圈與 Stop Condition 完整 checklist
- `farms`/`farm_components` 遷移取代 `database.json`
- Benchmark 擴充到 30-50 題，開始追蹤 Recall@5/10/20/50、MRR、nDCG

**預期成果**：Recall@10 相較 MVP dense-only 有量化提升；Agent 能處理需要多跳檢索的問題（如生電機制的第11節範例）。

**風險**：Sparse 模型（BGE-M3）中文技術詞 tokenize 效果未知，需要小規模驗證再全面採用；緩解：先在題庫子集上 A/B 比較 dense-only vs hybrid。

### Phase 2（+8-12 週）：Code Intelligence 起步 + Claim 反證機制成熟

- Tree-sitter 索引 + 有限範圍 JDT 語意解析（只針對高頻引用符號）
- SCIP symbol index，`get_callers`/`get_callees`/`compare_versions` tool 落地
- Minecraft Semantic Layer 的 deterministic 部分（RegistryEntry/Tag/LootTable 解析）
- Final Claim Verification 完整版（含 AI verifier 分流）
- RESOLVE_CONTRADICTION 狀態落地，counterevidence 搜尋成為標準流程

**預期成果**：涉及程式邏輯的問題（如「這個裝置的冷卻時間為什麼是 8gt」）能給出程式碼佐證，而非只靠文件描述。

**風險**：Java 反編譯碼庫規模可能導致索引時間/儲存成本超預期；緩解：先限定索引範圍（只索引與已核准 concept 相關的類別），不做全庫索引。

### 進階階段（Advanced，時程視 Phase 2 成果調整）

- CodeQL 完整 call graph/DFG、Minecraft AI 輔助語意標註層
- Small Domain Model：先做 Query Classification + Claim Extraction 兩個高頻低風險任務的 LoRA/SFT（見第14-15節原文任務優先序），CPT 視 SFT 效果不足再評估
- Litematic/Blueprint 解析與 Component Graph
- Dynamic Verification（Fabric+Mixin Test Runner）
- Ablation Study（第26節 A-I 全部跑齊）正式對外報告

**風險**：訓練資料（Expert Research Trajectories，第24節原文）收集成本高，需要真人專家長期參與標註，若無法穩定產出高品質軌跡資料，Small Domain Model 的訓練優先序應該降低，先靠 Strong LLM few-shot 頂住。

---

## 附：Benchmark 與 Ablation（延續原規劃內容，不重複展開）

沿用使用者原始需求第25-26節定義的指標與 Ablation 分組（A. General LLM only 到 I. Agentic+Dynamic Verification），每次 pipeline 變更都要重跑同一份題庫比較（沿用 KNOWLEDGE_SYSTEM_PLAN.md 既有「評測與維護」章節的紀律：命中證據正確性、版本正確性、引用正確性、回答完整性、幻覺情況）。

**v2 修正（題庫規模）**：15-20 題只適合當 MVP smoke test，用來確認 pipeline 沒退步；**不能拿來下「架構優於 baseline」這種強度的研究結論**——樣本數不足以支撐統計意義。正式評測要分層擴充到至少 ~120 題：

| 類別 | 目標題數 |
| --- | --- |
| definition | 20+ |
| mechanism_explanation | 20+ |
| causal | 20+ |
| design | 20+ |
| debugging | 20+ |
| version_difference / code_analysis | 20+ |

擴充節奏：MVP 15-20 題（單一 smoke test 池，不分類別）→ Phase 1 擴到 30-50 題（第17-18節既有規劃）→ Phase 2 結束前擴到六類各 20+ 題的完整分層題庫，只有這個規模的結果才適合寫進正式 Ablation Study 報告（第26節）對外呈現。

---

## 實際 Implementation Order（第一個月具體順序）

以下順序刻意把「移植既有資產」排在最前面，因為 5.1 節盤點顯示 `dictionary/entries` 與 `gtmc-database` 已經是可直接標記 approved 的資料，比從零建種子資料快得多，能讓第 6 步就有真實資料可測，不用等到第 8-9 步才有東西可查。

1. `docker-compose.yml`（PostgreSQL + Qdrant + 本地檔案系統物件儲存目錄）+ alembic migration 骨架
2. 建第一批資料表（第22節列出的第一批，含 `concepts.external_ref`/`external_ref_pending`、`knowledge_objects` 的 `AFTER INSERT` trigger），並匯入 `game_versions` 種子資料（Java 版本序列，`release_order` 手動整理一份 1.0~最新版 + 常用 snapshot 的清單）
3. `ingestion/pipelines/dictionary.py`：實作 5.1.2 節匯入偽代碼，跑通 `public/database/dictionary/entries/*.json`（979 筆）+ `zh-translations.json` 全量匯入，驗收標準：`concepts`/`concept_aliases`/`relations` 筆數與原始 JSON 條目數、`references` 邊數一致
4. Markdown parser：實作 5.1.3 節規則，跑通 `public/database/gtmc-database/` 全量匯入（215 篇，含 `404.md` 占位偵測與 license 登記），`source_revisions` 去重 + `documents`/`document_sections`/`chunks` 寫入
5. Dense embedding（BGE-M3，可沿用 [`embeddings.ts`](../src/services/embeddings.ts) 已驗證的 hf-mirror 鏡像/代理下載策略，見 5.1.6 節）+ Qdrant `concepts`/`documents` collection 建立與寫入
6. `semantic_search` tool + 最小 Gateway `/v1/ask`（先不經過 Agent，直接 retrieve→prompt→LLM，用步驟 3-4 的真實資料驗證管線通）
7. `ingestion/pipelines/machine.py`：`database.json` -> `farms`（metadata 直接 approved，`tags`->`relations` 候選標 pending），`sub_id` 保留為 `external_ref` 維持與現行分享連結相容
8. Claim extraction：先實作 5.1.4 節的規則初篩（沿用 [`learn.ts`](../src/services/learn.ts) 的 `KNOWLEDGE_SHARING_PATTERNS` 關鍵詞列表）+ 單一 prompt template，對 `database.csv` 跑一批小樣本（建議先 200 行）+ CLI 審核工具
9. Orchestrator 4 狀態骨架 + ResearchState 落地（先不做 REFORMULATE），Graph 展開直接查詢步驟 3 產出的 `relations` 資料，不需另外建種子
10. Evidence Package builder + Final Verification 的 deterministic 子集
11. 15-20 題 gold 題庫（優先取材自 `dictionary/entries` 涵蓋到的術語，因為這批資料有審核依據，答案可驗證）+ `eval_retriever.py`/`eval_answer.py`
12. 與現有 QQBot `/ask` 的 baseline 比較報告 → 決定是否進 Phase 1（含 5.1.5 節 `referencedBy` 懸空引用是否已從資料維護者取得對應表的追蹤事項）
