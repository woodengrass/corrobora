// public/database/raw/import-manifest.json 的讀寫與結構驗證
// 本機 generated state，不提交 Git（見 .gitignore）；Raw 目錄本身與資料庫內既有
// raw_assets 才是真源，manifest 只是加速增量掃描的本機快取
import fs from 'fs'
import path from 'path'

export type ManifestFileStatus = 'succeeded' | 'failed'

export interface ManifestFileEntry {
  sha256: string
  lastImportRunId: number | null
  lastImportedAt: string
  status: ManifestFileStatus
  // 失敗時的診斷訊息；成功項目不帶此欄位
  lastError?: string
}

export interface ImportManifest {
  version: 1
  files: Record<string, ManifestFileEntry>
}

const MANIFEST_STATUSES: readonly ManifestFileStatus[] = ['succeeded', 'failed']

function isManifestFileEntry(value: unknown): value is ManifestFileEntry {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const entry = value as Record<string, unknown>
  const statusValid =
    typeof entry['status'] === 'string' &&
    MANIFEST_STATUSES.includes(entry['status'] as ManifestFileStatus)

  return (
    typeof entry['sha256'] === 'string' &&
    (entry['lastImportRunId'] === null || typeof entry['lastImportRunId'] === 'number') &&
    typeof entry['lastImportedAt'] === 'string' &&
    statusValid &&
    (entry['lastError'] === undefined || typeof entry['lastError'] === 'string')
  )
}

function isImportManifest(value: unknown): value is ImportManifest {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const manifest = value as Record<string, unknown>
  if (manifest['version'] !== 1) {
    return false
  }
  if (typeof manifest['files'] !== 'object' || manifest['files'] === null) {
    return false
  }
  return Object.values(manifest['files'] as Record<string, unknown>).every(isManifestFileEntry)
}

export function createEmptyManifest(): ImportManifest {
  return { version: 1, files: {} }
}

// 缺失或損毀的 manifest 一律回退為全新 manifest：檔案不存在是正常的首次執行，
// 內容損毀則記錄警告以便診斷，但都不得中斷 Worker 啟動或掃描流程
export function loadManifest(manifestPath: string): ImportManifest {
  let raw: string
  try {
    raw = fs.readFileSync(manifestPath, 'utf8')
  } catch {
    return createEmptyManifest()
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isImportManifest(parsed)) {
      console.warn(`[Manifest] ${manifestPath} 格式不合法，回退為全新 manifest`)
      return createEmptyManifest()
    }
    return parsed
  } catch (error) {
    console.warn(`[Manifest] ${manifestPath} 解析失敗，回退為全新 manifest:`, error)
    return createEmptyManifest()
  }
}

// 原子寫入：先寫暫存檔再 rename，避免進程崩潰或並發寫入留下半份 JSON
export function saveManifest(manifestPath: string, manifest: ImportManifest): void {
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true })
  const tempPath = `${manifestPath}.tmp-${process.pid}-${Date.now()}`
  fs.writeFileSync(tempPath, JSON.stringify(manifest, null, 2), 'utf8')
  fs.renameSync(tempPath, manifestPath)
}
