-- T1.2 核心表：来源登记、导入批次、Raw 资产参照、品质旗标与 AI 审计佇列
-- raw_assets 永不存正文，只存 relative_path + content_hash + logical_record_no，
-- 靠这三者可回头在 Raw 目录重建原始内容

CREATE TABLE sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  creator TEXT,
  url TEXT,
  license TEXT,
  license_url TEXT,
  visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'public')),
  trust_level TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE import_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  importer_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  summary_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE raw_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  import_run_id INTEGER REFERENCES import_runs(id),
  asset_key TEXT NOT NULL UNIQUE,
  relative_path TEXT NOT NULL,
  logical_record_no INTEGER,
  content_hash TEXT NOT NULL,
  encoding TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  status TEXT NOT NULL CHECK (status IN ('discovered', 'processed', 'failed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX raw_assets_source_hash_record
  ON raw_assets(source_id, content_hash, logical_record_no);

CREATE TABLE content_quality_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_asset_id INTEGER NOT NULL REFERENCES raw_assets(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  detected_by TEXT NOT NULL CHECK (detected_by IN ('rule', 'flash', 'pro', 'reviewer')),
  evidence TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('open', 'accepted', 'dismissed')),
  created_at TEXT NOT NULL
);

CREATE INDEX content_quality_flags_asset ON content_quality_flags(raw_asset_id);
CREATE INDEX content_quality_flags_open ON content_quality_flags(flag_type, status);

CREATE TABLE ai_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_asset_id INTEGER NOT NULL REFERENCES raw_assets(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at TEXT NOT NULL,
  locked_at TEXT,
  last_error TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX ai_jobs_next ON ai_jobs(status, available_at, id);

CREATE TABLE ai_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ai_job_id INTEGER REFERENCES ai_jobs(id),
  raw_asset_id INTEGER REFERENCES raw_assets(id),
  task_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'deepseek',
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_json TEXT NOT NULL,
  usage_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'invalid')),
  created_at TEXT NOT NULL
);

CREATE INDEX ai_runs_asset_task ON ai_runs(raw_asset_id, task_type);
CREATE INDEX ai_runs_job ON ai_runs(ai_job_id);
CREATE INDEX ai_runs_input_hash ON ai_runs(input_hash);

CREATE TABLE extraction_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_asset_id INTEGER NOT NULL REFERENCES raw_assets(id),
  ai_run_id INTEGER NOT NULL REFERENCES ai_runs(id),
  candidate_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL CHECK (status IN ('generated', 'materialized', 'rejected', 'superseded')),
  materialized_type TEXT,
  materialized_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX extraction_candidates_status ON extraction_candidates(status, candidate_type);
CREATE INDEX extraction_candidates_raw ON extraction_candidates(raw_asset_id);
