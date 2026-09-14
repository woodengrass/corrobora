[索引](README.md) · [研究問題與 A–H](09-roadmap-and-benchmark.md)

# Longitudinal Experiment：如何驗證研究能力持續累積

## 1. 實驗不是重複問同一題

核心比較是 **Stateless Agent vs Research Memory Agent** 在一串相關但不同的研究問題上，
隨經驗增加是否减少新檢索，同时維持品質。精確重複題／paraphrase 是診斷子集，
不能用它們獨自宣稱 continual domain learning。

本文件是待執行 protocol；目前沒有數百題 stream、gold annotations 或已跑結果。

## 2. 三種評估視角

| 視角 | 方法 | 可以排除什麼誤解 |
| --- | --- | --- |
| Prequential stream | 第 t 題先用 M(t-1) 作答、評分封存，再將该次研究可保存成果更新為 M(t) | 防止把當題 gold 預先寫入記憶 |
| Fixed held-out probes | 每個 checkpoint 對同一 probe set 以唯讀 memory snapshot 作答，不寫回 | 避免後面題目比較簡單而出現假的學習曲線 |
| Controlled update challenge | 指定時間引入文件／code／上游 Finding 修訂，檢查受影響與不受影響案例 | 測 stale errors、歷史版本保留與維護成本 |

三者一起看，才有機會區分「題目順序變化」與「研究資產真的有用」。

## 3. Corpus 與題目組織

初始 corpus 為現有詞典、GTMC、可授權讀取的 legacy／machine metadata 與本機 source。
先選一個可標註子題域做 15–20 題 pilot，接著擴成例如 6–10 個 topic families、
100–500 個 stream steps；最終規模由 pilot effect size／variance／budget 決定。
目前 23 篇 GTMC 不能支持「數千篇 private corpus」的實證；需新增真实授權 corpus。
可加同領域 distractors 測 scale，但不能靠複製同文膨脹篇數。

每個 family 包括：

- 初次機制研究。
- 新 wording 且改必要條件的相關題。
- 跨來源／跨 topic 重用題。
- 只部分可覆蓋的設計／互動題。
- 明確新知識／corpus 無資料題。
- 版本／環境不相容與矛盾題。
- 需要實驗但只有 static code 的題。

用 concept／mechanism lineage 分割 dev、stream 與 held-out probes，
近重複與同來源轉載放同 split family。Probe 可共享研究原理，但不能只是 stream 答案改措辭。
保留題目原始版本；既有 approved machine 題屬舊目錄回歸，重新標註後才可算研究 gold。

## 4. Benchmark 資料契約草案

未來 `benchmark/` 增加 versioned manifests／streams／rubrics／run reports；本輪只規劃，
不生成貌似已審核的 gold。

| 資料 | 必要欄位 |
| --- | --- |
| Corpus manifest | `snapshot_id, source_revision_keys, code_snapshot_hashes, permissions_profile, capture_cutoff, content_hashes` |
| Question | `question_id, family_id, split, task_type, question, target_scope, required_needs, gold_evidence_sets, scoring_rubric, review_status` |
| Stream step | `stream_id, step, question_id, available_corpus_snapshot, update_event_ids` |
| Update event | `event_id, available_from_step, change_kind, old_ref, new_ref, expected_affected_validations, unaffected_controls` |
| Run | `run_id, arm, stream_order, seed, agent_model_version, prompts_hash, tool_contracts, git_sha, data_hash, index_contract, budget, reviewer_policy` |
| Result | `session_id, answer, citations, coverage, read/usage events, memory_before, memory_after, maintenance_usage, score, failure_reason` |

gold_evidence_sets 支援多个等價來源組合；不把單一標準 URL 當唯一正確路徑。
每組列出必要的多跳 evidence／constraints，而非只要求出現幾個 keywords。
Code gold 用 snapshot + path + signature/range/hash；未取得另一版 source，不能憑同名 symbol
補出跨版本 gold。Synthetic fixtures 標明 synthetic，不與真實 Minecraft updates 混合。

## 5. 每一步的嚴格時間界線

```text
載入該步允許的 corpus C(t) 與歷史 memory M(t-1)
    → 回答 Q(t)，記錄研究軌跡與尚未寫入的 candidate
    → 封存 answer / citations / foreground usage
    → evaluator 評分（Agent 看不到 gold／feedback）
    → 依該組 policy admission / consolidation / review
    → 索引更新，封存 M(t) 與 maintenance cost
    → 下一步
```

corpus 真實新 revision 只能在指定時間進入各組；不得提前把 future docs 放進 sparse vocabulary、
Finding typical questions 或摘要。Evaluation feedback 不寫入 memory；若要研究帶回饋學習，
另設 feedback-on 組與相同監督预算。
人工 reviewer 可以讀已允許 sources，但不能看未來题／probe gold；人審結論有成本與延遲，
不能當免費 oracle。固定 reviewer policy／每步時間配額，另比較 provisional-only 與
有固定 review 配額的設定，避免將「人審更多」歸因為 memory。

每組 memory 完全隔離，不能先用 H 跑完整 stream 建庫，再拿它當 D 的起點。
可做 **frozen snapshot matched ablation** 作局部模組比較，但要與各組自行成長的主實驗分開。

## 6. 調度、缓存與成本公平

主比較 C–H 使用相同 source tools、code navigation、permissions、Agent model、context budget、
API budgets 與 retry policy。只有指定 memory feature 改變。
Stateless 每題清空對話與跨題筆記；OS／embedding／provider cache 的 cold/warm 設定各組相同，
cached tokens 分列，不把 provider prompt caching 歸功於 Research Memory。

MVP 先使用 deterministic step barrier：下一題開始前，該步允許的 maintenance 完成或
超過配額；只使用當時已發布 memory。另做 realistic asynchronous run，測 queue lag 與
time-to-availability；兩者不混用作 latency 比較。

每題同時記：

- foreground tool／retrieval／read／LLM／verification latency 與 tokens。
- background admission、consolidation、embedding、invalidation、revalidation API／compute。
- reviewer minutes、等待時間、job failures／retries。
- raw unique／repeated reads、returned bytes、實際送入模型 tokens；未開啟的候選不算 read。

Report cumulative total cost 与 marginal query cost；提供 break-even point 與 storage/index growth。
不能只展示第 500 題便宜，卻省略前 499 題寫記憶的代價。

## 7. 更新測試矩陣

| 更新 | 預期觀察 |
| --- | --- |
| 相關段落修正 | 直接 Finding 與 required downstream 都進重驗，不只直接引用 |
| 文檔僅換行／BOM | raw hash 可能不同，normalized hash 相同；不誤稱語意變更 |
| 無關段落／file 改動 | 精細依賴不全庫失效，量測保守粒度的額外成本 |
| method body 修改 | 命中依賴，Agent 比較變動 path |
| method body 未變、callee／tag 改動 | 暴露 dependency completeness 問題 |
| mapping／decompiler 更新 | 不誤將 rename 當已證實 semantic change |
| 新遊戲版本 | 新 scope 未驗證，舊版 validation 仍可用 |
| 上游 Finding 被反證或修訂 | 傳播與新引用之間不漏檢 generation |
| duplicate／亂序 change event、worker crash | idempotency、最終收斂、讀取不誤用過期狀態 |
| parser 更新／source 消失但快照存在 | 歷史引用仍可還原，不以可用性代替真偽 |

每次更新由專家標出 affected 與 unaffected control sets；
預期「內容改了」與「結論真的失效」分開標註。
Invalidation 命中率、過度失效率、重新研究之後的 stale error 各自計算。

額外對照可用 no invalidation、TTL-only、source/file-level、dependency-aware、
oracle affected-set（只作診斷上限，不能當部署能力）。
no-invalidation 組仍保留明確 version filters，所以若新版本本來就無適用 memory，
不能聲稱其錯誤下降是 dependency 模組功勞；同 scope 來源修訂才可隔離此項效應。

## 8. 曲線與統計

Checkpoint 可設第 1／50／100／500 題，實際 stream 未達該長度就不報該點。
每個窗口繪 raw reads、tool calls、tokens、cost、latency、accuracy／完整度、
cross-topic reuse、duplicate／stale error，另給累計與 fixed-probe 表現。

先用 pilot 估計 variance，預先約定 accuracy non-inferiority margin（例如 3 個百分點只是
待專家確認的設計起點），再規劃樣本與 power。成本下降必须在品質非劣性成立下解释。
如果品質 CI 太寬，結論是證據不足，不是「沒有顯著差異所以等同一樣準」。

至少多種 topic order／隨機 seed 重跑，建議起步 3 種順序，最終依 budget／variance 定案。
同 family、同 memory history 有依賴，不能把所有题當 iid；
以 family／stream replicate 的 paired block bootstrap 或適當階層模型估 CI。
主分析先鎖 C vs E/F 與 invalidation matched ablation，其餘探索性比較標明，避免大量比較挑好結果。

Expert rating 使用盲評（隱藏 arm）與固定 rubric；抽樣雙評、記一致性與裁決。
LLM judge 只作輔助，需與人工校準，不让生成模型無監督自評成績。
拒答、partial、timeout 全部留在 denominator，必要時另報 coverage-adjusted accuracy，
防止系統只回答最簡單的部分來維持表面 accuracy。

## 9. 模型接棒實驗

在固定 checkpoint 封存 PG memory、來源與模型無關 public IDs：

1. 旧模型建立 memory；新模型讀同一 memory，不改參數、不預先重研究。
2. 比較新模型 stateless、新模型＋舊 memory、新模型＋自己可用的同预算 memory。
3. 固定 retrieval contract 作主要比較；encoder 更換需重建索引時，另計其成本。
4. 檢查舊 memory 是否造成 anchoring／版本錯誤，與可節省的研究量一起報。
5. 加測 memory-scaling 效應：小模型＋舊 memory 對更大模型 stateless，同 budget 下比較。
   ReMe 在 BFCL-V3＋AppWorld 實測 Qwen3-8B＋記憶 55.03% 勝過無記憶 Qwen3-14B 54.65%，
   本實驗以此為對照基準；若在 Minecraft 領域復現，即效率護城河的直接證據。
   注意論文限制：其 retrieval 每題只取一次、驗證主要靠 LLM-as-judge；本計畫的
   gap-only 多輪與人工 review 若做出更大差距，需確認增益來源，不可直接歸因於記憶。

這測的是可轉移研究資產，而非保證任何未來模型必然受益。
模型越強若收益變小也是有價值的結果，應分析是否 corpus 搜尋／revision 管理仍提供穩定價值。

## 10. 可主張到哪裡

只有在新題／held-out probes 顯示可重用累積、品質維持、總成本合理且更新後不持續誤用
stale findings 時，才可主張在本 corpus／問題分布內出現 **non-parametric continual domain learning**。
這是外部記憶改善 Agent 系統的任務表現，不是模型參數學會 Minecraft，也不是跨領域普遍證明。

若只有相同問句更快，結論限於 cache-like reuse；若省成本但漏答，屬 coverage failure；
若無效化太保守，需報 revalidation 開銷；若 corpus 太小，應把結果定位為 pilot。
