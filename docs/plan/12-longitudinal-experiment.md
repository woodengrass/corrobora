[索引](README.md) · [研究問題與基線](09-roadmap-and-benchmark.md) · [測試環境](15-farm-testbed.md)

# 長期與跨農場實驗協定

> 2026-10-01，待執行。沒有正式 farm dataset、agent runs 或既有學習曲線。所有正式門檻與樣本規模在 pilot 後、held-out 開封前鎖定。

## 1. 區分兩個實驗

### E1：同一歷史的受控使用方式比較

先取得不含測試答案的 acquisition history，固定為各 arm 都能讀取的原始設計、操作與實驗證據。B1 直接用 raw，B2 做普通筆記，B3 用固定程序，B4 建 CDET 經驗。建立表示法與測量工具的成本全部計入。

對相同測試農場、相同模型與初始條件做配對，主要隔離經驗表示／使用方式的效果。歷史來自人工、共同 behavior policy 或多來源時要明說；不能稱其為方法完全自主累積的成果。可用多種 acquisition histories 檢查單一提供者偏差。

### E2：各組自行累積的端到端 stream

各 arm 從相同初始資產起跑，依各自經驗與觀察完成一串任務，維護自己的記憶／工具。主動實驗不同會產生不同的後續資料，這是端到端系統效果的一部分，不能再把全部差異歸因於單一記憶格式。

各组不能互相讀歷史；也不能用 B4 完整跑出的庫當其他組起點，除非明確標為 E1 的凍結歷史實驗。

## 2. 任務切分與防近重複

- 依設計 lineage、機制組合、來源 blueprint 與操作條件分組，轉載／平移／鏡射／小幅縮放近重複留在同一 split。
- 至少有 dev、experience acquisition、held-out evaluation 三個角色；哪些共享原理、哪些留出組合要在 manifest 說清楚。
- 留出同家族新條件、未見模組組合與跨 family 轉移分層報告，不能以第一種冒充第三種。
- 預訓練可能已包含 Minecraft 藍圖；無法聲稱 zero prior knowledge。自建變體、凍結來源與 Fresh baseline 只能降低／量測此風險，不證明完全排除。
- 人造故障與真實設計問題分層。fault labels、oracle module graph、最佳修復不放 Agent 可讀檔案。

## 3. 每個 episode 的時間界線

```text
load allowed task and experience snapshot M(t-1)
observe -> commit hypotheses/predictions -> run experiments
patch -> validate using public development feedback
freeze final design and task trace
independent evaluator scores unseen conditions
seal scores; do not return hidden labels or grading traces to Agent
update M(t) only from permitted observations and public feedback
finish bounded maintenance; start the next episode
```

端到端工程迭代需要合法回饋，因此不是完全禁止所有得分回饋；要分清 public development feedback 與 final held-out scores，並在所有 arm 固定頻率／內容。

每步維護完成或耗盡配額後才開始下一步，記 memory snapshot 與 backlog。不把昂貴整理藏進「背景免費工作」。若之後測非同步模式，要另列成本與當時實際可讀的狀態。

## 4. Checkpoints 與 probes

在預先固定的經驗量 checkpoint，凍結經驗，於同一組未見 probe 初始快照評測。每次 probe 的 task-local 建造、診斷與修改仍可運行，但它的經驗不得寫回 acquisition stream。

Probe 的答案、結果、錯誤分析不能被 Agent 或調整方法的研究者用來更新正式演算法。用來開發的方法選擇應有獨立 dev probes；正式 repeated probes 在凍結方法後一次性分析。否則即使不寫回 memory，研究者也可能間接對 test 調參。

跑修復任務與從零設計任務時使用不同標籤／評分。不能把每次 probe 的表現上升直接稱 learning-to-learn；需排除預算、模型、工具與難度變化。

## 5. 預算與資訊公平

B1–B4 有同一原始來源／歷史的存取權、相同 context 上限、工具精度、行動範圍及 model snapshot。baseline 可搜尋、分段閱讀、寫當題腳本、自由反思；不因全歷史放不下一次 prompt 就截掉後半。

方法要求的不同 prompts／controllers 需記 hash 與改動；不要同時改 provider、觀察工具、網路權限或試驗次數，然後歸因於 memory。

公平同時報兩個視角：

- 硬總 budget 下的端到端成績，包括筆記整理與適用性測試。
- 相同當題執行 budget 下的成績，另完整列出經驗建置／維護成本，避免隱藏先期投入。

物理試驗次數、simulated ticks、模型 tokens、牆鐘與費用分開。供應商快取讀取另列；不能把 caching 省錢全歸功於方法。人工定檢查表、整理標註與協助次數單獨記錄，不当作零成本 oracle。

## 6. 隨機性、失敗與統計單位

配對初始快照／seed／需求，對不同 stream orders 與獨立 runs 重跑。動作不同會導致之後亂數與世界軌跡不同，不宣稱 perfect common randomness。

同一農場的小變體、同一 stream 中共享記憶的任務不是獨立樣本。主要分析單位以 design family／stream replicate 組塊，採配對 cluster bootstrap 或適合的階層模型估區間；只有少量 families 時，需明說無法支持廣泛 family-level 泛化。

先用 pilot 估分布、變異與可負擔規模。正式預註冊主要比較、預算軸、成功門檻、品質非劣性界線（若使用）、停止規則與多重比較處理；不能看 test 後挑最有利門檻。沒有顯著差異不等於證明等效。

報全數失敗、timeout、無效設計和工具異常。基礎設施故障的排除／重試政策在所有 arm 一致並事先定義；人工救援單列，不算全自主成功。

成本採 09 的截尾／受限成本與固定 budget 成功率共同呈現，不只分析兩組都成功的案例。配對 observed negative transfer 是結果差異的描述；不可把單次亂數失敗直接認定為某條記憶的因果責任，需重跑與消融支持。

## 7. 局部修正與回歸

每次宣告經驗不適用／修訂後，檢查：新條件是否改善、原本仍有效的條件是否保留、無關設計是否受損。來源或版本變了，只能觸發待重驗，不自動等於舊結論為假。

主實驗固定版本，以設計／負載／操作前提差異測適用性。跨遊戲版本另設 extension，記真實規則變化與可取得來源；不把 synthetic 改動寫成官方版本更新。

對不能透過允許觀察區分的機制，接受解釋等價類或 abstention；沒有唯一可辨識機制就不強制唯一 ground-truth graph。

## 8. 輸出與再現 manifest

每個 run 保存 `git_sha, model_provider, exact_model_id, snapshot_if_available, api_date, model_parameters, harness_hash, prompts_hash, tool_contract_hash, task_manifest_hash, world_hash, environment_config, arm, seed, stream_order, budgets, experience_before, experience_after, raw_artifacts, scoring_version`。

API 沒有提供固定 snapshot 時如實標註；模型名稱相同不代表 serving 不變。硬體與執行負載也記錄，尤其比較 wall-clock／lag 時。

交付 per-run results、排除紀錄、成本拆解、配對效應與不確定性、失敗案例及消融。release 後可公開的設計／seeds／評分流程應完整提供；實驗期間隔離保留資料不代表論文永遠隱藏評測。不得公開未授權遊戲 source、第三方藍圖或私人語料。

## 9. 模型與流程級擴展

若增加新模型，在該模型內重跑所有主要 arm，不能用舊模型 baseline 對比新模型＋方法。跨模型記憶移交是 portability 實驗，不自動證明 RSI。

只有另外凍結任務與預算，讓 Agent 修改自己的診斷／選實驗策略，並在全新保留任務證明改進後的流程更有效，才提出流程級自我改進主張。這不是本輪 MVP 的必要條件。
