# 文獻登記簿（Literature Registry）

> 本文件是 13 的詳細條目庫。13 只留邊界摘要，所有完整條目住在這裡。
> 查證日期：2026-09-18，全文重寫版。以下全部條目皆經 HTML 全文精讀重寫（七組平行查證，方法節、實驗表、ablation、限制章節為準；未讀到標未知），arXiv ID 以 live 抓取驗證真實存在，不再標待驗證（2026-09-18 複驗 34 個 ID 全存在，無幽靈 ID；附上連結全部點數導向正確）。
> 勘誤說明：2505.16067 初版為 2025 年 5 月（ prior 誤寫 2026），2502.12110 初版為 2025 年 2 月（prior 誤寫 2026）。
> 題名勘誤：2502.14802 以 arXiv  canonical title 為準，題為 From RAG to Memory（即 HippoRAG-2）；
> 2506.05690 以 arXiv canonical title 為準，題為 When to use Graphs in RAG（即 GraphRAG-Bench）。
> 2026-09-18 複驗勘誤：C4 以 ACL Anthology canonical title 為準，題為 FreshLLMs（FreshQA 為其內提出的 benchmark 之名，非論文題名）；C9 數字以 arXiv v1 為準（7 語言 1,632 題），venue 版已擴充為 8 語言 2,132 題，引用時需註明版本。2026-09-18 新增 B9 Dream-RSI（2609.14858），以 live arXiv 驗證存在。
> 本文件不新增機制設計，不收因果與 3D 新研究，只登記邊界。

## 寫作格式說明

每個條目固定六欄：題名與作者、出版與狀態、已解問題、借用、不得宣稱、限制與領域落差。
另附一句吃掉的新穎性，寫明它吃掉哪一塊宣稱。

## A. Agent 記憶組

### A1. Remember Me, Refine Me（Cao et al.）

- 題名與作者：Remember Me, Refine Me: A Dynamic Procedural Memory Framework for Experience-Driven Agent Evolution，Zouying Cao、Jiaji Deng、Li Yu、Weikang Zhou、Zhaoyang Liu、Bolin Ding（Tongyi Lab, Alibaba Group）、Hai Zhao（SJTU，通訊作者）。共 7 人。
- 出版與狀態：[arXiv:2512.10696](https://arxiv.org/abs/2512.10696)，v1 2025-12-11，v2 2026-04-15。20 頁，Findings of ACL 2026。code 見 [agentscope-ai/ReMe](https://github.com/agentscope-ai/ReMe)。
- 已解問題：以三機制閉環取代被動累積：(1) 多面蒸餾（成功模式辨識、失敗觸發分析、比較性洞見），經驗結構含 usage scenario（ω）向量索引，LLM-as-a-Judge 驗證加 cosine 去重；(2) 情境適應重用（取 top-K=5 加 rerank 加改寫為任務專屬指引）；(3) 效用修剪（只存成功軌跡蒸餾的 selective addition 勝 full addition；失敗反思成功才入庫，最多自反思 3 次；刪除規則按使用頻率與效用比，α=5、β=0.5）。在 BFCL-V3（50 建池／150 評測）與 AppWorld（90 train／168 test）驗證，Qwen3-8B 平均 Pass@4 達 55.03% 超 Qwen3-14B 無記憶，Qwen3-14B 加記憶超 Qwen3-32B 無記憶（memory-scaling）。
- 借用：三路蒸餾的分類法（成功模式加失敗觸發加比較性洞見），scenario 索引加 rerank 加改寫的重用管線形狀，selective addition 加 utility 刪除加失敗反思成功才入庫的修法形狀。
- 不得宣稱：不得宣稱失敗感知蒸餾是 Corrobora 首創。不得宣稱成功模式加失敗觸發加比較洞見的三路組合是新的。不得把本工作當成只支援成功才入庫的證據（初始建池用成敗對，線上才轉 selective）。不得搬運其 BFCL 與 AppWorld 數字為版本化記憶收益。
- 限制與領域落差：驗證場是工具呼叫與 App 任務，不是版本化技術知識。效用分數是檢索與任務成功導向，不是版本 scope 與依賴正確性導向。記憶是程序性經驗池，不是 Finding 加版本加依賴的審查結構。作者自陳限制：目前每任務只在開頭檢索一次，缺彈性情境感知檢索。
- 吃掉的新穎性：吃掉失敗感知三路蒸餾加 scenario 改寫加 utility 修剪整套閉環宣稱。

### A2. Agentic Memory（Yu et al.）

- 題名與作者：Agentic Memory: Learning Unified Long-Term and Short-Term Memory Management for Large Language Model Agents，Yi Yu、Liuyi Yao、Yuexiang Xie、Yaliang Li（Alibaba Group）、Qingquan Tan、Jiaqi Feng、Libing Wu（武漢大學）。共 7 人。
- 出版與狀態：[arXiv:2601.01885](https://arxiv.org/abs/2601.01885)，v1 2026-01-05，v3 2026-07-23。ACL 2026 SAC Highlight。code 見 [y1y5/AgeMem](https://github.com/y1y5/AgeMem)。
- 已解問題：把長期與短期記憶管理統一為 agent 內生策略，六工具分工（長期：新增、更新、刪除；短期：取回、摘要、過濾），以三階段漸進式 RL（建長期庫、抗干擾練短期、正式問答考協調）加 step-wise GRPO（終端獎勵廣播至全軌跡解長程歸因）訓練，只在 HotpotQA 上訓練、直評 ALFWorld、SciWorld、PDDL、BabyAI、HotpotQA 五集加記憶品質分，在 Qwen2.5-7B 與 Qwen3-4B 上全面勝過去記憶增強基線。
- 借用：記憶管理是 agent 自主工具呼叫的概念，長期短期分工加三階段訓練的形狀，終端優勢廣播解長程歸因的寫法。
- 不得宣稱：不得宣稱 agent 自行決定存取更新刪除是新的。不得宣稱工具化記憶操作與 step-wise GRPO 是首創。不得搬其成功率與 token 節省數字為 Corrobora 收益。
- 限制與領域落差：以 RL 訓練出記憶策略，Corrobora 在規劃階段沒有可訓練的 RL 環路。正確性由任務成功與 LLM 評審定義，沒有版本審查、引用存在性檢查、verified 狀態機。對話記憶與版本化研究記憶語意層級不同。作者自陳限制：工具集固定，需更廣任務覆蓋。
- 吃掉的新穎性：吃掉長期短期統一工具化加三階段 RL 自決存取刪的通用宣稱。

### A3. How Memory Management Impacts LLM Agents: Experience-Following（Xiong et al.）

- 題名與作者：How Memory Management Impacts LLM Agents: An Empirical Study of Experience-Following Behavior（登記簿簡寫 Experience-Following），Zidi Xiong（Harvard）、Yuping Lin、Wenya Xie、Pengfei He、Zirui Liu（v2 新增）、Jiliang Tang、Himabindu Lakkaraju、Zhen Xiang。共 8 人（v1 為 7 人）。
- 出版與狀態：[arXiv:2505.16067](https://arxiv.org/abs/2505.16067)，v1 2025-05-21，v2 2025-10-10，無 venue。code 見 [yuplin2333/agent_memory_manage](https://github.com/yuplin2333/agent_memory_manage)。引用數字須註版本（v1 與 v2 表格數字不同）。
- 已解問題：以量化實驗證明 agent 有經驗跟隨特性，檢索到的記憶輸入越像，輸出行為也越像（合成回歸任務上相關係數近 1），並指出兩類風險：錯誤傳播（壞記憶被跟隨，換乾淨示範的對照即拉開差距）與錯位重演（某些記憶當示範恆差，即使嚴格入庫仍被刪除機制剔除）。新增採四檔對照（全收、粗篩三級、嚴格 oracle），刪除採頻率式加歷史式加合併式；嚴格入庫加歷史刪除在三真實 agent 上全面最佳，證明評估器品質決定一切。
- 借用：錯誤傳播與錯位重演的名詞，記憶有害的評估視角，新增要篩選、刪除要受控的觀念。
- 不得宣稱：不得宣稱發現記憶重用會幫倒忙。不得宣稱錯誤傳播是本計畫的原創觀察。不得把行為量測當修法有效的證據，引用只能支持有害重用指標的必要性。
- 限制與領域落差：該研究是行為量測，不是修法方案。記憶是 episodic 軌跡（問答執行對），不是版本化 Finding。v2 強調普通 LLM 當評審可能比不加更糟，評估器品質是前提。
- 吃掉的新穎性：吃掉記憶跟隨導致錯誤放大的觀察類宣稱。

### A4. Mem2ActBench（Shen et al.）

- 題名與作者：Mem2ActBench: A Benchmark for Evaluating Long-Term Memory Utilization in Task-Oriented Autonomous Agents，Yiting Shen、Kun Li、Wei Zhou、Songlin Hu（中科院信工所）。共 4 人。
- 出版與狀態：[arXiv:2601.19935](https://arxiv.org/abs/2601.19935)，v1 2026-01-13，preprint 無 venue。資料與 code 見匿名倉庫 Mem2ActBench-29AC。
- 已解問題：指出舊 benchmark 只測被動事實取回，該 benchmark 測主動應用，要求 agent 從分散的長期記憶中還原可執行的工具參數。出題管線：事實抽取成分群排序去衝突，拓撲排序成全域事實演化鏈，混合檢索錨定工具參數，再反向生成欠指定查詢（三約束：省略參數、回指依賴、意圖一致）加洩漏過濾加判別器（無記憶重建失敗才留）。規模 400 題、2,029 sessions，三階段人驗為抽取 96.5%、衝突 86.7%、記憶依賴 91.3%（turns 數摘要寫 12、內文寫 13，引用須註出處）。七系統評測顯示瓶頸在命中而非推理（oracle 檢索領先 23 個點以上），中段距離記憶最難，複雜參數與布林參數最差。
- 借用：被動取回與主動應用的區分，欠指定查詢加判別器保記憶依賴加演化鏈的出題形狀，檢索遺漏、取回未用、幻覺預設、保真失敗、選工具錯的五類診斷。
- 不得宣稱：不得宣稱主動用記憶驅動行動的評測視角是新的。不得搬 F1 與工具準確率數字為版本問答證據。
- 限制與領域落差：場域是助理工具呼叫與偏好參數，不是 Minecraft 版本知識。成功是工具參數正確，不是引用可驗與版本一致。合成管線產生的記憶鏈與真實版本演進史不同。作者自陳限制：限離線工具呼叫生成、固定模型家族、無互動執行回饋。
- 吃掉的新穎性：吃掉記憶到行動落差的評測話語權。

### A5. APEX-MEM（Banerjee et al.）

- 題名與作者：APEX-MEM: Agentic Semi-Structured Memory with Temporal Reasoning for Long-Term Conversational AI，Pratyay Banerjee、Masud Moshtaghi、Shivashankar Subramanian、Amita Misra、Ankit Chadha（Amazon AGI）。共 5 人。
- 出版與狀態：[arXiv:2604.14362](https://arxiv.org/abs/2604.14362)，v1 2026-04-15，ACL 2026 Mains。code 全文未提供。LOCOMO 問答 88.88%，LongMemEval 86.2%。
- 已解問題：以屬性圖加領域無關本體（35 類，實體、事實、事件三元組，ISO 時間加信心加證據），把對話存成時間錨定的事件，append only 保留演化史，檢索期再解決衝突。以 ReAct agent 配四工具分工（schema 檢視、實體查、圖 SQL 多跳、混合子圖搜尋），建構用大模型抽事實、小模型解實體，LOCOMO 全量建圖、長記憶評測用線上閾值建圖，在三評測上全面勝過去基線。
- 借用：append only 保留史、檢索期解決衝突、時間錨定事件的概念形狀，實體連結加圖查詢加子圖搜尋的分工形狀。
- 不得宣稱：不得宣稱 append only 事件史是新的。不得宣稱檢索期衝突解決與時序屬性圖是首創。不得搬 LOCOMO 與 LongMemEval 數字為版本收益。
- 限制與領域落差：它是會話記憶，實體與事件本體是通用對話導向，沒有版本 scope、依賴圖、verified 狀態。Corrobora 的時間是版本時間（revision_at 與適用版本區間），不是對話輪次時間。作者自陳只評問答，事件摘要與多模態生成是未來工作。
- 吃掉的新穎性：吃掉時序屬性圖加 append only 的通用形狀宣稱，殘餘只剩版本語意層。

### A6. Learning How to Remember: Meta-Cognitive Management，MCMA（Liang et al.）

- 題名與作者：Learning How to Remember: A Meta-Cognitive Management Method for Structured and Transferable Agent Memory（登記簿簡寫 Meta-Cognitive Management），Sirui Liang、Pengfei Cao、Jian Zhao、Wenhao Teng、Xiangwen Liao、Jun Zhao、Kang Liu（中科院自動化所等）。共 7 人，簡稱 MCMA。
- 出版與狀態：[arXiv:2601.07470](https://arxiv.org/abs/2601.07470)，2026-01-12 v1 preprint，無 venue。code 見 LiangThree/MCMA。
- 已解問題：把記憶抽象本身當可學習的認知技能。任務模型凍結，另訓記憶 copilot（先監督微調再做偏好優化，成功摘要與失敗反思分開訓成雙 copilot）：每條軌跡生成多個複合結構記憶（自然文本、鍵值、鏈、樹四種基元），按下游效用選分布並學抽象粒度；記憶按兩層組織（原始軌跡、情節層、腳本層），新任務按相似度跨層選用（高相似用低層細節，低相似用高層抽象），無可用記憶時直接遷移 copilot 本身。主實驗在 ALFWorld 與 ScienceWorld（摘要另提 BabyAI 但主表無數字，引用時以主表為準），在 Qwen3-8B 與 32B 上全面勝過無記憶與多種基線，且 32B 訓出的 copilot 直搬 Gemini 與 GPT 小模型仍保有近原增益。
- 借用：抽象層級按相似度選用的觀念（高低相似對應低高抽象層），成功加失敗雙 copilot 分工，負遷移需要顯式處理的教訓。
- 不得宣稱：不得宣稱動態抽象層級是新的。不得宣稱記憶抽象可遷移與跨模型搬移是首創。不得搬家務與科學任務成功率為版本審查收益。
- 限制與領域落差：主實驗場是 ALFWorld 類家務與科學小任務，抽象是程序泛化層級，不是版本差異層。遷移是跨任務分布，沒有引用與證據約束。
- 吃掉的新穎性：吃掉可學習的動態抽象加 copilot 能力遷移的宣稱。

### A7. Adaptive Memory Admission Control，A-MAC（Zhang et al.）

- 題名與作者：Adaptive Memory Admission Control，Guilin Zhang、Wei Jiang、Xiejiashan Wang、Aisha Behr、Kai Zhao、Jeffrey Friedman、Xu Chu、Amine Anoun（Workday AI）。共 8 人，簡稱 A-MAC。
- 出版與狀態：[arXiv:2603.04549](https://arxiv.org/abs/2603.04549)，2026-03-04 v1 preprint，無 venue。code 見 GuilinDev/Adaptive_Memory_Admission_Control_LLM_Agents。
- 已解問題：把准入當顯式標量決策：候選先做原子化加共指時間消解加寒暄過濾，再算五因子加權分（未來效用、事實信心、語意新穎、時間新近、內容型別先驗），達閾值才准入；語意相近但內容異的衝突留高分者並合併。關鍵寫準：僅未來效用用 LLM 評（其餘四項全規則計算），閾值經交叉驗證學得，最優約 0.55在平頂區穩健。在 LoCoMo 上 F1 0.583（精確率低、召回率高），勝過去記憶基線，延遲降約三成（因只調一次 LLM）；消融顯示內容型別先驗最主導，去之等同等權重基線。
- 借用：准入是顯式閘門的立場，五因子分解的檢查表形狀，規則算可算的、LLM 只算語意效用的混合成本形狀。
- 不得宣稱：不得宣稱准入控制本身是新的。A-MAC 之後，任何無閘門全收的設計都不能說是合理預設。不得搬 F1 與延遲數字為版本審查收益。
- 限制與領域落差：它是會話長期記憶，LoCoMo 問答導向，沒有版本審查、依賴檢查、verified 狀態機。事實信心是對話支撐跨度，不是引用存在性與 held-out 實測。Corrobora 的准入若要主張新穎，只能放在版本 scope 加依賴加審查的三合一閘門，且需實測證明。
- 吃掉的新穎性：吃掉准入控制的通用宣稱。

### A8. MemCompiler: Compile Don't Inject（Ding et al.）

- 題名與作者：MemCompiler: Compile, Don't Inject -- State-Conditioned Memory for Embodied Agents，Xin Ding、Xinrui Wang、Yifan Yang、Hao Wu、Shiqi Jiang、Qianxi Zhang、Liang Mi、Hanxin Zhu、Kun Li、Yunxin Liu、Zhibo Chen、Ting Cao（USTC、HUST、MSRA、南大、清華 AIR）。共 12 人。
- 出版與狀態：[arXiv:2605.07594](https://arxiv.org/abs/2605.07594)，2026-05-08 v1 preprint（abs 已有 05-14 v2，引用註明 v1），無 venue。
- 已解問題：命名並證偽整包記憶注入（episode 開頭整包記憶注入）：注意力分析顯示執行器對記憶 token 的關注隨步單調衰減，狀態條件編譯版則保持平穩。改為每步依簡報狀態編譯：任務記憶只當原始碼庫，每步按任務進度（目標、已完成、當前、待辦）加環境信念（已知物位置、自身狀態、環境事實）兩維選編譯輸出四選一（經驗、簡報差量、兩者混合、無適用則空跑）。另設軟記憶潛通道（文字先行、潛向量經高斯映射銜接執行器空間，帶語意對齊加互補約束防塌成文字複本），以監督三損失加群體相對策略優化訓練、執行器凍結。在 AlfWorld、EmbodiedBench、ScienceWorld 上開源骨幹全面勝無記憶（最高約一到三成增益），同級模型加編譯可匹敵閉源旗艦；整包注入常把小執行器拖到無記憶以下；執行器輸入 token 與單步延遲降約六成。
- 借用：靜態整包注入會脫節的反例，依簡報狀態每步編譯篩選的觀念，文字難表達感知資訊需另通道的教訓。
- 不得宣稱：不得宣稱狀態條件編譯是新的。不得宣稱整包注入有害與雙通道是本計畫發現。不得搬增益與延遲數字為版本審查收益。
- 限制與領域落差：場域是 embodied 逐步執行，狀態是當下觀測加進度，不是研究問題的版本上下文。編譯器需監督加強化訓練環路，Corrobora 目前沒有該訓練環路。軟記憶潛 token 依賴執行器嵌入空間，不可直搬 PG 與 Qdrant 架構。
- 吃掉的新穎性：吃掉狀態條件編譯的宣稱。

### A9. A-MEM（Xu et al.）

- 題名與作者：A-MEM: Agentic Memory for LLM Agents，Wujiang Xu、Zujie Liang、Kai Mei、Hang Gao、Juntao Tan、Yongfeng Zhang（Rutgers、Ant Group、Salesforce Research）。共 6 人。
- 出版與狀態：[arXiv:2502.12110](https://arxiv.org/abs/2502.12110)，v1 2025-02-17（現 v11 2025-10-08），NeurIPS 2025。LoCoMo 評測常用基線。
- 已解問題：卡片盒式 agent 記憶三機制：筆記建構（每筆七元組：原文、時間、關鍵詞、標籤、脈絡描述、向量、連結集，向量取四欄拼接編碼）；連結生成（先餘弦取近鄰粗篩，再由 LLM 判連，非純相似度）；記憶演化（新記憶觸發 LLM 重寫舊筆記的關鍵詞標籤脈絡並取代原筆）。在 LoCoMo 長對話（七千餘問答，五類題）上多跳題至少翻倍，token 用量約降一個量級；消融證連結是基礎、演化補精修。
- 借用：筆記連結與演化的工程形狀（粗篩加 LLM 精判連加舊筆重寫），僅此而已。
- 不得宣稱：不得宣稱動態連結與記憶演化是新的。不得引多跳翻倍與 token 節省為 Corrobora 版本推理有效證據。後續系統性評測顯示其建構成本高而精度未必勝過強檢索基線，不可引為效能證據。
- 限制與領域落差：通用對話與任務記憶，無版本語意，無審查狀態機。演化依賴 LLM 重寫舊筆，無 verified 閘門，易漂移。
- 吃掉的新穎性：吃掉動態連結記憶的通用宣稱。

## B. 經驗、失敗與有害記憶組

### B1. XENON: Experience-based Knowledge Correction for Robust Planning in Minecraft（Lee et al.）

- 題名與作者：Experience-based Knowledge Correction for Robust Planning in Minecraft，Seungjoon Lee、Suhwan Kim、Minhyeon Oh、Youngsik Yoon、Jungseul Ok（POSTECH）。共 5 人。
- 出版與狀態：[arXiv:2505.24157](https://arxiv.org/abs/2505.24157)，v1 2025-05-30 初版題為 REPOA 版，v3 2026-02-18 改為現題，ICLR 2026。code 見 ml-postech/XENON。引用方法與數字須以 v3 與會議版為準，不可引 v1。
- 已解問題：在只有二元成功失敗回饋、不靠 LLM 自我修正的前提下，以演算法直接修正外部知識記憶做規劃。自適應依賴圖管依賴（LLM 預測初始化，修訂計數超閾判不可接納並為後代另開路，否則以類比補需求）；失敗感知動作記憶管動作（每動作記成功失敗數，失敗顯著超成功判無效，無有效動作才問 LLM，累積失敗達閾值才觸發依賴修訂），藉此區分失敗來自依賴錯或動作錯。實驗擴為三環境（MineRL、Mineflayer、MC-TextWorld），以 7B 規劃器在長程任務上超大參數基線，但紅石組學得版掛零，顯示修正亦有覆蓋盲區。
- 借用：依賴錯與動作錯要分開歸因的觀念，成功修依賴、失敗計數修動作的分工形狀，過度修訂即判不可接納並另開路的形狀。
- 不得宣稱：不得宣稱 Minecraft 加失敗記憶是新的。不得宣稱依賴圖從經驗修正是首創。不得宣稱 7B 勝大模型是通用結論（僅該 benchmark 與控制器組合下的報告值）。XENON 之後，Minecraft 規劃知識的經驗修正話語權已被佔據。
- 限制與領域落差：XENON 的依賴是物品合成依賴（鑽石鎬需鑽石加木棍之類），動作是遊戲內可執行操作。Corrobora 的依賴是研究結論之間的引用與版本適用關係，知識物件完全不同。驗證是規劃成功率，不是引用可驗與版本一致性。兩者不能互換證據。
- 吃掉的新穎性：吃掉 Minecraft 加失敗記憶整塊宣稱，Corrobora 殘餘只剩版本化研究記憶這一層。

### B2. Agent Skills Can Be Harmful（Dong et al.）

- 題名與作者：Agent Skills Can Be Harmful: An Empirical Study of Skill-Induced Failures in LLM Agents，Gen Dong、Yanjie Gao、Liqun Li、Tianyin Xu、Yu Hua、Fan Yang（華科、微軟研究院、微軟、UIUC）。共 6 人。
- 出版與狀態：[arXiv:2608.11888](https://arxiv.org/abs/2608.11888)，2026-08-12 v1 preprint，無 venue。
- 已解問題：以差分歸因把失敗算到載入的技能頭上（被審技能對無技能或語意相近技能，同任務同驗證器僅技能設置不同）。功能失敗定義被審失敗而參照通過；效率退化只看雙通過且 token 與時間雙增至少一項翻倍。經語意相近技能擴增、候選篩選、人工逐案定根因，定稿 307 確認案例等於功能 125 加效率 182（非技能個數）。根因以任務實作故障最大（近七成功能例），效率以過度程序最大（逾六成，過度驗證加過重管線），上下文開銷幾乎全由強制技能正文造成。另建三階段自動分類器，功能分類九成以上，效率約八成。
- 借用：差分歸因的方法形狀（有技能跑對無技能或語意相近技能參照跑），有害重用分功能失敗與效率退化分開報，雙增閾值的保守性觀念。
- 不得宣稱：不得宣稱發現技能重用有害。不得宣稱技能篩選必要性是本計畫見解。不得把 307 例讀成 307 個技能。不得搬 token 與時間倍數到 Corrobora 成本論證。
- 限制與領域落差：場域是通用 agent 技能包與程式驗證器，不是版本化研究結論。有害是多做或做錯實作，Corrobora 的有害是引用了過時或錯版結論。方向可借，數字不可搬。
- 吃掉的新穎性：吃掉技能有害的發現類宣稱。

### B3. MemoryGraft（Srivastava and He）

- 題名與作者：MemoryGraft: Persistent Compromise of LLM Agents via Poisoned Experience Retrieval，Saksham Sahai Srivastava、Haoyu He（喬治亞大學）。共 2 人。
- 出版與狀態：[arXiv:2512.16962](https://arxiv.org/abs/2512.16962)，2025-12-18 v1 preprint（14 頁），無 venue。code 見 Jacobhhy/Agent-Memory-Poisoning。
- 已解問題：攻擊者以良性攝入物誘使 agent 寫入看似成功驗證的惡意經驗，之後靠語意相似被檢索並模仿，造成跨 session 行為漂移，重點是經驗信任邊界，不是事實污染。機制上記憶檢索為字面加向量並集，毒種子遠少於良性種子，建庫持久化後無需攻擊者再介入；實驗以百餘種子中十餘毒、每次取三、十餘條探針，近半檢出為毒，並集雙通道互為放大器，毒佔比雖小但穿透跨異質任務。緩解提密碼學溯源簽章，能力邊界限於供文件誘執行、不能直寫記憶庫。
- 借用：經驗即攻擊面的觀念，成功經驗不可默認可信，寫入來源需區分的立場。
- 不得宣稱：不得宣稱發現經驗記憶的信任邊界問題。不得引毒檢出率為任何 Corrobora 檢索或重用法有效的證據。不得把毒化比例當通用數。
- 限制與領域落差：它是安全攻擊論文，不是記憶效能論文。可借其立場要求寫入來源標記與審查，但不能引它證明任何檢索或重用法有效。
- 吃掉的新穎性：吃掉經驗投毒攻擊面的問題意識宣稱。

### B4. Dependency-Guided Rollback（Yu et al.）

- 題名與作者：From Faulty Memories to Corrected Actions: Dependency-Guided Rollback Repair for Memory-Augmented Agents（登記簿簡寫 Dependency-Guided Rollback），Caili Yu、Yiqi Wang（通訊）、Jiaqi Zhang、Yiqun Duan、Mingkai Zheng、Zhangkai Wu、Kaize Shi、Taotao Cai。共 8 人。
- 出版與狀態：[arXiv:2608.10502](https://arxiv.org/abs/2608.10502)，2026-08-11 v1 preprint，無 venue。
- 已解問題：故障記憶已被使用後該怎麼辦（上游偵測器已給故障集，診斷本身不在範圍，執行期須有溯源）。五階段：建型別化記憶到行動異構圖，前向可達取過近似候選，獨立支撐檢查分保留與未支撐，規則規劃定刪除集隔離集失效步與答案相關集，其餘安全節點保留，按原軌跡序選擇性重播。在 150 例可控 benchmark 上回復率逾八成五、良性全保留、重播僅約一成、呼叫數省四成，但復發率非最低、主張分在可控集落後；消融證規劃器主管回復、支撐檢查主管保良節流、選擇性重播主管成本；遷移集掉近兩成，作者自陳可控集是上界非部署估計。
- 借用：刪源頭不等於修下游的觀念，影響範圍追蹤加獨立支撐保留加選擇性重播的形狀。
- 不得宣稱：不得宣稱依賴感知回復是新的。Corrobora 的失效處置若只做到刪源頭，在該工作之後會被視為不完整。不得引回復率為 Corrobora 預期值，不得隱藏復發率與主張分的但書。
- 限制與領域落差：場域是工具使用型 agent 的答案回復，不是版本化知識庫的審查狀態轉換。provenance 是執行期追蹤，Corrobora 的依賴是跨版本引用圖。其回滾不能撤銷不可逆外部副作用。成本數字不可搬。
- 吃掉的新穎性：吃掉依賴感知回復的通用宣稱。

### B5. Negative Knowledge as Failure-aware Shared Memory（Wang）

- 題名與作者：Negative Knowledge as Failure-aware Shared Memory for AutoResearch，Hanchun Wang 單一作者（Cambridge DAMTP）。共 1 人。
- 出版與狀態：[arXiv:2606.21024](https://arxiv.org/abs/2606.21024)，v1 2026-06-19，13 頁，無 venue。code 見 hch-wang/Negative_Knowledge。
- 已解問題：以 curator agent 把已結束嘗試的凍結產物轉成有界型別化記錄存入共享庫，下游研究 agent 開新實驗前必須逐筆標接受或拒絕並寫理由，再提下一個實驗。策展與執行分離以避自我辯護偏誤，整庫可 inline 傳給 agent，封閉詞表迫使策展承諾失敗類別。同任務重試上普通重試無增益、失敗庫小勝、自除錯三輪更高、深蒸一筆最高且 token 最省；跨任務上基線全滅、純正向庫僅過一子任務、含失敗庫三子任務全過，跨系統亦由零到半數。
- 借用：嘗試級加有界加型別化的 schema 形狀，策展與執行分離的設計，下游顯式接受或拒絕加理由的接地流程。
- 不得宣稱：不得宣稱結構化失敗庫是新的。不得宣稱失敗可遷移是本計畫發現。不得把 token 省量或 PDE 成功數搬成 Corrobora 預期收益。
- 限制與領域落差：記錄欄位是任務、路線、觀測、失敗、理由、替代建議五類封閉詞表，無版本 scope、引用存在性、verified 狀態機。遷移是相近 PDE 之間的方法警告可攜，不是同一知識在不同版本下真值變化的版本語意。樣本小、僅測單一模型家族。
- 吃掉的新穎性：吃掉失敗結構化為跨 agent 跨任務共享資產的宣稱。

### B6. SkillLearnBench（Zhong et al.）

- 題名與作者：SkillLearnBench: Benchmarking Continual Learning Methods for Agent Skill Generation on Real-World Tasks，Shanshan Zhong、Yi Lu、Jingjie Ning、Yibing Wan、Lihan Feng、Yuyi Ao、Leonardo F. R. Ribeiro、Markus Dreyer、Sean Ammirati、Chenyan Xiong（CMU 加 Amazon AGI）。共 10 人。
- 出版與狀態：[arXiv:2604.20087](https://arxiv.org/abs/2604.20087)，v1 2026-04-22，preprint 無 venue。code 見 cxcscmu/SkillLearnBench。
- 已解問題：比較 one-shot、自回饋、教師回饋、結構化多階段管線四種從經驗產技能的方法。技能依賴准入公式：無技能十次通過率不過半、且有人工技能至少成功一次才收。20 任務、百實例、六大類十五子域，三層評估為技能品質（覆蓋、可用、安全）、軌跡（對齊、使用率）、結果（驗證器準確率加 token 效率）。主結論：四法皆勝無技能基線但無一通吃，最佳法只補上約四成五的人工差距，換更強骨幹增益不穩，流程清晰可重用任務有效、開放任務可持平甚至變差，多輪迭代只有靠外部回饋才真改善，自回饋 alone 致遞迴漂移。
- 借用：自回饋會漂移的教訓，三層評估的形狀（產物、過程、結果分開看），無技能解不出加有技能解得出的篩選公式。
- 不得宣稱：不得宣稱自動技能生成是新的。不得宣稱自回饋漂移是本計畫發現。不得把差距數字搬成 Corrobora 預期值。
- 限制與領域落差：場域是通用真實技能（程式、文字、影音、檔案操作），不是 Minecraft 技術結論。技能是 Markdown 程序包，驗收是確定性驗證器通過與否，不是引用可驗與版本一致。
- 吃掉的新穎性：吃掉自動技能生成的評測話語權。

### B7. ExpeL（Zhao et al., AAAI 2024）

- 題名與作者：ExpeL: LLM Agents Are Experiential Learners，Andrew Zhao、Daniel Huang、Quentin Xu、Matthieu Lin、Yong-Jin Liu、Gao Huang（清華）。共 6 人。
- 出版與狀態：[arXiv:2308.10144](https://arxiv.org/abs/2308.10144)，v1 2023-08-20（v3 2023-12 加註 AAAI-24 接收），AAAI-24 口頭。code 見 [LeapLabTHU/ExpeL](https://github.com/LeapLabTHU/ExpeL)。
- 已解問題：無參數更新的經驗學習三段式：用重試收集訓練任務經驗入池（向量索引按任務相似度取成功軌跡），用大模型對成敗對做洞見萃取（新增初值 2 分，贊成與改寫加 1，踩減 1，歸零刪除，抽取器用強模型少幻覺），推理期任務說明串接洞見加動態取回成功軌跡當示例、單試作答。主結果呈雙通道互補（問答偏抽象通道、家務偏軌跡通道），單試打平或勝多試重試基線，另有跨資料集的洞見遷移設定。主對比是洞見對軌跡與對重試基線，非人工手寫（原條目該句降級）。
- 借用：洞見抽象加成功軌跡具例的雙通道分類視角，計數器式留存的形狀，重試只管單任務內、經驗學習管跨任務累積的區分。
- 不得宣稱：不得宣稱雙通道是新的。ExpeL 之後的 reflection 寫法只能當候選詮釋之一，不可當成功才保留或反思有效的證據。它的 reflection 加入 insight 反而有害的細節，與 13 之 F 節一致。
- 限制與領域落差：場域是問答與家務任務，insight 是通用推理提示，不是版本化結論。取回按任務語意相似度，不做版本 scope 與依賴檢查。作者自陳僅文字觀測、閉源 API、洞見全塞上下文。Minecraft 機制題偏抽象、機器操作偏軌跡只是類比假設，未經 pilot 不可當定論。
- 吃掉的新穎性：吃掉 insight 計數留存的通用形狀。

### B8. Reflexion 與 Generative Agents（背景，候選詮釋）

- 題名與作者：Reflexion: Language Agents with Verbal Reinforcement Learning，Shinn 等人（初版 3 人，會議版 6 人）；Generative Agents: Interactive Simulacra of Human Behavior，Joon Sung Park、Joseph C. O'Brien、Carrie J. Cai、Meredith Ringel Morris、Percy Liang、Michael S. Bernstein（Stanford 加 Google）。共 6 加 6 人。
- 出版與狀態：[arXiv:2303.11366](https://arxiv.org/abs/2303.11366)，NeurIPS 2023（arXiv 頁無註記，靠官方 proceedings 補）；[arXiv:2304.03442](https://arxiv.org/abs/2304.03442)，UIST 2023（靠 ACM DL 補）。
- 已解問題：verbal reflection 重試（三模型分工：行動、評分、反思，上限通常一到三次，啟發式觸發反思並重置重試，二值獎勵），memory stream 加關聯加新近加重要三因子取回加反思加計畫（25 agent 小鎮沙盒，單一播種自主擴散，消融缺一不可，最常見破損是取回失敗與記憶添飾）。
- 借用：僅借名詞與問題意識，不借有效性主張。
- 不得宣稱：不得以這兩篇證明反思或重試有效（初版與會議版數字互異，任一皆不可引為 Corrobora 證據）。後續工作（含 ReMe 與 Experience-Following）已顯示反思可幻覺、重試可燒錢，此處一律降為候選詮釋。
- 限制與領域落差：通用家務問答小鎮社交，與版本化技術記憶無直接對應。小鎮評價是可信度訪談與湧現社交，不是任務成功率。
- 吃掉的新穎性：不吃掉任何新穎性，只負責排除錯誤引用。

### B9. Dream-RSI（Zheng et al.）

- 題名與作者：Dream-RSI: Recursive Self-Improvement through Evolving Worlds，Zheng 等人（Tong Zheng 等 17 人，UMD、Google DeepMind、UVA 等）。
- 出版與狀態：[arXiv:2609.14858](https://arxiv.org/abs/2609.14858)，2026 年 9 月 14 日 v1 preprint，無 venue。12 頁。code 見 [zhengkid/Dream-RSI](https://github.com/zhengkid/Dream-RSI)。
- 已解問題：把探索策略本身當可改寫的執行碼，以輕量編排層控制分支、並行批量與停止（共享決策介面，底層 coding agent 與 evaluator 不動）；以歷史發現樹建 replay simulator 做 dreaming，replay 目標為發現品質減執行成本加並行獎勵，在同一歷史上離線評估 M 個候選策略版並選最優再部署回線上，形成 RSI 迴圈。以 Gemini-3.1-Pro／Gemini-3.7-Flash 經 Gemini CLI 在三域 8 任務驗證：Lasso 任務以 317 calls 達平均 2931.0ms（固定探索基線 550 calls／3587.1ms，約省 1.7 倍，相對 SimpleTES 51,200 generations 省約兩個量級）；數學三題 Sum-Diff 1.145427、Circle Packing 2.635983、Autocorrelation 1.456375（千代以內）；KernelBench 四核 VGG16／LayerNorm 省 2.43／1.79 倍 generations，ConvDiv／ConvMax 同預算高 2.09／1.44 倍。
- 借用：探索策略可編程分層的觀念，歷史發現樹即 replay simulator 的形狀（分支子集、順序、並行分組、停止皆可在樹上重走而不重跑），replay 目標三項式（品質減成本加並行獎勵）的形狀，線上發現與離線 dreaming 交替的迴圈形狀。
- 不得宣稱：不得宣稱自改進探索迴圈是新的。不得宣稱以 replay simulator 做 off-policy 評估是本計畫首創。不得引它的降本與加速數字為 Corrobora 的預期收益（對象是 solver／kernel 發現成本，不是版本審查成本）。
- 限制與領域落差：場域是演算法、數學優化、GPU kernel 的發現式工程任務，探索對象是解空間策略，replay 只能重走已實現分支、不能生成樹外結果。回饋是發現品質與成本，沒有版本 scope、引用存在性檢查、verified 狀態機。對照基線 Recursive Fixed Exploration 與本法共用同一初始策略與每輪預算，首輪行為一致、次輪才分叉，此 ablation 形狀可借，數字不可搬。
- 吃掉的新穎性：吃掉自改進探索迴圈加 replay 評估的通用形狀宣稱。

## C. 評測與標記組

### C1. LongMemEval（Wu et al., ICLR 2025）

- 題名與作者：LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory，Di Wu、Hongwei Wang、Wenhao Yu、Yuwei Zhang、Kai-Wei Chang、Dong Yu（UCLA 加 Tencent AI Lab）。共 6 人。
- 出版與狀態：[arXiv:2410.10813](https://arxiv.org/abs/2410.10813)，v1 2024-10-14，ICLR 2025。code 見 [xiaowu0162/LongMemEval](https://github.com/xiaowu0162/LongMemEval)。
- 已解問題：500 題人工改寫題測五能力（抽取、多 session 推理、時序推理、知識更新、拒答），歷史為模型自聊加人工編修的任務型多輪對話、證據間接埋入，長度可自由擴展。以新版模型作評審（與人類一致九成七以上）另報召回指標。短歷史 pilot 上商用助手掉三成；長檔上四個長上下文模型比僅給證據的 oracle 設定掉三到六成。統一框架拆四控制點：輪粒度優於整段；事實增強鍵擴展使召回加約四成中的四分之一、下游問答加約二十分之一；時間感知索引加查詢擴展使時序召回加約一成上下；筆記鏈加結構化提示在三模型上閱讀最高加十個絕對點。
- 借用：五能力的出題分類，拒答對應 refusal，知識更新對應版本題，time-aware 擴展的觀念，證據間接埋入的出題法。
- 不得宣稱：不得宣稱五能力分類是新的。不得宣稱 time-aware 有效是本計畫發現。鍵擴展與時間感知的增益數字須按上列寫，不可一概寫約一成。
- 限制與領域落差：場域是通用長程對話，更新是事實替換（單一真值覆寫），不是版本區間並存。Corrobora 的版本比較是同一知識在多版本下各有真值，與其單一更新語意不同。時間是 session 時間戳，不是 revision_at 加適用版本區間。
- 吃掉的新穎性：吃掉長期記憶評測分類與 time-aware 檢索優化的話語權。

### C2. SealQA（Pham et al., ICLR 2026）

- 題名與作者：SealQA: Raising the Bar for Reasoning in Search-Augmented Language Models，Thinh Pham、Nguyen Nguyen、Pratibha Zunjare、Weiyuan Chen、Yu-Min Tseng、Tu Vu（Virginia Tech）。共 6 人。
- 出版與狀態：[arXiv:2506.01062](https://arxiv.org/abs/2506.01062)，v1 2025-06-01，ICLR 2026。資料集在 vtllms/sealqa。引用須註版本（初版最強為 o3 的一成七，新版 GPT-5 加工具有四成多，兩版數字不同）。
- 已解問題：三味評測：主集百餘題（對當時聊天模型近零正確的對抗篩選集）、難集二百餘題、長上下文版（1 金加至多 50 硬負例、七千餘文件）。題型分高階推理、實體事件消歧、時序追蹤、跨語言、偽前提，新鮮度分永恆、慢變、快變。以新版模型作自動評審（與人工一致九成八）。初版最高為 o3 系一成七，深度思考模型反跌，加搜尋的推理模型在主集多為個位數；加測時算力在主集呈平台甚至越高校差、無可靠增益；長上下文版金放首位仍隨負例增而崩；人類子集平均二成三、最高三成，僅最高推理模型超平均。
- 借用：衝突與噪聲檢索題的出題法（衝突對無用分層），有害重用的問題意識，測時算力不可靠增益的反例形狀。
- 不得宣稱：不得宣稱發現檢索噪聲有害。不得以任一版本數字主張前沿上限而不註版本與搜尋條件。
- 限制與領域落差：場域是開放檢索問答，不是版本化記憶。衝突是檢索結果互斥，Corrobora 的衝突多是版本適用範圍不同，處理方向不同。長上下文版的干擾是搜尋前十加舊文加合成查詢，非版本演進史。
- 吃掉的新穎性：吃掉噪聲有害與測時擴展不可靠增益的觀察類宣稱。

### C3. ARES（Saad-Falcon et al., NAACL 2024）

- 題名與作者：ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems，Jon Saad-Falcon、Omar Khattab、Christopher Potts、Matei Zaharia（Stanford 加 UC Berkeley 與 Databricks）。共 4 人。
- 出版與狀態：[ACL Anthology 2024.naacl-long.20](https://aclanthology.org/2024.naacl-long.20)，NAACL 2024 long，338–354 頁，Mexico City。code 見 [stanford-futuredata/ARES](https://github.com/stanford-futuredata/ARES)，另見預印本 [arXiv:2311.09476](https://arxiv.org/abs/2311.09476)。預印 6 任務、會議版擴為 8 任務，引用須註版本。
- 已解問題：三維評測（上下文關聯、答案忠實、答案關聯），管線三段：大模型由語料段生合成問答（示例加取回過濾），輕量判別模型做二分類（對比正負例、驗證損失停滯即停），再以預測驅動推論用小標註集學修正子、把大批無標註預測校準為可信區間取中點排名。在九檔模擬系統上，上下文與答案關聯準確率平均高 RAGAS 約六成與一成四，排序相關亦高；人標低於百餘即排名崩；換查詢與文件型別仍有效但判別器需重訓；忠實維因缺幻覺人標答案未測。
- 借用：只借小標註加 PPI 的方法形狀（合成、判別、可信區間三段）。
- 不得宣稱：不得宣稱 150 筆固定足夠（該數已是下界且上下文維已掉）。實際所需筆數由 pilot 的變異數與效應量決定，固定寫 150 充分是錯誤引用。不得宣稱 judge 可取代人工盲評，人工為準的原則不變。
- 限制與領域落差：原驗證場是問答與常識評測集，不是版本化技術評測，跨域轉移不等於跨到 Minecraft 版本語意有效，judge 在版本題上的偏差需另測。
- 吃掉的新穎性：吃掉小標註可信評測的方法宣稱，殘餘只剩版本題上的實測校準。

### C4. FreshLLMs（提出 FreshQA benchmark）（Vu et al., Findings ACL 2024）

- 題名與作者：FreshLLMs: Refreshing Large Language Models with Search Engine Augmentation（內含 FreshQA benchmark），Tu Vu、Mohit Iyyer、Xuezhi Wang、Noah Constant、Jerry Wei、Jason Wei、Chris Tar、Yun-Hsuan Sung、Denny Zhou、Quoc Le、Thang Luong（Google 為主）。共 11 人。
- 出版與狀態：[ACL Anthology 2024.findings-acl.813](https://aclanthology.org/2024.findings-acl.813)，Findings of ACL 2024，13697–13720 頁。另有同題預印本 [arXiv:2310.03214](https://arxiv.org/abs/2310.03214)，code 見 [freshllms/freshqa](https://github.com/freshllms/freshqa)。600 題等於測試 500（四類各 125：永恆、慢變、快變、偽前提）加開發 100 加示例 15。
- 已解問題：雙軌人評（五萬餘 judgments，雙人一致寬鬆近全同、嚴格九成六以上）：寬鬆只看主答案對，嚴格要求全段無任何幻覺與過時（多一句錯即零分，偽前提須指偽）。基線快變題全滅（旗艦亦不過一成五），偽前提上中小模型呈平坦零分，思維鏈因冗長反增幻覺（寬鬆贏、嚴格輸）。搜尋增強提示法（取答案框加自然結果加知識圖加眾包問答，按舊到新排序，配示例加前提檢查）使旗艦嚴格與寬鬆各升約五成與三成、兩軌差距由近二成縮至約二分，勝自問法與當時商用系統；證據數與新者在尾、簡潔作答皆降幻覺，冗長示例反增幻覺。另有自動評審供快速比對。
- 借用：正確性與無幻覺分開報的計分形狀，前提檢查提示形狀，偽前提題型觀念。
- 不得宣稱：不得宣稱雙軌計分是新的。不得把搜尋增強數字搬為 Corrobora 預期收益。
- 限制與領域落差：場域是快變世界知識，不是版本化遊戲機制，false premise 題型可借但來源與驗收不同。週級快變題已被排除，與版本高頻改動語意不同。
- 吃掉的新穎性：吃掉雙軌計分與前提檢查的通用形狀。

### C5. MQuAKE（Zhong et al., EMNLP 2023）

- 題名與作者：MQuAKE: Assessing Knowledge Editing in Language Models via Multi-Hop Questions，Zexuan Zhong、Zhengxuan Wu（共同一作）、Christopher D. Manning、Christopher Potts、Danqi Chen（Princeton 加 Stanford）。共 5 人。
- 出版與狀態：[arXiv:2305.14795](https://arxiv.org/abs/2305.14795)，v1 2023-05-24，EMNLP 2023 main。code 見 princeton-nlp/MQuAKE。
- 已解問題：每例為編輯集加三個多跳問句加改前後答案與事實鏈。反事實集九千餘例（二三四跳分層），真實時差集千餘例。指標三層：單編輯成功率、整鏈單跳全對、多跳準確率（三問對一即算對，主指標）。改權重法單編輯可達九成以上，多跳全滅（基線四成多掉到個位數，思維鏈亦多不過二成；編輯數放大更崩）；外部記憶法（編輯外存加逐步分解子問加暫答加檢索最相關編輯做矛盾自檢）可擴展至千億級黑盒模型、大幅勝改權重路線。核心論點正是單跳高分對多跳崩的對比，不可省略。
- 借用：只借外部記憶路線的論據與受影響對未受影響對照題形，三層指標形狀。
- 不得宣稱：不得宣稱外部記憶路線選擇是本計畫的原創論證。不得引單跳高分證明編輯成功。
- 限制與領域落差：場域是單一事實替換後的多跳漣漪，與版本並存語意不同。Corrobora 是同知識多版本各有真值加範圍並存，不能引它證明版本推理有效。
- 吃掉的新穎性：吃掉改權重不可行的論據宣稱。

### C6. HELMET（Yen et al., ICLR 2025）

- 題名與作者：HELMET: How to Evaluate Long-Context Language Models Effectively and Thoroughly，Howard Yen、Tianyu Gao、Minmin Hou、Ke Ding、Daniel Fleischer、Peter Izsak、Moshe Wasserblat、Danqi Chen（Princeton 加 Intel）。共 8 人。
- 出版與狀態：[arXiv:2410.02694](https://arxiv.org/abs/2410.02694)，v1 2024-10-03 為 51 模型，v3 擴充為 59 模型，ICLR 2025。code 見 princeton-nlp/HELMET。引用模型數須註版本。
- 已解問題：七類應用中心評測（檢索問答、引用、重排、長問答、摘要、多示例上下文學習、合成召回），輸入長度 8K 到 128K 可控。敘事問答與摘要用新版模型作參照評分（先拆原子主張再算精確率召回，主張級一致近九成），其餘仍用傳統指標。結論：合成召回與真實任務相關一律不高，重排平均分低下；檢索問答與下游相關最高；超長下閉源在引用與重排領先開源最佳約三到四成；推薦以檢索問答作日常迭代代理（易跑、相關高、相容基底模型），但最終仍須全套整體評估。上下文學習類甚至出現開源反超閉源，任何閉源全勝引述皆不成立。
- 借用：以 RAG 類任務做快速迭代、正式比較才跑全套的節奏，示例降格式噪聲、基底模型可測的提示工程形狀。
- 不得宣稱：不得宣稱該節奏是新的。不得宣稱合成召回不可當主要證據是本計畫發現。不得把檢索最便宜當原文主張，原文是易跑加相關加相容三者兼顧。
- 限制與領域落差：通用長上下文評測，與版本語意無關。超長下的開閉源差距與一致係數皆不可搬到版本題。
- 吃掉的新穎性：吃掉以合成召回為主證據的評測節奏宣稱，殘餘只剩版本題上的實測校準。

### C7. BrowseComp（Wei et al., OpenAI 2025）

- 題名與作者：BrowseComp: A Simple Yet Challenging Benchmark for Browsing Agents，Jason Wei、Zhiqing Sun、Spencer Papay、Scott McKinney、Jeffrey Han、Isa Fulford、Hyung Won Chung、Alex Tachard Passos、William Fedus、Amelia Glaese（OpenAI）。共 10 人。
- 出版與狀態：[arXiv:2504.12516](https://arxiv.org/abs/2504.12516)，v1 2025-04-16，無 venue。code 見 openai/simple-evals。原 1,287 題，剔除標答有誤 21 題後定稿 1,266 題。
- 已解問題：短答可驗證的深網難題（三門檻：當時旗艦有無瀏覽皆解不出、數次簡易搜尋首頁無答案、另一人十分鐘解不出）。人類僅約三成解出；模型基線旗艦低於一成、加瀏覽約二成、無瀏覽推理模型約一成、深度研究約五成（但該模型受過同類任務訓練，不得當乾淨泛化證據）。信心校準誤差全面極高（六到九成），瀏覽越強信心越膨脹；但多採樣聚合仍比單次高一到二成。瀏覽努力量在對數軸上平滑上升。
- 借用：persistence 評估視角（三項核心能力之一，原文未主張獨立測量），信心只當排序提示、不當機率的教訓，多採樣聚合形狀。
- 不得宣稱：不得宣稱發現信心失準。不得把光會瀏覽不夠簡化為工具無用（無瀏覽推理亦有獨立貢獻）。
- 限制與領域落差：場域是開放瀏覽問答，不是版本化記憶問答。gap-only 迴圈與其換路徑重查只是形似，不可互證。計分沿用他榜模板，偏見另計。
- 吃掉的新穎性：吃掉 persistence 評測與信心失準的觀察宣稱。

### C8. When to use Graphs in RAG，即 GraphRAG-Bench（Xiang et al., ICLR 2026）

- 題名與作者：When to use Graphs in RAG: A Comprehensive Analysis for Graph Retrieval-Augmented Generation（評測名 GraphRAG-Bench），Zhishang Xiang、Chuanjie Wu（共同一作）、Qinggang Zhang（通訊）、Shengyuan Chen、Zijin Hong、Xiao Huang、Jinsong Su（廈大加港理工）。共 7 人。
- 出版與狀態：[arXiv:2506.05690](https://arxiv.org/abs/2506.05690)，v1 2025-06-06，ICLR 2026。code 見 GraphRAG-Bench/GraphRAG-Benchmark。注意另有同名異物他組評測，引用須認準本 ID。
- 已解問題：雙語料（西洋小說加醫療指引，兼顧鬆散敘事與緊密階層）乘四級難度（事實取回、複雜推理、情境摘要、創意生成）三段式評測（建圖品質、檢索、生成），七種圖檢索對照普通檢索：簡單事實題持平或普通勝（原文精確措辭），複雜推理與情境摘要圖勝，圖品質居冠者對應最高召回。成本揭露：普通僅約千 token 起，輕量圖約千級，中型數千，傳統圖約七千，另兩家平均十萬與三十三萬；全域社群摘要版 prompt 隨難度自數千膨脹至數萬，冗餘上下文反傷檢索關聯。
- 借用：gate 的方法依據（簡單不開圖、複雜才開圖），token 開銷必須進成本欄的立場，檢索越廣噪聲越多的取捨句式。
- 不得宣稱：不得宣稱發現圖在簡單題有害（已是原文結論，且為通用問答語料）。不得引用他語料的十萬級 token 數字為 Corrobora 預期成本。
- 限制與領域落差：場域是通用圖檢索（小說加醫療），與版本引用圖不同。複雜推理是跨文件情節與醫療階層合成，不是版本區間真值判定。gate 邏輯可借，勝負數字不可搬。
- 吃掉的新穎性：吃掉圖適用邊界加 token 成本揭露的宣稱。

### C9. Multi-SWE-bench（Zan et al., NeurIPS 2025）

- 題名與作者：Multi-SWE-bench: A Multilingual Benchmark for Issue Resolving，Daoguang Zan、Zhirong Huang 等 19 人（ByteDance Seed）。
- 出版與狀態：[arXiv:2504.02605](https://arxiv.org/abs/2504.02605)，v1 2025-04-03，NeurIPS 2025 Datasets and Benchmarks。版本數字差異註記必須保留：arXiv v1 為 7 語言（Java、TypeScript、JavaScript、Go、Rust、C、C++）1,632 題（自 2,456 候選經 68 專家雙人標註加 14 人品管、八成門檻篩出，39 倉庫，全 Docker 可重現；另附同管線未人工驗的 RL 集 4,723 題）；會議版擴充為 8 語言（加 Python）2,132 題、12 模型，並新增三級難度標籤（v1 只有問卷篩選條件而無分級）。
- 已解問題：五階段管線（選星數倉庫、爬關聯已合併請求、逐請求建容器、三配置全量測過濾、雙人問卷標註）。三方法乘前沿模型實測：問題描述越長解出率越高；修補超六百 token 或跨多檔時解出率陡降；會議版三發現為跨語言泛化有限、成績貼合人工難度分級、低資源語言最佳僅約一成。
- 借用：只借三樣，可重現環境（逐請求容器）、專家驗證（雙標註加品管門檻）、難度分層（以會議版三級標籤為準）。
- 不得宣稱：不得以跨檔必崩推導 Minecraft file 級主張成立。兩者物件不同（程式 patch 與技術結論引用），該推導無效。不得宣稱大規模標註路線是本計畫提出。不得引低資源語言低解出率為 Corrobora debugging 類證據。
- 限制與領域落差：場域是多語言修補，Java 在列不代表結論可搬到 Minecraft 機制問答。hard 題歸零是修補任務的性質，不可引為 Corrobora debugging 類的證據。v1 無 Python，任何含 Python 的數字必須註明是會議版。
- 吃掉的新穎性：吃掉可重現評測環境的方法宣稱，不支援任何跨域效能推論。

## D. 檢索、知識與系統組

### D1. Voyager（Wang et al. 2023）

- 題名與作者：Voyager: An Open-Ended Embodied Agent with Large Language Models，Guanzhi Wang、Yuqi Xie、Yunfan Jiang、Ajay Mandlekar、Chaowei Xiao、Yuke Zhu、Linxi Fan、Anima Anandkumar（Caltech、UT Austin、NVIDIA 等）。共 8 人。
- 出版與狀態：[arXiv:2305.16291](https://arxiv.org/abs/2305.16291)，v1 2023-05-25，preprint，無 venue。code 見 [MineDojo/Voyager](https://github.com/MineDojo/Voyager)。骨幹為 GPT-4 初代加 3.5 加嵌入模型，temperature 全零僅課程用 0.1 求多樣性，環境為 MineDojo 加 Mineflayer，以 code 為動作空間。
- 已解問題：三件套解決開放世界終身學習：自動課程（目标尽量多樣且不太難，加當前狀態、成敗史、問答補 wiki 上下文）；技能庫（程式描述向量為鍵、可執行程式為值，取前五）；迭代提示（每輪取環境回饋加執行錯加另一模型任評判的自我驗證，驗證通過才入庫，卡住四輪放棄換題）。160 輪內發現 63 獨特物品（三倍對手），移動二倍多，科技樹木十五倍、石八倍、鐵六倍、鑽石僅此家解出；零樣本新世界四任務全過，對手全零。消融：課程換隨機掉九成，去自我驗證掉七成（各回饋中最重要），去技能庫後期 plateau，大模型比小模型多近六倍物品。
- 借用：code 先驗證再入庫的紀律，curriculum 按缺口與現況出題的觀念，卡住換題的止損形狀。
- 不得宣稱：不得宣稱 Minecraft 技能庫是新的。差異必須寫明，Voyager 存可執行技能本身，Corrobora 存研究結論加版本 scope 加依賴，技能只作來源。不得引用其倍率為 Corrobora 預期收益。
- 限制與領域落差：Voyager 的成功是遊戲內解鎖與物品獲取，不是研究結論正確性。加速數字不可引用為 Corrobora 的預期收益。課程的新穎性是上下文新穎搜尋，無版本語意。
- 吃掉的新穎性：吃掉 Minecraft 可執行技能庫加課程加自我驗證三件套的宣稱。

### D2. HippoRAG（Gutierrez et al. 2024）與 From RAG to Memory，即 HippoRAG-2

- 題名與作者：(a) HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models，Bernal Jiménez Gutiérrez、Yiheng Shu、Yu Gu、Michihiro Yasunaga、Yu Su（OSU 加 Stanford）；(b) From RAG to Memory: Non-Parametric Continual Learning for Large Language Models（即 HippoRAG-2），Bernal Jiménez Gutiérrez、Yiheng Shu、Weijian Qi、Sizhe Zhou、Yu Su（OSU 加 UIUC）。
- 出版與狀態：[arXiv:2405.14831](https://arxiv.org/abs/2405.14831)，v1 2024-05-23，NeurIPS 2024；[arXiv:2502.14802](https://arxiv.org/abs/2502.14802)，v1 2025-02-20，以後者 arXiv canonical title From RAG to Memory 為準（ICML 2025）。同 repo OSU-NLP-Group/HippoRAG。
- 已解問題：(a) 單步多跳：離線以模型做開放抽取（先實體再含一般概念的三元組）建無模式圖譜為海馬索引，檢索編碼器補同義邊（餘弦 over 閾值）；線上抽查詢實體鏈到圖節點跑個性化 PageRank（重啟率半數、百例調參），節點分乘出現矩陣得段落分，另乘特異性抑常見節點。千題抽樣上二號庫升約二成、一號庫升約三點，單步即打平或勝多步迭代法，在線便宜一到三個量級、快數倍，加掛多步法再漲。(b) 修初代只看實體丟上下文：稠密稀疏整合（短語節點為稀疏加段落節點為稠密，以包含邊連段落到其全部短語）；更深上下文（棄實體直連，整查詢直配三元組）；辨識記憶（向量取前候選再以模型過濾）；線以過濾後短語加全部段落共作種子、按排序與相似加權跑 PageRank。七庫評上問答平均近六成勝最強嵌入約三點，召回平均近八成，關聯任務超約七點。
- 借用：只借 ablation 比較法（同 snapshot、開關對照），以及 v2 的概念加原文雙軌形狀當候選規格。
- 不得宣稱：不得宣稱單步多跳、PageRank 圖檢索、雙軌是新的。在 ablation 證明效益前不得主張建全量圖合理。不得把多跳與問答數字搬為版本比較題證據（便宜倍率初版與會議版文字有差，引用須註版本）。
- 限制與領域落差：場域是通用多跳問答，不是版本化引用。初代有概念對上下文權衡與抽取限制，v2 段落節點放大圖規模與索引成本，未在版本語意驗證。
- 吃掉的新穎性：吃掉開放抽取無模式圖譜加單步多跳加雙軌加辨識過濾整套圖檢索形狀的宣稱。

### D3. MIRIX（Wang and Chen 2025）

- 題名與作者：MIRIX: Multi-Agent Memory System for LLM-Based Agents，Yu Wang、Xi Chen（MIRIX AI）。共 2 人。
- 出版與狀態：[arXiv:2507.07957](https://arxiv.org/abs/2507.07957)，v1 2025-07-10，preprint，無 venue。實驗骨幹為 Gemini 快照與 GPT-4.1 作評審。
- 已解問題：六型別加多智能體路由加主動檢索：核心常駐（超九成觸發重寫）、情節、語義、程序、資源全文或節錄、高敏保險庫（高敏感排除隨意取回）。寫入由元管理器先搜全庫再路由到零到多個分管器並行更新去重；對話先粗搜摘要再選組件精查。主動取回兩階段：先由 agent 據輸入生成當前主題，再以該主題對六庫各取前十，包標籤注入系統提示，免顯式搜記憶指令；另供向量、關鍵詞、字串三匹配按境選用。自採螢幕問答超檢索基線三成五且存儲降近全幅，超長上下文基線四倍且存儲降九成多；長對話總準確率逾八成五，超最佳基線八點，接近長上下文上界。
- 借用：只借分層對照的視角，Finding、passage、concept、machine 分層若暗合，寫明是對照不是首創。主題先行再分庫取回的管線形狀。
- 不得宣稱：不得宣稱六型別、元路由、主動取回、前十注入是新的。不得引用其準確率與存儲數字為版本記憶證據。
- 限制與領域落差：通用個人與多智能體記憶，無版本語意與審查狀態。螢幕活動回憶與單一對話事實回取皆非版本區間並存語意。保險庫敏感度與 Corrobora 的 verified 加授權追溯不同物。
- 吃掉的新穎性：吃掉型別化記憶路由的形狀宣稱。

### D4. Mem0（Chhikara et al. 2025）

- 題名與作者：Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory，Prateek Chhikara、Dev Khant、Saket Aryan、Taranjeet Singh、Deshraj Yadav（mem0.ai）。共 5 人。
- 出版與狀態：[arXiv:2504.19413](https://arxiv.org/abs/2504.19413)，v1 2025-04-28，preprint，無 venue。code 見 [mem0ai/mem0](https://github.com/mem0ai/mem0)。操作全用輕量旗艦模型，嵌入用小模型，圖庫用 Neo4j。抽取、更新、檢索三模組，graph 版以舊關係標 invalid 不物理刪除。
- 已解問題：增量會話記憶服務分兩相：抽取相吃新訊息對加全域摘要加最近十則組提示抽候選事實；更新相對每候選取十相似舊記憶，再由模型自選四操作（新增、補充、矛盾刪、無需改）。圖版兩段抽取（型別化實體加關係三元組，兼顧顯隱式），新三元組按閾值配舊節點，衝突由模型判舊關係過時標失效而非物理刪，利時序推理；檢索雙軌為實體中心子圖加整查詢三元組匹配。長對話上評審分相對商用記憶高約二成六，圖版總分再高約二成中的十分之一，相對全上下文延遲降九成、token 省九成以上。
- 借用：只借工程模式（抽取更新分相、失效保留歷史不物理刪、雙軌檢索）。
- 不得宣稱：不得宣稱保留歷史不刪與四操作閘門是新的。必須寫明 Mem0 是通用個人記憶，Corrobora 是版本化研究記憶，語意層級不同。不得以其評審與延遲數字支持版本正確性。
- 限制與領域落差：無版本 scope、無審查狀態機，不可引為正確性證據。矛盾刪是會話矛盾刪除，不是事件驅動失效加審查。近十與取十為會話調參，不可搬為版本參數。
- 吃掉的新穎性：吃掉記憶服務切分的工程形狀宣稱。

## E. 歷史對照（只作年代標記，不作方法依據）

### E1. MemoryBank（Zhong et al., AAAI 2024）

- 題名與作者：MemoryBank: Enhancing Large Language Models with Long-Term Memory，Wanjun Zhong、Lianghong Guo、Qiqi Gao、He Ye、Yanlin Wang（中山大學、哈工大、KTH）。共 5 人。
- 出版與狀態：AAAI 2024 全文，38 卷 17 期 19724–19731 頁，SiliconFriend 應用。canonical 出處為 AAAI 全文（另有預印本 [arXiv:2305.10250](https://arxiv.org/abs/2305.10250)，不引用）。三支柱為記憶庫加檢索器加更新器，歷史會話記憶工作。
- 已解問題：在會話伴侶場景以指數衰減留存率擬人化遺忘（留存等於自然常數的負時間除以記憶強度次方，強度離散化、被取回則加一且時間歸零），三原則為遺忘速率、時間衰減、間隔效應，作者自述為探索性高度簡化。該機制只為伴侶更自然（久未取回的不重要記憶淡去）。
- 借用：不借用。Ebbinghaus 公式不引入 Corrobora。時間衰減不作版本真相的處置依據。
- 不得宣稱：不得宣稱採用遺忘曲線。不得以 MemoryBank 支持任何版本失效、刪除或降權決定。版本真相只認事件驅動的失效加審查，不認時間公式。
- 限制與領域落差：會話記憶的時間遺忘與版本化技術真相無關，兩者語意完全不同。本條保留只為標示年代，不為方法背書。
- 吃掉的新穎性：不吃掉 Corrobora 任何宣稱，反向要求 Corrobora 不得沾它的公式。
