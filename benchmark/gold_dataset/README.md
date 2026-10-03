# 既有問答與資料管線參考素材

這些檔案源自先前的問答、機器推薦及文件攝取評測，保留其原始契約與審核標籤。**它們不是 Corrobora 新研究的完整農場 benchmark，也不代表任何模型或資料管線已在此通過測試。**

現行評測依 [實驗協定](../../docs/plan/05-evaluation-protocol.md) 與 [農場環境](../../docs/plan/03-farm-testbed.md)。新農場 manifest、世界與實驗資料尚未建立，不能把這個目錄的檔案數當作 farm case 數。

## 現在保留什麼

- `questions.json`：歷史問答草稿與原審核狀態；不自動轉成新任務的真值。
- `baseline-machines.json`：舊機器推薦行為與資料 hash 參考，不是已知最佳設計或工程品質標準。
- `triage-fixtures/`：文件處理、來源及人工撰寫的 AI 回應種子；不是本輪真實模型輸出或已執行測試。

原始 JSON、文字及圖片內容在本次文件整理中不改寫。未來只有實際採用其中某項功能時才決定如何轉換，不能為了通過新程式而修改舊 expected 值。

這些素材不再綁定舊 Research Memory-first 路線，也不要求先復原舊 ingestion runner。現階段第一步是 [P0 的完整農場量測](../../docs/experiments/p0-first-farm.md)。来源、權限與公開限制依 [資料與安全](../../docs/plan/07-data-and-safety.md) 處理。
