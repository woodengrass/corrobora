// Worker 進程入口（T1.2a）
// 職責：啟動後先將殘留 running 的 ai_jobs 復原為 queued，接著掃描並監看
// public/database/raw/，只派送新增或雜湊改變的檔案。Worker 永遠不呼叫
// runMigrations()——只有 Bot 執行 migration，Worker 一定在 migration 成功後
// 才被 fork 出來，schema 保證已就緒。
//
// T1.2a／T2.4 邊界：本檔案的主迴圈只做「掃描 Raw、派送 queued ai_job、
// 啟動復原」，不消費 ai_jobs 佇列——src/db/import/aiJobs.ts 提供的
// claimNextAiJob／completeAiJob／failAiJob 目前完全不會被呼叫，詳見該檔案
// 開頭的說明。沒有 document_triage handler 之前，ai_jobs 停在 queued 是
// 刻意且正確的狀態，不是本 Track 的疏漏；T2.4 落地後才會在某處（可能是
// 本檔案，也可能是獨立的消費迴圈）接上這三個函式。
//
// 沒有正式 `npm run worker` 入口；本檔案僅供除錯時手動執行 `node dist/worker.js`，
// 正式啟動一律由 Bot 以 child_process.fork() 透過 workerSupervisor 帶起。
import fs from 'fs'
import { getDatabase, closeDatabase } from './db/connection'
import { resetRunningAiJobsToQueued } from './db/import/aiJobs'
import { scanRawDirectory } from './db/import/rawScanner'
import { RAW_DATABASE_ABS_DIR } from './config'

const RAW_SCAN_DEBOUNCE_MS = 500
const RAW_SCAN_POLL_INTERVAL_MS = 30000

export interface ScanScheduler {
  // 排入一次掃描請求；debounce 時間內的多次呼叫只會產生一次有效掃描
  trigger: () => void
  // 停止排程，清除任何等待中的計時器
  dispose: () => void
}

// 500ms debounce ＋ in-process guard：避免同一批檔案變動被重複觸發掃描。
// 掃描函式目前是同步呼叫，理論上不會真正重入，但仍保留顯式旗標，防止未來
// scanFn 改為非同步後在掃描進行中收到新觸發時遺漏或重複執行
export function createScanScheduler(
  scanFn: () => void,
  debounceMs = RAW_SCAN_DEBOUNCE_MS
): ScanScheduler {
  let timer: ReturnType<typeof setTimeout> | null = null
  let inFlight = false
  let rescanRequested = false
  let disposed = false

  function runOnce(): void {
    timer = null
    if (disposed) {
      return
    }
    if (inFlight) {
      rescanRequested = true
      return
    }

    inFlight = true
    try {
      scanFn()
    } finally {
      inFlight = false
      if (rescanRequested && !disposed) {
        rescanRequested = false
        trigger()
      }
    }
  }

  function trigger(): void {
    if (disposed) {
      return
    }
    if (timer !== null) {
      clearTimeout(timer)
    }
    timer = setTimeout(runOnce, debounceMs)
  }

  function dispose(): void {
    disposed = true
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { trigger, dispose }
}

let scheduler: ScanScheduler | null = null
let watcher: fs.FSWatcher | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let shuttingDown = false

function runScanAndLog(): void {
  try {
    const summary = scanRawDirectory()
    if (summary.registeredCount > 0 || summary.failedCount > 0) {
      console.log(
        `[Worker] Raw 掃描完成: 新增/變更 ${summary.registeredCount}，` +
        `未變 ${summary.unchangedCount}，失敗 ${summary.failedCount}`
      )
    }
  } catch (error) {
    console.error('[Worker] Raw 掃描失敗:', error)
  }
}

function startPolling(): void {
  if (pollTimer !== null) {
    return
  }
  // recursive fs.watch 在部分平台不受支援時的後備方案，確保 Raw 目錄變動
  // 最終仍會被偵測到，只是延遲以輪詢間隔為準
  pollTimer = setInterval(() => {
    scheduler?.trigger()
  }, RAW_SCAN_POLL_INTERVAL_MS)
}

function startWatching(): void {
  try {
    watcher = fs.watch(RAW_DATABASE_ABS_DIR, { recursive: true }, () => {
      scheduler?.trigger()
    })
    watcher.on('error', (error) => {
      console.error('[Worker] Raw 目錄監看發生錯誤，改用定時輪詢:', error)
      watcher = null
      startPolling()
    })
  } catch (error) {
    console.warn('[Worker] 目前平台不支援 recursive fs.watch，改用定時輪詢:', error)
    startPolling()
  }
}

function shutdown(signal: string): void {
  if (shuttingDown) {
    return
  }
  shuttingDown = true
  console.log(`[Worker] 收到 ${signal}，準備關閉`)

  scheduler?.dispose()
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  if (watcher !== null) {
    watcher.close()
    watcher = null
  }

  // scanRawDirectory 為同步呼叫，JS 單執行緒特性下，收到終止信號時若有掃描
  // 正在執行，會先跑完其自身的單檔案 transaction 邊界才輪到本回呼執行，
  // 不會有交易被中途強制中斷的風險，符合「不可強殺已開始的 transaction」
  closeDatabase()
  process.exit(0)
}

export function startWorker(): void {
  console.log('[Worker] 啟動中（不執行 migration）...')
  getDatabase()

  const recovered = resetRunningAiJobsToQueued()
  if (recovered > 0) {
    console.log(`[Worker] 已將 ${recovered} 個殘留 running job 恢復為 queued`)
  }

  scheduler = createScanScheduler(runScanAndLog)

  // 啟動時立即執行一次掃描，不等待 debounce
  runScanAndLog()
  startWatching()

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  // workerSupervisor 以 IPC 訊息（而非 OS 訊號）觸發優雅關閉：Windows 上
  // child.kill() 會直接強制終止子進程、無法讓其自行收尾，IPC 訊息才能保證
  // 跨平台都給 Worker 機會完成目前的單檔案 transaction 並關閉資料庫
  process.on('message', (message: unknown) => {
    if (
      message !== null &&
      typeof message === 'object' &&
      (message as { type?: unknown }).type === 'shutdown'
    ) {
      shutdown('supervisor shutdown 訊息')
    }
  })
}

if (require.main === module) {
  startWorker()
}
