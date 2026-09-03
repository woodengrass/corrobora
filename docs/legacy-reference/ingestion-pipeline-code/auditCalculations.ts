// 資料盤點稽核器（T0.3）的純運算層
// 只處理已讀入記憶體的字串／已解析資料，不做任何檔案系統存取，方便單元測試
import { createHash } from 'crypto'

// 統一 sha256，用於重複內容偵測
export function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex')
}

export function sha256Bytes(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

// 本倉庫 core.autocrlf=true：工作區為 CRLF，Git 內為 LF。
// 所有文字統計與雜湊都必須先正規化換行，否則同一份提交在 Windows 與 Linux
// checkout 會算出不同結果，使提交的基準快照無法跨平台重現。
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

// 依 wc -l 慣例切行：檔案以換行結尾時不把結尾後的空字串算成一行
export function splitLines(text: string): string[] {
  const lines = text.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

// 欄位層級盤點：T0.3 完成條件要求登記「每個來源的實際欄位」。
// 只記錄檔案雜湊時，欄位改名或增刪只會表現為不透明的 hash 變化，
// 無法看出 schema 究竟怎麼變——而 D1 正是欄位名稱不符造成的缺陷。
// `partial` 把「只出現在部分記錄」的欄位獨立標出，用來暴露不一致的 schema。
export interface FieldInventory {
  fields: string[]
  alwaysPresent: string[]
  partial: string[]
}

export function computeFieldInventory(
  records: Array<Record<string, unknown>>
): FieldInventory {
  const occurrences = new Map<string, number>()
  for (const record of records) {
    for (const key of Object.keys(record)) {
      occurrences.set(key, (occurrences.get(key) || 0) + 1)
    }
  }

  const fields = [...occurrences.keys()].sort()
  const alwaysPresent = fields.filter((f) => occurrences.get(f) === records.length)
  const partial = fields.filter((f) => occurrences.get(f) !== records.length)

  return { fields, alwaysPresent, partial }
}

// database.json 機器目錄
export interface RawMachineEntry {
  id: string
  name: string
  author: string
  tags: string[]
  description: string
  sub_id: string
}

export interface MachineStats {
  machineCount: number
  uniqueSubIdCount: number
  totalTagCount: number
  emptyDescriptionCount: number
}

export function computeMachineStats(entries: RawMachineEntry[]): MachineStats {
  const subIds = new Set(entries.map((m) => m.sub_id))
  const totalTagCount = entries.reduce((sum, m) => sum + (m.tags?.length || 0), 0)
  const emptyDescriptionCount = entries.filter(
    (m) => !m.description || m.description.trim() === ''
  ).length

  return {
    machineCount: entries.length,
    uniqueSubIdCount: subIds.size,
    totalTagCount,
    emptyDescriptionCount
  }
}

// database.csv 歷史知識庫（RFC 4180 解析後的邏輯記錄）
export interface LegacyCsvRecord {
  topic?: string
  content?: string
}

export interface LegacyCsvStats {
  logicalRecordCount: number
  emptyContentCount: number
  duplicateContentHashCount: number
  multilineRecordCount: number
}

export function computeLegacyCsvStats(records: LegacyCsvRecord[]): LegacyCsvStats {
  const hashCounts = new Map<string, number>()
  let emptyContentCount = 0
  let multilineRecordCount = 0

  for (const record of records) {
    const topic = record.topic || ''
    const body = record.content || ''
    if (body.trim() === '') {
      emptyContentCount++
    }
    if (body.includes('\n')) {
      multilineRecordCount++
    }
    const hash = sha256(`${topic}\n${body}`)
    hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1)
  }

  let duplicateContentHashCount = 0
  for (const count of hashCounts.values()) {
    if (count > 1) {
      duplicateContentHashCount += count - 1
    }
  }

  return {
    logicalRecordCount: records.length,
    emptyContentCount,
    duplicateContentHashCount,
    multilineRecordCount
  }
}

// database.csv 每筆記錄內容雜湊，供 GTMC 逐字重複比對使用
export function computeLegacyCsvContentHashes(records: LegacyCsvRecord[]): Set<string> {
  return new Set(records.map((r) => sha256((r.content || '').trim())))
}

// database.md 歷史學習日誌
export interface LegacyMarkdownStats {
  lineCount: number
  headingCount: number
  // 以 <!-- 学习于 ... --> 標記切出的學習紀錄數，比行數更接近「邏輯記錄數」
  entryCount: number
  // 標記內含「用户: 名稱」時，屬於原始社群識別資訊，不可進入一般回答或索引
  entriesWithUserIdentifierCount: number
  // 時間戳不是合法 ISO-8601（例如殘缺的 "2026-06-24T..."）視為異常
  malformedTimestampCount: number
}

const LEGACY_MARKDOWN_ENTRY_MARKER = /<!--\s*学习于\s*(.*?)\s*-->/g
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function computeLegacyMarkdownStats(content: string): LegacyMarkdownStats {
  const lines = splitLines(content)
  const headingCount = lines.filter((line) => /^#{1,6}\s/.test(line)).length

  let entryCount = 0
  let entriesWithUserIdentifierCount = 0
  let malformedTimestampCount = 0
  let match: RegExpExecArray | null
  const markerRegex = new RegExp(LEGACY_MARKDOWN_ENTRY_MARKER)
  while ((match = markerRegex.exec(content)) !== null) {
    entryCount++
    const [timestampPart, userPart] = match[1].split('|').map((part) => part.trim())
    if (userPart && userPart.length > 0) {
      entriesWithUserIdentifierCount++
    }
    if (!ISO_TIMESTAMP_PATTERN.test(timestampPart)) {
      malformedTimestampCount++
    }
  }

  return {
    lineCount: lines.length,
    headingCount,
    entryCount,
    entriesWithUserIdentifierCount,
    malformedTimestampCount
  }
}

// Dictionary.txt 補充候選
export interface DictionaryTxtStats {
  lineCount: number
  malformedLineCount: number
}

export function computeDictionaryTxtStats(content: string): DictionaryTxtStats {
  const lines = splitLines(content)
  const nonEmptyLines = lines.filter((line) => line.trim() !== '')
  const malformedLineCount = nonEmptyLines.filter((line) => !line.includes('-')).length

  return {
    lineCount: lines.length,
    malformedLineCount
  }
}

// dictionary/entries 英文詞條
export interface RawDictionaryEntry {
  id: string
  terms: string[]
  definition: string
  status: string
}

export interface DictionaryEntryStats {
  recordCount: number
  emptyDefinitionCount: number
  duplicateIdCount: number
  termOverlapCount: number
  statusBreakdown: Record<string, number>
  missingZhTranslationCount: number
}

export function computeDictionaryEntryStats(
  entries: RawDictionaryEntry[],
  zhIds: Set<string>
): DictionaryEntryStats {
  const seenIds = new Map<string, number>()
  const termOwners = new Map<string, Set<string>>()
  const statusBreakdown: Record<string, number> = {}
  let emptyDefinitionCount = 0

  for (const entry of entries) {
    seenIds.set(entry.id, (seenIds.get(entry.id) || 0) + 1)
    statusBreakdown[entry.status] = (statusBreakdown[entry.status] || 0) + 1
    if (!entry.definition || entry.definition.trim() === '') {
      emptyDefinitionCount++
    }
    for (const term of entry.terms || []) {
      const key = term.trim().toLowerCase()
      if (!termOwners.has(key)) {
        termOwners.set(key, new Set())
      }
      termOwners.get(key)!.add(entry.id)
    }
  }

  let duplicateIdCount = 0
  for (const count of seenIds.values()) {
    if (count > 1) {
      duplicateIdCount += count - 1
    }
  }

  let termOverlapCount = 0
  for (const owners of termOwners.values()) {
    if (owners.size > 1) {
      termOverlapCount++
    }
  }

  const missingZhTranslationCount = [...seenIds.keys()].filter(
    (id) => !zhIds.has(id)
  ).length

  return {
    recordCount: seenIds.size,
    emptyDefinitionCount,
    duplicateIdCount,
    termOverlapCount,
    statusBreakdown,
    missingZhTranslationCount
  }
}

// TechMC Glossary.csv（記錄實際欄名，不假設 D1 的錯誤欄名存在）
export interface GlossaryStats {
  columnCount: number
  rowCount: number
  emptyShortFormCount: number
  emptyFullFormCount: number
  duplicateShortFormCount: number
  knownDefects: KnownDefectStatus[]
}

// D1（KNOWLEDGE_SYSTEM_PLAN.md「已確認的現行缺陷」）：
// src/services/data.ts 的 loadGlossary() 讀取 term/术语/definition/定义 欄位，
// 但本 CSV 實際表頭沒有這些名稱，因此每一列都映射為空字串。
// T0.3 的職責只是登記（可程式驗證）此缺陷是否仍存在，修正屬於 T2.7。
export interface KnownDefectStatus {
  id: string
  description: string
  active: boolean
  missingFields: string[]
}

// loadGlossary() 是各自獨立讀取 term 與 definition 的，因此只要有一邊缺欄，
// 缺陷就仍然存在——必須用 OR 而非 AND 判斷，否則補上單一欄位就會謊報已修復：
//   只有 term  ：definition 全空，詞彙表對回答沒有貢獻
//   只有 definition：term 全空，而 matchGlossaryTerms() 用 includes(entry.term)
//                    比對，空字串會命中任何輸入，等於整份詞彙表誤匹配
function detectD1(header: string[]): KnownDefectStatus {
  const missingFields: string[] = []
  if (!header.includes('term') && !header.includes('术语')) {
    missingFields.push('term/术语')
  }
  if (!header.includes('definition') && !header.includes('定义')) {
    missingFields.push('definition/定义')
  }

  return {
    id: 'D1',
    description:
      'src/services/data.ts 的 loadGlossary() 讀取 term/术语 與 definition/定义 欄位，' +
      '任一欄缺失即無法完整載入，對應列會映射為空字串',
    active: missingFields.length > 0,
    missingFields
  }
}

export function computeGlossaryStats(
  rows: Array<Record<string, string>>,
  header: string[]
): GlossaryStats {
  const shortFormCounts = new Map<string, number>()
  let emptyShortFormCount = 0
  let emptyFullFormCount = 0

  for (const row of rows) {
    const shortForm = (row['Short Form'] || '').trim()
    const fullForm = (row['Full Form (English)'] || '').trim()
    if (shortForm === '') {
      emptyShortFormCount++
    } else {
      const key = shortForm.toLowerCase()
      shortFormCounts.set(key, (shortFormCounts.get(key) || 0) + 1)
    }
    if (fullForm === '') {
      emptyFullFormCount++
    }
  }

  let duplicateShortFormCount = 0
  for (const count of shortFormCounts.values()) {
    if (count > 1) {
      duplicateShortFormCount += count - 1
    }
  }

  return {
    columnCount: header.length,
    rowCount: rows.length,
    emptyShortFormCount,
    emptyFullFormCount,
    duplicateShortFormCount,
    knownDefects: [detectD1(header)]
  }
}

// 判斷檔案原始 buffer 開頭是否為 UTF-8 BOM
export function hasUtf8Bom(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
}

// 本專案只處理 UTF-8（含／不含 BOM）；供每個來源登記實際編碼
export type SourceEncoding = 'utf-8' | 'utf-8-bom'

export function detectEncoding(buffer: Buffer): SourceEncoding {
  return hasUtf8Bom(buffer) ? 'utf-8-bom' : 'utf-8'
}

// 抓取 Markdown 連結與圖片的本機目標，移除 fragment 與 query 供檔案存在性檢查。
// GTMC 文件以 docsify 發佈，站內連結會寫成 `路徑?id=錨點`；`?` 之後屬於錨點參數
// 而非檔名，與 `#` 一樣必須先移除，否則會把實際存在的檔案誤判為失效連結。
export function extractRelativeLinkTargets(content: string): string[] {
  const targets: string[] = []
  const linkRegex = /!?\[[^\]]*]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(content)) !== null) {
    const target = match[1].split(' ')[0].trim()
    if (
      target === '' ||
      /^https?:\/\//.test(target) ||
      target.startsWith('//') ||
      target.startsWith('#') ||
      target.startsWith('?')
    ) {
      continue
    }

    const pathOnly = target.split('#', 1)[0].split('?', 1)[0]
    if (pathOnly !== '') {
      targets.push(pathOnly)
    }
  }
  return targets
}

// 一個連結目標可接受的候選檔案路徑。docsify 站內連結常省略 `.md` 副檔名，
// 因此無副檔名的目標必須同時嘗試補上 `.md`；任一候選存在即視為連結有效。
// 連結可能以百分比編碼書寫（語料中大量中文檔名，`img%20a.png` 這類寫法很常見），
// 檔案系統上的名稱則是解碼後的形式，因此解碼版本也要納入候選。
// 編碼不合法時 decodeURIComponent 會拋錯，此時保留原字串即可。
function decodeLinkTarget(target: string): string {
  try {
    return decodeURIComponent(target)
  } catch {
    return target
  }
}

export function linkTargetCandidates(target: string): string[] {
  const decoded = decodeLinkTarget(target)
  const bases = decoded === target ? [target] : [target, decoded]

  const candidates: string[] = []
  for (const base of bases) {
    candidates.push(base)
    if (!/\.[^./\\]+$/.test(base)) {
      candidates.push(`${base}.md`)
    }
  }
  return candidates
}

// 單一 gtmc Markdown 檔案的文件類型分類：not_found（檔名含 404）、
// stub（去除標題後正文過短）、normal（其餘）；用於 T0.3「文件類型」盤點指標
export type GtmcFileType = 'not_found' | 'stub' | 'normal'

export interface GtmcFileClassification {
  headingCount: number
  fileType: GtmcFileType
  contentHash: string
}

export function classifyGtmcFile(fileName: string, content: string): GtmcFileClassification {
  const lines = content.split('\n')
  const headingCount = lines.filter((line) => /^#{1,6}\s/.test(line)).length
  const bodyWithoutHeadings = lines
    .filter((line) => !/^#{1,6}\s/.test(line))
    .join('\n')
    .trim()

  let fileType: GtmcFileType = 'normal'
  if (fileName.toLowerCase().includes('404')) {
    fileType = 'not_found'
  } else if (bodyWithoutHeadings.length < 50) {
    fileType = 'stub'
  }

  return {
    headingCount,
    fileType,
    contentHash: sha256(content.trim())
  }
}

// 遞迴比較兩個 JSON 相容值，回傳差異路徑清單
export function diffValues(
  pathPrefix: string,
  previous: unknown,
  current: unknown
): string[] {
  if (JSON.stringify(previous) === JSON.stringify(current)) {
    return []
  }

  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v)

  if (isPlainObject(previous) && isPlainObject(current)) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(current)])
    const diffs: string[] = []
    for (const key of keys) {
      diffs.push(...diffValues(`${pathPrefix}.${key}`, previous[key], current[key]))
    }
    return diffs
  }

  return [`${pathPrefix}: ${JSON.stringify(previous)} -> ${JSON.stringify(current)}`]
}
