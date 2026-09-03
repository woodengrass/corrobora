# 程式單元測試規範

## 原則

單元測試以輕量、快速與可維護為優先。不追求每個 module 或每個分支的覆蓋率，只保留
容易回歸、會造成資料錯誤或安全問題的核心行為。

- 純函式、狀態轉移、輸入驗證與路徑/權限檢查優先測試。
- 修復 bug 時，加入一個能重現該 bug 的測試。
- AI、QQ、GitHub、WebSocket、OCR、模型下載與真實檔案庫不做單元測試；以手動驗證或
  未來整合測試處理。
- 不為測試重構業務程式、加入 test mode，或建立大型 mock 架構。

## 檔案位置

```text
tests/
  unit/
    db/
      enums.test.ts
```

- 只在有必要時新增 `tests/unit/<module>.test.ts`。
- 每個測試檔對應一個小型、可獨立驗證的行為；不要求 production module 一對一建立測試。
- 測試資料必須小型且合成，不得使用正式資料庫、真實 token 或使用者資料。

## 最小案例

每個受測行為通常只需：

1. 一個正常案例。
2. 一個重要邊界或拒絕案例。
3. 如有歷史 bug，再加入一個回歸案例。

目前優先保護的行為：

- `src/db/enums.ts`：非法 enum 拒絕、只有 reviewer 可核准、終態不可直接恢復、阻擋旗標
  不得 materialize。
- `src/submissions/pathSafety.ts`：目錄穿越與絕對路徑拒絕。
- `src/upload/server.ts`：無效、過期或已使用 token 拒絕。
- 其他純解析或狀態邏輯：僅在新增功能或修復 bug 時補測試。

## 執行要求

- 未來加入 runner 時使用 `npm test`，不新增重量級測試框架；優先 Node 內建
  `node:test` 與 `node:assert`。
- 測試必須不依賴網路、`.env`、本機模型快取或正式資料。
- `eval/` 是知識檢索與文件攝取評測資料，不屬於程式單元測試。
