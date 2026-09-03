// 可重現資料盤點稽核器（T0.3）
// 對 KNOWLEDGE_SYSTEM_PLAN.md「資料盤點實測結果」涵蓋的 7 個實體來源做唯讀統計
// 預設模式：計算結果與已提交的 docs/data-audit.json 比對，有差異時印出報告並非零結束
// --write 模式：覆寫 docs/data-audit.json 作為新基準（供人工審核後接受）
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, relative, dirname, extname, sep } from 'path'
import { parse } from 'csv-parse/sync'
import {
  RawMachineEntry,
  MachineStats,
  computeMachineStats,
  LegacyCsvRecord,
  LegacyCsvStats,
  computeLegacyCsvStats,
  computeLegacyCsvContentHashes,
  LegacyMarkdownStats,
  computeLegacyMarkdownStats,
  DictionaryTxtStats,
  computeDictionaryTxtStats,
  RawDictionaryEntry,
  DictionaryEntryStats,
  computeDictionaryEntryStats,
  GlossaryStats,
  computeGlossaryStats,
  FieldInventory,
  computeFieldInventory,
  detectEncoding,
  SourceEncoding,
  normalizeLineEndings,
  sha256,
  sha256Bytes,
  extractRelativeLinkTargets,
  linkTargetCandidates,
  classifyGtmcFile,
  diffValues
} from './lib/auditCalculations'

// 所有文字讀取都經過換行正規化，確保 Windows（CRLF 工作區）與 Linux（LF）
// checkout 對同一份提交算出相同統計與雜湊
function readText(rootDir: string, relPath: string): string {
  return normalizeLineEndings(readFileSync(join(rootDir, relPath), 'utf-8'))
}

function readEncoding(rootDir: string, relPath: string): SourceEncoding {
  return detectEncoding(readFileSync(join(rootDir, relPath)))
}

// 多檔來源的整體編碼：全部一致則回報該編碼，否則回報 'mixed' 供人工檢查
function summarizeEncodings(encodings: SourceEncoding[]): SourceEncoding | 'mixed' {
  const unique = new Set(encodings)
  return unique.size === 1 ? encodings[0] : 'mixed'
}

// 彙總統計無法偵測所有內容變更：改寫一段正文而不動標題數、連結數與筆數時，
// 統計完全相同。T0.3 要求「來源新增或變更時必須輸出差異報告，不可靜默通過」，
// 因此另外記錄每個來源檔案的 SHA-256，讓任何內容變更都能被逐檔指名。
// 掃描整個資料根目錄而非固定清單：T0.3 要求「來源新增或變更時」都要報告，
// 寫死檔名會讓日後新增的來源檔案完全不被察覺而靜默通過。
const HASHED_SOURCE_ROOT = 'public/database'

// 執行期產生的檔案不是來源資料，會隨執行變動，納入雜湊只會造成假差異。
// knowledge.db 及其 -wal/-shm 為 Phase 1 之後才出現，先在此排除。
function isGeneratedArtifact(relPath: string): boolean {
  const name = relPath.split('/').pop() || ''
  return (
    name === 'submissions.json' ||
    name === 'import-manifest.json' ||
    name.startsWith('knowledge.db')
  )
}

// 純文字來源以正規化換行後的內容雜湊；圖片等二進位資產以原始位元組雜湊
const TEXT_FILE_EXTENSIONS = new Set(['.md', '.markdown', '.csv', '.txt', '.json'])

function hashSourceFile(absolutePath: string): string {
  const buffer = readFileSync(absolutePath)
  if (TEXT_FILE_EXTENSIONS.has(extname(absolutePath).toLowerCase())) {
    return sha256(normalizeLineEndings(buffer.toString('utf-8')))
  }
  return sha256Bytes(buffer)
}

function walkAllFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue
    }
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkAllFiles(full))
    } else if (entry.isFile()) {
      result.push(full)
    }
  }
  return result
}

// 以 POSIX 相對路徑為鍵並排序，確保跨平台與跨執行的輸出順序一致
function collectSourceFileHashes(rootDir: string): Record<string, string> {
  const keys = walkAllFiles(join(rootDir, HASHED_SOURCE_ROOT))
    .map((absolutePath) => relative(rootDir, absolutePath).split(sep).join('/'))
    .filter((relPath) => !isGeneratedArtifact(relPath))
    .sort()

  const hashes: Record<string, string> = {}
  for (const key of keys) {
    hashes[key] = hashSourceFile(join(rootDir, key))
  }
  return hashes
}

function parseCsv<T>(content: string): T[] {
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  }) as T[]
}

// database.json 機器目錄稽核
interface MachineAudit extends MachineStats {
  file: string
  encoding: SourceEncoding
  fieldInventory: FieldInventory
}

function auditMachines(rootDir: string): MachineAudit {
  const file = 'public/database/database.json'
  const entries = JSON.parse(readText(rootDir, file)) as RawMachineEntry[]

  return {
    file,
    encoding: readEncoding(rootDir, file),
    fieldInventory: computeFieldInventory(
      entries as unknown as Array<Record<string, unknown>>
    ),
    ...computeMachineStats(entries)
  }
}

// database.csv 歷史知識庫稽核（RFC 4180，禁止按換行切割）
interface LegacyCsvAudit extends LegacyCsvStats {
  file: string
  encoding: SourceEncoding
  fieldInventory: FieldInventory
}

function readLegacyCsvRecords(rootDir: string): LegacyCsvRecord[] {
  const content = readText(rootDir, 'public/database/raw/legacy/database.csv')
  return parseCsv<LegacyCsvRecord>(content)
}

function auditLegacyCsv(rootDir: string, records: LegacyCsvRecord[]): LegacyCsvAudit {
  const file = 'public/database/raw/legacy/database.csv'
  return {
    file,
    encoding: readEncoding(rootDir, file),
    fieldInventory: computeFieldInventory(
      records as unknown as Array<Record<string, unknown>>
    ),
    ...computeLegacyCsvStats(records)
  }
}

// database.md 歷史學習日誌稽核
interface LegacyMarkdownAudit extends LegacyMarkdownStats {
  file: string
  encoding: SourceEncoding
}

function auditLegacyMarkdown(rootDir: string): LegacyMarkdownAudit {
  const file = 'public/database/raw/legacy/database.md'
  return {
    file,
    encoding: readEncoding(rootDir, file),
    ...computeLegacyMarkdownStats(readText(rootDir, file))
  }
}

// dictionary/ 稽核（英文詞條 + 中文翻譯 + 補充候選 Dictionary.txt）
interface DictionaryAudit extends DictionaryEntryStats {
  entriesDir: string
  entryFileCount: number
  encoding: SourceEncoding | 'mixed'
  fieldInventory: FieldInventory
  zhTranslationCount: number
  zhFieldInventory: FieldInventory
}

function auditDictionary(rootDir: string): DictionaryAudit {
  const entriesDir = 'public/database/raw/dictionary/entries'
  const entryFiles = readdirSync(join(rootDir, entriesDir)).filter((f) =>
    f.endsWith('.json')
  )
  const entries = entryFiles.map(
    (fileName) =>
      JSON.parse(readText(rootDir, `${entriesDir}/${fileName}`)) as RawDictionaryEntry
  )

  const zhTranslationsFile = 'public/database/raw/dictionary/zh-translations.json'
  const zhTranslations = JSON.parse(
    readText(rootDir, zhTranslationsFile)
  ) as { entries: Array<{ id: string }> }
  const zhIds = new Set(zhTranslations.entries.map((e) => e.id))

  const encoding = summarizeEncodings([
    ...entryFiles.map((f) => readEncoding(rootDir, `${entriesDir}/${f}`)),
    readEncoding(rootDir, zhTranslationsFile)
  ])

  return {
    entriesDir,
    entryFileCount: entryFiles.length,
    encoding,
    fieldInventory: computeFieldInventory(
      entries as unknown as Array<Record<string, unknown>>
    ),
    ...computeDictionaryEntryStats(entries, zhIds),
    zhTranslationCount: zhTranslations.entries.length,
    zhFieldInventory: computeFieldInventory(
      zhTranslations.entries as unknown as Array<Record<string, unknown>>
    )
  }
}

// Dictionary.txt 是人工中英對照，屬待審翻譯候選，不是已核准的正式詞典內容。
// 計畫的 Raw 目錄配置把它放在 `raw/legacy/`（與 database.csv、database.md 同列），
// 而非 `raw/dictionary/`，因此這裡獨立成一個來源，避免它繼承
// storage_tech_dictionary 的 public／approved／GPL 署名姿態而被誤當正式翻譯。
interface DictionaryTxtAudit extends DictionaryTxtStats {
  file: string
  encoding: SourceEncoding
}

function auditDictionaryTxt(rootDir: string): DictionaryTxtAudit {
  const file = 'public/database/raw/legacy/Dictionary.txt'
  return {
    file,
    encoding: readEncoding(rootDir, file),
    ...computeDictionaryTxtStats(readText(rootDir, file))
  }
}

// TechMC Glossary.csv 稽核
// 欄名必須逐一登記：D1 就是「程式期待的欄名與實際欄名不符」造成的缺陷，
// 只記欄位數量無法看出是哪一欄被改名或移除
interface GlossaryAudit extends GlossaryStats {
  file: string
  encoding: SourceEncoding
  columns: string[]
}

function auditGlossary(rootDir: string): GlossaryAudit {
  const file = 'public/database/raw/TechMC Glossary.csv'
  const rawBuffer = readFileSync(join(rootDir, file))
  const encoding = detectEncoding(rawBuffer)
  const content = rawBuffer.toString('utf-8')

  // 從實際表頭列取欄名，不能用 Object.keys(rows[0])：
  // 只有表頭、沒有資料列時，那樣會回報 0 欄，並讓 D1 誤判為欄位缺失
  let header: string[] = []
  const rows = parse(content, {
    columns: (headerRow: string[]) => {
      header = headerRow.map((column) => String(column))
      return headerRow
    },
    skip_empty_lines: true,
    bom: true
  }) as Array<Record<string, string>>

  return { file, encoding, columns: header, ...computeGlossaryStats(rows, header) }
}

// gtmc-database/ 稽核：檔案數、結構區塊、疑似 404/stub、與歷史 CSV 逐字重複、失效相對連結
interface GtmcAudit {
  dir: string
  fileCount: number
  headingBlockCount: number
  fileTypeBreakdown: Record<'normal' | 'stub' | 'not_found', number>
  encodingBreakdown: Record<SourceEncoding, number>
  duplicateWithLegacyCsvCount: number
  brokenLinkCount: number
}

function walkMarkdownFiles(dir: string): string[] {
  const result: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue
    }
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walkMarkdownFiles(full))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') {
      result.push(full)
    }
  }
  return result
}

function auditGtmc(rootDir: string, legacyCsvHashes: Set<string>): GtmcAudit {
  const dir = 'public/database/raw/gtmc-database'
  const files = walkMarkdownFiles(join(rootDir, dir))

  let headingBlockCount = 0
  const fileTypeBreakdown: Record<'normal' | 'stub' | 'not_found', number> = {
    normal: 0,
    stub: 0,
    not_found: 0
  }
  const encodingBreakdown: Record<SourceEncoding, number> = { 'utf-8': 0, 'utf-8-bom': 0 }
  let duplicateWithLegacyCsvCount = 0
  let brokenLinkCount = 0

  for (const filePath of files) {
    const rawBuffer = readFileSync(filePath)
    // 與 readText() 一致做換行正規化，否則與 database.csv 的逐字重複比對
    // 會因 CRLF/LF 差異而全部落空
    const content = normalizeLineEndings(rawBuffer.toString('utf-8'))
    const fileName = filePath.split(/[\\/]/).pop() || ''
    const classification = classifyGtmcFile(fileName, content)

    headingBlockCount += classification.headingCount
    fileTypeBreakdown[classification.fileType]++
    encodingBreakdown[detectEncoding(rawBuffer)]++
    if (legacyCsvHashes.has(classification.contentHash)) {
      duplicateWithLegacyCsvCount++
    }

    const fileDir = dirname(filePath)
    for (const target of extractRelativeLinkTargets(content)) {
      const resolved = linkTargetCandidates(target).map((candidate) =>
        candidate.startsWith('/')
          ? join(rootDir, candidate.slice(1))
          : join(fileDir, candidate)
      )
      if (!resolved.some((candidatePath) => existsSync(candidatePath))) {
        brokenLinkCount++
      }
    }
  }

  return {
    dir,
    fileCount: files.length,
    headingBlockCount,
    fileTypeBreakdown,
    encodingBreakdown,
    duplicateWithLegacyCsvCount,
    brokenLinkCount
  }
}

export interface AuditReport {
  sources: {
    openst_machine_submission: MachineAudit
    legacy_database_csv: LegacyCsvAudit
    legacy_database_markdown: LegacyMarkdownAudit
    storage_tech_dictionary: DictionaryAudit
    legacy_dictionary_txt: DictionaryTxtAudit
    techmc_glossary: GlossaryAudit
    gtmc: GtmcAudit
  }
  fileHashes: Record<string, string>
}

export function buildReport(rootDir: string): AuditReport {
  const legacyCsvRecords = readLegacyCsvRecords(rootDir)
  const legacyCsvHashes = computeLegacyCsvContentHashes(legacyCsvRecords)

  return {
    sources: {
      openst_machine_submission: auditMachines(rootDir),
      legacy_database_csv: auditLegacyCsv(rootDir, legacyCsvRecords),
      legacy_database_markdown: auditLegacyMarkdown(rootDir),
      storage_tech_dictionary: auditDictionary(rootDir),
      legacy_dictionary_txt: auditDictionaryTxt(rootDir),
      techmc_glossary: auditGlossary(rootDir),
      gtmc: auditGtmc(rootDir, legacyCsvHashes)
    },
    fileHashes: collectSourceFileHashes(rootDir)
  }
}

export interface AuditIo {
  log: (message: string) => void
  error: (message: string) => void
}

// CLI 主邏輯，回傳 process exit code；抽出方便測試以任意 rootDir/argv 呼叫
export function runAudit(rootDir: string, argv: string[], io: AuditIo): number {
  const dataAuditPath = join(rootDir, 'docs', 'data-audit.json')
  const shouldWrite = argv.includes('--write')

  // 來源檔被刪除或損壞是「來源變更」的一種，必須輸出可讀報告並以非零碼結束，
  // 不能讓 ENOENT／JSON 解析錯誤以未處理例外的堆疊訊息中斷
  let report: AuditReport
  try {
    report = buildReport(rootDir)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    io.error(`無法完成資料盤點（來源檔可能已刪除、無法讀取或格式損壞）：${detail}`)
    return 1
  }

  if (shouldWrite) {
    mkdirSync(dirname(dataAuditPath), { recursive: true })
    writeFileSync(dataAuditPath, `${JSON.stringify(report, null, 2)}\n`)
    io.log(`已寫入基準快照: ${relative(rootDir, dataAuditPath)}`)
    return 0
  }

  if (!existsSync(dataAuditPath)) {
    io.error(`找不到基準快照 ${relative(rootDir, dataAuditPath)}，請先執行 --write 產生`)
    return 1
  }

  const baseline = JSON.parse(readFileSync(dataAuditPath, 'utf-8')) as AuditReport
  const diffs = [
    ...diffValues('sources', baseline.sources, report.sources),
    ...diffValues('fileHashes', baseline.fileHashes, report.fileHashes)
  ]

  if (diffs.length === 0) {
    io.log('資料盤點無差異')
    return 0
  }

  io.log('偵測到資料盤點差異，需人工審核後以 --write 接受新基準：')
  for (const diff of diffs) {
    io.log(`  ${diff}`)
  }
  return 1
}

function main(): void {
  const rootDir = join(__dirname, '..')
  process.exitCode = runAudit(rootDir, process.argv.slice(2), console)
}

if (require.main === module) {
  main()
}
