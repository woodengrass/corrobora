[索引](README.md) · [← MVP](08-scope-and-mvp.md) · [現況與遷移](10-current-state-and-migrations.md) · [長期實驗](12-longitudinal-experiment.md)

# Roadmap 與可驗證的研究問題

## 1. 主研究問題

在強通用 Agent 已能優秀理解專業資料的前提下，具有 provenance、consolidation 與
dependency-aware invalidation 的 Research Memory，能否讓 Agent 在大型未整理 corpus 上
形成有效的 **non-parametric continual domain learning**？

這不是已證實結論。研究需要把「多了可用資料」「重複問相同答案」「少回答」與
「真正重用研究知識處理新問題」分開。

| RQ | 可檢驗假說 | 主要對照／指標 |
| --- | --- | --- |
| RQ1 | Findings 減少重複研究且 accuracy 不劣化 | C vs D；accuracy、evidence correctness、總研究成本 |
| RQ2 | Memory-first＋gap-only 比整題 fresh search 更省，仍覆蓋必要条件 | D vs E；tokens、tool calls、完整度、false-covered |
| RQ3 | Consolidation 減少重複而不傷 retrieval quality | E vs F；duplicate rate、false merge/split、recall、維護成本 |
| RQ4 | Dependency invalidation 降低更新後 stale knowledge errors | 同配置 invalidation on/off；stale error、detection precision/recall、revalidation cost |
| RQ5 | Associative expansion 幫助跨文章／多跳／設計題 | F vs G；multi-hop evidence recall、答案品質、extra reads |
| RQ6 | 研究次數增加時，新題可重用比例上升，品質維持 | stateless vs sequential memory learning curves、固定 probe、跨模型接棒 |

## 2. 建議開發路線

以下 M0–M5 是本版的**未來里程碑**，不對應舊專案 Phase／Track 的完成度。
目前已存在的是資料與參考資產，見[實際盤點](10-current-state-and-migrations.md)。

| 里程碑 | 工作與依賴 | 可驗收產出／下一步條件 |
| --- | --- | --- |
| M0：研究設定 | 確認主題、來源 manifest、研究者可用权限、模型與预算；整理既有題目／fixtures | 固定 corpus＋baseline spec＋人工 evidence rubric，盤點數字可重現 |
| M1：可研究 corpus | Python modular monolith／PG／blob／Qdrant；Documents ingestion、alias、hybrid、section read；source search＋file refs；sessions | 原文還原、檢索有效、stateless raw Agent 可跑；記錄品質／成本分布 |
| M2：Memory 閉環 | 依 M1 加 Finding revisions／validations／sources／dependencies、memory search、gap record、review、基本 consolidation＋invalidation | [MVP](08-scope-and-mvp.md) 全流程與 pilot；不先做進階 graph／小模型 |
| M3：記憶可靠性 | 擴充間接依賴、併發／重播、文檔真實修訂；取得第二 code version；局部 symbol index、細粒度 diff | false-covered、false invalidation／stale errors 可量測，更新／rollback 測試通過 |
| M4：長期研究 | 擴充 topic families／數百步 stream、盲評、多順序／多 seed；做 C/D/E/F/H 主實驗 | accuracy 非劣性、成本曲線、維護攤銷、失敗案例、信賴區間 |
| M5：有證據的擴展 | graph association ablation、code analysis 工具比較、跨模型接棒；可獨立做 blueprint | 指定題型的效益足以支付新增工程／運行成本才採用 |

Catalog 遷移可與 M1/M2 平行；Blueprint 結構研究與自動遊戲測試不用等核心論文全部完成，
但它們也不能阻擋 Documents／Memory。Neo4j／CodeQL／CPT 不放進「必定要完成」里程碑。

每個 milestone 有 smoke correctness 與研究分析兩種結果；假說未成立仍需誠實產出負結果。
時程在 M0 pilot 與人力確認後估計，不承諾未量測的固定 4–6 週／15 秒 SLO。

## 3. A–H 比較組的操作定義

所有主比較使用相同 base Agent 模型、版本、工具權限、corpus 快照與 budget 上限。

| 組 | 定義 | 用來回答什麼 |
| --- | --- | --- |
| A. Strong Agent + Raw Corpus | 通用 repo/filesystem lexical search/read，可自主多輪；無本系統 document semantic index／memory | 強 Agent 原生能力基準，不能刻意限制為看不懂 source |
| B. Standard RAG | 同 corpus 分段索引，固定 single-shot retrieve→context→answer；top-k 在 dev 選定 | 傳統單次檢索基準，不刻意固定低品質 top 5 |
| C. Agentic Raw Corpus Search | A 的自主能力＋本系統 document hybrid/context tools；每题 stateless，無跨 session Findings | **memory 主對照**；與 D–H 只改記憶能力 |
| D. Agent + Findings | C＋Findings 存取／保存；可重用但新研究仍針對完整問題，無顯式 gap-only policy | isolate Findings 的增益 |
| E. + Gap-only | D＋structured coverage／針對 missing parts 研究 | gap-only policy 是否有益 |
| F. + Consolidation | E＋語意 equivalent/extends/contradicts/supersedes 管理 | duplication、錯誤 merge 與成本 |
| G. + Association | F＋bounded Finding graph expansion | 非字面／多跳 evidence recall |
| H. + Invalidation | G＋dependency-aware invalidation／JIT revalidation | 完整增量架構 |

D/E 仍有基本 idempotency、provenance、version filters 與寫入政策，停用的是語意 consolidation，
不是故意讓重試重複寫入。所有組都可用 raw source，不能讓 baseline 少拿關鍵來源。
A 與 C 的區別是 **通用 lexical corpus 工具 vs 本系統 corpus retrieval/context infrastructure**，
不是兩個含義模糊的「Agent 搜原文」。A 的 context 放不下時必須允許工具閱讀，不能直接截斷。

累加 ladder 方便展示，但不是每一模組的因果隔離：主實驗另做 F±invalidation、
F±graph、E±consolidation 的 matched ablation。Code graph 對所有 memory 主比較組固定，
其獨立效益再以 A/C 的 repo-only vs light-graph 比較。

Invalidation-off 組只在封閉 benchmark 中測舊知識風險；正常系統的 provenance／版本邊界保留。

## 4. 指標與定義

| 類別 | 指標／定義 |
| --- | --- |
| 答案品質 | Answer Accuracy（依必要事實／條件 rubric）、expert rating、完整度；partial／refusal 也計分 |
| 來源品質 | Evidence/Source Correctness；引用是否存在、定位正確、語意支持分開評分 |
| Retrieval | passage/section/finding Recall@K、MRR/nDCG；multi-hop all-required-evidence recall |
| 不可靠結論 | Unsupported Claim Rate＝無足夠依據 factual statements／全部 factual statements；版本錯誤分別統計 |
| 更新風險 | Stale Knowledge Error Rate；更新後依過期結論造成錯答的受影響問題比例，與每 statement 率并列 |
| 研究量 | Raw Passages Read、unique/repeated Documents Opened、Code Files/Ranges Read、tool calls；retrieved≠read |
| 成本 | input/output/cached tokens、API calls/cost、wall latency p50/p95；維護、review、索引分列 |
| 記憶健康 | duplicate findings、false merges/splits、成長數、Memory Utility Rate、association reuse |
| 覆蓋 | Knowledge Gap Detection Accuracy、五類 confusion matrix／macro-F1、false-covered rate、need omission rate |
| 失效 | affected-finding precision/recall、propagation lag、revalidation cost、historical-validity preservation |

重要衍生指標：

- **Repeated Research Reduction**：在相同問題 stream 的窗口 W，
  `1 - sum(raw_reads_memory[W]) / sum(raw_reads_stateless[W])`；denominator=0 時記 N/A。
  文件、passage、code bytes／tokens 分別報告，不把原始工具粒度不同的 counts 直接混加。
- **Memory Utility Rate**：某建立 cohort 中，在固定後續窗口內被真正用於不同後續題的
  Findings 比例；不能以 retrieved 計 used；同題重試、單純改寫問句另列。
- **Consolidation Quality**：人工標註的 equivalent/extends/contradicts/supersedes/independent
  confusion matrix、pairwise merge precision/recall，以及錯誤合併對 retrieval／答案的影響。
- **Total Cost**：foreground research + admission/consolidation + indexing + revalidation +
  review 人工時間（與 API 金額分列）；報告攤銷与 break-even，而不是只看最後一題便宜。

Latency 減少不能靠把工作藏進背景隊列：另報 time-to-memory-available、維護 backlog
與次題前可用的 memory snapshot。詳細操作見[長期實驗 protocol](12-longitudinal-experiment.md)。

## 5. 既有評測資產與缺口

已有 33 題，29 draft／4 approved（機器推薦）；9 個類別，所有 expected_source_ids 空白。
9 個 machine baseline cases 是舊 keyword 行為回歸，不是 retrieval relevance gold。
14 個 triage cases＋9 份人工 AI JSON 是規則契約，不能當真實模型產出或 memory benchmark。
本 repo 沒有可運行的 eval_agent/eval_retriever，也沒有歷史 accuracy 報告。

因此第一步不是直接跑「六類各 20 題已完成」的計畫，而是補 evidence locators／scope／
review、將現有範例整理成 pilot。之後依效果量／變異與標註能力擴到多個 topic families：
定義與別名、機制、因果、設計、debugging、版本差異／code，以及拒絕過度斷言。
120 題可作規模目標，但不是統計充分性的保證；數百題 stream 亦不能當數百獨立樣本。

## 6. 實作優先序

1. 固定 corpus 與評分 protocol，校正路徑、sources、版本 hints／unknown。
2. 建 Raw snapshots＋PG schema＋replayable importer，保護 immutable/provenance。
3. 做 document hybrid＋完整上下文 tools，source search/read；接 strong Agent 與 sessions。
4. 跑 C baseline，拆解 retrieval、模型推理與 corpus 缺口。
5. 加 Findings／兩層 index，跑 D，再加 gap-only 跑 E。
6. 在小資料上完成 consolidation／invalidation correctness，再跑更新 pilot。
7. 擴充 corpus、問題 families、真實版本修訂與 longitudinal experiment。
8. 依瓶頸做 graph、symbol 精細化或 model replacement，不預設更多技術一定更好。
