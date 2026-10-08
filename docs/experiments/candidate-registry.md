# 候選農場與選題登記表

[索引](../README.md) · [P0 工作表](p0-first-farm.md) · [評測協定](../plan/05-evaluation-protocol.md) · 2026-10-08

狀態：尚未登記任何實測農場。本文件定義欄位與選題規則，不填假資料。正式紀錄可另存 JSONL；本次不建立虛假的研究資料集。

## 1. 何時登記

第一次把某農場／變體納入考慮時就给 candidate_id，早於觀察 CDET 成績。保存所有候選，包括容易、無法量測、來源受限與後來放棄的案例。只追加決策修訂，不覆寫曾經做過的選擇。

## 2. 每筆最少資料

| 欄位 | 意義 |
| --- | --- |
| candidate_id、revision、registered_at | 中性身分與登記時間；ID 不暴露故障 |
| source、author、rights、artifact_hash | 原設計、自建／改編與使用權限；缺失如實保留 |
| family、design_lineage、variant_parent | 分組與近重複來源；研究者私有，不進模型 bootstrap |
| declared_task_mode | repair_restricted／free_optimize／design_build |
| reference_feasibility_refs | 正常版與參考修復的實際可行紀錄 |
| measurement_quality_refs | 波動、窗口、sensor、重置與原因可辨識限制 |
| case_origin | 自然缺陷、人工故障、合法條件改變或簡單控制 |
| coupling_check_refs | 模組互動的實測證據；沒有就標未證明 |
| baseline_runs | 所有初步基線及版本，不能只留一次失敗 |
| method_results_seen | 選題決策時是否已見候選方法結果及其日期 |
| decision、reason、decision_at | 納入、保留簡單組、困難子集、工程排除、來源待確認等 |
| split_assignment、frozen_at | 開發、經驗取得、正式測試；何時凍結 |
| prior_decision_id | 保留更改選題理由的歷史 |

## 3. 兩種不同的排除

工程或來源排除：正常版不可行、無法核對量測、資產不能合法使用。須有紀錄支持，不可因模型失敗而改判工具問題。

基線容易：不是無效資料，保留在預先定義的可行候選範圍。若另建困難子集，預先公布難度篩選策略與獨立重跑，不能依候選方法輸贏選題。

困難子集可以有價值，但不得冒充所有 Minecraft 農場的代表。沒有抽樣框架時稱本候選集，不稱一般農場母體。

## 4. 探索與正式確認

探索期可換題或調整窗口，但候選、基線、淘汰理由全部留存。被研究者用來調整方法的案例屬開發資料。

正式確認前凍結候選生成／篩選、分組、方法、預算、排除與分析規則，使用未參與這些決策的新案例。反覆挑基線一次性失敗的題目會受到隨機回升影響，先獨立重跑確認難度。

對外報候選總數、來源／工程排除、容易／普通／困難數、正式納入與全部執行數。選題表不是模型輸入，也不能因清理文件而刪掉不利紀錄。
