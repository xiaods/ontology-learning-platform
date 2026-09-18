// Case: McCarthy Building Companies × Palantir Pulse.
// Facts from the AIPCon 10 (2026-06-04) joint announcement.
// All simulation data is invented and labelled as such.

import type { CaseStudy } from './types';
import { num } from './types';

const SCALE: Record<string, { projects: number; sites: number; tasks: number; equipment: number; crews: number }> = {
  pilot: { projects: 3, sites: 5, tasks: 240, equipment: 38, crews: 12 },
  regional: { projects: 12, sites: 22, tasks: 1800, equipment: 210, crews: 64 },
  enterprise: { projects: 48, sites: 96, tasks: 9200, equipment: 1100, crews: 320 },
};

export const mccarthyCase: CaseStudy = {
  id: 'mccarthy-pulse',
  slug: 'mccarthy',
  name: 'McCarthy Building Companies',
  industry: '建筑工程',
  scenario: '一个工地事件触发跨场景联动',
  narrative:
    'McCarthy 与 Palantir 在 AIPCon 10 联合宣布多年期、数百万美元级别的战略合作，核心交付物是 Pulse AI 运营套件。Pulse 覆盖 7 大工地用例，全部挂在同一套 Ontology 上。本演示模拟一个工地事件：系统沿关系把一个质检发现传播到设备调拨、物流优化与风险重估，展示「point solution vs operating system」的分水岭。客户与 7 大用例为 AIPCon 10 官方披露；演示中的所有对象、记录数与计算结果均为模拟数据。',
  source: {
    venue: 'AIPCon 10 大会联合公告（2026-06-04）',
    date: '2026-06-04',
    fidelity: [
      { kind: 'fact', text: 'McCarthy 创立于 1874 年、8000 名员工、$22B 完成项目总额、ENR 2025 年第 15 位出自公开公告与行业榜单' },
      { kind: 'fact', text: 'Pulse 覆盖 7 大工地用例（现场执行、造价估算、合同管理、招投标、QA/QC、物流、设备规划）与 5 大功能（实时洞察、场景规划、风险分析、决策编排、Ontology 沉淀）出自 AIPCon 10 联合公告' },
      { kind: 'official-claim', text: 'McCarthy 数字官 Justin McFarland 公开表述「把 160 年的建筑专业知识直接融进团队的工作流」与「point solution vs operating system」分水岭' },
      { kind: 'simulated', 'text': '项目数、工地数、任务数、设备数、人员数，以及跨场景联动的计算结果全部为演示模拟数据' },
    ],
  },
  objects: [
    { id: 'project', name: 'Project', description: '建筑项目（含合同金额、工期、状态）', icon: '🏗️', color: '#3b82f6', recordCount: 48 },
    { id: 'site', name: 'Site', description: '工地（含地理坐标、天气联动）', icon: '📍', color: '#0ea5e9', recordCount: 96 },
    { id: 'task', name: 'Task', description: '施工任务（工种、工期、依赖）', icon: '📋', color: '#8b5cf6', recordCount: 9200 },
    { id: 'equipment', name: 'Equipment', description: '设备（塔吊、泵车、挖掘机）', icon: '🏗️', color: '#14b8a6', recordCount: 1100 },
    { id: 'material', name: 'Material', description: '物资（钢筋、混凝土、预制件）', icon: '📦', color: '#f59e0b', recordCount: 3400 },
    { id: 'qc-check', name: 'QCCheck', description: '质检项（设计延伸、自动派单）', icon: '🔍', color: '#ef4444', recordCount: 18_400 },
    { id: 'contract', name: 'Contract', description: '合同（条款追溯、触发节点）', icon: '📜', color: '#64748b', recordCount: 320 },
    { id: 'risk-alert', name: 'RiskAlert', description: '风险告警（跨工种联动）', icon: '⚠️', color: '#f97316', recordCount: 860 },
    { id: 'worker', name: 'Worker', description: '工人 / 班组（资质、出勤）', icon: '👷', color: '#ec4899', recordCount: 8000 },
    { id: 'decision', name: 'Decision', description: '决策记录（调拨、派发、通知）', icon: '🧭', color: '#22c55e', recordCount: 2600 },
  ],
  links: [
    { id: 'project-has-site', name: 'hasSite', description: '项目包含工地', source: 'project', target: 'site', cardinality: 'one-to-many' },
    { id: 'site-has-task', name: 'hasTask', description: '工地执行任务', source: 'site', target: 'task', cardinality: 'one-to-many' },
    { id: 'task-assigned-equipment', name: 'assignedEquipment', description: '任务分配设备', source: 'task', target: 'equipment', cardinality: 'many-to-many' },
    { id: 'task-consumes-material', name: 'consumesMaterial', description: '任务消耗物资', source: 'task', target: 'material', cardinality: 'one-to-many' },
    { id: 'site-stocks-material', name: 'stocksMaterial', description: '工地库存物资', source: 'site', target: 'material', cardinality: 'one-to-many' },
    { id: 'qc-on-task', name: 'checksTask', description: '质检项检查任务', source: 'qc-check', target: 'task', cardinality: 'one-to-many' },
    { id: 'contract-governs-project', name: 'governsProject', description: '合同约束项目', source: 'contract', target: 'project', cardinality: 'one-to-many' },
    { id: 'alert-on-site', name: 'alertsOnSite', description: '风险告警关联工地', source: 'risk-alert', target: 'site', cardinality: 'one-to-many' },
    { id: 'alert-triggers-decision', name: 'triggersDecision', description: '风险告警触发决策', source: 'risk-alert', target: 'decision', cardinality: 'one-to-many' },
    { id: 'worker-assigned-site', name: 'assignedToSite', description: '工人分配到工地', source: 'worker', target: 'site', cardinality: 'many-to-one' },
    { id: 'equipment-located-site', name: 'locatedAtSite', description: '设备位于工地', source: 'equipment', target: 'site', cardinality: 'many-to-one' },
  ],
  actions: [
    {
      id: 'dispatch-qc',
      name: 'Dispatch QC Check',
      description: '质检问题自动派单到责任班组',
      target: 'qc-check',
      requireReview: false,
      parameters: [
        { name: 'checkId', type: 'String', description: '质检项 ID' },
        { name: 'crewId', type: 'String', description: '责任班组 ID' },
      ],
      effects: ['创建 QCCheck 派单', '通知责任班组', '挂起相关任务'],
    },
    {
      id: 'reallocate-equipment',
      name: 'Reallocate Equipment',
      description: '跨工地调拨闲置设备',
      target: 'equipment',
      requireReview: true,
      parameters: [
        { name: 'equipmentId', type: 'String', description: '设备 ID' },
        { name: 'fromSiteId', type: 'String', description: '调出工地' },
        { name: 'toSiteId', type: 'String', description: '调入工地' },
      ],
      effects: ['更新设备位置', '通知双方调度', '记录调拨决策'],
    },
    {
      id: 'notify-schedule',
      name: 'Notify Schedule',
      description: '调度通知（跨工种协调）',
      target: 'decision',
      requireReview: false,
      parameters: [
        { name: 'siteId', type: 'String', description: '目标工地' },
        { name: 'message', type: 'String', description: '通知内容' },
      ],
      effects: ['创建 Decision 记录', '推送至相关方', '写入审计日志'],
    },
    {
      id: 'raise-risk-alert',
      name: 'Raise Risk Alert',
      description: '跨工种风险联动告警',
      target: 'risk-alert',
      requireReview: false,
      parameters: [
        { name: 'siteId', type: 'String', description: '关联工地' },
        { name: 'riskType', type: 'String', description: '风险类型' },
        { name: 'severity', type: 'String', description: '严重等级' },
      ],
      effects: ['创建 RiskAlert', '触发关联决策', '通知项目负责'],
    },
  ],
  layout: {
    'project': { x: 120, y: 90 },
    'contract': { x: 120, y: 260 },
    'site': { x: 330, y: 170 },
    'task': { x: 560, y: 90 },
    'equipment': { x: 800, y: 60 },
    'material': { x: 800, y: 200 },
    'qc-check': { x: 560, y: 300 },
    'worker': { x: 330, y: 360 },
    'risk-alert': { x: 800, y: 360 },
    'decision': { x: 560, y: 450 },
  },
  parameters: [
    {
      id: 'scale',
      label: '部署规模',
      kind: 'select',
      options: [
        { label: '试点：3 个项目 / 5 个工地', value: 'pilot' },
        { label: '区域：12 个项目 / 22 个工地', value: 'regional' },
        { label: '企业级：48 个项目 / 96 个工地', value: 'enterprise' },
      ],
      default: 'regional',
    },
    {
      id: 'dataCoverage',
      label: '数据源接入覆盖率',
      kind: 'range',
      min: 20,
      max: 100,
      step: 10,
      default: 70,
    },
  ],
  compute: (params) => {
    const scaleKey = String(params.scale ?? 'regional');
    const s = SCALE[scaleKey] ?? SCALE.regional;
    const coverage = Number(params.dataCoverage ?? 70) / 100;
    const decisionHours = Math.round((24 - coverage * 20) * 10) / 10;
    const crossScenarioHits = Math.round(s.tasks * 0.04 * coverage);
    const idleEquipment = Math.round(s.equipment * (0.12 - coverage * 0.06));
    const qcAutoDispatch = Math.round(84 * coverage);
    const riskResponseHours = Math.round((48 - coverage * 40) * 10) / 10;
    const dataIntegrationHours = Math.round((8 - coverage * 6) * 10) / 10;
    return {
      scaleKey,
      projects: s.projects,
      sites: s.sites,
      tasks: s.tasks,
      equipment: s.equipment,
      crews: s.crews,
      coverage: Math.round(coverage * 100),
      decisionHours,
      crossScenarioHits,
      idleEquipment: Math.max(0, idleEquipment),
      qcAutoDispatch,
      riskResponseHours,
      dataIntegrationHours,
      ontologyReuse: Math.round(coverage * 85),
    };
  },
  stages: [
    {
      title: '实时洞察',
      subtitle: '多源数据流拉到决策界面',
      role: '工地主任 + 数据工程师',
      skills: '数据接入 · 实时看板 · 多源融合',
      production: '配置 BIM / ERP / IoT 数据源 connector，设置同步水位与延迟告警。',
      nodes: ['site', 'task', 'equipment', 'material'],
      input: (p, r) => ({ sites: r.sites, dataSources: ['BIM', 'ERP', '排程', 'IoT'], coverage: `${r.coverage}%` }),
      output: (p, r) => ({ syncedObjects: num(r.tasks) + num(r.equipment) + num(r.sites) * 3, dashboardStatus: '实时同步（模拟）', latency: '< 1 min' }),
      narrativeNote: (_p, r) => `数据源接入覆盖率 ${r.coverage}%：工地主任看板上同步显示 ${r.tasks} 个任务、${r.equipment} 台设备与 ${r.sites} 个工地的实时状态。`,
    },
    {
      title: '场景规划',
      subtitle: '多版本场景预测',
      role: '项目控制 + AI 平台工程师',
      skills: '场景生成 · 工期估算 · 成本对照',
      production: 'Agent 只生成候选方案；方案必须标注依据与不确定性。',
      nodes: ['project', 'task', 'site'],
      input: (p, r) => ({ projects: r.projects, scenarios: 3, basis: '历史项目数据 + 当前进度' }),
      output: (p, r) => ({ options: ['压缩工期 8%', '平衡资源', '最低成本'], generatedBy: 'AIP 场景规划（模拟）' }),
      narrativeNote: () => '排程调整时，系统给出 3 套备选方案及各自工期 / 成本估算——不是单点预测，而是多版本场景。',
    },
    {
      title: '风险分析',
      subtitle: '跨工种风险联动评估',
      role: '安全工程师 + 项目控制',
      skills: '风险建模 · 级联影响 · 可解释依据',
      production: '风险规则参数化；建筑业规则因地区 / 项目类型差异大。',
      nodes: ['site', 'risk-alert', 'task', 'equipment'],
      input: (p, r) => ({ trigger: '天气预报变化', affectedSites: Math.min(3, num(r.sites)) }),
      output: (p, r) => ({ cascadingImpacts: ['浇筑延迟', '焊接受限', '物流滞后'], riskResponseHours: num(r.riskResponseHours) }),
      narrativeNote: (_p, r) => `天气预报变化时，系统自动评估对浇筑 / 焊接 / 物流的级联影响，风险响应时间从 48 小时压缩到 ${r.riskResponseHours} 小时。`,
    },
    {
      title: '决策编排',
      subtitle: '决策逻辑从人脑搬到系统',
      role: '调度 + 工地主任',
      skills: '规则引擎 · 自动通知 · 跨工地调拨',
      production: '设备闲置超阈值时，系统自动通知调度并生成跨工地调拨建议。',
      nodes: ['equipment', 'site', 'decision', 'risk-alert'],
      input: (p, r) => ({ idleThreshold: '4 小时', idleEquipment: r.idleEquipment }),
      output: (p, r) => ({ reallocationSuggestions: Math.min(num(r.idleEquipment), 3), autoDispatched: true }),
      narrativeNote: (_p, r) =>
        num(r.idleEquipment) > 0
          ? `系统识别 ${r.idleEquipment} 台闲置设备，自动生成跨工地调拨建议——决策编排把响应从被动等单变主动派发。`
          : '当前无闲置设备超阈值，系统持续监控中。',
    },
    {
      title: 'Ontology 沉淀',
      subtitle: '152 年专家知识结构化',
      role: '领域专家 + 本体工程师',
      skills: '知识建模 · 规则参数化 · 历史案例复用',
      production: '工地主任调用规则时，系统按历史项目类似情境给出参考。',
      nodes: ['project', 'task', 'qc-check', 'contract'],
      input: (p, r) => ({ knowledgeBase: '152 年项目积累', reuseRate: `${r.ontologyReuse}%` }),
      output: (p, r) => ({ similarCases: Math.round(num(r.projects) * 0.3), ruleMatches: Math.round(num(r.tasks) * 0.02) }),
      narrativeNote: (_p, r) => `Ontology 沉淀复用率 ${r.ontologyReuse}%：工地主任调用规则时，系统按历史项目类似情境给出参考——152 年的专家知识直接融进工作流。`,
    },
    {
      title: '跨场景联动',
      subtitle: '质检触发设备调拨',
      role: 'QA/QC + 调度',
      skills: '跨用例联动 · Action 触发 · 复合价值',
      production: '质检发现的某个问题，自动触发设备调拨建议——这是单点工具做不到的事。',
      nodes: ['qc-check', 'task', 'equipment', 'decision'],
      input: (p, r) => ({ qcIssue: '混凝土强度未达标', autoDispatchRate: `${r.qcAutoDispatch}%` }),
      output: (p, r) => ({ crossScenarioHits: r.crossScenarioHits, triggeredActions: ['设备重排', '物流调整', '风险重估'] }),
      narrativeNote: (_p, r) =>
        `质检自动派单率 ${r.qcAutoDispatch}%：案例 5 质检发现的某个问题，自动触发案例 7 的设备调拨建议——跨场景复合价值 ${r.crossScenarioHits} 次/周，是单点工具永远做不到的事。`,
    },
  ],
};
