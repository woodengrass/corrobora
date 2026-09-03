-- 机器来源移除标记（T1.4a 修正）
-- database.json 不再包含某 sub_id 时，只标记来源已移除，不删除机器列、不改动
-- status：status 的转移只能由人工审核者驱动（见 src/db/enums.ts 的
-- REVIEWER_ONLY_TO），来源是否仍存在于 JSON 是系统事实，不是审核决定，因此用
-- 独立栏位表示，避免与审核状态机冲突。machine_id 保留完整历史，供未来审核或
-- 关联引用；T1.4b 或后续查询可用 source_removed_at IS NULL 排除已移除机器
ALTER TABLE machines ADD COLUMN source_removed_at TEXT;

CREATE INDEX machines_source_removed_at ON machines(source_removed_at);
