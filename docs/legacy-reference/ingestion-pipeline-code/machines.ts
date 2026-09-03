// database.json 机器同步器（T1.4a）
// 每次 Bot 启动以 database.json 的正规化文字内容 SHA-256 侦测内容是否变更（只改
// 行尾不视为变更）；未变更时不写入 machines / machine_tags。变更时以单一
// transaction 用 ON CONFLICT(sub_id) DO UPDATE 同步 JSON 管理栏位，逐机器比对
// machine_tags 差异，并将 JSON 不再包含的机器标记为来源已移除（不删除、不改
// status）。不呼叫 AI、不进 Raw 扫描器、不建立 source_references、不建立
// machine_terms（见 T2.2）
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import Database from 'better-sqlite3'
import { getDatabase } from '../connection'
import { DATABASE_PATH, PROJECT_ROOT } from '../../config'
import { getSourcePolicy } from '../sourcePolicy'
import { findSourceByKey, registerSource } from './sources'

const MACHINE_SOURCE_KEY = 'openst_machine_submission'
const IMPORTER_VERSION = 't1.4a-machines'

interface RawMachineRecord {
  id: string
  name: string
  author?: string
  tags?: string[]
  description?: string
  preview?: string
  filename?: string
  sub_id: string
}

export interface MachineSyncResult {
  synced: boolean
  machineCount: number
  tagCount: number
  removedCount: number
}

interface ImportRunSummaryRow {
  summary_json: string
}

function sha256Hex(input: Buffer | string): string {
  return createHash('sha256').update(input).digest('hex')
}

// 本仓库 core.autocrlf=true，手动编辑 database.json 时行尾可能在 LF/CRLF 间
// 跳动；只因换行差异判定「内容已变更」会造成不必要的全量同步与噪音写入
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// canonical JSON：物件键按字母排序、阵列保留原顺序，确保同一笔机器资料不因
// JSON.stringify 键顺序差异算出不同雜湊
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = canonicalize((value as Record<string, unknown>)[key])
    }
    return sorted
  }
  return value
}

function canonicalJsonHash(record: RawMachineRecord): string {
  return sha256Hex(JSON.stringify(canonicalize(record)))
}

function readDatabaseFile(databaseAbsolutePath: string): {
  fileHash: string
  records: RawMachineRecord[]
} {
  const raw = fs.readFileSync(databaseAbsolutePath, 'utf-8')
  const records = JSON.parse(raw) as unknown
  if (!Array.isArray(records)) {
    throw new Error(`${databaseAbsolutePath} 顶层必须是阵列`)
  }
  return {
    fileHash: sha256Hex(normalizeLineEndings(raw)),
    records: records as RawMachineRecord[]
  }
}

// 只信任本来源最近一次成功匯入记录的雜湊，避免失败的匯入被误判为「未变更」
function findLastSyncedHash(
  database: Database.Database,
  sourceId: number
): string | null {
  const row = database.prepare<[number], ImportRunSummaryRow>(`
    SELECT summary_json FROM import_runs
    WHERE source_id = ? AND status = 'succeeded'
    ORDER BY id DESC LIMIT 1
  `).get(sourceId)
  if (row === undefined) {
    return null
  }

  try {
    const summary = JSON.parse(row.summary_json) as { databaseHash?: unknown }
    return typeof summary.databaseHash === 'string' ? summary.databaseHash : null
  } catch {
    return null
  }
}

// ON CONFLICT(sub_id) DO UPDATE 只更新 JSON 管理的栏位；status 不在 SET 清单中，
// 因此人工调整过的非 approved status 永远不会被本函式覆写。source_removed_at
// 固定清为 NULL：机器重新出现在 JSON 中即代表来源已恢复，不论新建或既有列
function upsertMachine(
  database: Database.Database,
  record: RawMachineRecord,
  sourceHash: string,
  now: string
): number {
  database.prepare(`
    INSERT INTO machines (
      source_id, name, author, description, preview_path, filename, sub_id,
      source_hash, source_removed_at, created_at, updated_at
    ) VALUES (
      @sourceId, @name, @author, @description, @previewPath, @filename, @subId,
      @sourceHash, NULL, @now, @now
    )
    ON CONFLICT(sub_id) DO UPDATE SET
      source_id = excluded.source_id,
      name = excluded.name,
      author = excluded.author,
      description = excluded.description,
      preview_path = excluded.preview_path,
      filename = excluded.filename,
      source_hash = excluded.source_hash,
      source_removed_at = NULL,
      updated_at = excluded.updated_at
  `).run({
    sourceId: record.id,
    name: record.name,
    author: record.author || 'Unknown',
    description: record.description || '',
    previewPath: record.preview || '',
    filename: record.filename || '',
    subId: record.sub_id,
    sourceHash,
    now
  })

  const row = database
    .prepare<[string], { id: number }>('SELECT id FROM machines WHERE sub_id = ?')
    .get(record.sub_id)
  if (row === undefined) {
    throw new Error(`同步后找不到刚写入的机器：sub_id=${record.sub_id}`)
  }
  return row.id
}

// 依集合差异同步单一机器的 tag：新增缺少的、移除多余的，未变动的保持原样
function syncMachineTags(
  database: Database.Database,
  machineId: number,
  desiredTags: string[]
): number {
  const existingRows = database
    .prepare<[number], { tag: string }>('SELECT tag FROM machine_tags WHERE machine_id = ?')
    .all(machineId)
  const existing = new Set(existingRows.map((r) => r.tag))
  const desired = new Set(desiredTags)

  const insertTag = database.prepare(
    'INSERT INTO machine_tags (machine_id, tag) VALUES (?, ?)'
  )
  for (const tag of desired) {
    if (!existing.has(tag)) {
      insertTag.run(machineId, tag)
    }
  }

  const deleteTag = database.prepare(
    'DELETE FROM machine_tags WHERE machine_id = ? AND tag = ?'
  )
  for (const tag of existing) {
    if (!desired.has(tag)) {
      deleteTag.run(machineId, tag)
    }
  }

  return desired.size
}

// 将不再出现于本次 JSON 的既有机器标记为来源已移除；不删除列、不改动 status——
// status 的转移只能由人工审核者驱动（见 src/db/enums.ts 的 REVIEWER_ONLY_TO），
// 来源是否仍存在于 JSON 是系统事实，与审核决定无关，因此用独立栏位表示
function markRemovedMachines(
  database: Database.Database,
  currentSubIds: ReadonlySet<string>,
  now: string
): number {
  const activeRows = database
    .prepare<[], { id: number; sub_id: string }>(
      'SELECT id, sub_id FROM machines WHERE source_removed_at IS NULL'
    )
    .all()

  const markRemoved = database.prepare(
    'UPDATE machines SET source_removed_at = ? WHERE id = ?'
  )

  let removedCount = 0
  for (const row of activeRows) {
    if (!currentSubIds.has(row.sub_id)) {
      markRemoved.run(now, row.id)
      removedCount += 1
    }
  }
  return removedCount
}

// 每次 Bot 启动调用一次：database.json 未变更时直接返回、不写任何资料表；
// 变更时在单一 transaction 内同步 machines 与 machine_tags，并记录本次同步
// 使用的档案雜湊供下次比对
export function syncMachinesIfChanged(
  database: Database.Database = getDatabase(),
  databaseAbsolutePath: string = path.join(PROJECT_ROOT, DATABASE_PATH)
): MachineSyncResult {
  const { fileHash, records } = readDatabaseFile(databaseAbsolutePath)

  // 只读查询既有来源，不在此处写入：来源登记必须与 machines/tag 同步共享同一个
  // transaction，否则同步失败 rollback 时会留下一笔无对应资料的 sources 纪录
  const existingSource = findSourceByKey(MACHINE_SOURCE_KEY, database)
  const lastSyncedHash = existingSource === null
    ? null
    : findLastSyncedHash(database, existingSource.id)

  if (lastSyncedHash === fileHash) {
    const tagCount = records.reduce(
      (sum, record) => sum + new Set(record.tags ?? []).size,
      0
    )
    return { synced: false, machineCount: records.length, tagCount, removedCount: 0 }
  }

  const runSync = database.transaction((): { tagCount: number; removedCount: number } => {
    const source = registerSource(getSourcePolicy(MACHINE_SOURCE_KEY), database)
    const now = new Date().toISOString()
    let tagCount = 0
    const currentSubIds = new Set<string>()

    for (const record of records) {
      currentSubIds.add(record.sub_id)
      const sourceHash = canonicalJsonHash(record)
      const machineId = upsertMachine(database, record, sourceHash, now)
      tagCount += syncMachineTags(database, machineId, record.tags ?? [])
    }

    const removedCount = markRemovedMachines(database, currentSubIds, now)

    database.prepare(`
      INSERT INTO import_runs (
        source_id, importer_version, started_at, finished_at, status, summary_json
      ) VALUES (?, ?, ?, ?, 'succeeded', ?)
    `).run(
      source.id,
      IMPORTER_VERSION,
      now,
      now,
      JSON.stringify({
        databaseHash: fileHash,
        machineCount: records.length,
        tagCount,
        removedCount
      })
    )

    return { tagCount, removedCount }
  })

  const { tagCount, removedCount } = runSync()
  return { synced: true, machineCount: records.length, tagCount, removedCount }
}
