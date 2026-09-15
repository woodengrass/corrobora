# 相關文獻與完整度補強（精選）

> 挑選原則：只收「能直接對應本計畫某個缺口」的工作；純模型訓練、改權重编辑、
> 預設重型基建的一律不收。每條都標出處與落地位置。

## A. 記憶方式改善

### A1. Voyager：Minecraft 終身技能庫（Wang et al. 2023）
- 出處：arXiv:2305.16291，https://voyager.minedojo.org/，code：https://github.com/minedojo/voyager
- 重點：automatic curriculum＋可執行 code 的 skill library（描述 embedding 索引）＋
  執行反饋迭代＋self-verification 通過才入庫；3.3× 物品、15.3× 科技樹加速。
- 落地：`06` blueprint／machine 分支照此模式——code 先驗證再入庫；
  curriculum 思想用於 `12` stream 出題（按 coverage 缺口提下一個 family）。
  注意差異：Voyager 存技能本身，我們存「研究結論＋版本 scope＋依賴」，技能只作來源。

### A2. ExpeL：無參數經驗學習（Zhao et al., AAAI 2024）
- 出處：arXiv:2308.10144，code：https://github.com/LeapLabTHU/ExpeL
- 重點：insights＋成功軌跡雙通道；insight 操作 ADD／UPVOTE／DOWNVOTE／EDIT＋
  importance count，歸零刪除；學到的 insight 勝過人工手寫；HotpotQA 重抽象、ALFWorld 重軌跡。
- 落地：`11` consolidation 的 compare 動作直接採用這組操作＋計數器；
  Minecraft 機制題偏抽象（insights 通道）、機器操作題偏軌跡，pilot 兩類都要有。

### A3. MemoryBank：Ebbinghaus 遺忘曲線（Zhong et al., AAAI 2024）
- 出處：ojs.aaai.org（article/download/29946/31654）
- 重點：`R = e^(−t/S)`，被取回就 S＋1、t 歸零；SiliconFriend 正確率 0.716。
- 落地：`11` 的 α／β 剪枝之外，加一條時間衰減降權（長期未被取回的低 utility 先降權再刪），
  與 invalidation（事件驅動）互補：一個管時間，一個管事件。

### A4. HippoRAG：單步多跳檢索（Gutierrez et al., NeurIPS 2024）
- 出處：arXiv:2405.14831，code：https://github.com/OSU-NLP-Group/HippoRAG
- 重點：OpenIE 無 schema KG＋Personalized PageRank，單步多跳，最高 +20%，
  比迭代檢索便宜 10–20 倍、快 6–13 倍。
- 落地：`04`／`09` M5 的 graph ablation 照它的比較法做（同 snapshot、開關對照）；
  在 ablation 證明效益前不建全量圖——這正是本計畫已寫的 gate，引用它當方法依據。

### A5. Generative Agents／Reflexion（背景）
- Park et al., UIST 2023（arXiv:2304.03442）：memory stream＋重要性／新近性＋reflection，
  reflection 計分思想可用於 coverage review 的優先序。
- Shinn et al., NeurIPS 2023（arXiv:2303.11366）：verbal reflection 重試；
  ReMe 的 failure reflection 即由此來，本計畫重試上限與成功才保留已在 `11`。

## B. 資料標記與評測方法

### B1. LongMemEval：長期記憶五能力（Wu et al., ICLR 2025）
- 出處：arXiv:2410.10813，code：https://github.com/xiaowu0162/LongMemEval
- 重點：500 題測 extraction／multi-session／temporal／knowledge-update／abstention；
  session 切分、fact-augmented key expansion（recall +9.4%）、time-aware query expansion（+11.3%）；
  長上下文模型掉 30–60%。
- 落地：`12` held-out probes 照五能力出題（尤其 abstention 對應既有 refusal 類、
  knowledge-update 對應版本題）；time-aware 索引進 `02`（revision_at／captured_at 已在 `01`）。

### B2. ARES：少量標註＋可信評分（Saad-Falcon et al., NAACL 2024）
- 出處：https://aclanthology.org/2024.naacl-long.20/，
  code：https://github.com/stanford-futuredata/ARES
- 重點：合成 QA＋輕量 judge＋PPI，只要約 150 筆人工標註就有 95% 信賴區間；
  judge 可跨領域轉移；勝 RAGAS。
- 落地：`12` 專家評分改用此模式——150 筆標註＋synthetic judge＋PPI，
  直接回答 reviewer 人力從哪來；judge 只作輔助、人工盲評為準的原則不變。

### B3. FreshQA：STRICT／RELAXED 雙軌（Vu et al., Findings ACL 2024）
- 出處：https://aclanthology.org/2024.findings-acl.813/，600 題，快變知識＋false premise 全掛。
- 重點：RELAXED 只看答案對，STRICT 要求整段無幻覺；COT 會增加幻覺。
- 落地：`12` 計分拆兩軌（正確性 vs 無幻覺分開報）；false premise 題直接沿用既有 refusal 類。

### B4. MQuAKE：多跳更新測試（Zhong et al., EMNLP 2023）
- 出處：arXiv:2305.14795，https://github.com/princeton-nlp/MQuAKE
- 重點：改一個事實後的多跳連鎖題；改權重方法全滅，外部記憶 MeLLo 可擴展。
  附帶論據：**不要做改權重编辑**，外部記憶＋迭代問答才是可擴展路線——與本計畫一致。
- 落地：`12` 更新矩陣的 affected／unaffected 對照題照此出（事實變更＋多跳連鎖）。

## C. 刻意不採用的

- 模型改權重编辑（ROME 等）：MQuAKE 證明多跳必滅，外部記憶路線已選，不回頭。
- 上來就建 Neo4j／全量 KG／訓練 cats：HippoRAG ablation 方法支持先 gate 後建。
- 大規模人工標註 benchmark：ARES 證明 150 筆＋PPI 就夠，reviewer 配額照此估。

## D. 2025–2026 近年補充（與 ReMe 同代證據）

### D1. HippoRAG 2：概念＋上下文雙軌（Gutierrez et al., ICML 2025）
- 出處：arXiv:2502.14802，code：https://github.com/OSU-NLP-Group/HippoRAG
- 重點：修正 v1 只看 entity 丟失上下文的缺陷，phrase 節點＋passage 節點共同進 PPR，
  加 recognition memory 過濾種子；MuSiQue／2Wiki Recall@5 較最強 dense 檢索 ＋5.0／＋13.9%，
  關聯記憶任務 ＋7%，事實記憶不再輸標準 RAG。標題即立場：From RAG to Memory。
- 落地：`04` 關聯展開若要做，以 v2 的「概念＋原文雙軌＋過濾」為實作規格；
  v1 的 ablation gate 保留，升級條件是雙軌在 dev 證明贏 dense。

### D2. MIRIX：六型別＋多智能體記憶（Wang & Chen 2025）
- 出處：arXiv:2507.07957
- 重點：Core／Episodic／Semantic／Procedural／Resource／Knowledge Vault 六型別，
  各有 Memory Manager＋Meta Manager 路由；Active Retrieval 先定 topic 再查；
  ScreenshotVQA 較 RAG ＋35% 且儲存 −99.9%，LOCOMO 85.38% SOTA。
- 落地：`01` 的 Finding／passage／concept／machine 分層已暗合六型別；
  若未來記憶膨脹，先抄它的「近 90% 容量重寫＋consolidation」與 Active Retrieval（先定 topic），
  不必另發明。

### D3. SealQA：吵雜檢索下的推理（Pham et al. 2025，ICLR 2026）
- 出處：arXiv:2506.01062，資料：https://huggingface.co/datasets/vtllms/sealqa
- 重點：Seal-0 專挑搜尋結果衝突／噪聲題，GPT-5＋tools 僅 43.2%，o3 僅 17.1%；
  加 test-time compute 不穩定增益；LongSeal（254 題）測多文件 needle。
- 落地：`12` 加一類「衝突檢索題」——既有 conflict_handling 只有 4 題且無 source，
  按 SealQA 方法出：先收矛盾檢索結果，再驗答案；LongSeal 做法直接套版本比較題。

### D4. Mem0：生產級記憶層（Chhikara et al. 2025）
- 出處：arXiv:2504.19413，https://github.com/mem0ai/mem0
- 重點：抽取／更新／檢索三模組＋graph 版 Mem0^g（實體關係三元組＋衝突檢測，
  舊關係標 invalid 不物理刪除）；LOCOMO 全面勝出，p95 延遲 −91%、token −90%。
- 落地：`11` 的 superseded／stale 保留歷史（不物理刪除）與此一致，引用它當工程先例；
  它的 ADD／UPDATE／DELETE 三模組可作 memory service 切分參考。
  注意：Mem0 是通用個人記憶，你的是版本化研究記憶，語意層級不同，只借工程模式。

### D5. Multi-SWE-bench：多語言程式修補評測（Zan et al., NeurIPS 2025）
- 出處：arXiv:2504.02605，https://github.com/multi-swe-bench/multi-swe-bench
- 重點：7 語言 1,632 題（68 專家標註，Docker 可重現），另有 4,723 RL 題；
  patch 超 600 tokens 或跨檔就崩；Java 在列。
- 落地：`06` 的 Java code 驗證方法學照抄——Docker 可重現＋dual annotation；
  跨檔／大 patch 必崩的結論支持 `06`「先 file 級 dependency、symbol 細化後測」的順序。
  另：它的 4,723 RL 題證明「大規模標註要走 RL 社群眾包」，呼應 ARES 的低標註路線。

## E. 評測方法論補充（2025–2026，不看會誤判的那種）

### E1. GraphRAG-Bench：圖到底何時有用（Xiang et al. 2025，ICLR 2026）
- 出處：arXiv:2506.05690，https://github.com/GraphRAG-Bench/GraphRAG-Benchmark
- 重點：簡單事實題 RAG 直接贏（Evidence Recall 83.2%），圖只在 L2–L3 複雜推理勝
  （87.9–90.9%）；圖方案 prompt 可膨脹到 40k tokens，HippoRAG2 僅約 1k。
- 落地：這是 `04` gate 的尚方寶劍——簡單題不用圖、複雜題才開 ablation；
  token 開銷必須進 `09` 成本欄，否則圖的收益是拿上下文換的假收益。

### E2. BrowseComp：瀏覽 Agent 的 persistence（Wei et al., OpenAI 2025）
- 出處：arXiv:2504.12516，https://github.com/openai/simple-evals，1,266 題
- 重點：GPT-4o 0.6%、Deep Research 51.5%；光會瀏覽不夠，推理＋工具才有用；
  best-of-N 再 ＋15–25%。
- 落地：`12` 的 Agent 能力評估加 persistence／creativity 兩項；
  你的 gap-only 迴圈天然對應「策略性換路徑重查」，可直接當受測行為。

### E3. HELMET：長上下文評測怎麼做才準（Yen et al., ICLR 2025）
- 出處：arXiv:2410.02694，https://github.com/princeton-nlp/HELMET，59 個模型
- 重點：needle-in-a-haystack 預測不了下游表現；RAG 類任務最便宜且最能預測下游；
  用 reference-based model 評分取代 ROUGE；8K→128K 五檔長度。
- 落地：`12` 禁止拿 synthetic needle 當主要證據；快速迭代用 RAG 類任務，
  正式比較才跑全套；多長度檔是版本比較題的天然模板。

## F. 反駁與缺陷：這些研究打在我們哪裡

### F1. 噪聲檢索會傷害答案，不是不用白不用（SealQA）
- DeepSeek-R1＋FreshPrompt 22.4%→11.0%，GPT-4.1-mini 開搜尋 13.8%→11.8%。
- 衝突：memory-first 預設「有記憶總比沒有好」在噪聲下不成立。
- 修法：`04` coverage 加第六態或等價機制——`harmful`（重用了反而錯），
  某 family 上 memory 臂顯著差於 stateless 即自動降級為線索模式；
  `12` 加 reuse-harm 指標（memory 錯而 stateless 對的題比例）。

### F2. 加算力不穩定變好（SealQA o-series／GPT-5）
- o4-mini 高 effort 反而 6.3%→4.5%，o3-mini 原地踏步。
- 衝突：「多繞幾圈就會找到」的預設；REFORMULATE／重試若無覆蓋進展就是燒錢。
- 修法：`05` 重試加遞減回報檢測——連續兩輪 coverage 無進展即停，
  budget 燒完是底線，不是目標。

### F3. 模型信心全部失準（BrowseComp calibration error 65–91%）
- 所有模型都不會表達不確定，Deep Research 高達 91%。
- 衝突：任何拿模型自報信心當權重的設計（`c`、verification weight、sufficiency）。
- 修法：信心只當排序提示，不當機率；verified 只認 review＋deterministic check＋
  held-out 實測校準。`01`／`07` 的 confidence 欄位加註此限制。

### F4. 圖在簡單題是負擔（GraphRAG-Bench Obs.1／Obs.9）
- 簡單題 RAG 直接贏；圖 prompt 可膨脹到 40k tokens。
- 衝突：`finding_relations` 的 RELATED_TO 若無證據就是噪聲源。
- 修法：維持 gate，M5 第一刀就是「關圖對照」；token 開銷進 `09` 成本欄（已做）。

### F5. 反思會幻覺，人工模板不如學到的（ExpeL）
- reflection 加入 insight 流程反而有害；學到的 insight 勝過人工手寫。
- 衝突：「寫精美模板＋人工規則」的直覺。
- 修法：admission 模板走學習式（從成功案例提煉），reflection 內容不直接入 insight，
  與 selective addition（成功才保留）是同一條線。

### F6. 跨檔必崩、難題歸零（Multi-SWE-bench）
- patch 超 600 tokens 或跨檔就崩；hard 題解決率近零。
- 衝突：code intelligence 一步到位的野心。
- 修法：`06` file 級優先維持；debugging 類 Finding 在跨檔證據不足時標 unknown，
  禁止單檔推論補齊（`07`「引用存在≠證明」已覆蓋，執行時嚴守）。

### F7. 時間推理是獨立能力（LongMemEval＋HELMET）
- time-aware 索引＋查詢擴展 recall ＋11.3%；版本比較本質是時間推理。
- 缺口：`01` 有時間戳欄位，`04` 還沒寫 time-aware query expansion。
- 修法：`04` 加一條——版本／時間敏感查詢先抽時間範圍再 filter，這是現成方法，不用發明。

### 必修順序（MVP 前）

1. F1 harmful-reuse 檢測（不做，memory 可能幫倒忙還不知道）
2. F3 信心去機率化（不做，所有 verified 都可疑）
3. F7 time-aware（現成 ＋11.3%，不做白不做）
