-- 机器作品目录，取代 public/database/database.json 的执行期读取
-- source_id 保存 database.json 既有的 id 文字栏位，不可与内部自增主键混用
-- source_hash 是该 JSON 物件 canonical JSON 的 SHA-256，供 T1.4a 机器同步器判断内容是否变更
-- status 取值必须与 src/db/enums.ts 的 REVIEW_STATUSES 保持一致
CREATE TABLE machines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Unknown',
  description TEXT NOT NULL DEFAULT '',
  preview_path TEXT NOT NULL DEFAULT '',
  filename TEXT NOT NULL DEFAULT '',
  sub_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN (
    'pending', 'approved', 'rejected', 'deprecated', 'disputed', 'legacy_review'
  )),
  source_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX machines_name ON machines(name);
CREATE INDEX machines_author ON machines(author);
CREATE INDEX machines_status ON machines(status);

-- 机器标签，用于关键字推荐；一个机器可有多个标签
-- 标签内容不做大小写归一化，重复标签依赖复合主键去重
CREATE TABLE machine_tags (
  machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (machine_id, tag)
) WITHOUT ROWID;

CREATE INDEX machine_tags_tag ON machine_tags(tag);

-- 机器之间的关系（相容、替代、改良版等），本阶段只建表不写入资料
CREATE TABLE machine_relations (
  machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  related_machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  PRIMARY KEY (machine_id, relation_type, related_machine_id),
  CHECK (machine_id <> related_machine_id)
) WITHOUT ROWID;
