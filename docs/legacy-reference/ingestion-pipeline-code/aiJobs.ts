// ai_jobs 佇列生命週期工具
//
// T1.2a／T2.4 邊界（務必遵守，不可越界）：
// - T1.2a（本檔案＋rawScanner.ts＋worker.ts）只負責：
//   1. 掃描器建立 status = 'queued' 的 job（document_triage）。
//   2. Worker 啟動時把殘留的 running job 復原為 queued
//      （resetRunningAiJobsToQueued，worker.ts 會呼叫）。
//   3. 提供 claimNextAiJob／completeAiJob／failAiJob 這組佇列生命週期介面，
//      但只是「介面」——本 Track 不會呼叫它們，Worker 目前的主迴圈完全不
//      消費 ai_jobs。
// - T2.4（尚未開始）才負責：實際讀取 Raw 內容、呼叫 Flash／Pro 模型、寫入
//   ai_runs／extraction_candidates、呼叫 claimNextAiJob 取件與
//   completeAiJob／failAiJob 收尾。
// - 之所以刻意不把 claim/complete/fail 接進 Worker 主迴圈：目前沒有任何
//   document_triage handler，若貿然呼叫 claimNextAiJob，job 會被標記
//   running 但永遠不會被完成或失敗收尾，比維持 queued 更糟；若為了「看起來
//   有在跑」而呼叫 completeAiJob，等同偽造 T2.4 尚未存在的處理結果。
// - 因此：ai_jobs 在 T1.2a 完成後會維持 queued，這是刻意的、正確的狀態，
//   不是遺漏——直到 T2.4 的消費者實作完成並接上這三個函式為止。
import Database from 'better-sqlite3'
import { getDatabase } from '../connection'
import { AiJobStatus, assertAiJobStatus } from '../enums'

export interface AiJobRecord {
  id: number
  rawAssetId: number
  taskType: string
  payloadJson: string
  status: AiJobStatus
  attempts: number
  availableAt: string
  lockedAt: string | null
  lastError: string
  createdAt: string
  updatedAt: string
}

interface AiJobRow {
  id: number
  raw_asset_id: number
  task_type: string
  payload_json: string
  status: string
  attempts: number
  available_at: string
  locked_at: string | null
  last_error: string
  created_at: string
  updated_at: string
}

function toAiJobRecord(row: AiJobRow): AiJobRecord {
  return {
    id: row.id,
    rawAssetId: row.raw_asset_id,
    taskType: row.task_type,
    payloadJson: row.payload_json,
    status: assertAiJobStatus(row.status),
    attempts: row.attempts,
    availableAt: row.available_at,
    lockedAt: row.locked_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

// Worker 啟動時的復原邏輯：把上次進程異常結束時殘留的 running job 恢復為
// queued，確保被中斷的工作會在下次消費循環重新處理，而不是永遠卡住
export function resetRunningAiJobsToQueued(
  database: Database.Database = getDatabase()
): number {
  const now = new Date().toISOString()
  const result = database.prepare(`
    UPDATE ai_jobs
    SET status = 'queued', locked_at = NULL, updated_at = ?
    WHERE status = 'running'
  `).run(now)
  return result.changes
}

// 取下一個可執行的 job：以單一 transaction 將 queued 改為 running 並遞增
// attempts；供 T2.4 的實際消費者呼叫，本 Track 不在 Worker 主流程中使用
export function claimNextAiJob(
  database: Database.Database = getDatabase()
): AiJobRecord | null {
  return database.transaction(() => {
    const now = new Date().toISOString()
    const row = database.prepare<[string], AiJobRow>(`
      SELECT * FROM ai_jobs
      WHERE status = 'queued' AND available_at <= ?
      ORDER BY available_at ASC, id ASC
      LIMIT 1
    `).get(now)
    if (row === undefined) {
      return null
    }

    database.prepare(`
      UPDATE ai_jobs
      SET status = 'running', attempts = attempts + 1, locked_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, row.id)

    return toAiJobRecord({
      ...row,
      status: 'running',
      attempts: row.attempts + 1,
      locked_at: now,
      updated_at: now
    })
  })()
}

// 每個 job 的最大重試上限（T1.2a 計畫規則），本 Track 不含實際呼叫方，
// 由 T2.4 的消費者決定何時呼叫 failAiJob
const MAX_AI_JOB_ATTEMPTS = 3

// 任務成功收尾；實際結果寫入 ai_runs／extraction_candidates 由 T2.4 匯入器負責，
// 本函式只更新 ai_jobs 自身狀態
export function completeAiJob(
  jobId: number,
  database: Database.Database = getDatabase()
): void {
  const now = new Date().toISOString()
  database.prepare(`
    UPDATE ai_jobs SET status = 'succeeded', updated_at = ? WHERE id = ?
  `).run(now, jobId)
}

// 任務失敗：超過重試上限標記 failed，否則退回 queued 等待下次消費循環重試
export function failAiJob(
  jobId: number,
  errorMessage: string,
  database: Database.Database = getDatabase()
): void {
  const now = new Date().toISOString()
  const job = database
    .prepare<[number], AiJobRow>('SELECT * FROM ai_jobs WHERE id = ?')
    .get(jobId)
  if (job === undefined) {
    return
  }

  const status: AiJobStatus = job.attempts >= MAX_AI_JOB_ATTEMPTS ? 'failed' : 'queued'
  database.prepare(`
    UPDATE ai_jobs SET status = ?, last_error = ?, locked_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(status, errorMessage, now, jobId)
}
