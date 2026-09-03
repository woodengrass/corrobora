// 政策支撑的来源定义（docs/source-policy.md「初始来源清单」唯一程式码镜像）
// 任何匯入器在呼叫 registerSource() 前必须从这里取得来源 metadata，不可在各自
// 档案内另行硬编码 license/creator/visibility/trust_level，避免与文件逐渐失步。
// 新增或调整来源时，先更新 docs/source-policy.md 的表格，再同步修改此处
import { SourceInput } from './import/sources'

export interface SourcePolicyEntry extends SourceInput {
  // 对应 docs/source-policy.md 的 attribution_rule / public_export_rule；
  // sources 表目前未持久化这两栏，仅供匯入器与未来 Bot 回答／审核介面参考
  attributionRule: string
  publicExportRule: string
  // 对应 docs/source-policy.md 的 status 栏：本来源目前的政策状态（例如
  // 是否被授权问题「外部阻挡」）。sources 表未持久化这栏，仅供审核者与
  // 匯入器参考；status 含「外部阻挡」或「待确认」时，visibility 必须是
  // internal（docs/source-policy.md 验收规则 3），这里只登记文字说明，
  // 实际的 internal 值仍在各条目自己的 visibility 栏，不做额外程式推导
  status: string
}

// 与 docs/source-policy.md「初始来源清单」逐栏对应，栏位缺漏或修改须同步更新
// 该文件；trust_level 不得擅自升级，必须原样取自政策表
const SOURCE_POLICIES: Readonly<Record<string, SourcePolicyEntry>> = {
  openst_machine_submission: {
    sourceKey: 'openst_machine_submission',
    type: 'machine_submission',
    name: 'OpenST 機器投稿',
    creator: '各投稿者',
    url: '既有 OpenST 檔案庫',
    license: 'OpenST 投稿條款（投稿者已同意）',
    visibility: 'internal',
    trustLevel: 'medium',
    attributionRule: '僅用於機器推薦',
    publicExportRule:
      'Bot 顯示既有 OpenST 檔案庫連結，不建立額外來源目錄條目；不對外暴露內部匯入細節',
    status: '已核准'
  },
  // 以下六筆為 Raw scanner（T1.2a）掃描 public/database/raw/ 時實際會用到的
  // 來源，逐欄對應 docs/source-policy.md「初始來源清單」主表
  gtmc: {
    sourceKey: 'gtmc',
    type: 'document_collection',
    name: 'GTMC 技術文件',
    license: 'CC BY-NC-SA 4.0',
    visibility: 'public',
    trustLevel: 'medium',
    attributionRule:
      '顯示作品／文章名稱、可得作者、原始 URL、CC BY-NC-SA 4.0 與修改標記；找不到作者時留空',
    publicExportRule:
      '每次使用 GTMC 證據的回答須列來源 ID、作品／文章名稱與作者或署名對象；' +
      '找不到作者時留空，不得臆造',
    status: '已核准；來源 URL、授權全文 URL 與逐篇作者待補充前不得標為 high'
  },
  storage_tech_dictionary: {
    sourceKey: 'storage_tech_dictionary',
    type: 'dictionary',
    name: 'Storage Tech Dictionary',
    creator: 'Storage Tech Dictionary 社群',
    url: 'https://github.com/StorageTechDictionary/StorageTechDictionary.github.io',
    license: 'GPL-3.0-or-later',
    licenseUrl: 'public/database/raw/dictionary/LICENSE.md',
    visibility: 'public',
    trustLevel: 'high',
    attributionRule: '保留原始來源連結、著作權聲明與授權資訊',
    publicExportRule: '顯示來源與 GPL-3.0-or-later 資訊；不得省略授權聲明',
    status: '已核准；範圍僅限 public/database/raw/dictionary/，不含 Dictionary.txt'
  },
  techmc_glossary: {
    sourceKey: 'techmc_glossary',
    type: 'glossary',
    name: 'TechMC Glossary',
    visibility: 'internal',
    trustLevel: 'low',
    attributionRule: '授權確認前僅供內部檢索與審核',
    publicExportRule:
      '授權確認前禁止進入 public 匯出或一般回答引用；不得假設授權已解決',
    status: '外部阻擋：等待來源 URL、作者與再散布條件確認'
  },
  legacy_database_csv: {
    sourceKey: 'legacy_database_csv',
    type: 'legacy_raw',
    name: '歷史知識庫（CSV）',
    creator: '社群（原始貢獻者身份僅存 Raw 區）',
    license: '內部整理，無外部授權聲明',
    visibility: 'internal',
    trustLevel: 'low',
    attributionRule: '只作 Raw 與 AI 整理來源；核准整理內容改以 openst_community 發布',
    publicExportRule:
      '本來源本身不得公開匯出；僅其審核後衍生的 openst_community 內容可視情況公開',
    status: '已核准（僅供 Raw／AI 整理，救援遷移另立 session）'
  },
  legacy_database_markdown: {
    sourceKey: 'legacy_database_markdown',
    type: 'legacy_raw',
    name: '歷史學習日誌（Markdown）',
    creator: '社群（原始貢獻者身份僅存 Raw 區）',
    license: '內部整理，無外部授權聲明',
    visibility: 'internal',
    trustLevel: 'low',
    attributionRule: '只作 Raw 與 AI 整理來源；核准整理內容改以 openst_community 發布',
    publicExportRule:
      '本來源本身不得公開匯出；僅其審核後衍生的 openst_community 內容可視情況公開',
    status: '已核准（僅供 Raw／AI 整理）'
  },
  legacy_dictionary_txt: {
    sourceKey: 'legacy_dictionary_txt',
    type: 'legacy_raw',
    name: '舊術語對照（Dictionary.txt）',
    creator: '社群（原始貢獻者身份僅存 Raw 區）',
    license: '內部整理，無外部授權聲明',
    visibility: 'internal',
    trustLevel: 'low',
    attributionRule:
      '僅作待審翻譯候選內部使用，不得繼承 storage_tech_dictionary 的 public、' +
      'high 與 GPL-3.0-or-later 署名姿態',
    publicExportRule:
      '不得公開匯出；內容只能進入 extraction_candidates（T2.6）作為待審翻譯候選，' +
      '不得寫入正式術語翻譯或覆蓋 T2.5 由 dictionary/ 匯入的既有翻譯',
    status: '已核准（僅供 Raw／AI 整理翻譯候選，不得覆蓋正式詞典）'
  },
  // 目前沒有任何匯入器（T1.2a／T1.4a）直接使用這個 source_key，但它是
  // docs/source-policy.md 主表裡已核准的條目，本檔案作為該文件的唯一
  // 程式碼鏡像必須完整收錄，不能只收錄目前用得到的部分
  openst_community: {
    sourceKey: 'openst_community',
    type: 'community_curated',
    name: 'OpenST 社群整理',
    creator: '匿名／社群整理（預設）',
    license: '無外部授權聲明（原創整理內容）',
    visibility: 'internal',
    trustLevel: 'medium',
    attributionRule: '預設顯示「社群整理」；僅原始貢獻者明確同意才顯示貢獻者姓名',
    publicExportRule: '一般回答預設署名「社群整理」；公開網站與條款不屬於本專案範圍',
    status: '已核准'
  }
}

// 列举所有已登记的 source_key，供测试跨 docs/source-policy.md 与本档案做
// 一致性稽核，不需要另外手动维护一份清单
export function listSourcePolicyKeys(): string[] {
  return Object.keys(SOURCE_POLICIES)
}

// 找不到对应政策时直接抛错，避免匯入器在没有政策纪录的情况下静默使用臆造 metadata
export function getSourcePolicy(sourceKey: string): SourcePolicyEntry {
  const entry = SOURCE_POLICIES[sourceKey]
  if (entry === undefined) {
    throw new Error(
      `来源政策未定义：${sourceKey}，` +
        '请先于 docs/source-policy.md 与 src/db/sourcePolicy.ts 登记'
    )
  }
  return entry
}
