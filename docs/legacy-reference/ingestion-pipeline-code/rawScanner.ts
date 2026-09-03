// Raw 目錄增量掃描器（T1.2a）
// 職責僅限確定性 Raw 登記與品質檢查後建立 ai_jobs.status = 'queued'；不解析文件
// 結構、不切段、不呼叫 AI／DeepSeek／embedding，這些屬於 T2.3／T2.4 的範圍。
// 掃描器可被重複呼叫（Worker 啟動時、每次檔案變動 debounce 後），只對新增或
// 正規化內容 SHA-256 改變的檔案派送 ai_jobs；未變更檔案依 manifest 直接跳過。
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import Database from 'better-sqlite3'
import { getDatabase } from '../connection'
import { registerSource, findSourceByKey } from './sources'
import { recordRawAssetSnapshot } from './rawAssets'
import { AiTaskType, QualityFlag, assertAiTaskType, assertQualityFlag } from '../enums'
import { RAW_DATABASE_ABS_DIR, RAW_IMPORT_MANIFEST_PATH } from '../../config'
import { ImportManifest, loadManifest, saveManifest } from './manifest'
import { getSourcePolicy } from '../sourcePolicy'

const MANIFEST_FILE_NAME = 'import-manifest.json'
const IMPORTER_VERSION = 'raw-scanner@1'
const AI_TASK_TYPE_DOCUMENT_TRIAGE: AiTaskType = 'document_triage'

// docs/document-ingestion.md 第 4 節支援的通用文件解析格式；.csv／.json
// 等結構化格式有各自專門的匯入器（T2.5～T2.7 的職責），不屬於通用文件
// 管線，即使內容能被當作 UTF-8 文字讀出，也不能誤判為可交給
// document_triage 分析的文件
const SUPPORTED_DOCUMENT_EXTENSIONS = new Set(['.md', '.markdown', '.html', '.htm', '.txt'])

// Raw scanner 實際會掃到、需要登記來源的 source_key 清單；每一個都必須在
// src/db/sourcePolicy.ts（docs/source-policy.md 的唯一程式碼鏡像）登記，
// 不得在本檔案另行硬編碼 license／creator／visibility（見該文件驗收規則 1）
const RAW_SCANNER_SOURCE_KEYS = [
  'gtmc',
  'storage_tech_dictionary',
  'techmc_glossary',
  'legacy_database_csv',
  'legacy_database_markdown',
  'legacy_dictionary_txt'
] as const

// 依相對路徑判定 source_key；找不到對應規則時直接拒絕，不得臆測或沿用鄰近
// 目錄的政策——新增來源時必須先在 docs/source-policy.md 與
// src/db/sourcePolicy.ts 一併登記
function resolveSourceKey(relativePath: string): string {
  if (relativePath === 'legacy/database.csv') {
    return 'legacy_database_csv'
  }
  if (relativePath === 'legacy/database.md') {
    return 'legacy_database_markdown'
  }
  if (relativePath === 'legacy/Dictionary.txt') {
    return 'legacy_dictionary_txt'
  }
  if (relativePath === 'TechMC Glossary.csv') {
    return 'techmc_glossary'
  }
  if (relativePath.startsWith('gtmc-database/')) {
    return 'gtmc'
  }
  if (relativePath.startsWith('dictionary/')) {
    return 'storage_tech_dictionary'
  }
  throw new Error(
    `未登記來源: ${relativePath}，請先在 docs/source-policy.md 與 ` +
    'src/db/sourcePolicy.ts 新增對應映射'
  )
}

// 幂等註冊掃描器可能用到的所有來源；registerSource 對已存在的 source_key
// 直接回傳既有記錄，不會覆蓋審核者事後調整過的欄位。政策定義統一從
// getSourcePolicy() 取得，不在本檔案重複硬編碼
function registerPolicySources(database: Database.Database): void {
  for (const sourceKey of RAW_SCANNER_SOURCE_KEYS) {
    registerSource(getSourcePolicy(sourceKey), database)
  }
}

interface NormalizeResult {
  normalized: string | null
  encoding: string
  isBinary: boolean
}

// 正規化順序固定為 UTF-8 解碼 -> 剝離 BOM -> 換行符統一為 \n（見
// docs/document-ingestion.md 第 2 節）；解碼失敗視為二進位，改用原始位元組雜湊
export function normalizeAndHash(rawBuffer: Buffer): NormalizeResult {
  const hasBom =
    rawBuffer.length >= 3 &&
    rawBuffer[0] === 0xef &&
    rawBuffer[1] === 0xbb &&
    rawBuffer[2] === 0xbf

  try {
    // fatal: true 時遇到非法 UTF-8 位元組序列會拋出，藉此判定二進位內容；
    // ignoreBOM 保持預設 false，解碼時會自動剝離開頭 BOM
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const decoded = decoder.decode(rawBuffer)
    const normalized = decoded.replace(/\r\n|\r/g, '\n')
    return { normalized, encoding: hasBom ? 'utf-8-bom' : 'utf-8', isBinary: false }
  } catch {
    return { normalized: null, encoding: 'binary', isBinary: true }
  }
}

// Node crypto 的 hex digest 固定為小寫，滿足「正規化 SHA-256 必須為小寫」的要求
export function computeContentHash(normalized: string | null, rawBuffer: Buffer): string {
  const bytes = normalized === null ? rawBuffer : Buffer.from(normalized, 'utf8')
  return crypto.createHash('sha256').update(bytes).digest('hex')
}

function normalizeRelativePath(rawRoot: string, absolutePath: string): string {
  return path.relative(rawRoot, absolutePath).split(path.sep).join('/')
}

function isWithinRoot(rawRoot: string, absolutePath: string): boolean {
  const resolvedRoot = path.resolve(rawRoot)
  const resolvedTarget = path.resolve(absolutePath)
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + path.sep)
}

// 只收錄 Raw 根目錄內的 regular file；不跟隨 symbolic link（無論指向檔案或
// 目錄），並顯式校驗解析後路徑仍在根目錄內，防止任何路徑跳出
function listRawFiles(rawRoot: string, manifestRelativeName: string): string[] {
  const discovered: string[] = []

  function walk(directory: string): void {
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) {
        continue
      }

      const entryPath = path.join(directory, entry.name)
      if (!isWithinRoot(rawRoot, entryPath)) {
        continue
      }

      if (entry.isDirectory()) {
        walk(entryPath)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      const relativePath = normalizeRelativePath(rawRoot, entryPath)
      if (relativePath === manifestRelativeName) {
        continue
      }

      discovered.push(relativePath)
    }
  }

  walk(rawRoot)
  return discovered
}

function insertQualityFlag(
  database: Database.Database,
  rawAssetId: number,
  flagType: QualityFlag,
  evidence: string
): void {
  assertQualityFlag(flagType)
  const now = new Date().toISOString()
  database.prepare(`
    INSERT INTO content_quality_flags (
      raw_asset_id, flag_type, detected_by, evidence, status, created_at
    ) VALUES (?, ?, 'rule', ?, 'open', ?)
  `).run(rawAssetId, flagType, evidence, now)
}

function insertAiJob(database: Database.Database, rawAssetId: number): void {
  assertAiTaskType(AI_TASK_TYPE_DOCUMENT_TRIAGE)
  const now = new Date().toISOString()
  database.prepare(`
    INSERT INTO ai_jobs (
      raw_asset_id, task_type, payload_json, status, attempts,
      available_at, locked_at, last_error, created_at, updated_at
    ) VALUES (?, ?, '{}', 'queued', 0, ?, NULL, '', ?, ?)
  `).run(rawAssetId, AI_TASK_TYPE_DOCUMENT_TRIAGE, now, now, now)
}

type ContentClassification = 'unsupported_format' | 'empty' | 'not_found' | 'eligible'

// docs/document-ingestion.md 第 5.1 節「本頁不存在」語意樣式；判定須同時
// 滿足長度與樣式兩個條件，避免把正常文章中提及 404 的段落誤判
const NOT_FOUND_PATTERNS: readonly RegExp[] = [
  /PageNotFound/i,
  /404/,
  /还没完成/,
  /敬请期待/,
  /coming soon/i,
  /under construction/i
]
const NOT_FOUND_MAX_LENGTH = 200

// 依 docs/document-ingestion.md 第 5.1／5.2 節，抽取「扣除標題與圖片後的
// 正文」：只用純規則（正規表示式）移除 Markdown 標題語法與圖片語法，
// 供 R2（空內容／僅標題無內容區塊）與 R3（404 判定）這兩條不需要完整
// AST 的確定性規則使用。不是真正的 Markdown 解析器，不處理清單、表格、
// 程式碼區塊、區段層級排除（R4 導航判定）——那些需要依標題切段的結構化
// 解析，屬於 T2.3 通用文件解析器的職責，本 Track 刻意不做
function extractBodyText(normalized: string): string {
  return normalized
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^#{1,6}[ \t]+.*$/gm, '')
    .trim()
}

// 正文在 200 字元以內，且命中「本頁不存在」語意樣式，兩個條件缺一不可
function isNotFoundContent(bodyText: string): boolean {
  if (bodyText.length > NOT_FOUND_MAX_LENGTH) {
    return false
  }
  return NOT_FOUND_PATTERNS.some((pattern) => pattern.test(bodyText))
}

// 判定內容是否可交給通用文件 AI 分流（document_triage）：
// - 二進位內容、或副檔名不在 SUPPORTED_DOCUMENT_EXTENSIONS 清單內
//   （.csv／.json 等結構化格式屬於 T2.5～T2.7 各自的專門匯入器，不是
//   通用文件管線）一律視為 unsupported_format。
// - 扣除標題與圖片後的正文為空，涵蓋「完全空白」與「僅有一個標題、
//   無任何內容區塊」兩種情形（docs/document-ingestion.md R2）。
// - 正文在 200 字元內且命中「本頁不存在」樣式，視為 not_found（R3）。
// - 其餘情形視為 eligible，可建立 ai_job。
// 不做的：R4 導航判定（需要依標題切段的結構化解析，屬 T2.3 範圍）。
function classifyContent(
  relativePath: string,
  isBinary: boolean,
  normalized: string | null
): ContentClassification {
  if (isBinary) {
    return 'unsupported_format'
  }
  if (!SUPPORTED_DOCUMENT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) {
    return 'unsupported_format'
  }

  const bodyText = extractBodyText(normalized ?? '')
  if (bodyText.length === 0) {
    return 'empty'
  }
  if (isNotFoundContent(bodyText)) {
    return 'not_found'
  }
  return 'eligible'
}

// 只對「不是任何人的 duplicate」的資產（第一次出現的內容、或重新指派後的
// 新 canonical）執行；依分類結果建立品質旗標或 ai_job
function applyClassification(
  database: Database.Database,
  rawAssetId: number,
  relativePath: string,
  isBinary: boolean,
  normalized: string | null
): void {
  const classification = classifyContent(relativePath, isBinary, normalized)
  if (classification === 'unsupported_format') {
    const evidence = isBinary
      ? '内容无法以 UTF-8 解码'
      : `副档名 ${path.extname(relativePath) || '(无)'} 不在通用文件解析支援清单，` +
        '需专门匯入器处理'
    insertQualityFlag(database, rawAssetId, 'unsupported_format', evidence)
  } else if (classification === 'empty') {
    insertQualityFlag(
      database,
      rawAssetId,
      'empty',
      '扣除标题与图片后正文为空（含仅有标题、无内容区块的情形）'
    )
  } else if (classification === 'not_found') {
    insertQualityFlag(
      database,
      rawAssetId,
      'not_found',
      '正文在 200 字元内且符合「本页不存在」样式'
    )
  } else {
    insertAiJob(database, rawAssetId)
  }
}

// 舊 canonical 被排序鍵更小的資產取代而降級為 duplicate 時，其先前依內容
// 分類建立的品質旗標（empty／unsupported_format／not_found）已被
// duplicate_exact 取代、不再是最終結論，必須清除，避免同一資產同時掛著
// 互相矛盾的旗標——一個 Raw 資產最終只能有一個明確結果
function clearClassificationFlags(database: Database.Database, rawAssetId: number): void {
  database.prepare(`
    DELETE FROM content_quality_flags
    WHERE raw_asset_id = ? AND flag_type IN ('empty', 'unsupported_format', 'not_found')
  `).run(rawAssetId)
}

export type ScanFileOutcome = 'registered' | 'unchanged' | 'failed'

export interface ScanFileResult {
  relativePath: string
  outcome: ScanFileOutcome
  reason?: string
}

export interface ScanSummary {
  scannedAt: string
  results: ScanFileResult[]
  registeredCount: number
  unchangedCount: number
  failedCount: number
}

// 逐层验证从 rawRoot 到目标档案的每一层路径都不是符号连结（含中间目录）。
// O_NOFOLLOW 只保护「最后一层路径成分」，对中间目录的符号连结完全无效——
// 若 gtmc-database/SomeDir 本身被置换成指向 Raw 根目录外的符号连结，
// O_NOFOLLOW 不会阻止 open() 穿过它；必须显式逐层 lstat 才能侦测。
// lstat 参数可注入，供测试以假的 lstat 模拟「某一层是符号连结」，不需要
// 真的在受限环境（例如本机 Windows 沙盒）建立符号连结也能验证逻辑
export function assertNoSymlinkInPath(
  rawRoot: string,
  relativePath: string,
  lstat: (targetPath: string) => fs.Stats = fs.lstatSync
): void {
  const segments = relativePath.split('/')
  let current = rawRoot
  for (const segment of segments) {
    current = path.join(current, segment)
    const stat = lstat(current)
    if (stat.isSymbolicLink()) {
      throw new Error(
        `${relativePath} 的路径中含有符号连结（${segment}），拒绝读取`
      )
    }
  }
}

// TOCTOU 防禦：列舉階段已排除符號連結，但列舉與讀取之間仍有極短的時間窗，
// 路徑中任何一層（含中間目錄）可能被置換成指向 Raw 根目錄外的符號連結。
// 兩層防禦：
// 1. assertNoSymlinkInPath 逐層 lstat 驗證整條路徑，同時涵蓋最終檔案與
//    中間目錄的符號連結置換，緊鄰 open 呼叫之前執行以縮小競態窗口。
// 2. O_NOFOLLOW 開檔：若最終路徑成分在 lstat 驗證之後、open 之前被置換為
//    符號連結，POSIX 上 open 本身會直接失敗（ELOOP），提供最終成分的
//    原子性保障；fstat 對已開啟的 fd 校驗，同樣不受後續置換影響。
//
// 已知限制（誠實揭露，不假裝完全消除 TOCTOU）：
// - Node 在 Windows 上回報 fs.constants.O_NOFOLLOW 為 undefined（已於本機
//   以 `node -e "console.log(require('fs').constants.O_NOFOLLOW)"` 驗證），
//   位元 OR 會靜默退化為單純 O_RDONLY，第 2 層防禦在 Windows 上完全不生效。
// - 即使在 POSIX 上，assertNoSymlinkInPath 的逐層 lstat 與隨後的 open 之間
//   仍有極短暫的時間窗（Node 未提供 openat 等相對 fd 的原子 API，無法把
//   「驗證路徑」與「開檔」合併為單一原子操作）。
// - 因此 Windows 上的實際防護「僅」是列舉階段的 symlink 排除，加上緊鄰
//   讀取前的這次 lstat 鏈驗證——能擋下大多數情境（討論的攻擊視窗需要
//   攻擊者同時擁有 Raw 目錄寫入權限與符號連結建立權限，且時機精準落在
//   驗證與開檔之間），但不是密封的原子保證。若要在 Windows 上補齊剩餘
//   窗口，需要 Win32 原生 API（例如以 FILE_FLAG_OPEN_REPARSE_POINT 開檔
//   後自行判斷 reparse point 類型），Node 的 fs 模組未直接提供，超出本
//   Track 範圍與其依賴（不引入原生擴充套件）
function readRegularFileNoFollow(
  rawRoot: string,
  absolutePath: string,
  relativePath: string
): Buffer {
  assertNoSymlinkInPath(rawRoot, relativePath)

  const flags = fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW
  const fd = fs.openSync(absolutePath, flags)
  try {
    const stat = fs.fstatSync(fd)
    if (!stat.isFile()) {
      throw new Error(`${relativePath} 不是 regular file`)
    }
    return fs.readFileSync(fd)
  } finally {
    fs.closeSync(fd)
  }
}

// 是否已存在「這個 relative_path 自己」的 raw_asset：identity 為
// (source_id, relative_path, content_hash, logical_record_no)，與
// recordRawAssetSnapshot 的查重條件、asset_key 的組成一致（見
// 0004_raw_asset_identity.sql）
function findOwnRawAsset(
  database: Database.Database,
  sourceId: number,
  relativePath: string,
  contentHash: string
): { id: number } | undefined {
  return database
    .prepare<[number, string, string], { id: number }>(`
      SELECT id FROM raw_assets
      WHERE source_id = ? AND relative_path = ? AND content_hash = ?
        AND logical_record_no IS NULL
    `)
    .get(sourceId, relativePath, contentHash)
}

interface CanonicalRow {
  id: number
  sourceKey: string
  relativePath: string
}

// 全域（跨 source_id）查找目前這組內容雜湊的 canonical：canonical 定義為
// 「沒有出現在 raw_asset_provenance.raw_asset_id 裡的那一筆」，即不是任何人
// 的 duplicate。依本模組維護的不變量，同一組 content_hash（且
// logical_record_no 皆為 NULL）內至多只有一筆這樣的資產；找不到代表這組
// 內容第一次出現。跨 source 比較是必要的：內容完全相同的檔案可能出現在不同
// source_key 之下，去重必須全域比較，不能只在同一來源內比較
function findCurrentCanonical(
  database: Database.Database,
  contentHash: string,
  excludeAssetId: number
): CanonicalRow | undefined {
  const row = database
    .prepare<[string, number], { id: number; source_key: string; relative_path: string }>(`
      SELECT ra.id AS id, s.source_key AS source_key, ra.relative_path AS relative_path
      FROM raw_assets ra
      JOIN sources s ON s.id = ra.source_id
      LEFT JOIN raw_asset_provenance p ON p.raw_asset_id = ra.id
      WHERE ra.content_hash = ? AND ra.logical_record_no IS NULL
        AND p.raw_asset_id IS NULL AND ra.id != ?
      ORDER BY ra.id ASC
      LIMIT 1
    `)
    .get(contentHash, excludeAssetId)
  return row === undefined
    ? undefined
    : { id: row.id, sourceKey: row.source_key, relativePath: row.relative_path }
}

// canonical 排序鍵：依 docs/document-ingestion.md 的去重規則，先比較
// source_key、再比較 relative_path，兩者依穩定字典序決定；用 NUL 字元分隔
// 兩個欄位，避免 "a" + "bc" 與 "ab" + "c" 這類跨欄位邊界的排序歧義
function canonicalKey(sourceKey: string, relativePath: string): string {
  return `${sourceKey} ${relativePath}`
}

// 登記「duplicateAssetId 是 canonicalAssetId 的完全重複副本」；只會在
// duplicateAssetId 第一次被判定為 duplicate 時呼叫一次（新掃到的路徑本身，
// 或原本的 canonical 被排序鍵更小的資產取代而降級的當下），因此用一般
// INSERT 即可，不需要處理衝突
function insertProvenance(
  database: Database.Database,
  duplicateAssetId: number,
  canonicalAssetId: number
): void {
  const now = new Date().toISOString()
  database.prepare(`
    INSERT INTO raw_asset_provenance (raw_asset_id, canonical_raw_asset_id, relation, created_at)
    VALUES (?, ?, 'exact_duplicate', ?)
  `).run(duplicateAssetId, canonicalAssetId, now)
}

// 將原本指向 fromCanonicalId 的所有既有 duplicate 一併改指向 toCanonicalId；
// 用於 canonical 被排序鍵更小的資產取代時，讓整組 duplicate 關係保持一致
function reassignDuplicatesTo(
  database: Database.Database,
  fromCanonicalId: number,
  toCanonicalId: number
): void {
  database.prepare(`
    UPDATE raw_asset_provenance SET canonical_raw_asset_id = ?
    WHERE canonical_raw_asset_id = ?
  `).run(toCanonicalId, fromCanonicalId)
}

// 取消尚未被消費的 ai_job：只處理 status = 'queued'（安全、可捨棄，因為還
// 沒有任何消費者讀取過它）；running／succeeded／failed 一律不動，避免刪除
// 可能已在進行或已完成的工作——即使目前 Worker 並無實際消費者會讓 job 走到
// 這些狀態，仍保守處理，不臆測 T2.4 消費者的行為
function cancelQueuedAiJob(database: Database.Database, rawAssetId: number): void {
  database.prepare(`
    DELETE FROM ai_jobs WHERE raw_asset_id = ? AND status = 'queued'
  `).run(rawAssetId)
}

interface ProcessFileParams {
  rawRoot: string
  relativePath: string
  database: Database.Database
  manifest: ImportManifest
}

function processOneFile(params: ProcessFileParams): ScanFileResult {
  const { rawRoot, relativePath, database, manifest } = params
  const previous = manifest.files[relativePath]

  try {
    const absolutePath = path.join(rawRoot, relativePath)
    const rawBuffer = readRegularFileNoFollow(rawRoot, absolutePath, relativePath)
    const { normalized, encoding, isBinary } = normalizeAndHash(rawBuffer)
    const contentHash = computeContentHash(normalized, rawBuffer)
    const sourceKey = resolveSourceKey(relativePath)

    const manifestSaysUnchanged =
      previous !== undefined &&
      previous.status === 'succeeded' &&
      previous.sha256 === contentHash

    if (manifestSaysUnchanged) {
      // manifest 只是本機快取、非權威來源：即使雜湊相符，仍需向 SQLite
      // 確認這個 relative_path 自己確實有對應的 raw_asset，才能真正跳過；
      // 否則 DB 缺少記錄時（例如舊 schema 造成的遺漏、或 DB 遭人工修改）
      // 會被誤判為「已處理」而永遠不再補登
      const source = findSourceByKey(sourceKey, database)
      const ownAsset = source === null
        ? undefined
        : findOwnRawAsset(database, source.id, relativePath, contentHash)
      if (ownAsset !== undefined) {
        return { relativePath, outcome: 'unchanged' }
      }
    }

    const importRunId = database.transaction((): number => {
      const source = findSourceByKey(sourceKey, database)
      if (source === null) {
        throw new Error(`來源未登記: ${sourceKey}`)
      }

      const now = new Date().toISOString()
      const runResult = database.prepare(`
        INSERT INTO import_runs (
          source_id, importer_version, started_at, finished_at, status, summary_json
        ) VALUES (?, ?, ?, ?, 'succeeded', ?)
      `).run(
        source.id,
        IMPORTER_VERSION,
        now,
        now,
        JSON.stringify({ relativePath, contentHash })
      )
      const runId = Number(runResult.lastInsertRowid)

      const isNewForThisPath =
        findOwnRawAsset(database, source.id, relativePath, contentHash) === undefined

      const rawAsset = recordRawAssetSnapshot(
        {
          sourceKey,
          importRunId: runId,
          relativePath,
          contentHash,
          encoding,
          byteSize: rawBuffer.length,
          status: 'discovered'
        },
        database
      )

      if (isNewForThisPath) {
        // 去重優先於內容品質判定（docs/document-ingestion.md 第 6 節
        // 「去重優先於內容品質規則」）：不論內容是空的、二進位、或不支援
        // 格式，都先看這組內容雜湊有沒有其他路徑已登記過；重複本身必須
        // 被追溯，不能被品質標籤搶先蓋過，導致兩個內容完全相同的空檔或
        // 二進位檔各自獨立留下品質旗標、彼此毫無關聯
        const existingCanonical = findCurrentCanonical(database, contentHash, rawAsset.id)

        if (existingCanonical === undefined) {
          // 這組內容雜湊第一次出現，本資產直接成为 canonical，依內容分類
          // 決定要建立品質旗標還是 ai_job
          applyClassification(database, rawAsset.id, relativePath, isBinary, normalized)
        } else {
          const newKey = canonicalKey(sourceKey, relativePath)
          const existingKey = canonicalKey(
            existingCanonical.sourceKey,
            existingCanonical.relativePath
          )

          if (newKey < existingKey) {
            // 新資產的 (source_key, relative_path) 排序鍵更小：原子性
            // 重新指派 canonical——原本指向舊 canonical 的既有 duplicate
            // 一併改指向新資產；舊 canonical 現在降級为 duplicate，若其
            // 仍有未消費的 queued ai_job 一併取消（尚未被任何消費者讀取，
            // 可安全捨棄）；新資產成為 canonical 後仍依內容分類決定後續
            // 動作（它也可能是空檔或不支援格式，canonical 身份不代表
            // 一定要建立 ai_job）。
            // document/chunk/vector 的实际 canonical 消费仍留给 T2.4，
            // 这里只处理 ai_jobs 队列本身与可查询的 provenance 关系
            reassignDuplicatesTo(database, existingCanonical.id, rawAsset.id)
            cancelQueuedAiJob(database, existingCanonical.id)
            // 舊 canonical 先前依自身內容分類可能已建立 empty／
            // unsupported_format／not_found 旗標；現在被 duplicate_exact
            // 取代，必須清掉，避免同一資產同時掛著互相矛盾的最終結論
            clearClassificationFlags(database, existingCanonical.id)
            insertProvenance(database, existingCanonical.id, rawAsset.id)
            insertQualityFlag(
              database,
              existingCanonical.id,
              'duplicate_exact',
              `canonical 已改由 ${sourceKey}:${relativePath} 擔任`
            )
            applyClassification(database, rawAsset.id, relativePath, isBinary, normalized)
          } else {
            // 既有 canonical 的排序鍵更小或相等（相等不可能發生，因為
            // 兩者的 relative_path 或 source_key 必有一項不同），維持
            // canonical 不變；本資產登記為 duplicate，不再重複執行品質
            // 判定、也不建立 ai_job——品質結論以 canonical 資產為準
            insertProvenance(database, rawAsset.id, existingCanonical.id)
            insertQualityFlag(
              database,
              rawAsset.id,
              'duplicate_exact',
              `内容与 ${existingCanonical.sourceKey}:` +
                `${existingCanonical.relativePath} 完全相同`
            )
          }
        }
      }

      return runId
    })()

    manifest.files[relativePath] = {
      sha256: contentHash,
      lastImportRunId: importRunId,
      lastImportedAt: new Date().toISOString(),
      status: 'succeeded'
    }
    return { relativePath, outcome: 'registered' }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    manifest.files[relativePath] = {
      sha256: previous?.sha256 ?? '',
      lastImportRunId: previous?.lastImportRunId ?? null,
      lastImportedAt: previous?.lastImportedAt ?? new Date().toISOString(),
      status: 'failed',
      lastError: message
    }
    return { relativePath, outcome: 'failed', reason: message }
  }
}

export interface ScanOptions {
  rawRoot?: string
  manifestPath?: string
  database?: Database.Database
}

// 對 Raw 根目錄執行一次同步掃描；呼叫端（Worker）自行負責 debounce 與
// 同時只有一次有效掃描的 in-process guard，本函式本身不維護跨呼叫狀態
export function scanRawDirectory(options: ScanOptions = {}): ScanSummary {
  const rawRoot = options.rawRoot ?? RAW_DATABASE_ABS_DIR
  const manifestPath = options.manifestPath ?? RAW_IMPORT_MANIFEST_PATH
  const database = options.database ?? getDatabase()

  registerPolicySources(database)

  const manifest = loadManifest(manifestPath)
  const manifestRelativeName = normalizeRelativePath(
    rawRoot,
    path.resolve(rawRoot, MANIFEST_FILE_NAME)
  )

  // 依相對路徑字典序排序後才處理：當同一批次內出現跨路徑內容完全重複時，
  // 讓字典序最小的路徑必然最先被登記為 canonical（此時查不到「其他路徑」），
  // 其餘路徑才會在 findCrossPathDuplicate 命中並標記 duplicate_exact。
  // 這個決定只在「同一次掃描首次遇到多個重複路徑」時保證與
  // docs/document-ingestion.md 的排序規則一致；canonical 一旦寫入 DB 便不
  // 回頭重新指派，之後新增的字典序更小路徑只會被標記為 duplicate_exact，
  // 不會反過來讓既有 canonical 讓位——避免本 Track 需要實作候選重新歸屬
  const relativePaths = fs.existsSync(rawRoot)
    ? listRawFiles(rawRoot, manifestRelativeName).sort()
    : []

  const results: ScanFileResult[] = relativePaths.map((relativePath) =>
    processOneFile({ rawRoot, relativePath, database, manifest })
  )

  saveManifest(manifestPath, manifest)

  return {
    scannedAt: new Date().toISOString(),
    results,
    registeredCount: results.filter((result) => result.outcome === 'registered').length,
    unchangedCount: results.filter((result) => result.outcome === 'unchanged').length,
    failedCount: results.filter((result) => result.outcome === 'failed').length
  }
}
