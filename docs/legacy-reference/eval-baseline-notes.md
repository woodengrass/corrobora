# eval/

## baseline-machines.json（T1.5a）

`searchMachines()` 目前以關鍵字比對機器名稱、標籤與作者。在 T1.4a/T1.4b 把機器
資料來源從 `public/database/database.json` 切到 SQLite 之前，`baseline-machines.json`
記錄一組固定查詢（延伸自 `questions.json` 的 `machine_recommendation` 題目）在現行
邏輯下的 top-5 `sub_id`，作為之後遷移「推薦行為不回歸」的比對依據。

- 驗證（預設模式，CI／本機均可跑，離線、確定性、不呼叫任何 AI 或網路）：

```bash
npm run eval:machines
```

重新執行 `loadMachineDatabase()` + `searchMachines()`，逐案比對 top-5 `sub_id`
是否與 `baseline-machines.json` 完全一致；若 `database.json` 的 SHA-256 與
記錄不同會額外提示（用來分辨「資料更新」與「推薦行為改變」）。有差異時以非零
結束並列出每個案例的差異。

- 更新基準（**僅限審核過的行為變更**，例如 T1.4b 完成遷移並確認 T1.5b 通過後）：

```bash
npm run eval:machines -- --write
```

不得在沒有人工審核差異原因的情況下直接用 `--write` 覆蓋，否則會把非預期的
推薦行為回歸悄悄寫成新基準。

- 單元測試：`npm run test:eval-machines`
