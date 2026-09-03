// Bot 端 Worker 子進程監控器（T1.2a）
// 職責：以 child_process.fork() 帶起 Worker、依計畫的退避策略自動重啟、
// 並提供優雅關閉。本檔案只實作可被 index.ts 呼叫的介面，實際接線（在 Bot
// migration 成功後建立 WorkerSupervisor 並呼叫 start()／在 SIGINT／SIGTERM
// 收尾流程呼叫 stop()）留給後續整合 session 處理，本 Track 不修改 src/index.ts。
//
// Worker 崩潰時 Bot 本身必須繼續運作、QQ 訊息收發不受影響：本模組完全不
// 依賴或引用任何 QQ／WebSocket 相關程式碼，崩潰只影響是否還會重新 fork Worker。
//
// 「同一時間只允許一個 Worker」跨 Bot process 重啟的保證：靠 lockFilePath
// 這個鎖檔案。原子性來自 fs.openSync(path, 'wx')（O_CREAT | O_EXCL）——
// 兩個 Bot 進程若同時嘗試建立同一個檔案，作業系統保證只有一個會成功，
// 另一個會拿到 EEXIST，這是唯一真正提供互斥保證的步驟；先前「讀檔案
// 判斷是否存在」再「寫入」的兩步驟寫法有 TOCTOU 競態，兩個 Bot 都可能
// 先看到「沒有鎖」，再各自 fork 出一個 Worker。
//
// 鎖檔案內容記錄 { ownerToken, botPid, workerPid }：botPid 是持有鎖的
// Bot 自己的 process.pid（不是 Worker 的），workerPid 是目前該 Bot fork
// 出來的 Worker 的 pid（退避等待重啟期間為 null）。判斷鎖是否可以被接手：
// - botPid 仍存活：無論 workerPid 為何，都代表另一個 Bot 仍在管理自己的
//   Worker 生命週期（可能正在退避重啟等待中），不得介入。
// - botPid 已不存在，但 workerPid 仍存活：Bot 異常結束但其 Worker 變成
//   孤兒行程，這正是本模組要偵測的情形——不能自動搶鎖再多開一個 Worker，
//   必須留下明確、可辨識的失敗狀態等待人工介入。
// - botPid 與 workerPid（如有記錄）皆已不存在：鎖是真正的過期垃圾，
//   安全清除後才能重新以 exclusive create 宣告所有權。
import { ChildProcess, fork } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { WORKER_PID_PATH } from './config'

// 第 1／2／3 次重啟分別等待 5 秒、30 秒、120 秒
const RESTART_DELAYS_MS = [5000, 30000, 120000]
// 重啟後存活滿 5 分鐘才將失敗計數歸零
const SURVIVAL_THRESHOLD_MS = 5 * 60 * 1000
// 第 4 次崩潰（即连续 4 次都未存活满 5 分钟）时停止自动重启
const MAX_SHORT_LIVED_CRASHES = 4
// stop() 等待 Worker 自行结束的上限；超过仍未收到 exit 时记录失败并放弃
// 等待，讓 Bot 能繼續完成收尾流程，不永久卡住（見 stop() 內的說明）
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 30000

// 刻意保持为 unknown：真实实作回传 NodeJS.Timeout，测试端的假时钟可能改用
// 单纯的数字 id，supervisor 本身只会原样传回 clearTimer，不检查其内部结构
type TimerHandle = unknown

export type WorkerLockBlockedReason = 'none' | 'live_bot' | 'orphan_worker'

interface WorkerLock {
  ownerToken: string
  botPid: number
  workerPid: number | null
}

function serializeLock(lock: WorkerLock): string {
  return JSON.stringify(lock)
}

function parseLock(text: string): WorkerLock | null {
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    const candidate = parsed as Record<string, unknown>
    if (
      typeof candidate['ownerToken'] !== 'string' ||
      typeof candidate['botPid'] !== 'number' ||
      !(candidate['workerPid'] === null || typeof candidate['workerPid'] === 'number')
    ) {
      return null
    }
    return {
      ownerToken: candidate['ownerToken'],
      botPid: candidate['botPid'],
      workerPid: candidate['workerPid'] as number | null
    }
  } catch {
    return null
  }
}

function defaultReadLockFile(lockFilePath: string): string | null {
  try {
    return fs.readFileSync(lockFilePath, 'utf8')
  } catch {
    return null
  }
}

// 唯一真正提供互斥保證的操作：O_CREAT | O_EXCL，檔案已存在時 open 會直接
// 失敗（EEXIST），不會有「先檢查後寫入」之間的競態窗口
function defaultCreateLockFileExclusive(lockFilePath: string, content: string): boolean {
  fs.mkdirSync(path.dirname(lockFilePath), { recursive: true })
  let fd: number
  try {
    fd = fs.openSync(lockFilePath, 'wx')
  } catch (error) {
    const errno = error as NodeJS.ErrnoException
    if (errno.code === 'EEXIST') {
      return false
    }
    throw error
  }
  try {
    fs.writeSync(fd, content)
  } finally {
    fs.closeSync(fd)
  }
  return true
}

// 更新已經持有的鎖（例如補上剛 fork 出來的 Worker pid）；呼叫端必須先
// 自行確認仍持有該鎖的所有權，這裡不重複檢查
function defaultWriteLockFile(lockFilePath: string, content: string): void {
  fs.writeFileSync(lockFilePath, content, 'utf8')
}

function defaultRemoveLockFile(lockFilePath: string): void {
  try {
    fs.unlinkSync(lockFilePath)
  } catch {
    // 檔案不存在或刪除失敗都不阻擋後續流程
  }
}

// 以 signal 0 探測行程是否存活，不會真的送出任何終止信號；ESRCH 代表行程
// 不存在（視為未存活），其餘錯誤（例如 EPERM，行程存在但沒有權限操作）
// 一律視為「仍存活」，避免誤判導致同時跑出兩個 Worker
function defaultIsProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    const errno = error as NodeJS.ErrnoException
    return errno.code !== 'ESRCH'
  }
}

export interface WorkerSupervisorOptions {
  // 被帶起的 Worker 進入點，預設為同目錄下編譯後的 worker.js
  workerModulePath?: string
  // 可注入的 fork 實作，供測試以假子行程替換真正的 child_process.fork
  forkChild?: (modulePath: string) => ChildProcess
  // 可注入的計時器，供測試控制退避與存活門檻的時間流逝
  setTimer?: (callback: () => void, delayMs: number) => TimerHandle
  clearTimer?: (handle: TimerHandle) => void
  logger?: Pick<Console, 'log' | 'warn' | 'error'>
  // stop() 等待 Worker 自行結束的上限（毫秒），供測試縮短等待時間
  shutdownTimeoutMs?: number
  // 鎖檔案路徑，預設為 config.ts 的 WORKER_PID_PATH
  lockFilePath?: string
  // 本 Bot 自己的 process id，寫入鎖檔案供其他 Bot 判斷本進程是否仍存活；
  // 預設為真實的 process.pid，測試可注入固定值
  botPid?: number
  // 以下四個依賴皆可注入，供測試不必真的讀寫檔案或檢查真實行程
  readLockFile?: (lockFilePath: string) => string | null
  createLockFileExclusive?: (lockFilePath: string, content: string) => boolean
  writeLockFile?: (lockFilePath: string, content: string) => void
  removeLockFile?: (lockFilePath: string) => void
  isProcessAlive?: (pid: number) => boolean
}

export class WorkerSupervisor {
  private readonly workerModulePath: string
  private readonly forkChild: (modulePath: string) => ChildProcess
  private readonly setTimer: (callback: () => void, delayMs: number) => TimerHandle
  private readonly clearTimer: (handle: TimerHandle) => void
  private readonly logger: Pick<Console, 'log' | 'warn' | 'error'>
  private readonly shutdownTimeoutMs: number
  private readonly lockFilePath: string
  private readonly botPid: number
  private readonly readLockFile: (lockFilePath: string) => string | null
  private readonly createLockFileExclusive: (lockFilePath: string, content: string) => boolean
  private readonly writeLockFile: (lockFilePath: string, content: string) => void
  private readonly removeLockFile: (lockFilePath: string) => void
  private readonly isProcessAlive: (pid: number) => boolean

  private child: ChildProcess | null = null
  private failureCount = 0
  private lastError = ''
  private manualStop = false
  private givenUp = false
  private blockedReason: WorkerLockBlockedReason = 'none'
  private restartTimer: TimerHandle | null = null
  private survivalTimer: TimerHandle | null = null
  private ownerToken: string | null = null
  private holdingLock = false

  constructor(options: WorkerSupervisorOptions = {}) {
    this.workerModulePath = options.workerModulePath ?? path.join(__dirname, 'worker.js')
    this.forkChild = options.forkChild ?? ((modulePath) => fork(modulePath))
    this.setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay))
    this.clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle as NodeJS.Timeout))
    this.logger = options.logger ?? console
    this.shutdownTimeoutMs = options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS
    this.lockFilePath = options.lockFilePath ?? WORKER_PID_PATH
    this.botPid = options.botPid ?? process.pid
    this.readLockFile = options.readLockFile ?? defaultReadLockFile
    this.createLockFileExclusive =
      options.createLockFileExclusive ?? defaultCreateLockFileExclusive
    this.writeLockFile = options.writeLockFile ?? defaultWriteLockFile
    this.removeLockFile = options.removeLockFile ?? defaultRemoveLockFile
    this.isProcessAlive = options.isProcessAlive ?? defaultIsProcessAlive
  }

  // 嘗試以原子方式取得鎖；回傳 'acquired' 代表成功、可以繼續 fork，其餘
  // 兩種回傳值都代表必須放棄本次啟動
  private tryAcquireLock(): 'acquired' | 'blocked_by_live_bot' | 'blocked_by_orphan_worker' {
    const existingText = this.readLockFile(this.lockFilePath)
    if (existingText !== null) {
      const existingLock = parseLock(existingText)
      if (existingLock === null) {
        // 內容不合法，視為殘留垃圾
        this.removeLockFile(this.lockFilePath)
      } else if (this.isProcessAlive(existingLock.botPid)) {
        return 'blocked_by_live_bot'
      } else if (
        existingLock.workerPid !== null &&
        this.isProcessAlive(existingLock.workerPid)
      ) {
        return 'blocked_by_orphan_worker'
      } else {
        this.removeLockFile(this.lockFilePath)
      }
    }

    const ownerToken = crypto.randomBytes(16).toString('hex')
    const claimed = this.createLockFileExclusive(
      this.lockFilePath,
      serializeLock({ ownerToken, botPid: this.botPid, workerPid: null })
    )
    if (!claimed) {
      // 在上面的清理判斷與這裡的建立之間，被另一個進程搶先建立
      // （TOCTOU 窗口）；exclusive create 的失敗才是真正可信的訊號
      return 'blocked_by_live_bot'
    }

    this.ownerToken = ownerToken
    this.holdingLock = true
    return 'acquired'
  }

  // 更新已持有鎖的 workerPid 欄位（fork 成功後補上實際 pid、Worker 結束
  // 後改回 null）；沒有持有鎖時安全地什麼都不做
  private updateLockWorkerPid(workerPid: number | null): void {
    if (!this.holdingLock || this.ownerToken === null) {
      return
    }
    this.writeLockFile(
      this.lockFilePath,
      serializeLock({ ownerToken: this.ownerToken, botPid: this.botPid, workerPid })
    )
  }

  // 釋放鎖：讀回目前檔案內容，只有 ownerToken 與自己相符才刪除，避免
  // 刪掉別人合法持有的鎖
  private releaseLock(): void {
    if (!this.holdingLock || this.ownerToken === null) {
      return
    }
    const existingText = this.readLockFile(this.lockFilePath)
    if (existingText !== null) {
      const existingLock = parseLock(existingText)
      if (existingLock !== null && existingLock.ownerToken === this.ownerToken) {
        this.removeLockFile(this.lockFilePath)
      }
    }
    this.holdingLock = false
    this.ownerToken = null
  }

  // Worker 是否因鎖被佔用而拒絕啟動（不論原因）；Bot 可用以判斷是否
  // 需要人工介入
  isBlockedByExistingWorker(): boolean {
    return this.blockedReason !== 'none'
  }

  // 更精確的拒絕原因：'live_bot' 代表另一個仍存活的 Bot 進程持有鎖；
  // 'orphan_worker' 代表持有鎖的 Bot 已不存在、但其 Worker 仍存活，
  // 是需要人工特別留意清理的孤兒行程情形
  getBlockedReason(): WorkerLockBlockedReason {
    return this.blockedReason
  }

  // 啟動監控：立即 fork 一次 Worker；不等待、不阻塞呼叫端。
  // 冪等：若已有存活的 child 或正在等待退避重啟，直接忽略本次呼叫，
  // 不會疊加出第二個 Worker——同時只允許一個 Worker 是硬性規則，
  // 不能靠呼叫端自律保證只呼叫一次 start()
  start(): void {
    if (this.child !== null) {
      this.logger.warn(
        '[WorkerSupervisor] start() 被重複呼叫，但已有存活的 Worker，忽略本次請求'
      )
      return
    }
    if (this.restartTimer !== null) {
      this.logger.warn(
        '[WorkerSupervisor] start() 被重複呼叫，但已有等待中的重啟排程，忽略本次請求'
      )
      return
    }

    const result = this.tryAcquireLock()
    if (result !== 'acquired') {
      this.blockedReason = result === 'blocked_by_orphan_worker' ? 'orphan_worker' : 'live_bot'
      if (result === 'blocked_by_orphan_worker') {
        this.logger.error(
          `[WorkerSupervisor] 偵測到孤兒 Worker 仍在運行（鎖檔案 ${this.lockFilePath} 記錄的 ` +
          'Bot 進程已不存在，但其 Worker 仍存活）；拒絕啟動第二個 Worker，需人工確認並終止 ' +
          '該孤兒行程後，刪除鎖檔案再重啟 Bot'
        )
      } else {
        this.logger.error(
          `[WorkerSupervisor] 偵測到另一個仍在運行的 Bot 進程持有 Worker 鎖（` +
          `${this.lockFilePath}）；拒絕啟動第二個 Worker`
        )
      }
      return
    }

    this.blockedReason = 'none'
    this.manualStop = false
    this.givenUp = false
    this.failureCount = 0
    this.spawnChild()
  }

  private spawnChild(): void {
    const child = this.forkChild(this.workerModulePath)
    this.child = child
    this.updateLockWorkerPid(child.pid ?? null)

    // child_process 的 'error' 事件（fork 失敗、無法傳送訊息等 IPC 層級
    // 錯誤）若完全沒有監聽者，Node 會將其視為未處理錯誤並拋出，直接
    // crash 掉整個 Bot 行程——這正是 WorkerSupervisor 存在的目的所要避免
    // 的事。無論 spawn 失敗後是否也會觸發 exit，都用 settled 旗標確保
    // 只處理一次，不重複計入失敗次數
    let settled = false

    child.on('error', (error: Error) => {
      if (settled) {
        return
      }
      settled = true
      this.handleUnexpectedEnd(`spawn/IPC error: ${error.message}`)
    })

    child.once('exit', (code, signal) => {
      if (settled) {
        return
      }
      settled = true
      this.handleUnexpectedEnd(`exit code=${String(code)} signal=${String(signal)}`)
    })

    // 重啟後的 Worker 存活滿 5 分鐘才歸零失敗計數；若在此之前結束，
    // handleUnexpectedEnd 會先清除這個計時器，不會誤判為「已存活滿 5 分鐘」
    this.survivalTimer = this.setTimer(() => {
      this.survivalTimer = null
      this.failureCount = 0
    }, SURVIVAL_THRESHOLD_MS)
  }

  // 子行程「非預期結束」的共用處理：正常結束（exit）與根本沒能啟動或
  // IPC 層級失敗（error）都會導向這裡，退避與存活計數規則一視同仁
  private handleUnexpectedEnd(reason: string): void {
    this.child = null

    if (this.survivalTimer !== null) {
      this.clearTimer(this.survivalTimer)
      this.survivalTimer = null
    }

    // 由 stop() 主動要求關閉時，退出屬預期行為，不計入崩潰次數也不重啟；
    // 鎖的釋放交由 stop() 自己處理
    if (this.manualStop) {
      return
    }

    // Worker 確定已結束，把鎖檔案的 workerPid 欄位改回 null：這個 Bot
    // 進程仍然存活（botPid 未變），其他 Bot 依然不能搶鎖，但如果這個
    // Bot 之後也異常結束，下一個 Bot 才能正確判斷「沒有孤兒 Worker」
    this.updateLockWorkerPid(null)

    this.failureCount += 1
    this.lastError = reason

    if (this.failureCount >= MAX_SHORT_LIVED_CRASHES) {
      this.givenUp = true
      this.logger.error(
        `[WorkerSupervisor] Worker 連續崩潰 ${this.failureCount} 次，停止自動重啟；` +
        `最後錯誤: ${this.lastError}；Bot 本身繼續運作，僅背景匯入／AI／向量重算停擺，` +
        '需人工重啟整個 Bot 進程'
      )
      // 已經不會再有 Worker 在這個 Bot 底下運行，釋放鎖讓之後手動重啟的
      // Bot（或另一個 Bot）可以正常接手
      this.releaseLock()
      return
    }

    const delayIndex = Math.min(this.failureCount - 1, RESTART_DELAYS_MS.length - 1)
    const delay = RESTART_DELAYS_MS[delayIndex]
    this.logger.warn(
      `[WorkerSupervisor] Worker 異常結束（第 ${this.failureCount} 次），` +
      `${delay / 1000} 秒後重新 fork；錯誤: ${this.lastError}`
    )
    this.restartTimer = this.setTimer(() => {
      this.restartTimer = null
      this.spawnChild()
    }, delay)
  }

  // Worker 是否已因連續崩潰停止自動重啟；Bot 可用以判斷是否需要人工介入
  hasGivenUp(): boolean {
    return this.givenUp
  }

  getFailureCount(): number {
    return this.failureCount
  }

  getLastError(): string {
    return this.lastError
  }

  isRunning(): boolean {
    return this.child !== null
  }

  // 優雅關閉：以 IPC 訊息通知 Worker 收尾，等待其自行結束後才 resolve。
  // 不呼叫 child.kill()：Windows 上該呼叫等同直接強制終止，會讓 Worker
  // 沒有機會完成當前 transaction 或關閉資料庫連線，違反「不可強殺已開始
  // 的 transaction」的要求
  async stop(): Promise<void> {
    this.manualStop = true
    if (this.restartTimer !== null) {
      this.clearTimer(this.restartTimer)
      this.restartTimer = null
    }
    if (this.survivalTimer !== null) {
      this.clearTimer(this.survivalTimer)
      this.survivalTimer = null
    }

    const child = this.child
    if (child === null) {
      return
    }

    let confirmedExit = false

    await new Promise<void>((resolve) => {
      let settled = false
      let timeoutHandle: TimerHandle | null = null

      const finish = (): void => {
        if (settled) {
          return
        }
        settled = true
        if (timeoutHandle !== null) {
          this.clearTimer(timeoutHandle)
        }
        resolve()
      }

      child.once('exit', () => {
        confirmedExit = true
        finish()
      })

      // 有界等待：IPC 已斷線、kill() 失敗、或 Worker 遲遲不結束時都不可
      // 讓 Bot 的收尾流程永久卡住。逾時只記錄失敗並放棄等待（resolve），
      // 不會補送任何強制終止手段——維持「不可強殺已開始的 transaction」
      // 這條原則不變，只是不再無限期等待一個可能永遠不會發生的 exit
      timeoutHandle = this.setTimer(() => {
        this.logger.error(
          '[WorkerSupervisor] 等待 Worker 關閉逾時，Worker 可能仍在運行；' +
          'Bot 放棄等待並繼續完成收尾流程'
        )
        finish()
      }, this.shutdownTimeoutMs)

      if (child.connected) {
        child.send({ type: 'shutdown' })
      } else {
        // IPC 通道已斷線：無法再送出優雅關閉訊息，Worker 不可能收到通知，
        // 繼续等待只会让 Bot shutdown 永久卡住。此时唯一剩下的手段是送终止
        // 信号；这不是「强杀一个正在进行的 transaction」——那种情况下 IPC
        // 理应仍然连通，能正常送出 shutdown 訊息並等待 Worker 自行收尾。
        // kill() 本身可能失敗（回傳 false），此時仍靠上方的逾時計時器
        // 保證 stop() 終究會 resolve，不會永久卡住
        this.logger.warn(
          '[WorkerSupervisor] Worker 的 IPC 通道已斷線，改送終止信號等待其結束'
        )
        const killed = child.kill('SIGTERM')
        if (!killed) {
          this.logger.error(
            '[WorkerSupervisor] 無法送出終止信號（kill 失敗），將等待逾時後放棄等待'
          )
        }
      }
    })

    if (confirmedExit) {
      // 只有確認 Worker 真的結束了才釋放鎖：逾時放棄等待時 Worker 可能
      // 仍然存活，此時釋放鎖會讓另一個 Bot 進程的 exclusive create 誤判
      // 為安全，跑出跟這個「未確認結束」的 Worker 同時存在的第二個 Worker
      this.releaseLock()
    } else {
      this.logger.error(
        '[WorkerSupervisor] Worker 未確認結束，鎖檔案保留，避免其他 Bot 進程誤判可安全啟動新 Worker'
      )
    }
    this.child = null
  }
}
