[索引](README.md) · [← Code](06-code-intelligence-and-versioning.md) · [MVP →](08-scope-and-mvp.md)

# Evidence 重新定位：精確來源與必要的驗證

## 1. 核心判斷

Evidence 不再是一套獨立龐大的知識實體系統，而是 **Finding 與答案的可追溯來源、
依賴與驗證紀錄**。保留來源的重要性，簡化把所有東西先轉成 atomic Claim 的成本。

| 證據來源 | 保存什麼 | 不能推論什麼 |
| --- | --- | --- |
| Document | source/revision、passage、位置、原文、版本 hint、作者／品質 | 高可信來源不代表每句都正確 |
| Code | 具體 snapshot/version/mapping、symbol/file/range/hash | 讀到分支不代表 runtime 一定走該分支 |
| Experiment | protocol、run、環境、量測與 raw logs | 一次結果不代表任意硬體／版本普遍成立 |
| Finding | revision、scoped validation、來源與依賴鏈 | verified 標記不能替代適用條件檢查 |
| Agent 推論 | reasoning_summary、假設、支持／反對來源（屬 interpretation／hypothesis，不是 evidence） | 無 source／code／experiment 支持的 reasoning_summary，不能靠 LLM agreement 或 self-reflection 升格為已驗證 |

## 2. 引用存在，不等於結論被證明

確定性檢查擅長回答：引用 ID 是否存在、hash 是否正確、line range 是否属于该 snapshot、
版本／環境是否相容、來源是否可存取、有無失效依賴。
它不能僅因存在 `CALLS` 邊就证明「這個呼叫在指定情況一定發生」，也不能因
`finding_sources` 有一列就證明來源支持結論全部語意。

語意 entailment、條件充分性與跨來源推理仍由 Agent／reviewer 評估。
可用独立 LLM verifier 做 baseline，但它的意見是檢查結果，不是自動 truth stamp。
Agent reasoning 與 self-reflection 只產生待驗證的 interpretation／hypothesis；
未附來源支持前，不因多模型一致或自我覆核而提升證據等級。
重要設計／量測題需要相稱的來源，不能用通用 source authority 乘積公式替代判斷。

## 3. Finding 的 verified 政策

MVP 由人工 reviewer 核准，寫入指定 `finding_validation`：

1. statement 是可重用、有邊界的結論；conditions／exceptions 清楚。
2. 引用能回到實際原文或 source，含 supports 與已知 contradicts。
3. 明确版本／環境有適用依據；未知 scope 不偽裝成全版本。
4. dependency set 包含結論依賴的關鍵來源與上游 Findings。
5. 核准前 generation 再檢查，研究期间來源若改變則重新確認。

通過後記 review actor、時間、policy version、source_set_hash 與 checked_generation。
provisional 可作研究線索，disputed/stale 可供比較；只有當前有效且適用的 verified validation
可被當成已覆蓋的研究記憶。人工只審高價值成果，不逐段批准整個 corpus 才開始研究。

對可重現、狹義的機器檢查，後續可讓授權 verifier 升格指定命題；必須列明可驗證範圍，
例如「snapshot 中常數值」不等於「某農場所有情況都可靠」。不為實現自動化而降低 verified 定義。

## 4. 輕量 Research Workspace 與答案交付

Agent 的工作上下文保留：目前問題與 scope、相關 Findings、已讀資料、反證、必要條件與 gaps。
不再建立「館員按固定步驟收齊 package，Strong LLM 最後才閱讀」的雙層 reasoner。

上下文節省以精確 locator 去重、按 need 聚合、progressive disclosure 為主。
**不能按 source_id 一筆去重整篇文章**，因為同一文章不同段落可能互為反證；
也不能因 summary 相似就丟掉不同版本或不同 overload。保留原文展開能力。

對 client 的最小交付可包含：

```text
answer
scope_and_assumptions
citations: [finding revision/validation 或 passage/code/experiment refs]
unresolved_needs / contradictions
verification_summary
session_id / usage
memory_write_outcome
```

Evidence Package 可作這份回應的相容名稱，不再是独立 ontology／服務或模型唯一准許看見的材料。
答案區分已有驗證的结論、有條件推論、設計建議與未確認部分，引用跟在相關敘述旁。

## 5. 最終檢查的最小實作

先驗證所有引用是否由工具取得、locator／version／permissions 是否有效，
再讓 Agent 修正 unsupported 或範圍過大的關鍵敘述。對一般文字不做全量離線 Claim extraction；
對答案評估可按需拆 factual statements，這只用於 verification／benchmark，不把它們全部入 memory。

若失效在研究期間發生，最終交付前重新檢查被重用的 validation generations；
失配的部分補查或明示 unresolved，不用舊 prompt 中的 verified 標籤當永久通行證。
沒有足夠來源仍可回答哪些部分已知、如何測試，但不得標成完整已驗證結論。

模型自報信心、相似分數一律只作排序提示，不作機率使用（BrowseComp 實測
calibration error 65–91%，模型不會表達不確定）。verified 只認人工 review、
deterministic check 與 held-out 實測校準；任何 `confidence` 欄位不得寫入
Finding 當作可信度事實。

## 6. 私人 corpus 的來源與權限延續

沿用已有 source-policy 的來源界定、署名與 export 限制，但不把其 `trust_level=high`
（主要表示授權／來源可追溯）當作 factual accuracy 分數。
文件研究权限與答案輸出权限分開：允許讀私人材料的 Agent，不代表可對任意 client 輸出内容。
衍生 Finding 必須保留所依據來源的 access constraints，merge 不會把 private 資料洗成 public。

一般日志不存 tokens、完整私人原文或 query。Raw 永久保存與研究事件 retention 分開管理；
刪除低 utility 的索引 projection 不影響原始來源、revision 或過往引用可追溯性。
