-- 修正 raw_assets 的唯一识别范围，并新增可查询的 duplicate/canonical 关系
-- （T1.2 后续修正）
--
-- 0001_core.sql 建立的 raw_assets_source_hash_record 唯一索引只涵盖
-- (source_id, content_hash, logical_record_no)，未包含 relative_path。
--
-- 澄清：SQLite 的 UNIQUE INDEX 视每个 NULL 为相异值，因此这个索引对
-- logical_record_no = NULL（整档快照，目前唯一会用到的情形）从未真正生效过；
-- 实际造成「同一来源下两个内容相同但路径不同的档案被合并成一笔 raw_assets」
-- 的原因，是应用层（rawAssets.ts 的 recordRawAssetSnapshot、rawScanner.ts
-- 的既有登记查重）自己没有比对 relative_path，与本索引是否存在无关，已在
-- 应用层一并修正。但对 logical_record_no 非 NULL 的情形（例如未来 T2.4 的
-- CSV 逐列匯入），这个索引会是真正生效的 DB 层级约束。
--
-- 新识别为 (source_id, relative_path, content_hash, logical_record_no)，与
-- asset_key 的组成完全对应（<source_key>:<relative_path>:
-- <logical_record_no-or-file>:<sha256>）。但同一个 UNIQUE INDEX 无法同时对
-- NULL 和非 NULL 的 logical_record_no 都提供真正的 DB 层级唯一性保证——
-- 对 NULL 值，唯一性必须改用 partial index（WHERE logical_record_no IS
-- NULL），因为 SQLite 的 partial index 是先用 WHERE 子句筛选后才建索引，
-- 不受「完整索引视 NULL 为相异值」这条规则影响；对非 NULL 值则用另一个
-- partial index。两者合起来才是完整、货真价实的 identity 保证，不依赖
-- asset_key 字符串本身的 UNIQUE、也不只靠应用层查重。
DROP INDEX raw_assets_source_hash_record;

CREATE UNIQUE INDEX raw_assets_identity_whole_file
  ON raw_assets(source_id, relative_path, content_hash)
  WHERE logical_record_no IS NULL;

CREATE UNIQUE INDEX raw_assets_identity_record
  ON raw_assets(source_id, relative_path, content_hash, logical_record_no)
  WHERE logical_record_no IS NOT NULL;

-- Raw 资产的 duplicate -> canonical 关系：跨路径、跨来源内容完全相同时，
-- 只有一个 raw_asset 是 canonical（负责建立 ai_job／document／chunk／
-- vector），其余副本各自保留自己的 raw_assets 身份与路径，但在这里登记
-- 指向 canonical 的关系，可查询、可追溯，不只是 content_quality_flags 里
-- 一段自由文字 evidence。
--
-- raw_asset_id 是主键：一个 raw_asset 只能是「某一个」canonical 的副本，
-- 不能同时重复登记；canonical 本身不在此表出现（它没有指向别人的关系）。
-- relation 目前只允许 exact_duplicate，对应 docs/document-ingestion.md
-- 「跨路径或跨来源出现相同正规化雜湊」一节的去重语意与
-- duplicate-provenance.json fixture 使用的既有词汇。
CREATE TABLE raw_asset_provenance (
  raw_asset_id INTEGER PRIMARY KEY REFERENCES raw_assets(id) ON DELETE CASCADE,
  canonical_raw_asset_id INTEGER NOT NULL REFERENCES raw_assets(id) ON DELETE CASCADE,
  relation TEXT NOT NULL CHECK (relation IN ('exact_duplicate')),
  created_at TEXT NOT NULL,
  CHECK (raw_asset_id <> canonical_raw_asset_id)
) WITHOUT ROWID;

CREATE INDEX raw_asset_provenance_canonical
  ON raw_asset_provenance(canonical_raw_asset_id);
