# 候選農場與選題登記表

[索引](../README.md) · [P0 工作表](p0-first-farm.md) · [評測協定](../plan/05-evaluation-protocol.md) · 更新：2026-10-22

狀態：尚未完成本庫正式農場登記與驗收；下列先登記一項外部既有的單機開發案例，不填成新執行結果。正式紀錄可另存 JSONL；本次不建立虛假的研究資料集。

## 0. 已知外部開發案例

| 項目 | 2026-10-22 登記內容 |
| --- | --- |
| candidate_id／範圍 | machine-dev-001；MIS 第二波追加與續跑策略，非自然生產農場 |
| 來源 | Farm commit c7c9ba4a5e62c41f38eb29f420244387e10ef59c 的 [59](https://github.com/hthOG/minecraft-farm-mcp/blob/c7c9ba4a5e62c41f38eb29f420244387e10ef59c/docs/59-mis-idle-input-diagnosis.md) 與 [62](https://github.com/hthOG/minecraft-farm-mcp/blob/c7c9ba4a5e62c41f38eb29f420244387e10ef59c/docs/62-mis-idle-strategy-comparison.md)及[63 首組結果](https://github.com/hthOG/minecraft-farm-mcp/blob/c7c9ba4a5e62c41f38eb29f420244387e10ef59c/docs/63-mis-idle-strategy-results.md)；原設計作者／資產散布權以 Farm 來源紀錄為準，本次未重新核實 |
| 任務與分類 | 受控 host 操作策略比較；不冒充 repair_restricted 結構修復、完整農場或跨案例測試 |
| 已見資料 | 登記前已見 C-v2 症狀與較早續跑成功報告；本次更新亦已見 63 的 D 組結果；本次是事後登記外部已知案例，不稱預先未見選題；沒有由此取得 CDET 比較結果 |
| 決定／理由 | 納入近期開發里程碑：已有操作問題與固定對照計畫，可完成一次診斷／改善流程；不是依 CDET 輸贏選擇 |
| 量測／恢復限制 | 依來源報告有原始重算、保存／冷還原核對；本次未獨立重跑；世界時間與實體不完全相同，首組交付 6→12 件已報告，獨立重複配對為 0；逐臂 ticket／讀前載入狀態、玩家及模擬距離的完整可比性仍 unknown，納入重測紀錄 |
| split／後續 | dev；不能再稱未見正式保留題。正式農場 family／lineage、權限、會計與模式仍需另登記與驗證 |

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
