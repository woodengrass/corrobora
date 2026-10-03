# 08｜相關工作、最新查核與新穎性邊界

[索引](../README.md) · [研究問題](01-research-questions.md) · 檢索截止：2026-10-02

本文件只保留與目前研究有直接關係的來源，不承接舊文獻表的「全部已驗證」宣稱。下列結果是作者報告，本專案沒有獨立重跑其實驗。

## 1. 查詢範圍與限制

本輪搜尋涵蓋 arXiv、ACL Anthology、OpenReview 索引、作者專案／公開程式線索，以及 Fabric 官方技術文件。先廣搜主題，再依標題與 arXiv ID 回查；特別補查 2026-09-21 至 10-02，保留較早但直接重疊的工作。

主題包括 Minecraft farm／redstone agents、autonomous engineering／iterative design、cross-task diagnostic transfer、active experimentation、memory applicability／negative transfer、raw-history memory、belief revision 與 harness self-improvement。查詢不是正式系統性文獻回顧，沒有完整覆蓋全部投稿、未索引論文、私有成果與新版本。

閱讀深度分為：

- **全文重點**：實際讀取作者 HTML 的任務、方法或限制章節；仍不等於逐式審查或程式復現。
- **原始摘要頁**：取得 arXiv／ACL 官方摘要及可見 metadata，沒有完整方法審查。
- **索引摘要**：搜尋服務回傳指向 arXiv／ACL 的作者摘要；原頁或全文未完整取得。可以支持高層方法描述，不能据此比較精確實驗公平性。

本輪有多個 9 月 arXiv 原頁讀取失敗，但可取得原始來源的索引摘要；下表明列這種限制。不以第三方 AI 論文解說、未執行 leaderboard、影片或宣傳評分補成實證。後續修訂日期若未核實，就只列初次提交日期或會議月份，不把「索引更新」當新論文發表。

## 2. 優先讀的直接相關工作

### R01｜SciCrafter

*Can Current Agents Close the Discovery-to-Application Gap? A Case Study in Minecraft.* [arXiv:2604.24697](https://arxiv.org/abs/2604.24697)；2026-04-27 初次提交，本輪閱讀 [HTML v2](https://arxiv.org/html/2604.24697v2)，該版本日期 2026-05-20。閱讀深度：全文重點。

它研究紅石的發現—應用迴圈，有科學實驗子 Agent、知識整理與經驗累積，不是只有一組電路題。其主張、證據、限制、例子的知識格式與 Corrobora 原先想法有直接重疊。

本計畫不能再主張「首度讓 Minecraft Agent 做實驗或保存可驗證機制」。可以爭取的差異是完整、持續產出農場的跨設計診斷與成本評測；此差異仍需要實際任務與對照，不是僅更換遊戲物件。作者設定下的成功率不能當最新模型的能力上界。

### R02｜Frontier-Eng

*Benchmarking Self-Evolving Agents on Real-World Engineering Tasks with Generative Optimization.* [arXiv:2604.12290](https://arxiv.org/abs/2604.12290)；2026-04-14 初次提交，原頁可見 v2 日期 04-27。閱讀深度：原始摘要頁。

研究在可執行工程環境反覆提出、執行、評估並改良設計。這已覆蓋「Agent 不是一次生成，而是持續工程優化」的大方向。

Corrobora 的差異不能只是有迭代。要測跨設計經驗、誤導性相似條件及診斷成本。未讀完其全部任務與程式以前，不宣稱它完全沒有相關轉移機制。

### R03｜EvoSCM

*Scientific Belief Revision Through Causal Model Evolution and Experimentation.* [arXiv:2609.01526](https://arxiv.org/abs/2609.01526)；2026-09-01。閱讀深度：索引摘要。

作者描述維持不同因果模型，設計區分假說的干預，提交預測，再依觀察修正機制理解；摘要的驗證場景為 DiscoverPhysics。

這直接限制「信念修正、競爭假說、主動選實驗」的新穎性主張。若主要方法是選測試，P3 必須取得全文與程式可用性，再決定如何公平改編；本輪不能宣稱已完整重現或證明其沒有跨任務研究。

### R04｜MCMA

*Learning How to Remember: A Meta-Cognitive Management Method for Structured and Transferable Agent Memory.* [ACL Findings 2026](https://aclanthology.org/2026.findings-acl.1535/)；2026 年 7 月會議論文；另有 [arXiv:2601.07470](https://arxiv.org/abs/2601.07470)。閱讀深度：ACL 原始摘要頁。

以記憶管理模型進行抽象、選擇與可轉移記憶管理，並包含訓練；不是所有方法都只存原始筆記。

本研究不能把「選擇合適抽象層級／只取相關經驗」視為新概念。若作對照，訓練資料、權重可用性與推理費用必須明列，不能把受訓方法的名稱貼到自製提示詞上。

### R05｜ReMe

*Remember Me, Refine Me: A Dynamic Procedural Memory Framework for Experience-Driven Agent Evolution.* [ACL Findings 2026](https://aclanthology.org/2026.findings-acl.829/)；2026 年 7 月。閱讀深度：官方來源索引摘要。

包含經驗蒸餾、依上下文重用與依效益修整程序記憶。可作普通記憶之外的重要比較候選。

本計畫可借用經驗的形成與維護流程，但不能把「有用才留下／隨經驗更新」當原創。正式採用前需閱讀完整評測與實作，不搬用別的 benchmark 成績作本專案可達效果。

## 3. 9 月下旬直接影響現在計畫的新增工作

### R06｜MemCalib

*MemCalib: Benchmarking and Optimizing Memory Use in LLM Agents.* [arXiv:2609.24259](https://arxiv.org/abs/2609.24259)；2026-09-21。閱讀深度：索引摘要。

作者直接研究模型對記憶使用過度或不足，提出相應評測與訓練方法。這表示「AI 不知道該相信舊記憶多少」本身已有人明確研究。

對 Corrobora 的要求是把文字回答中的使用程度，連到工程行動、真實試驗與功能結果；不能只展示普通記憶偶爾誤導。第一篇不必採其訓練法，但方法主張前應比較其問題定義與評分限制。

### R07｜AIDE²

*Recursive self-improvement of AI research agents.* [arXiv:2609.26457](https://arxiv.org/abs/2609.26457)；2026-09-22。閱讀深度：索引摘要。

作者讓研究 Agent 修改自身程式並以保留評估選擇改進；摘要報告連續改進與跨評測轉移。

一般 harness 自改已有直接先例。這不表示所有架構研究都不能做，也不證明無限制自我加速；本專案第一輪不以修改 prompt、搜尋或上下文策略本身當貢獻。不要拿其保留評測結果推論 Minecraft 機制理論已解決或一定未解決。

### R08｜AEWM

*Agent-Editing World Model: Rethinking World Modeling for LLM Agents.* [arXiv:2609.28416](https://arxiv.org/abs/2609.28416)；2026-09-23。閱讀深度：索引摘要。

研究過時假設與雜訊 reasoning 留在工作狀態造成的污染，透過決策判斷與狀態修訂改善執行。

Corrobora 應分開原始證據、可修訂經驗與當題工作狀態，但這種分離是借用的設計原則，不是單獨新意。若比較其受訓版本，需完整記錄訓練與部署差異。

### R09｜SEMV

*Self-Evolving Multimedia Verification through Memory Consolidation of Contestation Experiences.* [arXiv:2609.27175](https://arxiv.org/abs/2609.27175)；2026-09-23。閱讀深度：索引摘要。

作者提出帶來源的論證、限定範圍的修訂、保留衝突，以及驗證後才納入記憶的流程，用於多媒體查核。

因此不能再說「大家只有追加記憶，沒人研究修正或驗證後重用」。其人工爭議與驗證設定不同於自主農場實驗；差別應逐項比較，不能只因領域不同就排除先例。

### R10｜JitMem

*Just-in-Time Memory: Learning to Curate Task-Adaptive Memory for LLM Agents.* [arXiv:2609.27334](https://arxiv.org/abs/2609.27334)；2026-09-23。閱讀深度：索引摘要。

保留原始軌跡，在新任務已知時才整理適合當題的內容；包含可訓練 curator，也報告未訓練版本的效益。

這是重要的「讀取時才整理」對照，不應把選項侷限成固定筆記與 CDET。P3 評估在同樣原始歷史與模型預算下，加入 task-conditioned read-time summary 的可重跑改編，與寫入時摘要及前提 gate 分開；只有依原始實作完成相應程序才稱復現。

### R11｜MemAgent

*MemAgent: Learning to Manage Heterogeneous Memory Providers for LLM Agents.* [arXiv:2609.32521](https://arxiv.org/abs/2609.32521)；2026-09-26。閱讀深度：索引摘要。

作者比較多種記憶方法，研究應選哪種記憶、何時注入、往哪裡儲存的路由及訓練。

這限制「自行選擇不同記憶形式」的新穎性。其比較結果是特定任務與配置下的證據，不等於證明多路由永遠必要；本專案仍先用簡單原始歷史和筆記基線。

### R12｜JAM

*Just-In-Time Agent Memory with Runtime Agentic Research.* [arXiv:2609.34385](https://arxiv.org/abs/2609.34385)；2026-09-28。閱讀深度：索引摘要。

保留完整原始歷史並以分頁與導航摘要組織，由 Researcher 在新查詢中逐步檢索、閱讀與整合；包含訓練流程。

它與 JitMem 是不同工作，不能混成同一篇。對本計畫的直接作用是補強 B1：原始紀錄應可搜尋、分段閱讀，不能硬塞一次 prompt 後截斷，讓結構化方法得到不公平優势。借用分頁導航不等於復現其受訓 Researcher。

### R13｜RSI-Master

*RSI-Master: Structuring Experiments to Guide Autonomous Model Improvement.* [arXiv:2609.35561](https://arxiv.org/abs/2609.35561)；2026-09-28。閱讀深度：索引摘要。

作者用 Experiment OS 保留可追溯試驗，配合研究方向的比較與審查，處理取巧和策略固著，主要場景是模型後訓練。

因此「可追溯試驗紀錄＋避免一直沿用錯方向」已是研究方向。本計畫不需要照搬多 Agent 研究圖；應把紀錄與權限當工程底線，研究具體跨農場試驗選擇效果。

## 4. 必須保留的較早先例與評測提醒

### R14｜Voyager

*Voyager: An Open-Ended Embodied Agent with Large Language Models.* [arXiv:2305.16291](https://arxiv.org/abs/2305.16291)；2023-05-25。閱讀深度：原始摘要頁。

Minecraft 中自主探索、產生與重用程式技能已有長期先例。本研究不能以「AI 在遊戲裡累積能力」為原創；重點是完整工程任務的診斷、條件性轉移與成本。

### R15｜MemDelta

*MemDelta: Controlled Baselines and Hidden Confounds in Agent Memory Evaluation.* [arXiv:2606.29914](https://arxiv.org/abs/2606.29914)；2026-06-29。閱讀深度：原始摘要頁。

提醒模型、embedding、檢索與記憶建置成本等混雜會改變比較結論。借用其公平比較警示，不搬用它在其他任務上的數字。

### R16｜Designer-RSI

*Designer-RSI: Evolving Procedural Memory from User Traffic for Agentic Graphic Design.* [arXiv:2609.22086](https://arxiv.org/abs/2609.22086)；2026-09-18。閱讀深度：索引摘要。

固定模型操作設計軟體，以成功／失敗經驗增加或修改程序記憶，並用配對重播檢查修正是否退化。它已有專業成品、長期程序累積與回歸控制，不可把「AI 做過作品後更會做」稱為沒人研究。

其回饋與圖形設計品質判定不同於 Minecraft 可執行量測。Corrobora 若強調修正後保留舊能力，应把 matched replay 類比較列入考慮，而不是把回歸測試本身當新發明。

## 5. 現在能與不能主張什麼？

已有先例：生成工具／技能、經驗抽象、動態記憶、讀取時整理、信念與狀態修正、驗證後重用、配對回歸、工程反覆優化及 harness 自改。

仍待本專案驗證的具體組合是：完整持續產出的農場、跨設計或前提差異、可干預的診斷實驗、錯誤重用及真正功能成本。這可以是評測設定或方法切入點，但「把功能加在一起」不自動是新演算法。

本輪未找到足以證明這個完整問題已被直接做完的公開研究，也沒有證據可證明無人做過。公開 GitHub 設計文件、腳本農場 bot 或單次影片不等於受控研究；它們可作工程線索，不能用作科學新穎性或模型上限的唯一依據。

## 6. 正式研究前必須補做

P0 優先讀 SciCrafter 的環境／評測與 Fabric 相容性；P2 前確認 B1 的原始歷史處理、ordinary notes 及固定診斷基線；P3 前讀完最接近的方法全文，優先 JitMem／JAM、MCMA／ReMe，若選實驗是主貢獻再加 EvoSCM。依核心問題选择少數可公平移植的強對照，不要求一次復現全部文獻。

每個採用的對照登記：原版本、程式 commit、模型／訓練需求、修改部分、調參預算、能否重跑、未能復現的限制。正式發表前再搜索近期更新，不能把 2026-10-02 的清單當永久完整。

技術棧的官方來源與版本警告見 [02](02-system-and-stack.md)。本輪不把模型價格、產品新聞或未確認的安全漏洞寫入研究必要性，避免快速過時與無關擴張。
