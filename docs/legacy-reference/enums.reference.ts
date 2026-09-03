// 知识系统枚举与状态机
// 本文件是规划书所定义的全部枚举值的唯一真源，涵盖审核、导入管线、AI 候选、
// 术语、知识与 Claim、审核回馈、向量索引与实验资料
// 业务代码与 schema 一律引用此处常量，禁止在各表定义或写入路径散落字符串字面值

// 审核状态
// legacy_review 专用于缺少逐笔来源与版本信息的历史数据，不等同于 pending
export const REVIEW_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'deprecated',
  'disputed',
  'legacy_review'
] as const
export type ReviewStatus = (typeof REVIEW_STATUSES)[number]

// 公开性
// internal 表示仅审核者可见；public 表示可在一般回答中引用并对外署名
export const VISIBILITIES = ['internal', 'public'] as const
export type Visibility = (typeof VISIBILITIES)[number]

// 可信度
// 描述结论的证据强度，与审核状态正交：approved 的内容仍可能只是 inferred
export const CONFIDENCE_LEVELS = [
  'documented',
  'expert_reviewed',
  'measured',
  'inferred',
  'unverified'
] as const
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number]

// 导入批次状态
export const IMPORT_RUN_STATUSES = ['running', 'succeeded', 'failed'] as const
export type ImportRunStatus = (typeof IMPORT_RUN_STATUSES)[number]

// Raw 资产处理状态
export const RAW_ASSET_STATUSES = ['discovered', 'processed', 'failed'] as const
export type RawAssetStatus = (typeof RAW_ASSET_STATUSES)[number]

// 清理分流结果
// 每个 Raw ID 必须得到唯一结果，供稽核报告追溯原因与规则版本
export const INGESTION_OUTCOMES = [
  'provenance_only',
  'candidate',
  'pending',
  'excluded'
] as const
export type IngestionOutcome = (typeof INGESTION_OUTCOMES)[number]

// 质量旗标
// unsupported_format 与 parse_error 见 docs/document-ingestion.md 第 11 节
// invalid_ai_output 用于 AI 回复非 JSON、缺字段、错误 enum 或哈希不符
export const QUALITY_FLAGS = [
  'empty',
  'stub',
  'navigation',
  'not_found',
  'broken_link',
  'duplicate_exact',
  'duplicate_near',
  'mixed_concepts',
  'possible_typo',
  'conflicting_fact',
  'license_unknown',
  'unsupported_format',
  'parse_error',
  'invalid_ai_output',
  'oversized_block'
] as const
export type QualityFlag = (typeof QUALITY_FLAGS)[number]

// 阻挡旗标：候选内容本身不可用，结果为 excluded 或 provenance_only
// 以 KNOWLEDGE_SYSTEM_PLAN.md 的 materialize 规则为准：navigation 只阻挡带此标记的
// 候选本身，不连坐同一 Raw 资产的其他候选——即 blocksMaterialize 只按候选自身的旗标
// 判断，不查询同资产的其他候选，天然满足这个范围限定
// document-ingestion.md 对 navigation 的重新诠释（AI 呼叫前已排除导航正文，标记多为
// 资讯性注记）尚未回写进权威计划书并经审核者核准，因此本表暂不采用该诠释
export const BLOCKING_QUALITY_FLAGS: readonly QualityFlag[] = [
  'empty',
  'stub',
  'navigation',
  'not_found',
  'duplicate_exact',
  'unsupported_format',
  'parse_error'
]

// invalid_ai_output 不列入上表：依 document-ingestion.md 第 7.3 节，AI 回复不合法时
// 根本不建立候选，该旗标挂在 Raw 资产与 ai_runs 上，不会出现在候选身上
// 强制点是「不建立候选」，不是 materialize 阶段的过滤

// 只建立 needs_review 候选、永不 materialize 的旗标
// 内容有价值但语意需人工厘清，与阻挡旗标的处理结果不同
export const NEEDS_REVIEW_QUALITY_FLAGS: readonly QualityFlag[] = [
  'possible_typo',
  'mixed_concepts',
  'conflicting_fact'
]

// 旗标侦测来源
export const FLAG_DETECTORS = ['rule', 'flash', 'pro', 'reviewer'] as const
export type FlagDetector = (typeof FLAG_DETECTORS)[number]

// 质量旗标处理状态
export const QUALITY_FLAG_STATUSES = ['open', 'accepted', 'dismissed'] as const
export type QualityFlagStatus = (typeof QUALITY_FLAG_STATUSES)[number]

// AI 工作队列状态
export const AI_JOB_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed'
] as const
export type AiJobStatus = (typeof AI_JOB_STATUSES)[number]

// AI 单次调用结果
// invalid 表示回复未通过 schema 或回链验证，此时不得建立候选
export const AI_RUN_STATUSES = ['succeeded', 'failed', 'invalid'] as const
export type AiRunStatus = (typeof AI_RUN_STATUSES)[number]

// AI 任务类型
export const AI_TASK_TYPES = [
  'document_triage',
  'document_quality',
  'term_normalize',
  'claim_extract',
  'query_plan',
  'answer_split',
  'feedback_classify',
  'conflict_review',
  'answer_synthesis'
] as const
export type AiTaskType = (typeof AI_TASK_TYPES)[number]

// 候选状态
// AI 抽取产物的生命周期，与人工审核状态分开，候选本身不进入 Answer Index
export const CANDIDATE_STATUSES = [
  'generated',
  'materialized',
  'rejected',
  'superseded'
] as const
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number]

// 候选类型
// document_triage 对每个非重复 Raw 资产输出零至多笔候选，无法判断时使用 needs_review
export const CANDIDATE_TYPES = [
  'term',
  'community_note',
  'claim',
  'discard',
  'needs_review'
] as const
export type CandidateType = (typeof CANDIDATE_TYPES)[number]

// 永不 materialize 的候选类型
export const NON_MATERIALIZABLE_CANDIDATE_TYPES: readonly CandidateType[] = [
  'discard',
  'needs_review'
]

// 游戏版本
export const EDITIONS = ['java', 'bedrock', 'unknown'] as const
export type Edition = (typeof EDITIONS)[number]

// 可挂载版本范围的内容类型
export const VERSION_SCOPE_CONTENT_TYPES = [
  'document',
  'chunk',
  'term_definition',
  'knowledge',
  'claim',
  'machine'
] as const
export type VersionScopeContentType = (typeof VERSION_SCOPE_CONTENT_TYPES)[number]

// 术语别名类型
export const ALIAS_TYPES = [
  'canonical',
  'abbreviation',
  'translation',
  'community',
  'legacy',
  'possible_typo'
] as const
export type AliasType = (typeof ALIAS_TYPES)[number]

// 术语之间的关系
export const TERM_RELATION_TYPES = [
  'related_to',
  'uses',
  'not_equivalent_to',
  'supersedes'
] as const
export type TermRelationType = (typeof TERM_RELATION_TYPES)[number]

// 一般知识条目的种类
export const KNOWLEDGE_KINDS = [
  'community_note',
  'tutorial',
  'design',
  'mechanism'
] as const
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number]

// Claim 的适用条件种类
export const CLAIM_CONDITION_TYPES = [
  'version',
  'edition',
  'loader',
  'server',
  'prerequisite',
  'scope'
] as const
export type ClaimConditionType = (typeof CLAIM_CONDITION_TYPES)[number]

// Claim 证据来源类型
export const CLAIM_EVIDENCE_TYPES = [
  'document_chunk',
  'term_definition',
  'experiment'
] as const
export type ClaimEvidenceType = (typeof CLAIM_EVIDENCE_TYPES)[number]

// Claim 之间的关系
// 计划书未给 claim_relations 建 DDL，此清单来自总览表的散文定义
export const CLAIM_RELATION_TYPES = ['supports', 'conflicts_with', 'supersedes'] as const
export type ClaimRelationType = (typeof CLAIM_RELATION_TYPES)[number]

// 证据对 Claim 的立场
export const EVIDENCE_STANCES = ['supports', 'contradicts'] as const
export type EvidenceStance = (typeof EVIDENCE_STANCES)[number]

// 可被人工审核的目标类型
export const REVIEW_TARGET_TYPES = [
  'knowledge',
  'claim',
  'term',
  'term_definition',
  'experiment'
] as const
export type ReviewTargetType = (typeof REVIEW_TARGET_TYPES)[number]

// 审核决定
// 是审核状态的子集，不含 pending 与 legacy_review 这两个只能由系统建立的状态
export const REVIEW_DECISIONS = [
  'approved',
  'rejected',
  'deprecated',
  'disputed'
] as const
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number]

// 回答判定
// partial 必须拆分知识点逐项判定；amend 建立待审修订候选
export const ANSWER_VERDICTS = ['correct', 'incorrect', 'partial', 'amend'] as const
export type AnswerVerdict = (typeof ANSWER_VERDICTS)[number]

// 回答判定流程状态
// awaiting_items 表示已判定 partial，正在等待逐项知识点判定
export const FEEDBACK_STATUSES = ['open', 'awaiting_items', 'completed'] as const
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]

// 逐项知识点判定
// 拆点后每一项只有对或错，不再有 partial
export const FEEDBACK_ITEM_VERDICTS = ['correct', 'incorrect'] as const
export type FeedbackItemVerdict = (typeof FEEDBACK_ITEM_VERDICTS)[number]

// QQ 互动回执状态，用于去重与重放保护
export const INTERACTION_STATUSES = ['received', 'completed', 'failed'] as const
export type InteractionStatus = (typeof INTERACTION_STATUSES)[number]

// 向量索引目标
// 文件 Chunk 与 Claim 的向量必须分开保存与检索，不可混入同一索引
export const VECTOR_TARGET_TYPES = ['document_chunk', 'claim'] as const
export type VectorTargetType = (typeof VECTOR_TARGET_TYPES)[number]

// 实验佐证类型
export const EXPERIMENT_EVIDENCE_TYPES = [
  'raw_asset',
  'document_chunk',
  'external_url'
] as const
export type ExperimentEvidenceType = (typeof EXPERIMENT_EVIDENCE_TYPES)[number]

// 枚举值非法时抛出，携带字段名与合法值以便直接回报给审核者
export class EnumValueError extends Error {
  constructor(
    public readonly field: string,
    public readonly value: unknown,
    public readonly allowed: readonly string[]
  ) {
    super(
      `${field} 的值不合法: ${JSON.stringify(value)}；` +
        `合法值为 ${allowed.join(', ')}`
    )
    this.name = 'EnumValueError'
  }
}

// 建立类型守卫，供 AI JSON、外部输入与 DB 读取的运行期校验使用
function createGuard<T extends string>(values: readonly T[]) {
  return (value: unknown): value is T =>
    typeof value === 'string' && (values as readonly string[]).includes(value)
}

// 建立断言函数，非法值抛出 EnumValueError
function createAssert<T extends string>(field: string, values: readonly T[]) {
  const guard = createGuard(values)
  return (value: unknown): T => {
    if (!guard(value)) {
      throw new EnumValueError(field, value, values)
    }
    return value
  }
}

export const isReviewStatus = createGuard(REVIEW_STATUSES)
export const isVisibility = createGuard(VISIBILITIES)
export const isConfidenceLevel = createGuard(CONFIDENCE_LEVELS)
export const isImportRunStatus = createGuard(IMPORT_RUN_STATUSES)
export const isRawAssetStatus = createGuard(RAW_ASSET_STATUSES)
export const isIngestionOutcome = createGuard(INGESTION_OUTCOMES)
export const isQualityFlag = createGuard(QUALITY_FLAGS)
export const isFlagDetector = createGuard(FLAG_DETECTORS)
export const isQualityFlagStatus = createGuard(QUALITY_FLAG_STATUSES)
export const isAiJobStatus = createGuard(AI_JOB_STATUSES)
export const isAiRunStatus = createGuard(AI_RUN_STATUSES)
export const isAiTaskType = createGuard(AI_TASK_TYPES)
export const isCandidateStatus = createGuard(CANDIDATE_STATUSES)
export const isCandidateType = createGuard(CANDIDATE_TYPES)
export const isEdition = createGuard(EDITIONS)
export const isVersionScopeContentType = createGuard(VERSION_SCOPE_CONTENT_TYPES)
export const isAliasType = createGuard(ALIAS_TYPES)
export const isTermRelationType = createGuard(TERM_RELATION_TYPES)
export const isKnowledgeKind = createGuard(KNOWLEDGE_KINDS)
export const isClaimConditionType = createGuard(CLAIM_CONDITION_TYPES)
export const isClaimEvidenceType = createGuard(CLAIM_EVIDENCE_TYPES)
export const isClaimRelationType = createGuard(CLAIM_RELATION_TYPES)
export const isEvidenceStance = createGuard(EVIDENCE_STANCES)
export const isReviewTargetType = createGuard(REVIEW_TARGET_TYPES)
export const isReviewDecision = createGuard(REVIEW_DECISIONS)
export const isAnswerVerdict = createGuard(ANSWER_VERDICTS)
export const isFeedbackStatus = createGuard(FEEDBACK_STATUSES)
export const isFeedbackItemVerdict = createGuard(FEEDBACK_ITEM_VERDICTS)
export const isInteractionStatus = createGuard(INTERACTION_STATUSES)
export const isVectorTargetType = createGuard(VECTOR_TARGET_TYPES)
export const isExperimentEvidenceType = createGuard(EXPERIMENT_EVIDENCE_TYPES)

export const assertReviewStatus = createAssert('review_status', REVIEW_STATUSES)
export const assertVisibility = createAssert('visibility', VISIBILITIES)
export const assertConfidenceLevel = createAssert('confidence_level', CONFIDENCE_LEVELS)
export const assertImportRunStatus = createAssert('import_run_status', IMPORT_RUN_STATUSES)
export const assertRawAssetStatus = createAssert('raw_asset_status', RAW_ASSET_STATUSES)
export const assertIngestionOutcome = createAssert('ingestion_outcome', INGESTION_OUTCOMES)
export const assertQualityFlag = createAssert('quality_flag', QUALITY_FLAGS)
export const assertFlagDetector = createAssert('detected_by', FLAG_DETECTORS)
export const assertQualityFlagStatus = createAssert('flag_status', QUALITY_FLAG_STATUSES)
export const assertAiJobStatus = createAssert('ai_job_status', AI_JOB_STATUSES)
export const assertAiRunStatus = createAssert('ai_run_status', AI_RUN_STATUSES)
export const assertAiTaskType = createAssert('ai_task_type', AI_TASK_TYPES)
export const assertCandidateStatus = createAssert('candidate_status', CANDIDATE_STATUSES)
export const assertCandidateType = createAssert('candidate_type', CANDIDATE_TYPES)
export const assertEdition = createAssert('edition', EDITIONS)
export const assertVersionScopeContentType = createAssert(
  'content_type',
  VERSION_SCOPE_CONTENT_TYPES
)
export const assertAliasType = createAssert('alias_type', ALIAS_TYPES)
export const assertTermRelationType = createAssert('relation_type', TERM_RELATION_TYPES)
export const assertKnowledgeKind = createAssert('kind', KNOWLEDGE_KINDS)
export const assertClaimConditionType = createAssert(
  'condition_type',
  CLAIM_CONDITION_TYPES
)
export const assertClaimEvidenceType = createAssert('evidence_type', CLAIM_EVIDENCE_TYPES)
export const assertClaimRelationType = createAssert('relation_type', CLAIM_RELATION_TYPES)
export const assertEvidenceStance = createAssert('stance', EVIDENCE_STANCES)
export const assertReviewTargetType = createAssert('target_type', REVIEW_TARGET_TYPES)
export const assertReviewDecision = createAssert('decision', REVIEW_DECISIONS)
export const assertAnswerVerdict = createAssert('answer_verdict', ANSWER_VERDICTS)
export const assertFeedbackStatus = createAssert('feedback_status', FEEDBACK_STATUSES)
export const assertFeedbackItemVerdict = createAssert(
  'item_verdict',
  FEEDBACK_ITEM_VERDICTS
)
export const assertInteractionStatus = createAssert(
  'interaction_status',
  INTERACTION_STATUSES
)
export const assertVectorTargetType = createAssert('target_type', VECTOR_TARGET_TYPES)
export const assertExperimentEvidenceType = createAssert(
  'evidence_type',
  EXPERIMENT_EVIDENCE_TYPES
)

// 是否阻止候选自动 materialize 为 pending 项目
// 两类旗标都不得 materialize，但只有阻挡旗标会让内容完全不进入候选区
// flag 通常直接来自 AI JSON 的 qualityFlags 字段，未知值必须报错而非静默放行：
// materialize 是唯一防止未审核内容进入 Answer Index 的关卡，fail-open 比 fail-closed
// 危险得多——沉默地把陌生旗标当成安全值，会让格式漂移或拼写错误的内容绕过审核
export function blocksMaterialize(flag: QualityFlag): boolean {
  if (!isQualityFlag(flag)) {
    throw new EnumValueError('quality_flag', flag, QUALITY_FLAGS)
  }
  return (
    BLOCKING_QUALITY_FLAGS.includes(flag) ||
    NEEDS_REVIEW_QUALITY_FLAGS.includes(flag)
  )
}

// 候选类型本身是否禁止 materialize，同样来自 AI JSON 的 candidateType 字段
export function candidateTypeBlocksMaterialize(type: CandidateType): boolean {
  if (!isCandidateType(type)) {
    throw new EnumValueError('candidate_type', type, CANDIDATE_TYPES)
  }
  return NON_MATERIALIZABLE_CANDIDATE_TYPES.includes(type)
}

// 状态转移操作者
// reviewer 代表已通过知识审核白名单校验的人工操作；system 代表导入器、AI 与后台作业
export const TRANSITION_ACTORS = ['reviewer', 'system'] as const
export type TransitionActor = (typeof TRANSITION_ACTORS)[number]
export const isTransitionActor = createGuard(TRANSITION_ACTORS)

// 审核状态转移表
// pending、approved、legacy_review 三条规则来自规划书；disputed 与 deprecated 的出向
// 转移规划书未定义，此处采用最保守解读：争议可由审核者裁决，废弃为终态
export const REVIEW_STATUS_TRANSITIONS: Readonly<
  Record<ReviewStatus, readonly ReviewStatus[]>
> = {
  pending: ['approved', 'rejected', 'deprecated', 'disputed'],
  approved: ['deprecated', 'disputed'],
  // 被拒内容不得直接复活，必须另建候选或明确修订记录后重新走 pending
  rejected: [],
  // 废弃为终态，取代它的应是新条目而非原地改写
  deprecated: [],
  // 争议只能由审核者裁决，三个出向都受 REVIEWER_ONLY_TO 保护
  disputed: ['approved', 'rejected', 'deprecated'],
  legacy_review: ['approved', 'rejected', 'deprecated']
}

// 只能由人工审核者写入的目标状态
// 转移表的目标状态集合恰好等于 REVIEW_DECISIONS，而 reviews 表每笔决定都带
// reviewer_id，因此每一次审核状态转移本身就是一次人工审核决定
// 导入器、AI 与后台作业只能建立初始状态，不得推动任何转移：既不能升格为已核准，
// 也不能把争议内容单方面拒绝或废弃，或把已核准内容废弃
const REVIEWER_ONLY_TO: readonly ReviewStatus[] = REVIEW_DECISIONS

// 建立时的合法初始状态
// 注意这是建立而非转移，导入器可依来源政策直接建立 approved 的机器目录资料，
// 但任何已存在资料要变成 approved 都必须走 assertReviewStatusTransition
export const INITIAL_REVIEW_STATUSES: readonly ReviewStatus[] = [
  'pending',
  'legacy_review',
  'approved'
]

// 状态转移非法时抛出，消息需可直接呈现给审核者
export class StatusTransitionError extends Error {
  constructor(
    public readonly from: ReviewStatus,
    public readonly to: ReviewStatus,
    public readonly actor: TransitionActor,
    reason: string
  ) {
    super(`审核状态不可由 ${from} 转为 ${to}（操作者 ${actor}）: ${reason}`)
    this.name = 'StatusTransitionError'
  }
}

// 检查状态转移是否合法，返回不合法原因；合法时返回 null
export function checkReviewStatusTransition(
  from: ReviewStatus,
  to: ReviewStatus,
  actor: TransitionActor
): string | null {
  // 三个入参都可能来自绕过编译期类型的外部输入：DB 读回、AI JSON、QQ 命令参数
  // 非法枚举值属于数据损坏而非业务判定，必须以 EnumValueError 报出合法值清单，
  // 不能让查表得到 undefined 之后抛出难以追查的 TypeError
  if (!isReviewStatus(from)) {
    throw new EnumValueError('transition.from', from, REVIEW_STATUSES)
  }
  if (!isReviewStatus(to)) {
    throw new EnumValueError('transition.to', to, REVIEW_STATUSES)
  }
  if (!isTransitionActor(actor)) {
    throw new EnumValueError('transition.actor', actor, TRANSITION_ACTORS)
  }

  if (from === to) {
    return '来源与目标状态相同，无需转移'
  }

  const allowed = REVIEW_STATUS_TRANSITIONS[from]
  if (!allowed.includes(to)) {
    if (allowed.length === 0) {
      return `${from} 为终态，如需恢复必须另建候选或明确修订记录`
    }
    return `合法目标状态为 ${allowed.join(', ')}`
  }

  if (actor !== 'reviewer' && REVIEWER_ONLY_TO.includes(to)) {
    return `转为 ${to} 只能由人工审核者执行，导入器与 AI 只能产生候选或待审内容`
  }

  return null
}

// 布尔版本的转移检查，供查询与界面显示使用
export function canTransitionReviewStatus(
  from: ReviewStatus,
  to: ReviewStatus,
  actor: TransitionActor
): boolean {
  return checkReviewStatusTransition(from, to, actor) === null
}

// 断言状态转移合法
// 调用方必须在写入 DB 之前调用，抛出时不得留下任何部分写入
export function assertReviewStatusTransition(
  from: ReviewStatus,
  to: ReviewStatus,
  actor: TransitionActor
): void {
  const reason = checkReviewStatusTransition(from, to, actor)
  if (reason !== null) {
    throw new StatusTransitionError(from, to, actor, reason)
  }
}
