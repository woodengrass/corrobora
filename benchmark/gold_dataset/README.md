# 既有評測資產與新 Research Memory Benchmark

本目錄來源為 OpenST-QQBot 的既有 eval 資產，JSON 保留其原始契約與審核狀態。
它們是新評估的起點，**不是已完成的 Research Memory gold 或可執行 benchmark**。
新研究設計見[Roadmap／RQ1–RQ6](../../docs/plan/09-roadmap-and-benchmark.md)與
[Longitudinal Protocol](../../docs/plan/12-longitudinal-experiment.md)。

## questions.json

33 題、9 類：term_definition 4、alias_search 4、version_constraint 4、
multi_evidence_reasoning 4、machine_recommendation 4、conflict_handling 4、refusal 6、
troubleshooting 2、performance 1。

只有 4 題 machine recommendation 標 `approved`，其他 29 題仍為 `draft`。
**全部 expected_source_ids 為空**，不能直接計算 evidence recall，也不能把題目中的
expected properties 當已查證的 Minecraft 結論。

舊欄位包括 question／edition／version／environment／expected_terms／
expected_answer_properties／expected_uncertainty。新題庫需增 family/split、
必要 information needs、gold evidence sets、精確來源 revision／code snapshot、rubric、
reviewer／annotation version。`serverImplementation` 等 legacy naming 在 adapter 轉 snake_case，
不直接修改來源 fixture 假裝原契約一直如此。

## baseline-machines.json

9 組固定 query 的 top-5 sub_id 與 normalized machine database hash，保護舊 keyword 推薦的
排序／資料來源遷移。baseline 有空結果是舊行為，不代表理想 retrieval quality。
目前內容 hash 已核對相同；本 repo 缺少其 import 的 `src/services/data.ts`、package.json
與 runner，**尚未重播推薦演算法**，不能在這裡執行 legacy `npm run eval:machines`。

未來做 catalog migration 時先復原舊演算法或建立明示的新 baseline，保留原始順序。
語意搜尋品質提升另做 relevance gold，不把固定 top-5 當永久最佳推薦。

## triage-fixtures/

| 項目 | 實際內容 |
| --- | --- |
| `document-expected.json` | 14 個來源／parser／quality／materialize 案例 |
| `duplicate-provenance.json` | 2 組 exact duplicate canonical 關係 |
| `samples/` | synthetic HTML／社群 note／learn submission 與圖片 |
| `ai-responses/` | 7 document-triage＋1 document-quality＋1 conflict-review，人工撰寫的契約 seeds |

14 個案例的 normalized content hashes 已與目前對應檔案核對。
這是 fixture 完整性檢查，沒有執行 parser／AI 或通過整個 ingestion runner。

重播時做明確根目錄映射：

| 舊根 | 本 repo |
| --- | --- |
| `public/database/raw/` | `raw-data/` |
| `eval/fixtures/triage/samples/` | `benchmark/gold_dataset/triage-fixtures/samples/` |
| `public/database/database.json` | `raw-data/machines/database.json` |

document_triage／quality 的 `rawAssetId=0` 要先驗證佔位再映射實際 ID。
conflict_review 的 evidenceRawIds 是 `[input, ...compared_with]` 的索引，逐來源映射。
模型欄位是舊種子標籤，並非本次實際呼叫的模型；prompt_version 也是 legacy 佔位。

新 Documents pipeline 不再以 AI Claim materialize 決定 raw 是否可讀，因此新 expected layer
要分 raw preservation、section readability、index eligibility、quality、access、provenance，
對 navigation／短段／矛盾內容的行為變更詳見[ingestion](../../docs/plan/03-ingestion-and-claims.md)。
保留舊 fixtures，不覆寫 approved seed 冒充新的 verified 結果。

## 待建立的評測

- Memory admission、錯誤／等價 merge、version scope、permission、间接 dependency、
  crash／亂序 events／索引延遲的 correctness fixtures。
- 15–20 題 pilot stream，raw agent vs Findings vs gap-only。
- 相關新題＋held-out probes＋更新事件的數百步實驗；每組隔離 memory，gold 不回流。
- 表現曲線同時报告 accuracy／完整度、sources、false-covered、stale errors、
  reads／tool calls／tokens／latency 與完整 maintenance／review 成本。

JSON 契約與資料版本先定，再實作 runner；未有結果前不宣稱研究假說成立。
