# 統一來源記錄

內文用 `[S編號]` 引用，本檔是唯一詳細出處。分組排列，附一句話說明。
arXiv ID 與 repo 以調研當下（2026-09）為準；標 `查無` 者是驗證過零命中的，不要引為 prior art。

## V：版本真相 ledger

- [S-V1] VersionRAG（arXiv:2510.08109；github.com/danielhuwiler/versionrag，24★ prototype）——5 層版本圖 + change 節點；100Q 上 90% vs naive 58%。
- [S-V2] FiscalQA Pro（arXiv:2608.09393）——32,436 法條版本 + nugget 確定性評分；靜態 RAG 日期適用檢索 0%，多版本 98.3%。
- [S-V3] TimelyRAG / TimelyQABench（arXiv:2609.11572；kaist-dmlab/TimelyRAG）——語義 + 時間重排公式；12,000 QA +28.6% nDCG。
- [S-V4] TG-RAG + ECT-QA（arXiv:2510.13590）——平行時間邊 + 增量摘要；只增不退役。
- [S-V5] T-GRAG + Time-LongQA（arXiv:2508.01680）——跨時間子查詢分解 + 三層過濾。
- [S-V6] Chronos EEG（arXiv:2604.05096）——時間衰減公式 + 事件演化圖；73.86% vs vanilla 47.48%。
- [S-V7] Graphiti / Zep（arXiv:2501.13956；getzep/graphiti，~31K★）——bi-temporal（valid/invalid + created/expired）+ episode；LongMemEval +15–18.5%，單會話回歸 -9–-18%。
- [S-V8] MemStrata I+II（arXiv:2606.26511 / 2608.20685）——確定性 (s,r,o) supersession；相似度 AUROC 0.59 不可能證明；演化集 0.95–1.00 vs 0.20–0.47，stale→~0%。
- [S-V9] TEMPO（arXiv:2601.09523；tempo-bench/Tempo）——1,730Q 時間檢索基準；最佳僅 32.0 nDCG。
- [S-V10] lakeFS / Nessie（docs.lakefs.io）——git-like 資料湖；PG=commit log、Qdrant=物化視圖的心智模型來源。
- [S-V11] Dolt（dolthub/dolt）——Prolly-Tree 分支資料庫；branch per hypothesis 想法來源。
- [S-V12] Datomic / litelog（docs.datomic.com；chazu/litelog）——bitemporal 雙時鐘 `AsOf(tx)/AsOfValidTime`。
- [S-V13] 查無：AionRAG / LedgerRAG / ConVer-G / GC-Mem / TMRL —— arXiv 零命中，勿引。

## D：依賴失效 invalidation

- [S-D1] TruthKeeper（2025 preprint，academia.edu）——四態真相 + Memory CI；只有假設無數字。
- [S-D2] ftl-beliefs / ftl-reasons（benthomaasson，2026-02）——Markdown claim + nogoods；只標不自動撤回。
- [S-D3] EEM / llmeem.ai——BMS + LLM；每輪撤回 13–37%，hobby 無 bench。
- [S-D4] ptms（neusym.ai，2026-06）——296 records / 477 scripts / 801 edges；HARD/SOFT + 自測 fixture；文件/簽名級。
- [S-D5] Coalent（Vectorlink-Labs/coalent，v0.6）——`source_changed` + 反向索引 + lazy rebuild；0.731 @ 省 43% tokens；自認 per-artifact 太粗。
- [S-D6] SmartVector（arXiv:2604.20598）——時間 + 信心衰減 + ripple；合成小集 31.2%→61.7%。
- [S-D7] MQuAKE（EMNLP'23）+ Remastered（ICLR'25）——ROME 43.4%→7.6%；Remastered 發現 33–76% 標籤壞。
- [S-D8] MEME（2026）——DAG Cascade 0.03 / Absence 0.01；Opus ingest-closure 70× 才 0.32/0.59。定價證據。
- [S-D9] LongMemEval（ICLR'25；xiaowu0162/LongMemEval）——500Q；長上下文掉 30–60%。
- [S-D10] EvoMemBench（2026）——revision 崩尤其 multi-hop；瓶頸是 suppress/replace 決策。
- [S-D11] StaleBench（2026）——~50% 重索引仍 stale；catch-up latency 指標來源。
- [S-D12] ChurnBench（2026-09）——ledger-gold 方法；關 refresh 4→45 errors。
- [S-D13] CONFRAG（ACL'26）——1,814Q，57.2% 矛盾；最佳 NMI 0.46（模型不會處理矛盾）。
- [S-D14] ROME/MEMIT 崩潰鏈（Gupta；r-ROME；One Mask ACL'26；MEMIT-Merge ACL'25；S2RKE NAACL'25）——1400 edits 災難；mask 逆轉 80%/70%；同 subject batch 修復 41%→95%。
- [S-D15] MeLLo / GMeLLo——外部記憶 + 分解檢查勝權重編輯（76% vs 20%）；revalidation 子程序來源。
- [S-D16] DataJoint 2.0 / Quipu（2026-08）/ GitLake（2026-07）——結構化 cascade / tombstone-retract / 事務分支；語義層空白。
- [S-D17] RAPTOR / adRAP（~95% @ -70%）/ GraphRAG update（官方不支援刪除，maintenance mode）/ EraRAG —— 增量检索≠失效。
- [S-D18] JTMS（Doyle 1979，MIT AIM-521）/ ATMS（de Kleer 1986）——IN/OUT-list + nogood；多 context 標籤。

## P：provenance / influence / abstention

- [S-P1] ALCE（EMNLP'23，arXiv:2305.14627；princeton-nlp/ALCE）——NLI 引文 recall/precision；ELI5 50% 缺支撐。
- [S-P2] ALiiCE（NAACL'25）——原子級引文。
- [S-P3] CiteGuard（ACL'26，arXiv:2510.17853；KathCYM/CiteGuard）——68.1% vs human 69.2%。
- [S-P4] Cited-but-Not-Verified / CITE-CONTROL（TACL'26）——success / citation-failure / response-failure 分類。
- [S-P5] G-Cite vs P-Cite（OpenReview 2025）——ledger 用 P-Cite（先草稿後掛引文）。
- [S-P6] REASONS（arXiv:2405.02228 v5）——12,723 句；advanced RAG HR 65.4% 但 AR 5%→0%。
- [S-P7] GenProve（推理 gap：Quotation 行、Inference 崩）——triple schema 來源。
- [S-P8] ProvenAI（arXiv:2606.26449）/ RAGShield（arXiv:2604.00387）/ provena —— L1/4/5 + hash-chain 抄。
- [S-P9] RECOMP（ICLR'24；carriex/recomp）——oracle 6% tokens；無重歸因 metric（0.12 缺口）。
- [S-P10] Influence：IF（Koh+Liang 2017）/ TracIn（NeurIPS'20）/ TRAK（ICML'23，MRR 0.42 vs 0.09）/ LoRIF（arXiv:2601.21929）/ f-INE（ICLR'26）——批量可，線上不可。
- [S-P11] RAGAS（arXiv:2309.15217；vibrantlabsai/ragas）/ ARES（NAACL'24；+59.3pp ctx）——CI 即插。
- [S-P12] CRAG（NeurIPS'24，arXiv:2406.04744；facebookresearch/CRAG）——`1/0/−1` 照抄；Corrective-RAG。
- [S-P13] FActScore / AIS / RAGTruth / MIRAGE —— eval 抄，線上歸因開。

## R：replay / trajectory / harness

- [S-R1] Dream-RSI（arXiv:2609.14858；zhengkid/Dream-RSI；dream-rsi.com）——樹即 simulator；零 calibration；162× 有模型混淆。
- [S-R2] SimpleTES（YWolfeee/SimpleTES，AGPL）——task/evaluator harness；零 replay。
- [S-R3] OpenEvolve（6.2k★）/ AlphaEvolve（DeepMind，closed）/ ThetaEvolve —— islands/MAP-Elites；零 replay。
- [S-R4] ReasoningBank + MaTTS（ICLR'26；google-research/reasoning-bank）——k=1 最優，k>1 49.7→44.4；零 replay。
- [S-R5] EXG / Trellis（"replay is as-of query"）/ EMG —— query pattern 抄；stale 未解。
- [S-R6] AEL（arXiv:2604.21725；WujiangXu/AEL）——uniform credit 勝一切精巧；bandit-over-policies 抄。
- [S-R7] Voyager（arXiv:2305.16291；MineDojo/voyager）——skill-as-code；sandbox 可 reset，私有 corpus 不行。
- [S-R8] DGM（arXiv:2505.22954；jennyzzt/dgm）——archive stepping-stones；SWE 20→50%。
- [S-R9] SWE 軌跡語料：Open-SWE-Traces 207k / Nebius 67k / NVIDIA SWE-Zero 318k；SRFT（32.2% vs 30.9%，$660/5k）；SWE-Prime（10% 勝全集）；FailForge（26% 挽回）。
- [S-R10] ATLAS（KL-gate 非 replay 不確定性）/ SEARL / HarnessEvolve（two-gate 抄）/ VICT（proof-edge credit 抄）。
- [S-R11] LAG / FoldGRPO（branch/return 抄）/ SWE-MeM / MemPO（memory-advantage 抄）/ AgeMem / MEM1（ICLR'26；MIT-MI/MEM1）。
- [S-R12] LangGraph（checkpoint）/ LangSmith / OTel `gen_ai.*` / AgentTelemetry（AIware'26，FDR 0.429→0.612）——base tracing 抄；4 階段 ledger 做。
- [S-R13] SWE-Live（月+50）/ SWE-Pro-Verified（731，`.git` 封鎖）/ OpenAI 污染審計（59.4% 壞、70→23%）——world stream + sandbox recipe。
- [S-R14] BrowseComp-Plus（frozen 100K）/ EvoBrowseComp / DeepResearch Bench II（9,430 rubrics）/ RACE-FACT / GAIA2-Time —— 評測四件套。
- [S-R15] 查無：SIP-Bench T0/T1/T2 —— 未定位，勿引。

## M：memory / retrieval 背景

- [S-M1] A-MEM（NeurIPS'25）——consolidation ablation；keep-case 錨點。
- [S-M2] HippoRAG / v2（NeurIPS'24 / ICML'25）——2Wiki +11–20%； jargon 弱。
- [S-M3] GraphRAG-Bench（2025）——*"frequently underperforms vanilla RAG"*；8× index tax。
- [S-M4] DOS RAG（EMNLP'25）——簡單保序打敗 RAPTOR。
- [S-M5] AgentIR（arXiv:2603.04384）——reasoning-trace 當 query；BrowseComp-Plus 68% vs 52%。
- [S-M6] BGE-M3（BAAI）——zh/en 正確 baseline；code 輸 CodeRankEmbed 2×（CORE-Bench arXiv:2606.11864）。
- [S-M7] BRIGHT（ICLR'25）——MTEB 59→18.3；推理檢索專用。
- [S-M8] Mem0（62.7K★）/ Letta（24.6K★）/ LlamaIndex / Haystack / DeerFlow（81k★）/ Open Deep Research —— 全 commoditized，reuse。
- [S-M9] Anthropic CE（2025-09-29）/ Harnesses（2026-01）/ Managed Agents（2026-04）/ Dreaming（2026-05）——session-as-object、`getEvents()`、夜間 consolidation 想法來源。
- [S-M10] 2026 前沿：REALM（arXiv:2609.16053）/ MAGMA+AgeMem（ACL'26）/ MemPrism（arXiv:2608.06745）/ MEMO（arXiv:2609.07471）/ qTTT（arXiv:2512.13898）/ S-TTT / MoNe / Prefix Sliding / LongStraw / MRCRv2 / RULER —— harness>weights、RL 控記憶、2M 可跑不可推理。

## C：社群 / MC / blueprint / simulator（想法來源）

- [S-C1] GTMC（techmc-wiki/gtmc）——`translated-from-revision` pinned-stale；slug-map + schematic 嵌入。
- [S-C2] Tech MC Wiki Older Versions（techmcdocs）——per-mechanic 版本矩陣。
- [S-C3] Forge/Fabric/NeoForge + McJty porting + CurseForge/Modrinth —— 4-tuple manifest + migration operators + version facet。
- [S-C4] MediaWiki FlaggedRevs / Semantic Wiki —— stable/draft 雙讀 + typed links。
- [S-C5] Tian Pan freshness（2026-04-20）——tombstone + Freshness SLO。
- [S-C6] Perplexity teardown / Tavily SEALQA / haystack-abstention / HN 47499356 / johal $126k —— pre-citation + sufficiency router + incomplete/cost UX。
- [S-C7] NEXO（r/LocalLLaMA）——三階 decay + metacognitive guard。
- [S-C8] CAD-Llama SPCC（CVPR'25）/ LLM4CAD-DSL（arXiv:2606.20607）/ OpenShape / ULIP / BRIDGES / CircuitFusion（ICLR'25）/ MuaLLM（arXiv:2508.08137）/ EDATracer（arXiv:2608.04032）——blueprint 6 trick 來源。
- [S-C9] MCHPRS（MCHPR/MCHPRS + Redpiler.md）/ nucleation（schem-at/nucleation，MchprsWorld）/ lemma-redstone-mcp / dylan121322/minecraft-redstone-mcp（40/40 ALU）/ RedstoneSim / cairn / Redstonery —— oracle 排名來源。
- [S-C10] MineDojo / Voyager / AutoWorldModel-Bench（arXiv:2608.11216）/ WMRL（arXiv:2608.12564）/ SciDesignBench —— horizon metric + surrogate roadmap。
- [S-C11] Litematic 工具：litemapy（SmylerMC）/ schematic4j（SandroHc）/ rustmatica（RubixDev）——parse-only，無人做索引環。

## F：記憶基礎與負結果（早期 memory 報告併入，原文 38 條 S1–S38）

- [S-F1] 記憶綜述 5 篇：Age-of-AI-Agents（arXiv:2512.13564，Forms-Functions-Dynamics）/
  Foundation Survey（arXiv:2602.06052， Agentic Memory RL 三段式；consolidation「特別缺人做」）/
  Storage-to-Experience（ACL Findings 2026，F_ref vs F_exp；遷移到未見任務才是標準）/
  模組重實現（arXiv:2604.01707，12 方法在 LOCOMO/LongMemEval/MemoryArena 重跑；幾乎全隨規模掉 F1、有近因偏）/
  Anatomy（arXiv:2602.19320，評測清單：基準太小、指標錯位、主幹依賴、維護開銷）。
- [S-F2] MemGPT（arXiv:2310.08560；letta-ai/letta）——虛擬上下文（RAM/磁碟類比）始祖；自家 DMR 基準小且飽和。
  Letta 生產版：agent 自改記憶塊，無有效期模型，失效故事薄。
- [S-F3] A-MEM（NeurIPS 2025，arXiv:2502.12110）——原子筆記加鏈接加演化；multi-hop 約 2 倍，
  去鏈接加演化 F1 從 44.65 掉到 13.28；約 1,200 tokens 對全歷史 16,900。consolidation 最強 ablation 證據。
- [S-F4] MemoryBank（AAAI 2024，arXiv:2305.10250）——Ebbinghaus 遺忘 `R=e^(-t/S)`；
  評測只有模擬用戶加手寫題，遺忘從未 ablation。只當存在先例，不當證據。
- [S-F5] Reflexion（NeurIPS 2023，arXiv:2303.11366）——同任務多 trial 有效，跨任務不復用。
  反例：內省自糾正（arXiv:2310.06897）無外部回饋會停滯或變差；更新必須接地（檢索命中、測試結果），不能自批。
  後續：Meta-Policy Reflexion（arXiv:2509.03990，軟引導加硬攔截）、Memento 2（arXiv:2512.22716，讀寫迴圈理論）、
  Generative Agents（UIST 2023，arXiv:2304.03442，多信號檢索加反思鼻祖）。
- [S-F6] HippoRAG（NeurIPS 2024，arXiv:2405.14831；OSU-NLP-Group/HippoRAG）/
  HippoRAG 2（ICML 2025，arXiv:2502.14802，2Wiki +9.5 F1，首個無事實稅的圖方法）/
  對照：RAPTOR（arXiv:2401.18059）、GraphRAG（arXiv:2404.16130）、LightRAG（arXiv:2410.05779）。
- [S-F7] Mem0（arXiv:2504.19413；mem0ai/mem0）——ADD/UPDATE/DELETE/NOOP 兩段式；
  LOCOMO 上 J 66.88（Mem0g 68.44）對 RAG 約 61；full-context 上限 J 約 73 但 p95 17 秒對 1.44 秒。
  教訓：獨立評測比廠商自報低 10–20 分，評測架子要先註冊。
- [S-F8] TRACE（arXiv:2310.06762，ID 待確認）/ CounterFact / ROME（arXiv:2204.07260）/
  MEMIT（arXiv:2210.16802）——序列訓練必忘；單點編輯行、多跳傳播崩。權重存知識的死刑證據。
- [S-F9] Self-RAG（ICLR 2024，arXiv:2310.11511）——critique token 決定何時檢索；讀取政策的微縮版。
- [S-F10] LongMemEval 索引時優化（ICLR 2025）——fact key 擴張 +9.4% recall、+5.4% 準確率；
  時間查詢擴張 +11.4%。最便宜的 consolidation 可能在索引時，不在 LLM 重寫環。
- [S-F11] MemR3（arXiv:2512.20237）——檢索控制器外置（LangGraph），+5–9 分；評測器和儲存要分開量。
- [S-F12] 三種失效學派無對決（缺口）：A 有效期窗口（Zep）、B 衰減遺忘（MemoryBank，從未 ablation）、
  C 顯式操作（Mem0，法官誤差累積）。決戰實驗：同一版本變更探針上 A vs B vs C vs 只追加。
- [S-F13] 污染與噪聲：PoisonedRAG（arXiv:2406.11657，幾篇毒文檔翻轉答案）/
  AgentPoison（arXiv:2407.12784，後門跨會話殘留）/ Cuconasu 噪聲（arXiv:2407.01095，ID 待確認）/
  LOCOMO 對抗崩（長上下文 GPT-4 15.7% 對短上下文 34.8%；過期記憶有害且越長越害）/
  Lost in the Middle（arXiv:2307.03172，中間丟失）/ full-context 帳（LOCOMO J 約 73 但貴 10 倍）。
  結論：寫入過濾加信任分級加拒答，必備；評測用成本調整後準確率。
- [S-F14] 基準底本：LOCOMO（ACL 2024，arXiv:2402.17753，600 回合/16k token，人類 87.9 對模型 50 初頭；
  有標註爭議）/ LongMemEval（ICLR 2025，arXiv:2410.10813，500Q，115k/1.5M，含更新和拒答，最適底本）/
  DialSim（A-MEM 用，分數小、差值有用）。MemBench、MemoryArena、BEAM 未確認或廠商宣傳，勿引。
