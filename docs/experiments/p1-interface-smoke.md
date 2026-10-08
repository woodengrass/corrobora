# P1｜模型—Minecraft 接入實測工作表

[索引](../README.md) · [介面](../plan/agent-world-interface.md) · [驗收 ID](../plan/agent-world-acceptance.md) · 2026-10-08

狀態：尚未執行。本文是填寫模板，沒有實測產量、通過紀錄或可運行命令。

## 1. 啟動前要填的設定

| 項目 | 記錄 |
| --- | --- |
| 基底農場與 P0 證據 | 待填；正常設計、來源和窗口已可核對才進入 |
| 程式／設定 | 待填 git SHA、Python/JDK/game/loader/API/mappings、schema/manual hashes |
| 介面配置 | 待填 scan/page/bytes/patch/tick/fork 上限、時間模式與工具清單 |
| 狀態／載入 | 待填世界初始化、固定玩家、載入邊界及未還原狀態 |
| 感測能力 | 待填每個 sensor 的定義、實測 hook、覆蓋與缺失行為 |
| 模型與成本 | 接入時才填 provider/id/snapshot/API 日期、參數、用量與上限 |
| 執行命令 | 待真實程式建立後填寫；不把示意名稱當已可執行命令 |
| 資料隔離 | 待確認模型沙箱、私有標籤、正式 evaluator、各組歷史掛載 |

## 2. 先不接模型

依 W01–W21 做必要項，記 ID、指令、預期、實際、trace 路徑、pass/fail 和限制。先用小方塊／空容器場景驗座標、0 與 missing、分頁、非法 patch、stale state、取消和重送。

再讓固定腳本建立世界、載入完整農場、預熱、量測、封存、停止與冷重置。保存多次獨立重建的原始結果，次數與窗口依 P0 的波動決定，不以單次成功當穩定性證據。

## 3. 接入模型的第一條軌跡

| 次序 | 模型／runner 工作 | 要保存的證據 |
| --- | --- | --- |
| 1 | 取得公開 task、manual、capabilities 與概要 | bootstrap hash，確認未含私有模組／故障資訊 |
| 2 | inspect_region、slice_region、inspect_container | observation IDs、座標、分頁與 coverage |
| 3 | 模型標記自己的區域與可能功能 | annotation revision、引用與未知，不當 ground truth |
| 4 | 提出測試並封存 | source state、intervention、sensor、預測或 explicit unknown |
| 5 | 副本執行 | parent linkage、actual ticks、全部重複資料與成本 |
| 6 | 回父世界提出合法 patch | 前後 state、順序、部分失敗與修改成本 |
| 7 | 完整農場重跑並提交 | 凍結設計、合法初始狀態、獨立驗收及不回流的 final score |
| 8 | 封存與 reset | 全部用量、失敗、版本與下一 episode 的隔離證據 |

這是開發 smoke，不是方法成績。首輪不啟用 CDET，先確認普通強模型能理解工具介面。模型修不成功也保留資料，但要區分介面錯誤、觀察缺口與診斷失敗。

## 4. 必須測的失敗

超大 scan、未載入 chunk、過期 patch、重送 request、操作另一個 world、使用未支援 sensor、取消長推進，以及診斷注入物試圖進入正式計分。確認錯誤可理解、沒有額外副作用、免費重試或私有資料洩漏。

視覺工具未實作不阻擋首版；之後加入時重做座標／時間一致性与載入干擾測試，不能只對候選方法開放。

## 5. 放行決定

| 日期 | 通過／未通過的 ID | 未解限制與歸因 | 是否放行普通模型 pilot | 證據與人工協助 |
| --- | --- | --- | --- | --- |
| 待執行 | 無 | 尚未建立 adapter／runner | 否 | 無實驗資料 |

只有計分、時間、座標、權限、分頁與重置可信，才放行方法比較。關鍵 sensor 不可靠時調整案例或先修感測，不能用模型推測填補量測缺口。
