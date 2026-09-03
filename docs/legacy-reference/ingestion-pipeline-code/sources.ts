// 来源注册工具：写入 sources 表，供各匯入器与业务代码查询授权、署名与可见性
// 依 docs/source-policy.md 的验收规则，任何匯入器不得硬编码 license/creator/visibility，
// 一律先调用本工具登记来源，再从回传或数据库读回的记录取值
import Database from 'better-sqlite3'
import { getDatabase } from '../connection'
import { Visibility, assertVisibility } from '../enums'

export interface SourceInput {
  sourceKey: string
  type: string
  name: string
  creator?: string
  url?: string
  license?: string
  licenseUrl?: string
  visibility: Visibility
  trustLevel: string
}

export interface SourceRecord {
  id: number
  sourceKey: string
  type: string
  name: string
  creator: string | null
  url: string | null
  license: string | null
  licenseUrl: string | null
  visibility: Visibility
  trustLevel: string
  createdAt: string
}

interface SourceRow {
  id: number
  source_key: string
  type: string
  name: string
  creator: string | null
  url: string | null
  license: string | null
  license_url: string | null
  visibility: string
  trust_level: string
  created_at: string
}

function toSourceRecord(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    sourceKey: row.source_key,
    type: row.type,
    name: row.name,
    creator: row.creator,
    url: row.url,
    license: row.license,
    licenseUrl: row.license_url,
    visibility: assertVisibility(row.visibility),
    trustLevel: row.trust_level,
    createdAt: row.created_at
  }
}

// 依 source_key 幂等注册来源；已存在时直接返回既有记录，不覆盖任何栏位
// 避免匯入器重複啟動时，把审核者事后手动调整过的 visibility/trust_level 覆写回
// 程式码内的初始政策值
export function registerSource(
  input: SourceInput,
  database: Database.Database = getDatabase()
): SourceRecord {
  assertVisibility(input.visibility)

  const existing = database
    .prepare<[string], SourceRow>('SELECT * FROM sources WHERE source_key = ?')
    .get(input.sourceKey)
  if (existing !== undefined) {
    return toSourceRecord(existing)
  }

  const createdAt = new Date().toISOString()
  const result = database.prepare(`
    INSERT INTO sources (
      source_key, type, name, creator, url, license, license_url,
      visibility, trust_level, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.sourceKey,
    input.type,
    input.name,
    input.creator ?? null,
    input.url ?? null,
    input.license ?? null,
    input.licenseUrl ?? null,
    input.visibility,
    input.trustLevel,
    createdAt
  )

  return toSourceRecord({
    id: Number(result.lastInsertRowid),
    source_key: input.sourceKey,
    type: input.type,
    name: input.name,
    creator: input.creator ?? null,
    url: input.url ?? null,
    license: input.license ?? null,
    license_url: input.licenseUrl ?? null,
    visibility: input.visibility,
    trust_level: input.trustLevel,
    created_at: createdAt
  })
}

// 依 source_key 查询既有来源；找不到时回传 null，供匯入器在写入前校验来源已登记
export function findSourceByKey(
  sourceKey: string,
  database: Database.Database = getDatabase()
): SourceRecord | null {
  const row = database
    .prepare<[string], SourceRow>('SELECT * FROM sources WHERE source_key = ?')
    .get(sourceKey)
  return row === undefined ? null : toSourceRecord(row)
}
